#!/usr/bin/env node

/**
 * Database Initialization Script for FaceShot-ChopShop-web
 * Sets up MongoDB indexes and seed data
 */

const { connectDB, getCollections } = require('./db/mongoClient');

async function initializeDatabase() {
    try {
        // Connect to MongoDB
        await connectDB();
        console.log('✅ Connected to MongoDB');

        const {
            Vector,
            Plan,
            Flag,
            Sku,
            Stats
        } = getCollections();

        const now = new Date();

        // Seed vectors (idempotent upsert)
        const vectors = [
            { id: 'v1', code: 'V1', name: 'Image Generation', description: 'AI-powered image creation and generation' },
            { id: 'v2', code: 'V2', name: 'Image Utility', description: 'Image enhancement, background removal, and utilities' },
            { id: 'v3', code: 'V3', name: 'Video Generation', description: 'Video creation and animation services' },
            { id: 'v4', code: 'V4', name: 'Voice Clone', description: 'Custom voice cloning services' },
            { id: 'v5', code: 'V5', name: 'Voiceover / TTS', description: 'Text-to-speech and voiceover services' },
            { id: 'v6', code: 'V6', name: 'Text Content / SEO', description: 'SEO content and article writing' },
            { id: 'v7', code: 'V7', name: 'Multi-Modal Bundles', description: 'Comprehensive packages combining multiple services' }
        ];

        for (const vector of vectors) {
            await Vector.findOneAndUpdate(
                { id: vector.id },
                { ...vector, created_at: now },
                { upsert: true, new: true }
            );
        }
        console.log('✅ Seeded vectors');

        // Seed plans (idempotent upsert)
        const plans = [
            { id: 'plan_starter', code: 'STARTER', name: 'Starter', monthly_price_cents: 1999, included_seconds: 600, overage_rate_per_second_cents: 20, description: 'Perfect for individuals and small projects' },
            { id: 'plan_pro', code: 'PRO', name: 'Pro', monthly_price_cents: 7999, included_seconds: 3000, overage_rate_per_second_cents: 15, description: 'Ideal for professionals and growing businesses' },
            { id: 'plan_agency', code: 'AGENCY', name: 'Agency', monthly_price_cents: 19900, included_seconds: 10000, overage_rate_per_second_cents: 10, description: 'Enterprise-grade solution for agencies and teams' }
        ];

        for (const plan of plans) {
            await Plan.findOneAndUpdate(
                { id: plan.id },
                { ...plan, active: true, created_at: now },
                { upsert: true, new: true }
            );
        }
        console.log('✅ Seeded plans');

        // Seed flags (idempotent upsert)
        const flags = [
            { id: 'flag_r', code: 'R', label: 'Rapid (same-day)', price_multiplier: 1.4, price_add_flat_cents: 0, description: 'Priority processing with same-day delivery' },
            { id: 'flag_c', code: 'C', label: 'Custom (brand style)', price_multiplier: 1.0, price_add_flat_cents: 9900, description: 'Custom branding and style application' },
            { id: 'flag_b', code: 'B', label: 'Batch discount', price_multiplier: 0.85, price_add_flat_cents: 0, description: 'Automatic discount for bulk orders (10+ items)' },
            { id: 'flag_l_std', code: 'L_STD', label: 'Standard License', price_multiplier: 1.0, price_add_flat_cents: 0, description: 'Standard commercial usage rights' },
            { id: 'flag_l_ext', code: 'L_EXT', label: 'Extended License', price_multiplier: 1.0, price_add_flat_cents: 30000, description: 'Extended commercial rights for broader usage' },
            { id: 'flag_l_excl', code: 'L_EXCL', label: 'Exclusive License', price_multiplier: 1.0, price_add_flat_cents: 80000, description: 'Exclusive rights with no redistribution' }
        ];

        for (const flag of flags) {
            await Flag.findOneAndUpdate(
                { id: flag.id },
                { ...flag, active: true, created_at: now },
                { upsert: true, new: true }
            );
        }
        console.log('✅ Seeded flags');

        // Seed SKUs (idempotent upsert)
        const skus = [
            { id: 'sku_a1_ig', code: 'A1-IG', name: 'Instagram Image 1080p', vector_id: 'v1', base_credits: 60, base_price_cents: 499, default_flags: ['L_STD'], description: 'Social media ready 1080p image' },
            { id: 'sku_a2_bh', code: 'A2-BH', name: 'Blog Hero 2K', vector_id: 'v1', base_credits: 90, base_price_cents: 999, default_flags: ['L_STD'], description: 'High-quality 2K blog header image' },
            { id: 'sku_a3_4k', code: 'A3-4K', name: '4K Print-Ready', vector_id: 'v1', base_credits: 140, base_price_cents: 1499, default_flags: ['L_STD'], description: '4K resolution print-ready image' },
            { id: 'sku_a4_br', code: 'A4-BR', name: 'Brand-Styled Image', vector_id: 'v1', base_credits: 180, base_price_cents: 2499, default_flags: ['C', 'L_STD'], description: 'Custom brand-styled image creation' },
            { id: 'sku_b1_30soc', code: 'B1-30SOC', name: '30 Social Creatives', vector_id: 'v7', base_credits: 1800, base_price_cents: 7900, default_flags: ['B'], description: 'Bundle of 30 social media images' },
            { id: 'sku_b2_90soc', code: 'B2-90SOC', name: '90 Creatives + Captions', vector_id: 'v7', base_credits: 5400, base_price_cents: 19900, default_flags: ['B'], description: '90 social images with AI-generated captions' },
            { id: 'sku_c1_15', code: 'C1-15', name: '15s Promo/Reel', vector_id: 'v3', base_credits: 90, base_price_cents: 2900, default_flags: ['L_STD'], description: '15-second promotional video or reel' },
            { id: 'sku_c2_30', code: 'C2-30', name: '30s Ad/UGC Clip', vector_id: 'v3', base_credits: 180, base_price_cents: 5900, default_flags: ['L_STD'], description: '30-second ad or UGC style video' },
            { id: 'sku_c3_60', code: 'C3-60', name: '60s Explainer/YouTube', vector_id: 'v3', base_credits: 360, base_price_cents: 11900, default_flags: ['L_STD'], description: '60-second explainer or YouTube video' },
            { id: 'sku_d1_vo30', code: 'D1-VO30', name: '30s Voiceover', vector_id: 'v5', base_credits: 30, base_price_cents: 1500, default_flags: ['L_STD'], description: '30-second professional voiceover' },
            { id: 'sku_d2_clone', code: 'D2-CLONE', name: 'Standard Voice Clone', vector_id: 'v4', base_credits: 200, base_price_cents: 3900, default_flags: ['C'], description: 'Standard quality voice cloning' },
            { id: 'sku_d3_clpro', code: 'D3-CLPRO', name: 'Advanced Voice Clone', vector_id: 'v4', base_credits: 600, base_price_cents: 9900, default_flags: ['C'], description: 'Professional-grade voice cloning' },
            { id: 'sku_d4_5pk', code: 'D4-5PK', name: '5x30s Voice Spots', vector_id: 'v5', base_credits: 150, base_price_cents: 5900, default_flags: ['L_STD'], description: 'Package of 5 x 30-second voiceovers' },
            { id: 'sku_f1_starter', code: 'F1-STARTER', name: '10 SEO Articles + Images', vector_id: 'v6', base_credits: 1000, base_price_cents: 4900, default_flags: [], description: '10 SEO-optimized articles with images' },
            { id: 'sku_f2_auth', code: 'F2-AUTH', name: '40 SEO Articles + Linking', vector_id: 'v6', base_credits: 4000, base_price_cents: 14900, default_flags: [], description: '40 articles with internal link strategy' },
            { id: 'sku_f3_dominator', code: 'F3-DOMINATOR', name: '150 Articles + Strategy', vector_id: 'v6', base_credits: 15000, base_price_cents: 39900, default_flags: [], description: 'Complete content domination package' },
            { id: 'sku_e1_ecom25', code: 'E1-ECOM25', name: 'E-commerce Pack (25 SKUs)', vector_id: 'v7', base_credits: 4500, base_price_cents: 22500, default_flags: [], description: '25 product SKUs with 3 images each' },
            { id: 'sku_e2_launchkit', code: 'E2-LAUNCHKIT', name: 'Brand Launch Kit', vector_id: 'v7', base_credits: 3000, base_price_cents: 44900, default_flags: [], description: 'Complete brand launch asset package' },
            { id: 'sku_e3_agency100', code: 'E3-AGENCY100', name: 'Agency Asset Bank (100 assets)', vector_id: 'v7', base_credits: 10000, base_price_cents: 59900, default_flags: [], description: '100 mixed assets for agency use' }
        ];

        for (const sku of skus) {
            await Sku.findOneAndUpdate(
                { id: sku.id },
                { ...sku, active: true, created_at: now },
                { upsert: true, new: true }
            );
        }
        console.log('✅ Seeded SKUs');

        // Initialize stats if not exists
        const existingStats = await Stats.findOne();
        if (!existingStats) {
            await Stats.create({ total_users: 0, total_jobs: 0, videos: 0 });
            console.log('✅ Initialized stats');
        }

        // Create additional indexes if needed (most are defined in schema)
        // User email index (already unique in schema)
        // Job indexes (already defined)
        // etc.

        console.log('✅ Database initialized successfully');
    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        throw error;
    }
}

if (require.main === module) {
    initializeDatabase()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = { initializeDatabase };