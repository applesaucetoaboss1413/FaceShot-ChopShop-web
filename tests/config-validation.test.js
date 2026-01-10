const { describe, it, beforeEach } = require('mocha');
const { expect } = require('chai');
const sinon = require('sinon');

// Mock process.env for testing
const originalEnv = { ...process.env };

describe('Configuration Validation', () => {
    beforeEach(() => {
        // Reset process.env before each test
        process.env = { ...originalEnv };
        // Clear require cache to reload config
        delete require.cache[require.resolve('../config')];
    });

    afterEach(() => {
        // Restore original env
        process.env = originalEnv;
    });

    it('should throw error for missing required environment variables', () => {
        // Clear all required vars
        const requiredVars = [
            'PORT', 'NODE_ENV', 'DB_PATH', 'JWT_SECRET', 'ADMIN_SECRET',
            'A2E_API_KEY', 'A2E_BASE_URL', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET',
            'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET',
            'COST_PER_CREDIT', 'MIN_MARGIN', 'MAX_JOB_SECONDS'
        ];

        requiredVars.forEach(varName => {
            delete process.env[varName];
        });

        expect(() => {
            require('../config');
        }).to.throw('CRITICAL: Missing required environment variables');
    });

    it('should throw error for invalid COST_PER_CREDIT', () => {
        // Set valid required vars
        setValidRequiredVars();
        process.env.COST_PER_CREDIT = 'invalid';

        expect(() => {
            require('../config');
        }).to.throw('CRITICAL: COST_PER_CREDIT must be a positive number');
    });

    it('should throw error for invalid MIN_MARGIN', () => {
        setValidRequiredVars();
        process.env.MIN_MARGIN = '1.5'; // > 1

        expect(() => {
            require('../config');
        }).to.throw('CRITICAL: MIN_MARGIN must be between 0 and 1');
    });

    it('should throw error for invalid MAX_JOB_SECONDS', () => {
        setValidRequiredVars();
        process.env.MAX_JOB_SECONDS = '-1';

        expect(() => {
            require('../config');
        }).to.throw('CRITICAL: MAX_JOB_SECONDS must be a positive integer');
    });

    it('should throw error for placeholder values in production', () => {
        setValidRequiredVars();
        process.env.NODE_ENV = 'production';
        process.env.JWT_SECRET = 'your_jwt_secret_here';

        expect(() => {
            require('../config');
        }).to.throw('CRITICAL: JWT_SECRET is set to insecure placeholder value');
    });

    it('should throw error for missing DB_PATH in production', () => {
        setValidRequiredVars();
        process.env.NODE_ENV = 'production';
        delete process.env.DB_PATH;

        expect(() => {
            require('../config');
        }).to.throw('CRITICAL: DB_PATH must be explicitly set in production environment');
    });

    it('should load successfully with valid configuration', () => {
        setValidRequiredVars();

        const config = require('../config');

        expect(config).to.be.an('object');
        expect(config.port).to.equal('3000');
        expect(config.nodeEnv).to.equal('test');
        expect(config.dbPath).to.equal('/tmp/test.db');
        expect(config.jwtSecret).to.equal('test_jwt_secret');
    });

    it('should provide defaults for optional variables', () => {
        setValidRequiredVars();

        const config = require('../config');

        expect(config.logLevel).to.equal('info');
        expect(config.defaultCurrency).to.equal('mxn');
        expect(config.supportedCurrencies).to.be.an('array');
        expect(config.supportedCurrencies).to.include('usd');
        expect(config.supportedCurrencies).to.include('mxn');
    });
});

function setValidRequiredVars() {
    process.env.PORT = '3000';
    process.env.NODE_ENV = 'test';
    process.env.DB_PATH = '/tmp/test.db';
    process.env.JWT_SECRET = 'test_jwt_secret';
    process.env.ADMIN_SECRET = 'test_admin_secret';
    process.env.A2E_API_KEY = 'test_a2e_key';
    process.env.A2E_BASE_URL = 'https://test.a2e.ai';
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123';
    process.env.CLOUDINARY_CLOUD_NAME = 'test_cloud';
    process.env.CLOUDINARY_API_KEY = '123456789';
    process.env.CLOUDINARY_API_SECRET = 'test_secret';
    process.env.COST_PER_CREDIT = '0.01';
    process.env.MIN_MARGIN = '0.3';
    process.env.MAX_JOB_SECONDS = '3600';
}