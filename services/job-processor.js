/**
 * Job Processor Service
 * Orchestrates multi-step job execution based on SKU configurations
 * Handles async polling, error recovery, and step tracking
 */

const winston = require('winston');
const A2EServiceEnhanced = require('./a2e-enhanced');
const SKUConfigManager = require('./sku-config-manager');
const db = require('../db/mongo');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [new winston.transports.Console()]
});

class JobProcessor {
    constructor(apiKey, baseURL) {
        this.a2eService = new A2EServiceEnhanced(apiKey, baseURL);
        this.configManager = new SKUConfigManager();
        this.activeJobs = new Map();
        this.pollingInterval = 10000; // 10 seconds
    }

    /**
     * Create and start a new job
     */
    async createJob(userId, orderId, skuCode, customerInputs) {
        // Validate inputs
        const validation = await this.configManager.validateCustomerInputs(skuCode, customerInputs);
        if (!validation.valid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }

        // Get configuration
        const config = await this.configManager.getConfig(skuCode);
        if (!config) {
            throw new Error(`No configuration found for SKU: ${skuCode}`);
        }

        // Calculate estimated credits
        const sku = await db.getSkuByCode(skuCode);
        const estimatedCredits = sku ? sku.base_credits : 0;

        // Create job record
        const job = await db.createJob(userId, skuCode, null, {
            order_id: orderId,
            cost_credits: estimatedCredits
        });

        const jobId = job.id;

        logger.info('Job created', { jobId, userId, skuCode, orderId });

        // Start job execution asynchronously
        this.executeJob(jobId, config, customerInputs).catch(error => {
            logger.error('Job execution failed', { jobId, error: error.message });
            this.handleJobFailure(jobId, error.message);
        });

        return jobId;
    }

    /**
     * Execute job steps sequentially
     */
    async executeJob(jobId, config, customerInputs) {
        try {
            // Update job status
            await db.updateJob(jobId, { status: 'processing' });

            const results = [];

            // Execute each step
            for (const step of config.steps) {
                const stepResult = await this.executeStep(jobId, step, customerInputs, results);
                results.push(stepResult);

                // If step failed and was required, stop execution
                if (stepResult.status === 'failed' && step.required) {
                    throw new Error(`Required step ${step.step_name} failed: ${stepResult.error}`);
                }
            }

            // Find final result URL
            const finalResult = results.reverse().find(r => r.status === 'completed' && r.result_url);
            const resultUrl = finalResult ? finalResult.result_url : null;

            // Mark job as completed
            await db.updateJob(jobId, {
                status: 'completed',
                result_url: resultUrl
            });

            // Update order status
            const job = await db.getJob(jobId);
            if (job && job.order_id) {
                await db.updateOrderStatus(job.order_id, 'completed');
            }

            logger.info('Job completed successfully', { jobId, resultUrl });

            // Clean up polling
            this.activeJobs.delete(jobId);

        } catch (error) {
            logger.error('Job execution error', { jobId, error: error.message, stack: error.stack });
            this.handleJobFailure(jobId, error.message);
            throw error;
        }
    }

