/**
 * SKU Tool Configuration Manager
 * Handles loading, parsing, and executing SKU-specific tool workflows
 */

const winston = require('winston');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [new winston.transports.Console()]
});

class SKUConfigManager {
    constructor(db) {
        this.db = db;
        this.configCache = new Map();
        this.cacheTimeout = 300000; // 5 minutes
    }

    /**
     * Get tool configuration for a SKU
     */
    getConfig(skuCode) {
        // Check cache first
        const cached = this.configCache.get(skuCode);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.config;
        }

        const config = this.db.prepare(`
            SELECT * FROM sku_tool_configs 
            WHERE sku_code = ? AND active = 1
        `).get(skuCode);

        if (!config) {
            return null;
        }

        // Load steps
        const steps = this.db.prepare(`
            SELECT * FROM sku_tool_steps 
            WHERE config_id = ? 
            ORDER BY step_order ASC
        `).all(config.id);

        // Load customer options
        const options = this.db.prepare(`
            SELECT * FROM sku_customer_options 
            WHERE config_id = ? 
            ORDER BY display_order ASC
        `).all(config.id);

        const fullConfig = {
            ...config,
            steps: steps.map(step => ({
                ...step,
                params_template: JSON.parse(step.params_template || '{}'),
                condition_expression: step.condition_expression ? JSON.parse(step.condition_expression) : null
            })),
            customer_options: options.map(opt => ({
                ...opt,
                option_values: opt.option_values ? JSON.parse(opt.option_values) : null,
                validation_rules: opt.validation_rules ? JSON.parse(opt.validation_rules) : null
            }))
        };

        // Cache it
        this.configCache.set(skuCode, {
            config: fullConfig,
            timestamp: Date.now()
        });

