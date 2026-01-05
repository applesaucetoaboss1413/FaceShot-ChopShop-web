const Database = require('better-sqlite3');
const PricingEngine = require('../services/pricing');
const fs = require('fs');
const path = require('path');

describe('PricingEngine', () => {
    let db;
    let pricing;

    beforeAll(() => {
        const testDbPath = path.join(__dirname, 'test-pricing.db');
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }
        
        db = new Database(testDbPath);
        
        db.exec(`
            CREATE TABLE vectors (id TEXT PRIMARY KEY, code TEXT, name TEXT, description TEXT, created_at TEXT);
            CREATE TABLE plans (id TEXT PRIMARY KEY, code TEXT, name TEXT, monthly_price_cents INTEGER, included_seconds INTEGER, overage_rate_per_second_cents INTEGER, description TEXT, active INTEGER DEFAULT 1, created_at TEXT);
            CREATE TABLE skus (id TEXT PRIMARY KEY, code TEXT, name TEXT, vector_id TEXT, base_credits INTEGER, base_price_cents INTEGER, default_flags TEXT DEFAULT '[]', description TEXT, active INTEGER DEFAULT 1, created_at TEXT);
            CREATE TABLE flags (id TEXT PRIMARY KEY, code TEXT, label TEXT, price_multiplier REAL DEFAULT 1.0, price_add_flat_cents INTEGER DEFAULT 0, description TEXT, active INTEGER DEFAULT 1, created_at TEXT);
            CREATE TABLE user_plans (id INTEGER PRIMARY KEY, user_id INTEGER, plan_id TEXT, start_date TEXT, end_date TEXT, auto_renew INTEGER, stripe_subscription_id TEXT, status TEXT DEFAULT 'active', created_at TEXT);
            CREATE TABLE plan_usage (id INTEGER PRIMARY KEY, user_id INTEGER, plan_id TEXT, period_start TEXT, period_end TEXT, seconds_used INTEGER DEFAULT 0, created_at TEXT, updated_at TEXT);
        `);

        const now = new Date().toISOString();
        
        db.prepare(`INSERT INTO vectors (id, code, name, description, created_at) VALUES ('v1', 'V1', 'Image Generation', 'Images', ?)`).run(now);
        db.prepare(`INSERT INTO vectors (id, code, name, description, created_at) VALUES ('v3', 'V3', 'Video Generation', 'Videos', ?)`).run(now);
        
        db.prepare(`INSERT INTO plans (id, code, name, monthly_price_cents, included_seconds, overage_rate_per_second_cents, description, created_at) VALUES ('plan_starter', 'STARTER', 'Starter', 1999, 600, 20, 'Starter plan', ?)`).run(now);
        db.prepare(`INSERT INTO plans (id, code, name, monthly_price_cents, included_seconds, overage_rate_per_second_cents, description, created_at) VALUES ('plan_pro', 'PRO', 'Pro', 7999, 3000, 15, 'Pro plan', ?)`).run(now);
        
        db.prepare(`INSERT INTO flags (id, code, label, price_multiplier, price_add_flat_cents, description, created_at) VALUES ('flag_r', 'R', 'Rapid', 1.4, 0, 'Rapid delivery', ?)`).run(now);
        db.prepare(`INSERT INTO flags (id, code, label, price_multiplier, price_add_flat_cents, description, created_at) VALUES ('flag_c', 'C', 'Custom', 1.0, 9900, 'Custom branding', ?)`).run(now);
        db.prepare(`INSERT INTO flags (id, code, label, price_multiplier, price_add_flat_cents, description, created_at) VALUES ('flag_l_std', 'L_STD', 'Standard License', 1.0, 0, 'Standard license', ?)`).run(now);
        
        db.prepare(`INSERT INTO skus (id, code, name, vector_id, base_credits, base_price_cents, default_flags, description, created_at) VALUES ('sku_a1_ig', 'A1-IG', 'Instagram Image', 'v1', 60, 499, '["L_STD"]', 'Social image', ?)`).run(now);
        db.prepare(`INSERT INTO skus (id, code, name, vector_id, base_credits, base_price_cents, default_flags, description, created_at) VALUES ('sku_c2_30', 'C2-30', '30s Video', 'v3', 180, 5900, '["L_STD"]', '30s video', ?)`).run(now);
        db.prepare(`INSERT INTO skus (id, code, name, vector_id, base_credits, base_price_cents, default_flags, description, created_at) VALUES ('sku_a4_br', 'A4-BR', 'Brand Image', 'v1', 180, 2499, '["C","L_STD"]', 'Branded image', ?)`).run(now);

        pricing = new PricingEngine(db);
    });

    afterAll(() => {
        db.close();
        const testDbPath = path.join(__dirname, 'test-pricing.db');
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }
    });

    describe('quote without user plan', () => {
        test('should quote A1-IG at base price', async () => {
            const quote = await pricing.quote(999, 'A1-IG', 1, []);
            
            expect(quote.sku_code).toBe('A1-IG');
            expect(quote.quantity).toBe(1);
            expect(quote.customer_price_cents).toBe(499);
            expect(quote.total_seconds).toBe(60);
            expect(quote.internal_cost_cents).toBe(Math.round(60 * 0.0111 * 100));
            expect(parseFloat(quote.margin_percent)).toBeGreaterThan(40);
            expect(quote.overage_seconds).toBe(0);
        });

        test('should quote C2-30 with 180 credits', async () => {
            const quote = await pricing.quote(999, 'C2-30', 1, []);
            
            expect(quote.sku_code).toBe('C2-30');
            expect(quote.customer_price_cents).toBe(5900);
            expect(quote.total_seconds).toBe(180);
            expect(quote.internal_cost_cents).toBe(Math.round(180 * 0.0111 * 100));
            expect(parseFloat(quote.margin_percent)).toBeGreaterThan(40);
        });

        test('should apply Rapid flag multiplier', async () => {
            const quote = await pricing.quote(999, 'A1-IG', 1, ['R']);
            
            expect(quote.customer_price_cents).toBe(Math.round(499 * 1.4));
            expect(quote.applied_flags).toContain('R');
            expect(quote.applied_flags).toContain('L_STD');
        });

        test('should apply Custom flag flat addition', async () => {
            const quote = await pricing.quote(999, 'A4-BR', 1, []);
            
            expect(quote.customer_price_cents).toBe(2499 + 9900);
            expect(quote.applied_flags).toContain('C');
            expect(quote.applied_flags).toContain('L_STD');
        });

        test('should handle quantity multiplier', async () => {
            const quote = await pricing.quote(999, 'A1-IG', 5, []);
            
            expect(quote.quantity).toBe(5);
            expect(quote.customer_price_cents).toBe(499 * 5);
            expect(quote.total_seconds).toBe(60 * 5);
        });
    });

    describe('quote with user plan', () => {
        const userId = 1000;
        const planId = 'plan_pro';

        beforeAll(() => {
            const now = new Date();
            const startDate = now.toISOString();
            const endDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).toISOString();
            
            db.prepare(`INSERT INTO user_plans (user_id, plan_id, start_date, end_date, status, created_at) VALUES (?, ?, ?, ?, 'active', ?)`).run(
                userId, planId, startDate, endDate, now.toISOString()
            );
        });

        test('should use plan quota for small job', async () => {
            const quote = await pricing.quote(userId, 'A1-IG', 1, []);
            
            expect(quote.seconds_from_plan).toBe(60);
            expect(quote.overage_seconds).toBe(0);
            expect(quote.overage_cost_cents).toBe(0);
            expect(quote.customer_price_cents).toBe(499);
        });

        test('should charge overage when exceeding quota', async () => {
            pricing.deductUsage(userId, planId, 2950);
            
            const quote = await pricing.quote(userId, 'C2-30', 1, []);
            
            expect(quote.remaining_plan_seconds).toBe(50);
            expect(quote.seconds_from_plan).toBe(50);
            expect(quote.overage_seconds).toBe(130);
            expect(quote.overage_cost_cents).toBe(130 * 15);
            expect(quote.customer_price_cents).toBe(5900 + (130 * 15));
        });

        test('should maintain 40% minimum margin', async () => {
            const quote = await pricing.quote(userId, 'A1-IG', 1, []);
            const margin = parseFloat(quote.margin_percent);
            
            expect(margin).toBeGreaterThanOrEqual(40);
            
            const expectedCost = 60 * 0.0111 * 100;
            const expectedMargin = (quote.customer_price_cents - expectedCost) / quote.customer_price_cents * 100;
            expect(margin).toBeCloseTo(expectedMargin, 0);
        });
    });

    describe('edge cases', () => {
        test('should reject non-existent SKU', async () => {
            await expect(pricing.quote(999, 'INVALID-SKU', 1, [])).rejects.toThrow('sku_not_found');
        });

        test('should reject if margin too low', async () => {
            const now = new Date().toISOString();
            db.prepare(`INSERT INTO skus (id, code, name, vector_id, base_credits, base_price_cents, default_flags, description, created_at, active) VALUES ('sku_test_low', 'TEST-LOW', 'Low Margin', 'v1', 100, 50, '[]', 'Test', ?, 1)`).run(now);
            
            await expect(pricing.quote(999, 'TEST-LOW', 1, [])).rejects.toThrow(/margin_too_low/);
        });
    });
});