    /**
     * Execute a single step
     */
    async executeStep(jobId, step, customerInputs, previousResults) {
        const now = new Date().toISOString();

        // Evaluate condition
        const shouldExecute = this.configManager.evaluateCondition(
            step.condition_expression,
            customerInputs,
            previousResults
        );

        if (!shouldExecute) {
            logger.info('Step skipped (condition not met)', {
                jobId,
                stepName: step.step_name
            });

            // Record skipped step
            const stepResult = this.db.prepare(`
                INSERT INTO job_steps (
                    job_id, step_order, step_name, a2e_endpoint, status, created_at
                ) VALUES (?, ?, ?, ?, 'skipped', ?)
            `).run(jobId, step.step_order, step.step_name, step.a2e_endpoint, now);

            return { status: 'skipped', step_id: stepResult.lastInsertRowid };
        }

        // Interpolate parameters
        const params = this.configManager.interpolateParams(
            step.params_template,
            customerInputs,
            previousResults
        );

        logger.info('Executing step', {
            jobId,
            stepName: step.step_name,
            endpoint: step.a2e_endpoint
        });

        // Create step record
        const stepResult = this.db.prepare(`
            INSERT INTO job_steps (
                job_id, step_order, step_name, a2e_endpoint, status,
                input_params, started_at, created_at
            ) VALUES (?, ?, ?, ?, 'processing', ?, ?, ?)
        `).run(
            jobId,
            step.step_order,
            step.step_name,
            step.a2e_endpoint,
            JSON.stringify(params),
            now,
            now
        );

        const stepId = stepResult.lastInsertRowid;

        try {
            // Call A2E API
            const response = await this.callA2EEndpoint(
                step.a2e_endpoint,
                step.http_method,
                params
            );

            const taskId = response?.data?._id || response?.data?.id;

            // Update step with task ID
            this.db.prepare(`
                UPDATE job_steps 
                SET a2e_task_id = ?, output_data = ? 
                WHERE id = ?
            `).run(taskId, JSON.stringify(response), stepId);

            // If task is async, start polling
            if (taskId && this.isAsyncEndpoint(step.a2e_endpoint)) {
                await this.pollTaskStatus(jobId, stepId, step.a2e_endpoint, taskId);
            } else {
                // Synchronous response, mark as completed
                this.db.prepare(`
                    UPDATE job_steps 
                    SET status = 'completed', completed_at = ? 
                    WHERE id = ?
                `).run(new Date().toISOString(), stepId);
            }

            // Get final step data
            const finalStep = this.db.prepare('SELECT * FROM job_steps WHERE id = ?').get(stepId);
            const outputData = JSON.parse(finalStep.output_data || '{}');

            return {
                status: finalStep.status,
                step_id: stepId,
                task_id: taskId,
                result_url: outputData?.data?.result_url || outputData?.data?.video_url || outputData?.data?.audio_url,
                data: outputData
            };

        } catch (error) {
            logger.error('Step execution failed', {
                jobId,
                stepId,
                stepName: step.step_name,
                error: error.message
            });

            // Update step as failed
            this.db.prepare(`
                UPDATE job_steps 
                SET status = 'failed', error_message = ?, completed_at = ? 
                WHERE id = ?
            `).run(error.message, new Date().toISOString(), stepId);

            // Log error
            this.logError('error', 'step_execution_failed', error.message, {
                job_id: jobId,
                step_id: stepId,
                step_name: step.step_name,
                endpoint: step.a2e_endpoint,
                error_stack: error.stack
            });

            return {
                status: 'failed',
                step_id: stepId,
                error: error.message
            };
        }
    }

    /**
     * Call A2E API endpoint
     */
    async callA2EEndpoint(endpoint, method, params) {
        // Map endpoint to A2E service method
        if (endpoint === '/api/v1/video/generate') {
            return await this.a2eService.generateVideo(params);
        } else if (endpoint === '/api/v1/video/send_tts') {
            return await this.a2eService.generateTTS(params);
        } else if (endpoint === '/api/v1/userVoice/training') {
            return await this.a2eService.trainVoiceClone(params);
        } else if (endpoint === '/api/v1/userVideoTwin/startTraining') {
            return await this.a2eService.trainAvatar(params);
        } else if (endpoint === '/api/v1/userImage2Video/start') {
            return await this.a2eService.imageToVideo(params);
        } else if (endpoint === '/api/v1/userFaceSwapTask/add') {
            return await this.a2eService.faceSwap(params);
        } else if (endpoint === '/api/v1/userDubbing/startDubbing') {
            return await this.a2eService.dubVideo(params);
        } else {
            throw new Error(`Unknown A2E endpoint: ${endpoint}`);
        }
    }

    /**
     * Check if endpoint is async (requires polling)
     */
    isAsyncEndpoint(endpoint) {
        const asyncEndpoints = [
            '/api/v1/video/generate',
            '/api/v1/userImage2Video/start',
            '/api/v1/userFaceSwapTask/add',
            '/api/v1/userDubbing/startDubbing',
            '/api/v1/userVideoTwin/startTraining',
            '/api/v1/userVoice/training'
        ];
        return asyncEndpoints.includes(endpoint);
    }

