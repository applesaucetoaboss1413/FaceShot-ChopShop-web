/**
 * SKU Tool Configuration Manager
 * Handles loading, parsing, and executing SKU-specific tool workflows
 */

const winston = require('winston');
const db = require('../db/mongo');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [new winston.transports.Console()]
});

class SKUConfigManager {
    constructor() {
        this.configCache = new Map();
        this.cacheTimeout = 300000; // 5 minutes
    }

    /**
     * Get tool configuration for a SKU
     */
    async getConfig(skuCode) {
        // Check cache first
        const cached = this.configCache.get(skuCode);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.config;
        }

        const fullConfig = await db.getSkuToolConfig(skuCode);

        if (!fullConfig) {
            return null;
        }

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
    async getAllConfiguredSKUs() {
        return await db.getAllConfiguredSKUs();
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
    async saveConfig(skuCode, steps, customerOptions) {
        // Check if config exists
        let config = await db.getSkuToolConfig(skuCode);

        if (config) {
            // Update existing
            config = await db.updateSkuToolConfig(config._id, { config_version: (config.config_version || 0) + 1 });

            // Delete old steps and options
            await db.deleteSkuToolSteps(config._id);
            await db.deleteSkuCustomerOptions(config._id);
        } else {
            // Create new
            config = await db.createSkuToolConfig(skuCode);
        }

        // Insert steps
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            await db.createSkuToolStep(config._id, {
                step_order: step.step_order || i,
                step_name: step.step_name,
                a2e_endpoint: step.a2e_endpoint,
                http_method: step.http_method || 'POST',
                required: step.required || false,
                condition_expression: step.condition_expression,
                params_template: step.params_template,
                timeout_seconds: step.timeout_seconds || 300,
                retry_enabled: step.retry_enabled !== false,
                retry_max_attempts: step.retry_max_attempts || 3,
                retry_backoff_ms: step.retry_backoff_ms || 1000
            });
        }

        // Insert customer options
        for (let i = 0; i < customerOptions.length; i++) {
            const option = customerOptions[i];
            await db.createSkuCustomerOption(config._id, {
                option_key: option.option_key,
                option_label: option.option_label,
                option_type: option.option_type,
                option_values: option.option_values,
                default_value: option.default_value,
                required: option.required || false,
                validation_rules: option.validation_rules,
                help_text: option.help_text,
                display_order: option.display_order || i
            });
        }

        // Clear cache for this SKU
        this.clearCache(skuCode);

        logger.info('SKU configuration saved', { skuCode, configId: config._id });

        return config._id;
    }
}

module.exports = SKUConfigManager;
