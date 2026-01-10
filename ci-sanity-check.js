#!/usr/bin/env node
/**
 * CI Sanity Check Script
 * Performs lightweight checks to prevent obviously broken deploys
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Set safe defaults for CI environment
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.DB_PATH = process.env.DB_PATH || ':memory:';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'ci-jwt-secret-for-testing';
process.env.ADMIN_SECRET = process.env.ADMIN_SECRET || 'ci-admin-secret-for-testing';
process.env.A2E_API_KEY = process.env.A2E_API_KEY || 'ci-a2e-api-key';
process.env.A2E_BASE_URL = process.env.A2E_BASE_URL || 'https://video.a2e.ai';
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_ci_stripe_secret';
process.env.STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_ci_webhook_secret';
process.env.CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'ci-cloud-name';
process.env.CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || 'ci-api-key';
process.env.CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || 'ci-api-secret';
process.env.COST_PER_CREDIT = process.env.COST_PER_CREDIT || '0.0111';
process.env.MIN_MARGIN = process.env.MIN_MARGIN || '0.40';
process.env.MAX_JOB_SECONDS = process.env.MAX_JOB_SECONDS || '3600';
process.env.PORT = process.env.PORT || '3000';

console.log('🚀 Starting CI Sanity Checks...\n');

// 1. Load config to validate env vars
try {
    require('./config.js');
    console.log('✅ Environment variables validated');
} catch (error) {
    console.error('❌ Environment validation failed:', error.message);
    process.exit(1);
}

// 2. Run database migrations
try {
    console.log('📦 Running database migrations...');
    const { execSync } = require('child_process');
    execSync('node scripts/run-migrations.js', { stdio: 'inherit' });
    console.log('✅ Database migrations completed');
} catch (error) {
    console.error('❌ Database migrations failed:', error.message);
    process.exit(1);
}

// 3. Check required tables exist
try {
    console.log('🔍 Checking database tables...');
    const db = new Database(process.env.DB_PATH);
    const requiredTables = ['skus', 'plans', 'user_plans', 'plan_usage', 'flags'];

    for (const table of requiredTables) {
        const result = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(table);
        if (!result) {
            throw new Error(`Required table '${table}' not found`);
        }
    }

    console.log('✅ All required tables exist');
    db.close();
} catch (error) {
    console.error('❌ Database table check failed:', error.message);
    process.exit(1);
}

// 4. Test pricing logic with sample SKUs
try {
    console.log('💰 Testing pricing logic...');
    const PricingEngine = require('./services/pricing.js');
    const db = new Database(process.env.DB_PATH);

    // Initialize pricing engine
    const pricing = new PricingEngine(db);

    // Sample SKUs to test
    const sampleSkus = ['A1-IG', 'C1-15', 'D1-VO30'];

    for (const skuCode of sampleSkus) {
        try {
            const quote = pricing.quote('test-user-123', skuCode, 1, [], 'usd');
            if (!quote || !quote.customer_price_cents || quote.customer_price_cents <= 0) {
                throw new Error(`Invalid quote for ${skuCode}`);
            }
            console.log(`   ✓ ${skuCode}: $${(quote.customer_price_cents / 100).toFixed(2)} (${quote.margin_percent}% margin)`);
        } catch (error) {
            throw new Error(`Pricing test failed for ${skuCode}: ${error.message}`);
        }
    }

    console.log('✅ Pricing logic tests passed');
    db.close();
} catch (error) {
    console.error('❌ Pricing logic test failed:', error.message);
    process.exit(1);
}

console.log('\n🎉 All CI sanity checks passed! Ready for deployment.');
process.exit(0);