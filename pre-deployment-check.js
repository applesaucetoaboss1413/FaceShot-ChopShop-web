#!/usr/bin/env node

/**
 * Pre-Deployment Safety Check for FaceShot-ChopShop-web
 * Validates database, environment variables, and pricing calculations
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

function checkDatabase() {
    console.log('🔍 Checking database schema and seed data...');

    const config = require('./config');
    const dbPath = config.dbPath;

    if (!fs.existsSync(dbPath)) {
        throw new Error(`Database file not found at ${dbPath}`);
    }

    const db = new Database(dbPath);

    // Check tables exist
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    const tableNames = tables.map(t => t.name);

    const requiredTables = [
        'users', 'user_credits', 'purchases', 'jobs', 'analytics_events',
        'miniapp_creations', 'vectors', 'plans', 'skus', 'flags',
        'user_plans', 'plan_usage', 'orders'
    ];

    for (const table of requiredTables) {
        if (!tableNames.includes(table)) {
            throw new Error(`Required table '${table}' not found in database`);
        }
    }

    // Check seed data
    const vectorCount = db.prepare('SELECT COUNT(*) as count FROM vectors').get().count;
    if (vectorCount < 7) {
        throw new Error(`Expected at least 7 vectors, found ${vectorCount}`);
    }

    const planCount = db.prepare('SELECT COUNT(*) as count FROM plans').get().count;
    if (planCount < 3) {
        throw new Error(`Expected at least 3 plans, found ${planCount}`);
    }

    const skuCount = db.prepare('SELECT COUNT(*) as count FROM skus').get().count;
    if (skuCount < 20) {
        throw new Error(`Expected at least 20 SKUs, found ${skuCount}`);
    }

    const flagCount = db.prepare('SELECT COUNT(*) as count FROM flags').get().count;
    if (flagCount < 6) {
        throw new Error(`Expected at least 6 flags, found ${flagCount}`);
    }

    db.close();
    console.log('✅ Database schema and seed data validated');
}

function checkEnvironmentVariables() {
    console.log('🔍 Checking critical environment variables...');

    const requiredEnvVars = [
        'SESSION_SECRET',
        'DB_PATH',
        'NODE_ENV',
        'PORT'
    ];

    const optionalButRecommended = [
        'STRIPE_SECRET_KEY',
        'STRIPE_WEBHOOK_SECRET',
        'CLOUDINARY_CLOUD_NAME',
        'CLOUDINARY_API_KEY',
        'CLOUDINARY_API_SECRET',
        'A2E_API_KEY',
        'A2E_BASE_URL',
        'ADMIN_SECRET',
        'ADMIN_EMAILS',
        'FRONTEND_URL',
        'PUBLIC_URL'
    ];

    let missingRequired = [];
    let missingRecommended = [];

    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            missingRequired.push(envVar);
        }
    }

    for (const envVar of optionalButRecommended) {
        if (!process.env[envVar]) {
            missingRecommended.push(envVar);
        }
    }

    if (missingRequired.length > 0) {
        throw new Error(`Missing required environment variables: ${missingRequired.join(', ')}`);
    }

    if (missingRecommended.length > 0) {
        console.log(`⚠️  Warning: Missing recommended environment variables: ${missingRecommended.join(', ')}`);
    }

    console.log('✅ Environment variables validated');
}

function checkPricingCalculations() {
    console.log('🔍 Checking pricing calculations...');

    const config = require('./config');
    const db = new Database(config.dbPath);
    const PricingEngine = require('./services/pricing');

    const pricingEngine = new PricingEngine(db);

    // Test sample SKUs with different scenarios
    const testCases = [
        { sku: 'A1-IG', quantity: 1, flags: [], currency: 'usd' },
        { sku: 'B1-30SOC', quantity: 1, flags: ['B'], currency: 'usd' },
        { sku: 'A4-BR', quantity: 1, flags: ['C', 'R'], currency: 'usd' },
        { sku: 'C2-30', quantity: 2, flags: ['L_EXT'], currency: 'usd' }
    ];

    for (const testCase of testCases) {
        try {
            const quote = pricingEngine.quote(1, testCase.sku, testCase.quantity, testCase.flags, testCase.currency);

            // Basic validation
            if (!quote.customer_price_cents || quote.customer_price_cents <= 0) {
                throw new Error(`Invalid customer price for ${testCase.sku}`);
            }
            if (!quote.internal_cost_cents || quote.internal_cost_cents <= 0) {
                throw new Error(`Invalid internal cost for ${testCase.sku}`);
            }
            if (quote.margin_percent < 0) {
                throw new Error(`Invalid margin for ${testCase.sku}`);
            }
            if (!quote.total_seconds || quote.total_seconds <= 0) {
                throw new Error(`Invalid total seconds for ${testCase.sku}`);
            }

            console.log(`  ✅ ${testCase.sku} (${testCase.quantity}x) with flags [${testCase.flags.join(',')}] - $${(quote.customer_price_cents / 100).toFixed(2)}`);

        } catch (error) {
            throw new Error(`Pricing calculation failed for ${testCase.sku}: ${error.message}`);
        }
    }

    db.close();
    console.log('✅ Pricing calculations validated');
}

function runChecks() {
    try {
        console.log('🚀 Starting pre-deployment safety checks...\n');

        checkDatabase();
        console.log('');

        checkEnvironmentVariables();
        console.log('');

        checkPricingCalculations();
        console.log('');

        console.log('🎉 All pre-deployment checks passed! Ready for deployment.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Pre-deployment check failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    runChecks();
}

module.exports = { checkDatabase, checkEnvironmentVariables, checkPricingCalculations };