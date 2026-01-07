/**
 * Enhanced A2E Service Layer
 * Comprehensive implementation of A2E.ai API integration with:
 * - All video, TTS, voice clone, and avatar endpoints
 * - Retry logic with exponential backoff
 * - Circuit breaker pattern
 * - Comprehensive error handling
 * - API usage tracking
 * - Input validation
 */

const axios = require('axios');
const winston = require('winston');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [new winston.transports.Console()]
});

// Circuit Breaker Implementation
class CircuitBreaker {
    constructor(threshold = 5, timeout = 60000) {
        this.failureCount = 0;
        this.threshold = threshold;
        this.timeout = timeout;
        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.nextAttempt = Date.now();
    }

    async execute(fn) {
        if (this.state === 'OPEN') {
            if (Date.now() < this.nextAttempt) {
                throw new Error('Circuit breaker is OPEN');
            }
            this.state = 'HALF_OPEN';
        }

        try {
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    onSuccess() {
        this.failureCount = 0;
        this.state = 'CLOSED';
    }

    onFailure() {
        this.failureCount++;
        if (this.failureCount >= this.threshold) {
            this.state = 'OPEN';
            this.nextAttempt = Date.now() + this.timeout;
            logger.warn('Circuit breaker opened', {
                failureCount: this.failureCount,
                nextAttempt: new Date(this.nextAttempt).toISOString()
            });
        }
    }

    getState() {
        return this.state;
    }
}

class A2EServiceEnhanced {
    constructor(apiKey, baseURL, db = null) {
        this.apiKey = apiKey;
        this.baseURL = baseURL || 'https://video.a2e.ai';
        this.db = db;

        this.client = axios.create({
            baseURL: this.baseURL,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        // Circuit breakers for different endpoint categories
        this.circuitBreakers = {
            video: new CircuitBreaker(5, 60000),
            tts: new CircuitBreaker(5, 60000),
            voice: new CircuitBreaker(5, 60000),
            avatar: new CircuitBreaker(5, 60000),
            status: new CircuitBreaker(10, 30000)
        };

        // Rate limiting tracking
        this.requestCount = 0;
        this.requestWindow = Date.now();
        this.maxRequestsPerMinute = 60;
    }

    /**
     * Retry logic with exponential backoff
     */
    async retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
        let lastError;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;

                // Don't retry on validation errors or authentication errors
                if (error.response?.status === 400 || error.response?.status === 401 || error.response?.status === 403) {
                    throw error;
                }

                if (attempt < maxRetries) {
                    const delay = initialDelay * Math.pow(2, attempt);
                    logger.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`, {
                        error: error.message,
                        status: error.response?.status
                    });
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        throw lastError;
    }

    /**
     * Rate limiting check
     */
    async checkRateLimit() {
        const now = Date.now();
        const windowDuration = 60000; // 1 minute

        if (now - this.requestWindow > windowDuration) {
            this.requestCount = 0;
            this.requestWindow = now;
        }

        if (this.requestCount >= this.maxRequestsPerMinute) {
            const waitTime = windowDuration - (now - this.requestWindow);
            logger.warn('Rate limit reached, waiting', { waitTime });
            await new Promise(resolve => setTimeout(resolve, waitTime));
            this.requestCount = 0;
            this.requestWindow = Date.now();
        }

        this.requestCount++;
    }

    /**
     * Track API call in database
     */
    trackApiCall(endpoint, method, requestPayload, responseStatus, responseBody, responseTime, success, error = null) {
        if (!this.db) return;

        try {
            this.db.prepare(`
                INSERT INTO a2e_api_calls (
                    endpoint, http_method, request_payload, response_status, 
                    response_body, response_time_ms, success, error_message, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                endpoint,
                method,
                JSON.stringify(requestPayload),
                responseStatus,
                JSON.stringify(responseBody),
                responseTime,
                success ? 1 : 0,
                error,
                new Date().toISOString()
            );
        } catch (err) {
            logger.error('Failed to track API call', { error: err.message });
        }
    }

    /**
     * Make API request with full error handling and tracking
     */
    async makeRequest(endpoint, method, data, circuitBreakerKey = 'video') {
        await this.checkRateLimit();

        const startTime = Date.now();
        let response, error, success = true;

        try {
            response = await this.circuitBreakers[circuitBreakerKey].execute(async () => {
                return await this.retryWithBackoff(async () => {
                    return await this.client.request({
                        url: endpoint,
                        method,
                        data
                    });
                });
            });

            const responseTime = Date.now() - startTime;
            this.trackApiCall(endpoint, method, data, response.status, response.data, responseTime, true);

            logger.info('A2E API call successful', {
                endpoint,
                method,
                status: response.status,
                responseTime
            });

            return response.data;
        } catch (err) {
            success = false;
            error = err.message;
            const responseTime = Date.now() - startTime;

            this.trackApiCall(
                endpoint,
                method,
                data,
                err.response?.status || 0,
                err.response?.data || {},
                responseTime,
                false,
                error
            );

            logger.error('A2E API call failed', {
                endpoint,
                method,
                error: err.message,
                status: err.response?.status,
                responseData: err.response?.data
            });

            throw err;
        }
    }

    // ========== VIDEO GENERATION ==========

    /**
     * Generate video with avatar and audio
     * Primary endpoint for C1-15, C2-30, C3-60 SKUs
     */
    async generateVideo(params) {
        const {
            title,
            anchor_id,
            anchor_type = 1,
            audioSrc,
            msg = '',
            resolution = 1080,
            web_bg_width = 1920,
            web_bg_height = 1080,
            anchor_background_color = null,
            anchor_background_img = null,
            isSkipRs = true,
            isCaptionEnabled = false,
            captionAlign = null,
            isToPublicPool = false
        } = params;

        // Input validation
        if (!anchor_id) throw new Error('anchor_id is required');
        if (!audioSrc && !msg) throw new Error('Either audioSrc or msg is required');

        const payload = {
            title: title || `video_${Date.now()}`,
            anchor_id,
            anchor_type,
            resolution,
            web_bg_width,
            web_bg_height,
            isSkipRs,
            isToPublicPool
        };

        if (audioSrc) payload.audioSrc = audioSrc;
        if (msg) payload.msg = msg;
        if (anchor_background_color) payload.anchor_background_color = anchor_background_color;
        if (anchor_background_img) payload.anchor_background_img = anchor_background_img;
        if (isCaptionEnabled && captionAlign) {
            payload.isCaptionEnabled = true;
            payload.captionAlign = captionAlign;
        }

        return await this.makeRequest('/api/v1/video/generate', 'POST', payload, 'video');
    }

    /**
     * Get video generation status
     */
    async getVideoStatus(taskId) {
        return await this.makeRequest('/api/v1/video/awsResult', 'POST', { _id: taskId }, 'status');
    }

    // ========== TEXT-TO-SPEECH ==========

    /**
     * Generate TTS audio
     * Used for D1-VO30, D4-5PK SKUs
     */
    async generateTTS(params) {
        const {
            msg,
            tts_id,
            user_voice_id = null,
            speechRate = 1.0,
            country = 'en',
            region = 'US'
        } = params;

        // Input validation
        if (!msg || msg.trim().length === 0) {
            throw new Error('msg (script text) is required and cannot be empty');
        }
        if (!tts_id && !user_voice_id) {
            throw new Error('Either tts_id (public voice) or user_voice_id (cloned voice) is required');
        }

        const payload = {
            msg: msg.trim(),
            speechRate,
            country,
            region
        };

        if (user_voice_id) {
            payload.user_voice_id = user_voice_id;
        } else {
            payload.tts_id = tts_id;
        }

        return await this.makeRequest('/api/v1/video/send_tts', 'POST', payload, 'tts');
    }

    /**
     * Get list of available public voices
     */
    async getVoiceList() {
        return await this.makeRequest('/api/v1/anchor/voice_list', 'GET', null, 'tts');
    }

    // ========== VOICE CLONING ==========

    /**
     * Train voice clone
     * Used for D2-CLONE, D3-CLPRO SKUs
     */
    async trainVoiceClone(params) {
        const {
            name,
            voice_urls,
            model = 'a2e',
            language = 'en',
            gender = 'female',
            denoise = true
        } = params;

        // Input validation
        if (!name || name.trim().length === 0) {
            throw new Error('name is required for voice clone');
        }
        if (!voice_urls || !Array.isArray(voice_urls) || voice_urls.length === 0) {
            throw new Error('voice_urls array with at least one audio sample is required');
        }

        const payload = {
            name: name.trim(),
            voice_urls,
            model,
            language,
            gender,
            denoise
        };

        return await this.makeRequest('/api/v1/userVoice/training', 'POST', payload, 'voice');
    }

    /**
     * Get voice clone status
     */
    async getVoiceCloneStatus(voiceId) {
        const response = await this.makeRequest('/api/v1/userVoice/completedRecord', 'GET', null, 'status');

        if (response && response.data && Array.isArray(response.data)) {
            const voice = response.data.find(v => v._id === voiceId);
            return voice || null;
        }

        return null;
    }

    /**
     * Get all user voice clones
     */
    async getUserVoices() {
        return await this.makeRequest('/api/v1/userVoice/completedRecord', 'GET', null, 'voice');
    }

    // ========== AVATAR MANAGEMENT ==========

    /**
     * Create custom avatar
     * Used for A4-BR SKU
     */
    async trainAvatar(params) {
        const {
            name,
            video_urls,
            model = 'instant'
        } = params;

        // Input validation
        if (!name || name.trim().length === 0) {
            throw new Error('name is required for avatar');
        }
        if (!video_urls || !Array.isArray(video_urls) || video_urls.length === 0) {
            throw new Error('video_urls array with at least one video is required');
        }

        const payload = {
            name: name.trim(),
            video_urls,
            model
        };

        return await this.makeRequest('/api/v1/userVideoTwin/startTraining', 'POST', payload, 'avatar');
    }

    /**
     * Get avatar training status
     */
    async getAvatarStatus(avatarId) {
        return await this.makeRequest('/api/v1/userVideoTwin/get', 'POST', { _id: avatarId }, 'status');
    }

    /**
     * Get list of available avatars (public + user's custom)
     */
    async getAvatarList() {
        return await this.makeRequest('/api/v1/anchor/character_list', 'GET', null, 'avatar');
    }

    // ========== IMAGE TO VIDEO ==========

    /**
     * Convert image to video
     * Used for some V1 SKUs with video extraction
     */
    async imageToVideo(params) {
        const {
            image_url,
            name,
            prompt = 'person speaking naturally',
            negative_prompt = 'bad quality, blurry, distorted',
            duration = 5
        } = params;

        // Input validation
        if (!image_url) throw new Error('image_url is required');

        const payload = {
            image_url,
            name: name || `img2vid_${Date.now()}`,
            prompt,
            negative_prompt,
            duration
        };

        return await this.makeRequest('/api/v1/userImage2Video/start', 'POST', payload, 'video');
    }

    /**
     * Get image-to-video status
     */
    async getImageToVideoStatus(taskId) {
        return await this.makeRequest('/api/v1/userImage2Video/get', 'POST', { _id: taskId }, 'status');
    }

    // ========== FACE SWAP ==========

    /**
     * Face swap in video
     */
    async faceSwap(params) {
        const {
            face_url,
            video_url,
            name
        } = params;

        // Input validation
        if (!face_url) throw new Error('face_url is required');
        if (!video_url) throw new Error('video_url is required');

        const payload = {
            face_url,
            video_url,
            name: name || `faceswap_${Date.now()}`
        };

        return await this.makeRequest('/api/v1/userFaceSwapTask/add', 'POST', payload, 'video');
    }

    /**
     * Get face swap status
     */
    async getFaceSwapStatus(taskId) {
        return await this.makeRequest('/api/v1/userFaceSwapTask/get', 'POST', { _id: taskId }, 'status');
    }

    // ========== VIDEO DUBBING ==========

    /**
     * Dub video to different language
     */
    async dubVideo(params) {
        const {
            video_url,
            target_language = 'en',
            name
        } = params;

        // Input validation
        if (!video_url) throw new Error('video_url is required');

        const payload = {
            video_url,
            target_language,
            name: name || `dub_${Date.now()}`
        };

        return await this.makeRequest('/api/v1/userDubbing/startDubbing', 'POST', payload, 'video');
    }

    /**
     * Get dubbing status
     */
    async getDubbingStatus(taskId) {
        return await this.makeRequest('/api/v1/userDubbing/get', 'POST', { _id: taskId }, 'status');
    }

    // ========== ACCOUNT & CREDITS ==========

    /**
     * Get user credit balance
     */
    async getRemainingCredits() {
        return await this.makeRequest('/api/v1/user/remainingCoins', 'GET', null, 'status');
    }

    /**
     * Get user account info
     */
    async getUserInfo() {
        return await this.makeRequest('/api/v1/user/info', 'GET', null, 'status');
    }

    // ========== TASK MANAGEMENT ==========

    /**
     * Cancel a running task
     */
    async cancelTask(taskType, taskId) {
        const endpoints = {
            video: '/api/v1/video/cancel',
            image2video: '/api/v1/userImage2Video/cancel',
            faceswap: '/api/v1/userFaceSwapTask/cancel',
            dubbing: '/api/v1/userDubbing/cancel'
        };

        const endpoint = endpoints[taskType];
        if (!endpoint) {
            throw new Error(`Unknown task type: ${taskType}`);
        }

        return await this.makeRequest(endpoint, 'POST', { _id: taskId }, 'status');
    }

    /**
     * Get generic task status (auto-detects endpoint)
     */
    async getTaskStatus(taskType, taskId) {
        const statusEndpoints = {
            video: this.getVideoStatus.bind(this),
            image2video: this.getImageToVideoStatus.bind(this),
            faceswap: this.getFaceSwapStatus.bind(this),
            dubbing: this.getDubbingStatus.bind(this),
            avatar: this.getAvatarStatus.bind(this),
            voice: this.getVoiceCloneStatus.bind(this)
        };

        const statusFn = statusEndpoints[taskType];
        if (!statusFn) {
            throw new Error(`Unknown task type: ${taskType}`);
        }

        return await statusFn(taskId);
    }

    // ========== HEALTH CHECKS ==========

    /**
     * Perform health check on A2E service
     */
    async healthCheck() {
        const startTime = Date.now();
        try {
            const response = await this.getRemainingCredits();
            const responseTime = Date.now() - startTime;

            const health = {
                status: 'healthy',
                responseTime,
                creditsRemaining: response?.data?.coins || 0,
                timestamp: new Date().toISOString()
            };

            if (this.db) {
                this.db.prepare(`
                    INSERT INTO a2e_health_checks (endpoint_type, response_time_ms, success, credits_remaining, created_at)
                    VALUES (?, ?, 1, ?, ?)
                `).run('credits', responseTime, health.creditsRemaining, health.timestamp);
            }

            return health;
        } catch (error) {
            const responseTime = Date.now() - startTime;

            if (this.db) {
                this.db.prepare(`
                    INSERT INTO a2e_health_checks (endpoint_type, response_time_ms, success, error_message, created_at)
                    VALUES (?, ?, 0, ?, ?)
                `).run('credits', responseTime, error.message, new Date().toISOString());
            }

            return {
                status: 'unhealthy',
                responseTime,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Get circuit breaker states
     */
    getCircuitBreakerStates() {
        const states = {};
        for (const [key, breaker] of Object.entries(this.circuitBreakers)) {
            states[key] = {
                state: breaker.getState(),
                failureCount: breaker.failureCount
            };
        }
        return states;
    }
}

module.exports = A2EServiceEnhanced;
