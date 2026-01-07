-- Migration: Add SKU Tool Configuration Tables
-- Version: 001
-- Date: 2026-01-07
-- Description: Adds comprehensive tool configuration system for SKU-to-A2E endpoint mapping

-- Main SKU Tool Configuration Table
CREATE TABLE IF NOT EXISTS sku_tool_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku_code TEXT NOT NULL UNIQUE,
    config_version INTEGER DEFAULT 1,
    active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(sku_code) REFERENCES skus(code)
);

CREATE INDEX IF NOT EXISTS idx_sku_tool_configs_sku_code ON sku_tool_configs(sku_code);
CREATE INDEX IF NOT EXISTS idx_sku_tool_configs_active ON sku_tool_configs(active);

-- Tool Configuration Steps (for multi-step workflows)
CREATE TABLE IF NOT EXISTS sku_tool_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    config_id INTEGER NOT NULL,
    step_order INTEGER NOT NULL,
    step_name TEXT NOT NULL,
    a2e_endpoint TEXT NOT NULL,
    http_method TEXT DEFAULT 'POST',
    required INTEGER DEFAULT 1,
    condition_expression TEXT, -- JSON expression for conditional execution
    params_template TEXT NOT NULL, -- JSON template with ${variable} placeholders
    timeout_seconds INTEGER DEFAULT 300,
    retry_enabled INTEGER DEFAULT 1,
    retry_max_attempts INTEGER DEFAULT 3,
    retry_backoff_ms INTEGER DEFAULT 1000,
    created_at TEXT NOT NULL,
    FOREIGN KEY(config_id) REFERENCES sku_tool_configs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sku_tool_steps_config_id ON sku_tool_steps(config_id);
CREATE INDEX IF NOT EXISTS idx_sku_tool_steps_order ON sku_tool_steps(config_id, step_order);

-- Customer-facing Options (rendered dynamically in frontend)
CREATE TABLE IF NOT EXISTS sku_customer_options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    config_id INTEGER NOT NULL,
    option_key TEXT NOT NULL,
    option_label TEXT NOT NULL,
    option_type TEXT NOT NULL, -- 'dropdown', 'radio', 'checkbox', 'text', 'file', 'number', 'slider'
    option_values TEXT, -- JSON array of possible values for dropdowns/radios
    default_value TEXT,
    required INTEGER DEFAULT 0,
    validation_rules TEXT, -- JSON object with validation rules
    help_text TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY(config_id) REFERENCES sku_tool_configs(id) ON DELETE CASCADE,
    UNIQUE(config_id, option_key)
);

CREATE INDEX IF NOT EXISTS idx_sku_customer_options_config ON sku_customer_options(config_id);

-- Job Steps Tracking (for monitoring multi-step job execution)
CREATE TABLE IF NOT EXISTS job_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    step_order INTEGER NOT NULL,
    step_name TEXT NOT NULL,
    a2e_endpoint TEXT NOT NULL,
    a2e_task_id TEXT,
    status TEXT DEFAULT 'pending', -- pending, processing, completed, failed, skipped
    input_params TEXT, -- JSON of parameters sent
    output_data TEXT, -- JSON of response received
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    started_at TEXT,
    completed_at TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_job_steps_job_id ON job_steps(job_id);
CREATE INDEX IF NOT EXISTS idx_job_steps_status ON job_steps(status);

-- A2E API Usage Tracking (for monitoring and cost analysis)
CREATE TABLE IF NOT EXISTS a2e_api_calls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER,
    job_step_id INTEGER,
    endpoint TEXT NOT NULL,
    http_method TEXT NOT NULL,
    request_payload TEXT,
    response_status INTEGER,
    response_body TEXT,
    response_time_ms INTEGER,
    credits_consumed INTEGER DEFAULT 0,
    success INTEGER DEFAULT 1,
    error_message TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE SET NULL,
    FOREIGN KEY(job_step_id) REFERENCES job_steps(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_a2e_api_calls_job_id ON a2e_api_calls(job_id);
CREATE INDEX IF NOT EXISTS idx_a2e_api_calls_created_at ON a2e_api_calls(created_at);
CREATE INDEX IF NOT EXISTS idx_a2e_api_calls_endpoint ON a2e_api_calls(endpoint);

-- Error Log Table (comprehensive error tracking)
CREATE TABLE IF NOT EXISTS error_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    severity TEXT NOT NULL, -- info, warning, error, critical
    error_code TEXT,
    error_message TEXT NOT NULL,
    error_stack TEXT,
    context TEXT, -- JSON with additional context
    user_id INTEGER,
    job_id INTEGER,
    order_id INTEGER,
    resolved INTEGER DEFAULT 0,
    resolution_notes TEXT,
    created_at TEXT NOT NULL,
    resolved_at TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE SET NULL,
    FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved);
CREATE INDEX IF NOT EXISTS idx_error_logs_job_id ON error_logs(job_id);

-- System Health Metrics (for monitoring)
CREATE TABLE IF NOT EXISTS system_health_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metric_name TEXT NOT NULL,
    metric_value REAL NOT NULL,
    metric_unit TEXT,
    tags TEXT, -- JSON object with tags
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_system_health_metrics_name ON system_health_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_system_health_metrics_created_at ON system_health_metrics(created_at);

-- A2E Service Health Check
CREATE TABLE IF NOT EXISTS a2e_health_checks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint_type TEXT NOT NULL,
    response_time_ms INTEGER,
    success INTEGER NOT NULL,
    error_message TEXT,
    credits_remaining INTEGER,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_a2e_health_checks_created_at ON a2e_health_checks(created_at);
