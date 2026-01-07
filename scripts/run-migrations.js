#!/usr/bin/env node
/**
 * Database Migration Runner
 * Runs SQL migrations in order and tracks which have been applied
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || 'production.db';
const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

// Initialize database
const db = new Database(DB_PATH);

// Create migrations tracking table
db.exec(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    applied_at TEXT NOT NULL
  );
`);

// Get list of applied migrations
const getAppliedMigrations = () => {
    const rows = db.prepare('SELECT version FROM schema_migrations ORDER BY version').all();
    return rows.map(row => row.version);
};

// Apply a migration
const applyMigration = (filename, sql) => {
    const version = filename.match(/^(\d+)_/)?.[1];
    if (!version) {
        console.error(`Skipping ${filename}: Invalid filename format (should start with NNN_)`);
        return false;
    }

    const applied = getAppliedMigrations();
    if (applied.includes(version)) {
        console.log(`✓ Migration ${version} already applied: ${filename}`);
        return true;
    }

    console.log(`Applying migration ${version}: ${filename}...`);

    try {
        // Run migration in a transaction
        db.exec('BEGIN TRANSACTION');
        db.exec(sql);
        db.prepare(
            'INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)'
        ).run(version, filename, new Date().toISOString());
        db.exec('COMMIT');

        console.log(`✓ Successfully applied migration ${version}`);
        return true;
    } catch (error) {
        db.exec('ROLLBACK');
        console.error(`✗ Failed to apply migration ${version}:`, error.message);
        throw error;
    }
};

// Main migration runner
const runMigrations = () => {
    console.log('=== Database Migration Runner ===\n');
    console.log(`Database: ${DB_PATH}`);
    console.log(`Migrations directory: ${MIGRATIONS_DIR}\n`);

    if (!fs.existsSync(MIGRATIONS_DIR)) {
        console.log('No migrations directory found. Exiting.');
        return;
    }

    const files = fs.readdirSync(MIGRATIONS_DIR)
        .filter(f => f.endsWith('.sql'))
        .sort();

    if (files.length === 0) {
        console.log('No migration files found. Exiting.');
        return;
    }

    console.log(`Found ${files.length} migration file(s):\n`);

    let appliedCount = 0;
    let skippedCount = 0;

    for (const file of files) {
        const filePath = path.join(MIGRATIONS_DIR, file);
        const sql = fs.readFileSync(filePath, 'utf8');

        const applied = getAppliedMigrations();
        const version = file.match(/^(\d+)_/)?.[1];

        if (version && applied.includes(version)) {
            skippedCount++;
        } else {
            applyMigration(file, sql);
            appliedCount++;
        }
    }

    console.log(`\n=== Migration Summary ===`);
    console.log(`Applied: ${appliedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log(`Total: ${files.length}`);
};

// Run migrations
try {
    runMigrations();
    db.close();
    process.exit(0);
} catch (error) {
    console.error('\n✗ Migration failed:', error);
    db.close();
    process.exit(1);
}