        return fullConfig;
    }

    /**
     * Validate customer inputs against configuration
     */
    validateCustomerInputs(skuCode, customerInputs) {
        const config = this.getConfig(skuCode);
        if (!config) {
            throw new Error(`No configuration found for SKU: ${skuCode}`);
        }

        const errors = [];

        for (const option of config.customer_options) {
            const value = customerInputs[option.option_key];

            // Check required fields
            if (option.required && (value === undefined || value === null || value === '')) {
                errors.push(`${option.option_label} is required`);
                continue;
            }

            // Skip validation if not provided and not required
            if (value === undefined || value === null) {
                continue;
            }

            // Apply validation rules
            if (option.validation_rules) {
                const rules = option.validation_rules;

                // Min/Max for numbers
                if (option.option_type === 'number') {
                    const numValue = Number(value);
                    if (isNaN(numValue)) {
                        errors.push(`${option.option_label} must be a number`);
                    } else {
                        if (rules.min !== undefined && numValue < rules.min) {
                            errors.push(`${option.option_label} must be at least ${rules.min}`);
                        }
                        if (rules.max !== undefined && numValue > rules.max) {
                            errors.push(`${option.option_label} must be at most ${rules.max}`);
                        }
                    }
                }

                // Length validation for text
                if (option.option_type === 'text') {
                    if (rules.minLength && value.length < rules.minLength) {
                        errors.push(`${option.option_label} must be at least ${rules.minLength} characters`);
                    }
                    if (rules.maxLength && value.length > rules.maxLength) {
                        errors.push(`${option.option_label} must be at most ${rules.maxLength} characters`);
                    }
                    if (rules.pattern) {
                        const regex = new RegExp(rules.pattern);
                        if (!regex.test(value)) {
                            errors.push(`${option.option_label} format is invalid`);
                        }
                    }
                }

                // Enum validation for dropdowns/radios
                if ((option.option_type === 'dropdown' || option.option_type === 'radio') && option.option_values) {
                    const validValues = option.option_values.map(v => v.value);
                    if (!validValues.includes(value)) {
                        errors.push(`${option.option_label} must be one of: ${validValues.join(', ')}`);
                    }
                }

                // File validation
                if (option.option_type === 'file' && rules.allowedTypes) {
                    // This would be validated on upload, but we can check URL extension
                    if (typeof value === 'string') {
                        const ext = value.split('.').pop()?.toLowerCase();
                        if (ext && !rules.allowedTypes.includes(ext)) {
                            errors.push(`${option.option_label} must be one of: ${rules.allowedTypes.join(', ')}`);
                        }
                    }
                }
            }
        }

        if (errors.length > 0) {
            return { valid: false, errors };
        }

        return { valid: true, errors: [] };
    }

    /**
     * Interpolate template parameters with customer inputs
     */
    interpolateParams(template, customerInputs, previousResults = []) {
        const context = {
            ...customerInputs,
            // Add results from previous steps
            ...previousResults.reduce((acc, result, index) => {
                acc[`step${index}_result`] = result;
                return acc;
            }, {})
        };

        // Convert template to string for processing
        let templateStr = JSON.stringify(template);

        // Replace ${variable} placeholders
        const regex = /\$\{([^}]+)\}/g;
        templateStr = templateStr.replace(regex, (match, key) => {
            // Handle nested properties (e.g., step0_result.data.url)
            const keys = key.trim().split('.');
            let value = context;

            for (const k of keys) {
                value = value?.[k];
                if (value === undefined) break;
            }

            if (value === undefined) {
                logger.warn(`Template variable not found: ${key}`);
                return match; // Keep original if not found
            }

            return JSON.stringify(value).replace(/^"|"$/g, ''); // Remove quotes if string
        });

        return JSON.parse(templateStr);
    }

    /**
     * Evaluate condition expression
     */
    evaluateCondition(condition, customerInputs, previousResults = []) {
        if (!condition) return true;

        const context = {
            ...customerInputs,
            ...previousResults.reduce((acc, result, index) => {
                acc[`step${index}`] = result;
                return acc;
            }, {})
        };

        try {
            // Simple condition evaluation (supports: ==, !=, >, <, >=, <=, &&, ||)
            // Format: { field: "key", operator: "==", value: "expected" }
            if (condition.field && condition.operator && condition.value !== undefined) {
                const fieldValue = context[condition.field];
                const expectedValue = condition.value;

                switch (condition.operator) {
                    case '==':
                        return fieldValue == expectedValue;
                    case '!=':
                        return fieldValue != expectedValue;
                    case '>':
                        return Number(fieldValue) > Number(expectedValue);
                    case '<':
                        return Number(fieldValue) < Number(expectedValue);
                    case '>=':
                        return Number(fieldValue) >= Number(expectedValue);
                    case '<=':
                        return Number(fieldValue) <= Number(expectedValue);
                    case 'exists':
                        return fieldValue !== undefined && fieldValue !== null;
                    case 'not_exists':
                        return fieldValue === undefined || fieldValue === null;
                    default:
                        logger.warn(`Unknown operator: ${condition.operator}`);
                        return true;
                }
            }

            // Complex conditions with AND/OR
            if (condition.and) {
                return condition.and.every(c => this.evaluateCondition(c, customerInputs, previousResults));
            }
            if (condition.or) {
                return condition.or.some(c => this.evaluateCondition(c, customerInputs, previousResults));
            }

            return true;
        } catch (error) {
            logger.error('Condition evaluation error', { error: error.message, condition });
            return true; // Default to true on error
        }
    }

    /**
     * Get all SKU codes with configurations
     */
    getAllConfiguredSKUs() {
        const configs = this.db.prepare(`
            SELECT sku_code FROM sku_tool_configs WHERE active = 1
        `).all();

        return configs.map(c => c.sku_code);
    }

    /**
     * Clear configuration cache
     */
    clearCache(skuCode = null) {
        if (skuCode) {
            this.configCache.delete(skuCode);
        } else {
            this.configCache.clear();
        }
    }

    /**
     * Create or update SKU configuration
     */
    saveConfig(skuCode, steps, customerOptions) {
        const now = new Date().toISOString();

        // Start transaction
        const transaction = this.db.transaction(() => {
            // Check if config exists
            let config = this.db.prepare('SELECT id FROM sku_tool_configs WHERE sku_code = ?').get(skuCode);

            if (config) {
                // Update existing
                this.db.prepare(`
                    UPDATE sku_tool_configs 
                    SET config_version = config_version + 1, updated_at = ?
                    WHERE sku_code = ?
                `).run(now, skuCode);

                // Delete old steps and options
                this.db.prepare('DELETE FROM sku_tool_steps WHERE config_id = ?').run(config.id);
                this.db.prepare('DELETE FROM sku_customer_options WHERE config_id = ?').run(config.id);
            } else {
                // Create new
                const result = this.db.prepare(`
                    INSERT INTO sku_tool_configs (sku_code, created_at, updated_at)
                    VALUES (?, ?, ?)
                `).run(skuCode, now, now);

                config = { id: result.lastInsertRowid };
            }

            // Insert steps
            const stepStmt = this.db.prepare(`
                INSERT INTO sku_tool_steps (
                    config_id, step_order, step_name, a2e_endpoint, http_method,
                    required, condition_expression, params_template, timeout_seconds,
                    retry_enabled, retry_max_attempts, retry_backoff_ms, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            steps.forEach((step, index) => {
                stepStmt.run(
                    config.id,
                    step.step_order || index,
                    step.step_name,
                    step.a2e_endpoint,
                    step.http_method || 'POST',
                    step.required ? 1 : 0,
                    step.condition_expression ? JSON.stringify(step.condition_expression) : null,
                    JSON.stringify(step.params_template),
                    step.timeout_seconds || 300,
                    step.retry_enabled !== false ? 1 : 0,
                    step.retry_max_attempts || 3,
                    step.retry_backoff_ms || 1000,
                    now
                );
            });

            // Insert customer options
            const optionStmt = this.db.prepare(`
                INSERT INTO sku_customer_options (
                    config_id, option_key, option_label, option_type, option_values,
                    default_value, required, validation_rules, help_text, display_order, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            customerOptions.forEach((option, index) => {
                // Ensure default_value is a valid SQLite type (string, number, or null)
                let defaultValue = option.default_value;
                if (defaultValue !== null && defaultValue !== undefined) {
                    if (typeof defaultValue === 'object') {
                        defaultValue = JSON.stringify(defaultValue);
                    } else if (typeof defaultValue !== 'string' && typeof defaultValue !== 'number') {
                        defaultValue = String(defaultValue);
                    }
                } else {
                    defaultValue = null;
                }

                optionStmt.run(
                    config.id,
                    option.option_key,
                    option.option_label,
                    option.option_type,
                    option.option_values ? JSON.stringify(option.option_values) : null,
                    defaultValue,
                    option.required ? 1 : 0,
                    option.validation_rules ? JSON.stringify(option.validation_rules) : null,
                    option.help_text || null,
                    option.display_order || index,
                    now
                );
            });

            return config.id;
        });

        const configId = transaction();

        // Clear cache for this SKU
        this.clearCache(skuCode);

        logger.info('SKU configuration saved', { skuCode, configId });

        return configId;
    }
}

module.exports = SKUConfigManager;
