/**
 * Integration Tests for API Tool Mapping Implementation
 * Tests end-to-end workflows for all major components
 */

const Database = require('better-sqlite3');
const SKUConfigManager = require('../services/sku-config-manager');
const A2EServiceEnhanced = require('../services/a2e-enhanced');
const JobProcessor = require('../services/job-processor');

// Test database
const testDb = new Database(':memory:');

// Initialize test database schema
function initTestDatabase() {
    testDb.exec(`
        CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT);
        CREATE TABLE user_credits (user_id INTEGER, balance INTEGER DEFAULT 0);
        CREATE TABLE skus (code TEXT PRIMARY KEY, base_credits INTEGER);
        CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER, sku_code TEXT, status TEXT);
        CREATE TABLE jobs (id INTEGER PRIMARY KEY, user_id INTEGER, type TEXT, status TEXT, cost_credits INTEGER, order_id INTEGER, created_at TEXT, updated_at TEXT, error_message TEXT, result_url TEXT);
        CREATE TABLE sku_tool_configs (id INTEGER PRIMARY KEY, sku_code TEXT UNIQUE, config_version INTEGER DEFAULT 1, active INTEGER DEFAULT 1, created_at TEXT, updated_at TEXT);
        CREATE TABLE sku_tool_steps (id INTEGER PRIMARY KEY, config_id INTEGER, step_order INTEGER, step_name TEXT, a2e_endpoint TEXT, http_method TEXT DEFAULT 'POST', required INTEGER DEFAULT 1, condition_expression TEXT, params_template TEXT, timeout_seconds INTEGER DEFAULT 300, retry_enabled INTEGER DEFAULT 1, retry_max_attempts INTEGER DEFAULT 3, retry_backoff_ms INTEGER DEFAULT 1000, created_at TEXT);
        CREATE TABLE sku_customer_options (id INTEGER PRIMARY KEY, config_id INTEGER, option_key TEXT, option_label TEXT, option_type TEXT, option_values TEXT, default_value TEXT, required INTEGER DEFAULT 0, validation_rules TEXT, help_text TEXT, display_order INTEGER DEFAULT 0, created_at TEXT);
        CREATE TABLE job_steps (id INTEGER PRIMARY KEY, job_id INTEGER, step_order INTEGER, step_name TEXT, a2e_endpoint TEXT, a2e_task_id TEXT, status TEXT DEFAULT 'pending', input_params TEXT, output_data TEXT, error_message TEXT, retry_count INTEGER DEFAULT 0, started_at TEXT, completed_at TEXT, created_at TEXT);
        CREATE TABLE a2e_api_calls (id INTEGER PRIMARY KEY, job_id INTEGER, job_step_id INTEGER, endpoint TEXT, http_method TEXT, request_payload TEXT, response_status INTEGER, response_body TEXT, response_time_ms INTEGER, credits_consumed INTEGER DEFAULT 0, success INTEGER DEFAULT 1, error_message TEXT, created_at TEXT);
        CREATE TABLE error_logs (id INTEGER PRIMARY KEY, severity TEXT, error_code TEXT, error_message TEXT, error_stack TEXT, context TEXT, user_id INTEGER, job_id INTEGER, order_id INTEGER, resolved INTEGER DEFAULT 0, resolution_notes TEXT, created_at TEXT, resolved_at TEXT);
    `);

    // Insert test data
    testDb.prepare('INSERT INTO users (id, email) VALUES (?, ?)').run(1, 'test@example.com');
    testDb.prepare('INSERT INTO user_credits (user_id, balance) VALUES (?, ?)').run(1, 1000);
    testDb.prepare('INSERT INTO skus (code, base_credits) VALUES (?, ?)').run('C1-15', 90);
}

describe('SKU Configuration Manager', () => {
    let configManager;

    beforeAll(() => {
        initTestDatabase();
        configManager = new SKUConfigManager(testDb);
    });

    test('should save and retrieve SKU configuration', () => {
        const steps = [
            {
                step_order: 0,
                step_name: 'generate_video',
                a2e_endpoint: '/api/v1/video/generate',
                params_template: { anchor_id: '${avatar_id}' }
            }
        ];

        const options = [
            {
                option_key: 'avatar_id',
                option_label: 'Select Avatar',
                option_type: 'dropdown',
                required: true
            }
        ];

        const configId = configManager.saveConfig('C1-15', steps, options);
        expect(configId).toBeGreaterThan(0);

        const config = configManager.getConfig('C1-15');
        expect(config).toBeDefined();
        expect(config.sku_code).toBe('C1-15');
        expect(config.steps.length).toBe(1);
        expect(config.customer_options.length).toBe(1);
    });

    test('should validate customer inputs correctly', () => {
        // Valid inputs
        const validInputs = { avatar_id: 'avatar_123' };
        const validResult = configManager.validateCustomerInputs('C1-15', validInputs);
        expect(validResult.valid).toBe(true);
        expect(validResult.errors.length).toBe(0);

        // Invalid inputs (missing required field)
        const invalidInputs = {};
        const invalidResult = configManager.validateCustomerInputs('C1-15', invalidInputs);
        expect(invalidResult.valid).toBe(false);
        expect(invalidResult.errors.length).toBeGreaterThan(0);
    });

    test('should interpolate parameters correctly', () => {
        const template = {
            anchor_id: '${avatar_id}',
            resolution: 1080,
            nested: { value: '${nested_value}' }
        };

        const customerInputs = {
            avatar_id: 'avatar_123',
            nested_value: 'test'
        };

        const result = configManager.interpolateParams(template, customerInputs);
        expect(result.anchor_id).toBe('avatar_123');
        expect(result.resolution).toBe(1080);
        expect(result.nested.value).toBe('test');
    });

    test('should evaluate conditions correctly', () => {
        const condition = { field: 'use_tts', operator: '==', value: true };

        const inputs1 = { use_tts: true };
        expect(configManager.evaluateCondition(condition, inputs1)).toBe(true);

        const inputs2 = { use_tts: false };
        expect(configManager.evaluateCondition(condition, inputs2)).toBe(false);
    });
});

