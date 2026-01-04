const axios = require('axios');
const winston = require('winston');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.json(),
    transports: [new winston.transports.Console()]
});

// User should replace this with actual A2E API URL
const A2E_API_URL = process.env.A2E_API_URL || 'https://api.a2e.ai/v1'; 
const A2E_API_KEY = process.env.A2E_API_KEY;

const api = axios.create({
    baseURL: A2E_API_URL,
    headers: {
        'Authorization': `Bearer ${A2E_API_KEY}`,
        'Content-Type': 'application/json'
    }
});

const submitJob = async (type, payload) => {
    try {
        if (!A2E_API_KEY) {
             logger.warn('A2E_API_KEY not set. Mocking response.');
             return { id: 'mock_' + Date.now(), status: 'processing' };
        }
        const response = await api.post('/jobs', { type, ...payload });
        return response.data;
    } catch (error) {
        logger.error({ msg: 'a2e_submit_error', error: error.message });
        throw error;
    }
};

const getJobStatus = async (jobId) => {
    try {
        if (jobId.startsWith('mock_')) {
             return { id: jobId, status: 'completed', result: { url: 'https://via.placeholder.com/500' } };
        }
        const response = await api.get(`/jobs/${jobId}`);
        return response.data;
    } catch (error) {
        logger.error({ msg: 'a2e_status_error', error: error.message });
        throw error;
    }
};

module.exports = { submitJob, getJobStatus };
