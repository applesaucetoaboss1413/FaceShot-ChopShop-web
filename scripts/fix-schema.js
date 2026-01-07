const Database = require('better-sqlite3');
const db = new Database('production.db');

console.log('Fixing schema to make a2e_endpoint nullable...');

db.exec(`
    -- Rename old table
    ALTER TABLE sku_tool_steps RENAME TO sku_tool_steps_old;
    
    -- Create new table with nullable a2e_endpoint
    CREATE TABLE sku_tool_steps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        config_id INTEGER NOT NULL,
        step_order INTEGER NOT NULL,
        step_name TEXT NOT NULL,
        a2e_endpoint TEXT,
        http_method TEXT DEFAULT 'POST',
        required INTEGER DEFAULT 1,
        condition_expression TEXT,
        params_template TEXT NOT NULL,
        timeout_seconds INTEGER DEFAULT 300,
        retry_enabled INTEGER DEFAULT 1,
        retry_max_attempts INTEGER DEFAULT 3,
        retry_backoff_ms INTEGER DEFAULT 1000,
        created_at TEXT NOT NULL,
        FOREIGN KEY(config_id) REFERENCES sku_tool_configs(id) ON DELETE CASCADE
    );
    
    -- Copy data
    INSERT INTO sku_tool_steps SELECT * FROM sku_tool_steps_old;
    
    -- Drop old table
    DROP TABLE sku_tool_steps_old;
    
    -- Recreate indexes
    CREATE INDEX IF NOT EXISTS idx_sku_tool_steps_config_id ON sku_tool_steps(config_id);
    CREATE INDEX IF NOT EXISTS idx_sku_tool_steps_order ON sku_tool_steps(config_id, step_order);
`);

console.log('✓ Schema fixed successfully');

// Do the same for job_steps
db.exec(`
    -- Rename old table
    ALTER TABLE job_steps RENAME TO job_steps_old;
    
    -- Create new table with nullable a2e_endpoint
    CREATE TABLE job_steps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id INTEGER NOT NULL,
        step_order INTEGER NOT NULL,
        step_name TEXT NOT NULL,
        a2e_endpoint TEXT,
        a2e_task_id TEXT,
        status TEXT DEFAULT 'pending',
        input_params TEXT,
        output_data TEXT,
        error_message TEXT,
        retry_count INTEGER DEFAULT 0,
        started_at TEXT,
        completed_at TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE CASCADE
    );
    
    -- Copy data
    INSERT INTO job_steps SELECT * FROM job_steps_old;
    
    -- Drop old table
    DROP TABLE job_steps_old;
    
    -- Recreate indexes
    CREATE INDEX IF NOT EXISTS idx_job_steps_job_id ON job_steps(job_id);
    CREATE INDEX IF NOT EXISTS idx_job_steps_status ON job_steps(status);
`);

console.log('✓ job_steps schema also fixed');

db.close();