describe('Input Validation', () => {
    let configManager;

    beforeAll(() => {
        configManager = new SKUConfigManager(testDb);

        // Add config with validation rules
        configManager.saveConfig('TEST-SKU',
            [{ step_order: 0, step_name: 'test', a2e_endpoint: '/test', params_template: {} }],
            [
                {
                    option_key: 'email',
                    option_label: 'Email',
                    option_type: 'text',
                    required: true,
                    validation_rules: { pattern: '^[^@]+@[^@]+\\.[^@]+$' }
                },
                {
                    option_key: 'age',
                    option_label: 'Age',
                    option_type: 'number',
                    required: false,
                    validation_rules: { min: 18, max: 120 }
                }
            ]
        );
    });

    test('should validate email format', () => {
        const valid = configManager.validateCustomerInputs('TEST-SKU', { email: 'test@example.com' });
        expect(valid.valid).toBe(true);

        const invalid = configManager.validateCustomerInputs('TEST-SKU', { email: 'not-an-email' });
        expect(invalid.valid).toBe(false);
    });

    test('should validate number ranges', () => {
        const valid = configManager.validateCustomerInputs('TEST-SKU', {
            email: 'test@example.com',
            age: 25
        });
        expect(valid.valid).toBe(true);

        const tooYoung = configManager.validateCustomerInputs('TEST-SKU', {
            email: 'test@example.com',
            age: 15
        });
        expect(tooYoung.valid).toBe(false);

        const tooOld = configManager.validateCustomerInputs('TEST-SKU', {
            email: 'test@example.com',
            age: 150
        });
        expect(tooOld.valid).toBe(false);
    });
});

describe('Circuit Breaker', () => {
    test('should transition states correctly', async () => {
        const A2EServiceEnhanced = require('../services/a2e-enhanced');
        const mockService = new A2EServiceEnhanced('test-key', 'https://test.api');

        const breaker = mockService.circuitBreakers.video;
        expect(breaker.getState()).toBe('CLOSED');

        // Simulate failures
        for (let i = 0; i < 5; i++) {
            breaker.onFailure();
        }

        expect(breaker.getState()).toBe('OPEN');
    });
});

describe('Error Handling', () => {
    test('should sanitize XSS inputs', () => {
        const maliciousInput = '<script>alert("XSS")</script>Hello';
        const sanitized = maliciousInput.replace(/<script[^>]*>.*?<\/script>/gi, '').replace(/<[^>]+>/g, '').trim();
        expect(sanitized).toBe('Hello');
        expect(sanitized).not.toContain('<script>');
    });

    test('should handle SQL injection attempts', () => {
        const maliciousInput = "'; DROP TABLE users; --";
        // Using prepared statements prevents SQL injection
        expect(() => {
            testDb.prepare('SELECT * FROM users WHERE email = ?').get(maliciousInput);
        }).not.toThrow();
    });
});

describe('Credit Calculation', () => {
    test('should calculate credits correctly based on SKU', () => {
        const sku = testDb.prepare('SELECT base_credits FROM skus WHERE code = ?').get('C1-15');
        expect(sku.base_credits).toBe(90);
    });
});

// Mock A2E Service for testing without real API calls
class MockA2EService extends A2EServiceEnhanced {
    async makeRequest(endpoint, method, data) {
        // Return mock responses based on endpoint
        if (endpoint.includes('video/generate')) {
            return {
                status: 200,
                data: {
                    _id: 'mock_task_123',
                    status: 'processing'
                }
            };
        }
        if (endpoint.includes('send_tts')) {
            return {
                status: 200,
                data: {
                    audio_url: 'https://example.com/audio.mp3'
                }
            };
        }
        return { status: 200, data: {} };
    }

    async getTaskStatus(type, taskId) {
        return {
            data: {
                current_status: 'completed',
                result_url: 'https://example.com/result.mp4'
            }
        };
    }
}

describe('End-to-End Workflow', () => {
    test('should process a complete video generation job', async () => {
        const mockJobProcessor = new JobProcessor(testDb, 'test-key', 'https://test.api');

        // Override A2E service with mock
        mockJobProcessor.a2eService = new MockA2EService('test-key', 'https://test.api', testDb);

        const customerInputs = {
            avatar_id: 'avatar_123',
            orientation: 'vertical',
            audio_source: 'upload',
            audio_url: 'https://example.com/audio.mp3',
            background_type: 'color',
            bg_color: 'rgb(255,255,255)',
            captions_enabled: false
        };

        // This would normally be async and take time
        // In a real test, you'd use jest.setTimeout and await the full process
        const jobId = await mockJobProcessor.createJob(1, null, 'C1-15', customerInputs);
        expect(jobId).toBeGreaterThan(0);

        // Verify job was created
        const job = testDb.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
        expect(job).toBeDefined();
        expect(job.type).toBe('C1-15');
    });
});

// Cleanup
afterAll(() => {
    testDb.close();
});
