/**
 * Enhanced API Routes
 * New endpoints for SKU tool configurations and advanced job processing
 */

const express = require('express');
const winston = require('winston');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const SKUConfigManager = require('../services/sku-config-manager');
const JobProcessor = require('../services/job-processor');
const A2EServiceEnhanced = require('../services/a2e-enhanced');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [new winston.transports.Console()]
});

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20971520 } }); // 20MB limit

/**
 * Initialize services
 */
function initializeServices(db) {
    const configManager = new SKUConfigManager(db);
    const jobProcessor = new JobProcessor(
        db,
        process.env.A2E_API_KEY,
        process.env.A2E_BASE_URL
    );
    const a2eService = new A2EServiceEnhanced(
        process.env.A2E_API_KEY,
        process.env.A2E_BASE_URL,
        db
    );

    return { configManager, jobProcessor, a2eService };
}

/**
 * Middleware for input sanitization
 */
function sanitizeInput(req, res, next) {
    const sanitize = (obj) => {
        if (typeof obj === 'string') {
            // Remove potential XSS
            return obj.replace(/<script[^>]*>.*?<\/script>/gi, '')
                .replace(/<[^>]+>/g, '')
                .trim();
        }
        if (Array.isArray(obj)) {
            return obj.map(sanitize);
        }
        if (obj && typeof obj === 'object') {
            const sanitized = {};
            for (const [key, value] of Object.entries(obj)) {
                sanitized[key] = sanitize(value);
            }
            return sanitized;
        }
        return obj;
    };

    if (req.body) {
        req.body = sanitize(req.body);
    }
    if (req.query) {
        req.query = sanitize(req.query);
    }
    next();
}

router.use(sanitizeInput);

