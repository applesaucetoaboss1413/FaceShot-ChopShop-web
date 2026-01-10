#!/usr/bin/env node

/**
 * Database Initialization Script for FaceShot-ChopShop-web
 * Sets up database schema and seed data
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

function initializeDatabase() {
    const config = require('./config');

    const db = new Database(config.dbPath);

    // Initialize DB and migrate if necessary
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            email TEXT UNIQUE,
            password_hash TEXT,
            first_name TEXT,
            telegram_user_id TEXT UNIQUE,
            created_at TEXT
        );
        CREATE TABLE IF NOT EXISTS user_credits (user_id INTEGER, balance INTEGER DEFAULT 0);
        CREATE TABLE IF NOT EXISTS purchases (id INTEGER PRIMARY KEY, user_id INTEGER, pack_type TEXT, points INTEGER, amount_cents INTEGER, currency TEXT DEFAULT 'usd', created_at TEXT);
        CREATE TABLE IF NOT EXISTS jobs (
            id INTEGER PRIMARY KEY,
            user_id INTEGER,
            type TEXT,
            status TEXT,
            a2e_task_id TEXT,
            result_url TEXT,
            error_message TEXT,
            cost_credits INTEGER DEFAULT 0,
            order_id INTEGER,
            created_at TEXT,
            updated_at TEXT
        );
        CREATE TABLE IF NOT EXISTS analytics_events (id INTEGER PRIMARY KEY, type TEXT, user_id INTEGER, data TEXT, created_at TEXT);
        CREATE TABLE IF NOT EXISTS miniapp_creations (id INTEGER PRIMARY KEY, user_id INTEGER, type TEXT, status TEXT, url TEXT, created_at TEXT);
        CREATE TABLE IF NOT EXISTS vectors (id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, name TEXT NOT NULL, description TEXT, created_at TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS plans (id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, name TEXT NOT NULL, monthly_price_cents INTEGER NOT NULL, included_seconds INTEGER NOT NULL, overage_rate_per_second_cents INTEGER NOT NULL, description TEXT, active INTEGER DEFAULT 1, created_at TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS skus (id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, name TEXT NOT NULL, vector_id TEXT, base_credits INTEGER NOT NULL, base_price_cents INTEGER NOT NULL, default_flags TEXT DEFAULT '[]', description TEXT, active INTEGER DEFAULT 1, created_at TEXT NOT NULL, FOREIGN KEY(vector_id) REFERENCES vectors(id));
        CREATE TABLE IF NOT EXISTS flags (id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, label TEXT NOT NULL, price_multiplier REAL DEFAULT 1.0, price_add_flat_cents INTEGER DEFAULT 0, description TEXT, active INTEGER DEFAULT 1, created_at TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS user_plans (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, plan_id TEXT NOT NULL, start_date TEXT NOT NULL, end_date TEXT, auto_renew INTEGER DEFAULT 1, stripe_subscription_id TEXT, status TEXT DEFAULT 'active', created_at TEXT NOT NULL);
        CREATE INDEX IF NOT EXISTS idx_user_plans_user_id ON user_plans(user_id);
        CREATE TABLE IF NOT EXISTS plan_usage (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, plan_id TEXT NOT NULL, period_start TEXT NOT NULL, period_end TEXT NOT NULL, seconds_used INTEGER DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
        CREATE INDEX IF NOT EXISTS idx_plan_usage_user_period ON plan_usage(user_id, period_start, period_end);
        CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, sku_code TEXT NOT NULL, quantity INTEGER DEFAULT 1, applied_flags TEXT DEFAULT '[]', customer_price_cents INTEGER NOT NULL, internal_cost_cents INTEGER NOT NULL, margin_percent REAL NOT NULL, total_seconds INTEGER NOT NULL, overage_seconds INTEGER DEFAULT 0, stripe_payment_intent_id TEXT, currency TEXT DEFAULT 'usd', status TEXT DEFAULT 'pending', created_at TEXT NOT NULL);
        CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
        CREATE TABLE IF NOT EXISTS processed_webhooks (event_id TEXT PRIMARY KEY, processed_at TEXT NOT NULL);
    `);

    const nowSeed = new Date().toISOString();

    // Seed vectors
    db.prepare(`INSERT OR IGNORE INTO vectors (id, code, name, description, created_at) VALUES (?, ?, ?, ?, ?)`).run('v1', 'V1', 'Image Generation', 'AI-powered image creation and generation', nowSeed);
    db.prepare(`INSERT OR IGNORE INTO vectors (id, code, name, description, created_at) VALUES (?, ?, ?, ?, ?)`).run('v2', 'V2', 'Image Utility', 'Image enhancement, background removal, and utilities', nowSeed);
    db.prepare(`INSERT OR IGNORE INTO vectors (id, code, name, description, created_at) VALUES (?, ?, ?, ?, ?)`).run('v3', 'V3', 'Video Generation', 'Video creation and animation services', nowSeed);
    db.prepare(`INSERT OR IGNORE INTO vectors (id, code, name, description, created_at) VALUES (?, ?, ?, ?, ?)`).run('v4', 'V4', 'Voice Clone', 'Custom voice cloning services', nowSeed);
    db.prepare(`INSERT OR IGNORE INTO vectors (id, code, name, description, created_at) VALUES (?, ?, ?, ?, ?)`).run('v5', 'V5', 'Voiceover / TTS', 'Text-to-speech and voiceover services', nowSeed);
    db.prepare(`INSERT OR IGNORE INTO vectors (id, code, name, description, created_at) VALUES (?, ?, ?, ?, ?)`).run('v6', 'V6', 'Text Content / SEO', 'SEO content and article writing', nowSeed);
    db.prepare(`INSERT OR IGNORE INTO vectors (id, code, name, description, created_at) VALUES (?, ?, ?, ?, ?)`).run('v7', 'V7', 'Multi-Modal Bundles', 'Comprehensive packages combining multiple services', nowSeed);

    // Seed plans
    db.prepare(`INSERT OR IGNORE INTO plans (id, code, name, monthly_price_cents, included_seconds, overage_rate_per_second_cents, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run('plan_starter', 'STARTER', 'Starter', 1999, 600, 20, 'Perfect for individuals and small projects', nowSeed);
    db.prepare(`INSERT OR IGNORE INTO plans (id, code, name, monthly_price_cents, included_seconds, overage_rate_per_second_cents, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run('plan_pro', 'PRO', 'Pro', 7999, 3000, 15, 'Ideal for professionals and growing businesses', nowSeed);
    db.prepare(`INSERT OR IGNORE INTO plans (id, code, name, monthly_price_cents, included_seconds, overage_rate_per_second_cents, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run('plan_agency', 'AGENCY', 'Agency', 19900, 10000, 10, 'Enterprise-grade solution for agencies and teams', nowSeed);

    // Seed flags
    db.prepare(`INSERT OR IGNORE INTO flags (id, code, label, price_multiplier, price_add_flat_cents, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).run('flag_r', 'R', 'Rapid (same-day)', 1.4, 0, 'Priority processing with same-day delivery', nowSeed);
    db.prepare(`INSERT OR IGNORE INTO flags (id, code, label, price_multiplier, price_add_flat_cents, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run('flag_c', 'C', 'Custom (brand style)', 1.0, 9900, 'Custom branding and style application', nowSeed);
    db.prepare(`INSERT OR IGNORE INTO flags (id, code, label, price_multiplier, price_add_flat_cents, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run('flag_b', 'B', 'Batch discount', 0.85, 0, 'Automatic discount for bulk orders (10+ items)', nowSeed);
    db.prepare(`INSERT OR IGNORE INTO flags (id, code, label, price_multiplier, price_add_flat_cents, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run('flag_l_std', 'L_STD', 'Standard License', 1.0, 0, 'Standard commercial usage rights', nowSeed);
    db.prepare(`INSERT OR IGNORE INTO flags (id, code, label, price_multiplier, price_add_flat_cents, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run('flag_l_ext', 'L_EXT', 'Extended License', 1.0, 30000, 'Extended commercial rights for broader usage', nowSeed);
    db.prepare(`INSERT OR IGNORE INTO flags (id, code, label, price_multiplier, price_add_flat_cents, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run('flag_l_excl', 'L_EXCL', 'Exclusive License', 1.0, 80000, 'Exclusive rights with no redistribution', nowSeed);

    // Seed SKUs
    db.prepare(`INSERT OR IGNORE INTO skus (id, code, name, vector_id, base_credits, base_price_cents, default_flags, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('sku_a1_ig', 'A1-IG', 'Instagram Image 1080p', 'v1', 60, 499, '["L_STD"]', 'Social media ready 1080p image', nowSeed);
    db.prepare(`INSERT OR IGNORE INTO skus (id, code, name, vector_id, base_credits, base_price_cents, default_flags, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('sku_a2_bh', 'A2-BH', 'Blog Hero 2K', 'v1', 90, 999, '["L_STD"]', 'High-quality 2K blog header image', nowSeed);
    db.prepare(`INSERT OR IGNORE INTO skus (id, code, name, vector_id, base_credits, base_price_cents, default_flags, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('sku_a3_4k', 'A3-4K', '4K Print-Ready', 'v1', 140, 1499, '["L_STD"]', '4K resolution print-ready image', nowSeed);
    db.prepare(`INSERT OR IGNORE INTO skus (id, code, name, vector_id, base_credits, base_price_cents, default_flags, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('sku_a4_br', 'A4-BR', 'Brand-Styled Image', 'v1', 180, 2499, '["C","L_STD"]', 'Custom brand-styled image creation', nowSeed);
    db.prepare(`INSERT OR IGNORE INTO skus (id, code, name, vector_id, base_credits, base_price_cents, default_flags, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('sku_b1_30soc', 'B1-30SOC', '30 Social Creatives', 'v7', 1800, 7900, '["B"]', 'Bundle of 30 social media images', nowSeed);
    db.prepare(`INSERT OR IGNORE INTO skus (id, code, name, vector_id, base_credits, base_price_cents, default_flags, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('sku_b2_90soc', 'B2-90SOC', '90 Creatives + Captions', 'v7', 5400, 19900, '["B"]', '90 social images with AI-generated captions', nowSeed);
    db.prepare(`INSERT OR IGNORE INTO skus (id, code, name, vector_id, base_credits, base_price_cents, default_flags, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('sku_c1_15', 'C1-15', '15s Promo/Reel', 'v3', 90, 2900, '["L_STD"]', '15-second promotional video or reel', nowSeed);
    db.prepare(`INSERT OR IGNORE INTO skus (id, code, name, vector_id, base_credits, base_price_cents, default_flags, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('sku_c2_30', 'C2-30', '30s Ad/UGC Clip', 'v3', 180, 5900, '["L_STD"]', '30-second ad or UGC style video', nowSeed);
    db.prepare(`INSERT OR IGNORE INTO skus (id, code, name, vector_id, base_credits, base_price_cents, default_flags, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('sku_c3_60', 'C3-60', '60s Explainer/YouTube', 'v3', 360, 11900, '["L_STD"]', '60-second explainer or YouTube video', nowSeed);
    db.prepare(`INSERT OR IGNORE INTO skus (id, code, name, vector_id, base_credits, base_price_cents, default_flags, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('sku_d1_vo30', 'D1-VO30', '30s Voiceover', 'v5', 30, 1500, '["L_STD"]', '30-second professional voiceover', nowSeed);
    db.prepare(`INSERT OR IGNORE INTO skus (id, code, name, vector_id, base_credits, base_price_cents, default_flags, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('sku_d2_clone', 'D2-CLONE', 'Standard Voice Clone', 'v4', 200, 3900, '["C"]', 'Standard quality voice cloning', nowSeed);
    db.prepare(`INSERT OR IGNORE INTO skus (id, code, name, vector_id, base_credits, base_price_cents, default_flags, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('sku_d3_clpro', 'D3-CLPRO', 'Advanced Voice Clone', 'v4', 600, 9900, '["C"]', 'Professional-grade voice cloning', nowSeed);
    db.prepare(`INSERT OR IGNORE INTO skus (id, code, name, vector_id, base_credits, base_price_cents, default_flags, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('sku_d4_5pk', 'D4-5PK', '5x30s Voice Spots', 'v5', 150, 5900, '["L_STD"]', 'Package of 5 x 30-second voiceovers', nowSeed);
    db.prepare(`INSERT OR IGNORE INTO skus (id, code, name, vector_id, base_credits, base_price_cents, default_flags, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('sku_f1_starter', 'F1-STARTER', '10 SEO Articles + Images', 'v6', 1000, 4900, '[]', '10 SEO-optimized articles with images', nowSeed);
    db.prepare(`INSERT OR IGNORE INTO skus (id, code, name, vector_id, base_credits, base_price_cents, default_flags, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('sku_f2_auth', 'F2-AUTH', '40 SEO Articles + Linking', 'v6', 4000, 14900, '[]', '40 articles with internal link strategy', nowSeed);
    db.prepare(`INSERT OR IGNORE INTO skus (id, code, name, vector_id, base_credits, base_price_cents, default_flags, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('sku_f3_dominator', 'F3-DOMINATOR', '150 Articles + Strategy', 'v6', 15000, 39900, '[]', 'Complete content domination package', nowSeed);
    db.prepare(`INSERT OR IGNORE INTO skus (id, code, name, vector_id, base_credits, base_price_cents, default_flags, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('sku_e1_ecom25', 'E1-ECOM25', 'E-commerce Pack (25 SKUs)', 'v7', 4500, 22500, '[]', '25 product SKUs with 3 images each', nowSeed);
    db.prepare(`INSERT OR IGNORE INTO skus (id, code, name, vector_id, base_credits, base_price_cents, default_flags, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('sku_e2_launchkit', 'E2-LAUNCHKIT', 'Brand Launch Kit', 'v7', 3000, 44900, '[]', 'Complete brand launch asset package', nowSeed);
    db.prepare(`INSERT OR IGNORE INTO skus (id, code, name, vector_id, base_credits, base_price_cents, default_flags, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('sku_e3_agency100', 'E3-AGENCY100', 'Agency Asset Bank (100 assets)', 'v7', 10000, 59900, '[]', '100 mixed assets for agency use', nowSeed);

    // Simple migration to ensure columns exist
    try {
        const tableInfo = db.prepare('PRAGMA table_info(users)').all();
        if (!tableInfo.some(col => col.name === 'email')) db.exec('ALTER TABLE users ADD COLUMN email TEXT UNIQUE');
        if (!tableInfo.some(col => col.name === 'password_hash')) db.exec('ALTER TABLE users ADD COLUMN password_hash TEXT');
        if (!tableInfo.some(col => col.name === 'first_name')) db.exec('ALTER TABLE users ADD COLUMN first_name TEXT');
        if (!tableInfo.some(col => col.name === 'telegram_user_id')) db.exec('ALTER TABLE users ADD COLUMN telegram_user_id TEXT UNIQUE');
        if (!tableInfo.some(col => col.name === 'created_at')) db.exec('ALTER TABLE users ADD COLUMN created_at TEXT');

        const jobsInfo = db.prepare('PRAGMA table_info(jobs)').all();
        if (!jobsInfo.some(col => col.name === 'a2e_task_id')) db.exec('ALTER TABLE jobs ADD COLUMN a2e_task_id TEXT');
        if (!jobsInfo.some(col => col.name === 'result_url')) db.exec('ALTER TABLE jobs ADD COLUMN result_url TEXT');
        if (!jobsInfo.some(col => col.name === 'error_message')) db.exec('ALTER TABLE jobs ADD COLUMN error_message TEXT');
        if (!jobsInfo.some(col => col.name === 'cost_credits')) db.exec('ALTER TABLE jobs ADD COLUMN cost_credits INTEGER DEFAULT 0');
        if (!jobsInfo.some(col => col.name === 'order_id')) db.exec('ALTER TABLE jobs ADD COLUMN order_id INTEGER');

        const skusInfo = db.prepare('PRAGMA table_info(skus)').all();
        if (!skusInfo.some(col => col.name === 'vector_id')) db.exec('ALTER TABLE skus ADD COLUMN vector_id TEXT');

        // Currency column migrations
        const purchasesInfo = db.prepare('PRAGMA table_info(purchases)').all();
        if (!purchasesInfo.some(col => col.name === 'currency')) db.exec('ALTER TABLE purchases ADD COLUMN currency TEXT DEFAULT \'usd\'');

        const ordersInfo = db.prepare('PRAGMA table_info(orders)').all();
        if (!ordersInfo.some(col => col.name === 'currency')) db.exec('ALTER TABLE orders ADD COLUMN currency TEXT DEFAULT \'usd\'');
    } catch (e) {
        console.error('Migration error:', e);
    }

    db.close();
    console.log('Database initialized successfully');
}

if (require.main === module) {
    initializeDatabase();
}

module.exports = { initializeDatabase };