    /**
     * Poll task status until complete
     */
    async pollTaskStatus(jobId, stepId, endpoint, taskId) {
        const maxAttempts = 180; // 30 minutes max (180 * 10 seconds)
        let attempts = 0;

        return new Promise((resolve, reject) => {
            const pollInterval = setInterval(async () => {
                attempts++;

                try {
                    const status = await this.getTaskStatus(endpoint, taskId);

                    if (!status || !status.data) {
                        logger.warn('Invalid status response', { jobId, stepId, taskId });
                        return;
                    }

                    const currentStatus = status.data.current_status || status.data.status;

                    logger.debug('Task status check', {
                        jobId,
                        stepId,
                        taskId,
                        currentStatus,
                        attempt: attempts
                    });

                    if (currentStatus === 'completed' || currentStatus === 'success') {
                        clearInterval(pollInterval);

                        const resultUrl = status.data.result_url ||
                            status.data.video_url ||
                            status.data.audio_url ||
                            status.data.media_url || '';

                        // Update step
                        this.db.prepare(`
                            UPDATE job_steps 
                            SET status = 'completed', output_data = ?, completed_at = ? 
                            WHERE id = ?
                        `).run(JSON.stringify(status), new Date().toISOString(), stepId);

                        logger.info('Task completed', { jobId, stepId, taskId, resultUrl });
                        resolve({ status: 'completed', result_url: resultUrl });

                    } else if (currentStatus === 'failed' || currentStatus === 'error') {
                        clearInterval(pollInterval);

                        const errorMessage = status.data.failed_message ||
                            status.data.error_message ||
                            'Unknown error';

                        // Update step
                        this.db.prepare(`
                            UPDATE job_steps 
                            SET status = 'failed', error_message = ?, completed_at = ? 
                            WHERE id = ?
                        `).run(errorMessage, new Date().toISOString(), stepId);

                        logger.error('Task failed', { jobId, stepId, taskId, errorMessage });
                        reject(new Error(errorMessage));

                    } else if (attempts >= maxAttempts) {
                        clearInterval(pollInterval);

                        const timeoutError = 'Task timeout after 30 minutes';
                        this.db.prepare(`
                            UPDATE job_steps 
                            SET status = 'failed', error_message = ?, completed_at = ? 
                            WHERE id = ?
                        `).run(timeoutError, new Date().toISOString(), stepId);

                        logger.error('Task timeout', { jobId, stepId, taskId });
                        reject(new Error(timeoutError));
                    }

                } catch (error) {
                    logger.error('Polling error', {
                        jobId,
                        stepId,
                        taskId,
                        error: error.message
                    });

                    // Don't stop polling on transient errors
                    if (attempts >= maxAttempts) {
                        clearInterval(pollInterval);
                        reject(error);
                    }
                }
            }, this.pollingInterval);
        });
    }

    /**
     * Get task status from A2E
     */
    async getTaskStatus(endpoint, taskId) {
        const taskTypeMap = {
            '/api/v1/video/generate': 'video',
            '/api/v1/userImage2Video/start': 'image2video',
            '/api/v1/userFaceSwapTask/add': 'faceswap',
            '/api/v1/userDubbing/startDubbing': 'dubbing',
            '/api/v1/userVideoTwin/startTraining': 'avatar',
            '/api/v1/userVoice/training': 'voice'
        };

        const taskType = taskTypeMap[endpoint];
        if (!taskType) {
            throw new Error(`Unknown task type for endpoint: ${endpoint}`);
        }

        return await this.a2eService.getTaskStatus(taskType, taskId);
    }