module.exports = function (db, authenticateToken, isAdmin) {
    const { configManager, jobProcessor, a2eService } = initializeServices(db);

    // ==========================================================================
    // SKU TOOL CONFIGURATION ENDPOINTS
    // ==========================================================================

    /**
     * GET /api/skus/:sku_code/config
     * Get tool configuration for a specific SKU
     */
    router.get('/api/skus/:sku_code/config', authenticateToken, (req, res) => {
        try {
            const { sku_code } = req.params;
            const config = configManager.getConfig(sku_code);

            if (!config) {
                return res.status(404).json({ error: 'Configuration not found for this SKU' });
            }

            // Return customer-facing configuration
            res.json({
                sku_code,
                customer_options: config.customer_options,
                has_configuration: true
            });
        } catch (error) {
            logger.error('Get SKU config error', { error: error.message, sku_code: req.params.sku_code });
            res.status(500).json({ error: 'Failed to load configuration' });
        }
    });

    /**
     * POST /api/skus/:sku_code/validate
     * Validate customer inputs for a SKU
     */
    router.post('/api/skus/:sku_code/validate', authenticateToken, (req, res) => {
        try {
            const { sku_code } = req.params;
            const { customer_inputs } = req.body;

            const validation = configManager.validateCustomerInputs(sku_code, customer_inputs);
            res.json(validation);
        } catch (error) {
            logger.error('Validate inputs error', { error: error.message });
            res.status(500).json({ error: 'Validation failed', details: error.message });
        }
    });

    // ==========================================================================
    // ADVANCED JOB PROCESSING ENDPOINTS
    // ==========================================================================

    /**
     * POST /api/jobs/create-advanced
     * Create and start a job with advanced configuration
     */
    router.post('/api/jobs/create-advanced', authenticateToken, async (req, res) => {
        try {
            const { sku_code, customer_inputs, order_id } = req.body;
            const userId = req.user.id;

            if (!sku_code || !customer_inputs) {
                return res.status(400).json({ error: 'sku_code and customer_inputs are required' });
            }

            // Validate inputs
            const validation = configManager.validateCustomerInputs(sku_code, customer_inputs);
            if (!validation.valid) {
                return res.status(400).json({
                    error: 'Validation failed',
                    validation_errors: validation.errors
                });
            }

            // Create job
            const jobId = await jobProcessor.createJob(userId, order_id, sku_code, customer_inputs);

            res.json({
                job_id: jobId,
                status: 'processing',
                message: 'Job created and processing started'
            });

            logger.info('Advanced job created', { jobId, userId, sku_code });
        } catch (error) {
            logger.error('Create advanced job error', { error: error.message, stack: error.stack });
            res.status(500).json({ error: 'Job creation failed', details: error.message });
        }
    });

    /**
     * GET /api/jobs/:job_id/status
     * Get detailed job status with step information
     */
    router.get('/api/jobs/:job_id/status', authenticateToken, (req, res) => {
        try {
            const { job_id } = req.params;
            const userId = req.user.id;

            // Verify job ownership
            const job = db.prepare('SELECT user_id FROM jobs WHERE id = ?').get(job_id);
            if (!job) {
                return res.status(404).json({ error: 'Job not found' });
            }
            if (job.user_id !== userId) {
                return res.status(403).json({ error: 'Access denied' });
            }

            const status = jobProcessor.getJobStatus(job_id);
            res.json(status);
        } catch (error) {
            logger.error('Get job status error', { error: error.message });
            res.status(500).json({ error: 'Failed to get job status' });
        }
    });

    /**
     * POST /api/jobs/:job_id/cancel
     * Cancel a running job
     */
    router.post('/api/jobs/:job_id/cancel', authenticateToken, async (req, res) => {
        try {
            const { job_id } = req.params;
            const userId = req.user.id;

            // Verify job ownership
            const job = db.prepare('SELECT user_id FROM jobs WHERE id = ?').get(job_id);
            if (!job) {
                return res.status(404).json({ error: 'Job not found' });
            }
            if (job.user_id !== userId) {
                return res.status(403).json({ error: 'Access denied' });
            }

            await jobProcessor.cancelJob(job_id);
            res.json({ message: 'Job cancelled successfully', job_id });

            logger.info('Job cancelled', { job_id, userId });
        } catch (error) {
            logger.error('Cancel job error', { error: error.message });
            res.status(500).json({ error: 'Failed to cancel job', details: error.message });
        }
    });

    // ==========================================================================
    // FILE UPLOAD ENDPOINTS
    // ==========================================================================

    /**
     * POST /api/upload/media
     * Upload media files (images, audio, video)
     */
    router.post('/api/upload/media', authenticateToken, upload.single('file'), async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const { resource_type } = req.body; // image, video, audio, auto

            // Upload to cloudinary
            const result = await cloudinary.uploader.upload(
                `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
                {
                    resource_type: resource_type || 'auto',
                    folder: 'media-uploads',
                    use_filename: true
                }
            );

            res.json({
                url: result.secure_url,
                public_id: result.public_id,
                format: result.format,
                width: result.width,
                height: result.height,
                duration: result.duration,
                bytes: result.bytes
            });

            logger.info('Media uploaded', {
                userId: req.user.id,
                publicId: result.public_id,
                format: result.format
            });
        } catch (error) {
            logger.error('Media upload error', { error: error.message });
            res.status(500).json({ error: 'Upload failed', details: error.message });
        }
    });

    /**
     * POST /api/upload/multiple
     * Upload multiple files
     */
    router.post('/api/upload/multiple', authenticateToken, upload.array('files', 10), async (req, res) => {
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ error: 'No files uploaded' });
            }

            const uploadPromises = req.files.map(file =>
                cloudinary.uploader.upload(
                    `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
                    {
                        resource_type: 'auto',
                        folder: 'media-uploads'
                    }
                )
            );

            const results = await Promise.all(uploadPromises);

            res.json({
                files: results.map(result => ({
                    url: result.secure_url,
                    public_id: result.public_id,
                    format: result.format
                }))
            });

            logger.info('Multiple files uploaded', {
                userId: req.user.id,
                count: results.length
            });
        } catch (error) {
            logger.error('Multiple upload error', { error: error.message });
            res.status(500).json({ error: 'Upload failed', details: error.message });
        }
    });

    // ==========================================================================
    // A2E RESOURCE ENDPOINTS
    // ==========================================================================

    /**
     * GET /api/a2e/avatars
     * Get list of available avatars
     */
    router.get('/api/a2e/avatars', authenticateToken, async (req, res) => {
        try {
            const avatars = await a2eService.getAvatarList();
            res.json(avatars);
        } catch (error) {
            logger.error('Get avatars error', { error: error.message });
            res.status(500).json({ error: 'Failed to load avatars' });
        }
    });

    /**
     * GET /api/a2e/voices
     * Get list of available voices
     */
    router.get('/api/a2e/voices', authenticateToken, async (req, res) => {
        try {
            const voices = await a2eService.getVoiceList();
            res.json(voices);
        } catch (error) {
            logger.error('Get voices error', { error: error.message });
            res.status(500).json({ error: 'Failed to load voices' });
        }
    });

    /**
     * GET /api/a2e/user-voices
     * Get user's custom voice clones
     */
    router.get('/api/a2e/user-voices', authenticateToken, async (req, res) => {
        try {
            const voices = await a2eService.getUserVoices();
            res.json(voices);
        } catch (error) {
            logger.error('Get user voices error', { error: error.message });
            res.status(500).json({ error: 'Failed to load user voices' });
        }
    });

    /**
     * GET /api/a2e/credits
     * Get remaining A2E credits
     */
    router.get('/api/a2e/credits', authenticateToken, async (req, res) => {
        try {
            const credits = await a2eService.getRemainingCredits();
            res.json(credits);
        } catch (error) {
            logger.error('Get A2E credits error', { error: error.message });
            res.status(500).json({ error: 'Failed to load credits' });
        }
    });

    // ==========================================================================
    // MONITORING & HEALTH ENDPOINTS
    // ==========================================================================

    /**
     * GET /api/health/a2e
     * Check A2E service health
     */
    router.get('/api/health/a2e', authenticateToken, async (req, res) => {
        try {
            const health = await a2eService.healthCheck();
            res.json(health);
        } catch (error) {
            res.status(503).json({
                status: 'unhealthy',
                error: error.message
            });
        }
    });

    /**
     * GET /api/health/circuit-breakers
     * Get circuit breaker states
     */
    router.get('/api/health/circuit-breakers', authenticateToken, isAdmin, (req, res) => {
        try {
            const states = a2eService.getCircuitBreakerStates();
            res.json(states);
        } catch (error) {
            res.status(500).json({ error: 'Failed to get circuit breaker states' });
        }
    });

    /**
     * GET /api/monitoring/api-calls
     * Get recent A2E API call logs
     */
    router.get('/api/monitoring/api-calls', authenticateToken, isAdmin, (req, res) => {
        try {
            const { limit = 100, endpoint = null, success = null } = req.query;

            let query = 'SELECT * FROM a2e_api_calls WHERE 1=1';
            const params = [];

            if (endpoint) {
                query += ' AND endpoint = ?';
                params.push(endpoint);
            }

            if (success !== null) {
                query += ' AND success = ?';
                params.push(success === 'true' ? 1 : 0);
            }

            query += ' ORDER BY created_at DESC LIMIT ?';
            params.push(parseInt(limit));

            const calls = db.prepare(query).all(...params);

            res.json({
                calls: calls.map(call => ({
                    ...call,
                    request_payload: call.request_payload ? JSON.parse(call.request_payload) : null,
                    response_body: call.response_body ? JSON.parse(call.response_body) : null
                }))
            });
        } catch (error) {
            logger.error('Get API calls error', { error: error.message });
            res.status(500).json({ error: 'Failed to load API calls' });
        }
    });

    /**
     * GET /api/monitoring/errors
     * Get recent error logs
     */
    router.get('/api/monitoring/errors', authenticateToken, isAdmin, (req, res) => {
        try {
            const { limit = 100, severity = null, resolved = null } = req.query;

            let query = 'SELECT * FROM error_logs WHERE 1=1';
            const params = [];

            if (severity) {
                query += ' AND severity = ?';
                params.push(severity);
            }

            if (resolved !== null) {
                query += ' AND resolved = ?';
                params.push(resolved === 'true' ? 1 : 0);
            }

            query += ' ORDER BY created_at DESC LIMIT ?';
            params.push(parseInt(limit));

            const errors = db.prepare(query).all(...params);

            res.json({
                errors: errors.map(err => ({
                    ...err,
                    context: err.context ? JSON.parse(err.context) : null
                }))
            });
        } catch (error) {
            logger.error('Get errors error', { error: error.message });
            res.status(500).json({ error: 'Failed to load errors' });
        }
    });

    /**
     * GET /api/monitoring/metrics
     * Get system health metrics
     */
    router.get('/api/monitoring/metrics', authenticateToken, isAdmin, (req, res) => {
        try {
            const { hours = 24 } = req.query;
            const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

            const metrics = db.prepare(`
                SELECT * FROM system_health_metrics 
                WHERE created_at >= ? 
                ORDER BY created_at DESC
            `).all(since);

            // Aggregate by metric name
            const aggregated = {};
            metrics.forEach(m => {
                if (!aggregated[m.metric_name]) {
                    aggregated[m.metric_name] = {
                        name: m.metric_name,
                        unit: m.metric_unit,
                        values: [],
                        avg: 0,
                        min: Infinity,
                        max: -Infinity
                    };
                }
                const val = m.metric_value;
                aggregated[m.metric_name].values.push({ value: val, timestamp: m.created_at });
                aggregated[m.metric_name].min = Math.min(aggregated[m.metric_name].min, val);
                aggregated[m.metric_name].max = Math.max(aggregated[m.metric_name].max, val);
            });

            // Calculate averages
            Object.values(aggregated).forEach(metric => {
                const sum = metric.values.reduce((acc, v) => acc + v.value, 0);
                metric.avg = sum / metric.values.length;
            });

            res.json({ metrics: Object.values(aggregated) });
        } catch (error) {
            logger.error('Get metrics error', { error: error.message });
            res.status(500).json({ error: 'Failed to load metrics' });
        }
    });

    // ==========================================================================
    // ADMIN: SKU CONFIGURATION MANAGEMENT
    // ==========================================================================

    /**
     * PUT /api/admin/skus/:sku_code/config
     * Update SKU tool configuration (admin only)
     */
    router.put('/api/admin/skus/:sku_code/config', authenticateToken, isAdmin, (req, res) => {
        try {
            const { sku_code } = req.params;
            const { steps, customer_options } = req.body;

            if (!steps || !Array.isArray(steps)) {
                return res.status(400).json({ error: 'steps array is required' });
            }

            if (!customer_options || !Array.isArray(customer_options)) {
                return res.status(400).json({ error: 'customer_options array is required' });
            }

            const configId = configManager.saveConfig(sku_code, steps, customer_options);

            res.json({
                message: 'Configuration saved successfully',
                config_id: configId,
                sku_code
            });

            logger.info('SKU config updated', { sku_code, config_id: configId, admin: req.user.id });
        } catch (error) {
            logger.error('Update SKU config error', { error: error.message });
            res.status(500).json({ error: 'Failed to update configuration', details: error.message });
        }
    });

    return router;
};