    /**
     * Handle job failure
     */
    handleJobFailure(jobId, errorMessage) {
        const now = new Date().toISOString();

        // Update job status
        this.db.prepare(`
            UPDATE jobs 
            SET status = 'failed', error_message = ?, updated_at = ? 
            WHERE id = ?
        `).run(errorMessage, now, jobId);

        // Get job details
        const job = this.db.prepare('SELECT user_id, order_id, cost_credits FROM jobs WHERE id = ?').get(jobId);

        // Refund credits if applicable
        if (job && job.cost_credits > 0) {
            try {
                this.db.prepare('UPDATE user_credits SET balance = balance + ? WHERE user_id = ?')
                    .run(job.cost_credits, job.user_id);
                logger.info('Credits refunded', { jobId, userId: job.user_id, credits: job.cost_credits });
            } catch (error) {
                logger.error('Credit refund failed', { jobId, error: error.message });
            }
        }

        // Update order status
        if (job && job.order_id) {
            this.db.prepare('UPDATE orders SET status = ? WHERE id = ?')
                .run('failed', job.order_id);
        }

        // Log error
        this.logError('error', 'job_failed', errorMessage, {
            job_id: jobId,
            user_id: job?.user_id,
            order_id: job?.order_id
        });

        // Clean up
        this.activeJobs.delete(jobId);
    }

    /**
     * Log error to database
     */
    logError(severity, errorCode, errorMessage, context = {}) {
        try {
            this.db.prepare(`
                INSERT INTO error_logs (
                    severity, error_code, error_message, context,
                    user_id, job_id, order_id, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                severity,
                errorCode,
                errorMessage,
                JSON.stringify(context),
                context.user_id || null,
                context.job_id || null,
                context.order_id || null,
                new Date().toISOString()
            );
        } catch (error) {
            logger.error('Failed to log error', { error: error.message });
        }
    }

    /**
     * Get job status
     */
    getJobStatus(jobId) {
        const job = this.db.prepare(`
            SELECT j.*, 
                   (SELECT COUNT(*) FROM job_steps WHERE job_id = j.id) as total_steps,
                   (SELECT COUNT(*) FROM job_steps WHERE job_id = j.id AND status = 'completed') as completed_steps
            FROM jobs j
            WHERE j.id = ?
        `).get(jobId);

        if (!job) return null;

        const steps = this.db.prepare(`
            SELECT * FROM job_steps 
            WHERE job_id = ? 
            ORDER BY step_order ASC
        `).all(jobId);

        return {
            ...job,
            steps: steps.map(step => ({
                ...step,
                input_params: step.input_params ? JSON.parse(step.input_params) : null,
                output_data: step.output_data ? JSON.parse(step.output_data) : null
            }))
        };
    }

    /**
     * Cancel a job
     */
    async cancelJob(jobId) {
        const job = this.getJobStatus(jobId);
        if (!job) {
            throw new Error('Job not found');
        }

        if (job.status === 'completed' || job.status === 'failed') {
            throw new Error('Cannot cancel completed or failed job');
        }

        // Try to cancel active A2E tasks
        for (const step of job.steps) {
            if (step.status === 'processing' && step.a2e_task_id) {
                try {
                    const taskTypeMap = {
                        '/api/v1/video/generate': 'video',
                        '/api/v1/userImage2Video/start': 'image2video',
                        '/api/v1/userFaceSwapTask/add': 'faceswap',
                        '/api/v1/userDubbing/startDubbing': 'dubbing'
                    };
                    const taskType = taskTypeMap[step.a2e_endpoint];
                    if (taskType) {
                        await this.a2eService.cancelTask(taskType, step.a2e_task_id);
                    }
                } catch (error) {
                    logger.warn('Failed to cancel A2E task', {
                        stepId: step.id,
                        taskId: step.a2e_task_id,
                        error: error.message
                    });
                }
            }
        }

        // Update job status
        this.db.prepare('UPDATE jobs SET status = ?, updated_at = ? WHERE id = ?')
            .run('cancelled', new Date().toISOString(), jobId);

        // Refund credits
        if (job.cost_credits > 0) {
            this.db.prepare('UPDATE user_credits SET balance = balance + ? WHERE user_id = ?')
                .run(job.cost_credits, job.user_id);
        }

        this.activeJobs.delete(jobId);

        logger.info('Job cancelled', { jobId });
    }
}

module.exports = JobProcessor;
