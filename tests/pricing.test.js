const Database = require('better-sqlite3');
const PricingEngine = require('../services/pricing');
const assert = require('assert');

describe('PricingEngine', () => {
  let db;
  let pricingEngine;
  let testUserId;

  before(() => {
    // Create in-memory database for testing
    db = new Database(':memory:');

    // Create schema
    db.exec(`
      CREATE TABLE plans (
        id TEXT PRIMARY KEY, 
        code TEXT, 
        name TEXT, 
        monthly_price_cents INTEGER, 
        included_seconds INTEGER, 
        overage_rate_per_second_cents INTEGER, 
        description TEXT, 
        active INTEGER DEFAULT 1,
        created_at TEXT
      );
      
      CREATE TABLE skus (
        id TEXT PRIMARY KEY, 
        code TEXT UNIQUE, 
        name TEXT, 
        vector_id TEXT, 
        base_credits INTEGER, 
        base_price_cents INTEGER, 
        default_flags TEXT DEFAULT '[]', 
        description TEXT, 
        active INTEGER DEFAULT 1,
        created_at TEXT
      );
      
      CREATE TABLE flags (
        id TEXT PRIMARY KEY, 
        code TEXT UNIQUE, 
        label TEXT, 
        price_multiplier REAL DEFAULT 1.0, 
        price_add_flat_cents INTEGER DEFAULT 0, 
        description TEXT, 
        active INTEGER DEFAULT 1,
        created_at TEXT
      );
      
      CREATE TABLE user_plans (
        id INTEGER PRIMARY KEY, 
        user_id INTEGER, 
        plan_id TEXT, 
        start_date TEXT, 
        end_date TEXT, 
        auto_renew INTEGER DEFAULT 1, 
        status TEXT DEFAULT 'active',
        created_at TEXT
      );
      
      CREATE TABLE plan_usage (
        id INTEGER PRIMARY KEY, 
        user_id INTEGER, 
        plan_id TEXT, 
        period_start TEXT, 
        period_end TEXT, 
        seconds_used INTEGER DEFAULT 0,
        created_at TEXT,
        updated_at TEXT
      );
    `);

    // Seed test data
    const now = new Date().toISOString();

    // Plans
    db.prepare(`INSERT INTO plans VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      'plan_test', 'TEST', 'Test Plan', 1999, 600, 20, 'Test plan', 1, now
    );

    // SKUs
    db.prepare(`INSERT INTO skus VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      'sku_test1', 'TEST-1', 'Test SKU 1', 'v1', 60, 499, '["L_STD"]', 'Test SKU 1', 1, now
    );
    db.prepare(`INSERT INTO skus VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      'sku_test2', 'TEST-2', 'Test SKU 2', 'v1', 180, 2499, '["C"]', 'Test SKU with custom', 1, now
    );

    // Flags
    db.prepare(`INSERT INTO flags VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
      'flag_r', 'R', 'Rapid', 1.4, 0, 'Same-day delivery', 1, now
    );
    db.prepare(`INSERT INTO flags VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
      'flag_c', 'C', 'Custom', 1.0, 9900, 'Custom branding', 1, now
    );
    db.prepare(`INSERT INTO flags VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
      'flag_l_std', 'L_STD', 'Standard License', 1.0, 0, 'Standard license', 1, now
    );
    db.prepare(`INSERT INTO flags VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
      'flag_l_ext', 'L_EXT', 'Extended License', 1.0, 30000, 'Extended license', 1, now
    );

    pricingEngine = new PricingEngine(db);
    testUserId = 1;
  });

  after(() => {
    db.close();
  });

  describe('Basic Quote Calculation', () => {
    it('should calculate correct price for single unit', async () => {
      const quote = await pricingEngine.quote(testUserId, 'TEST-1', 1, []);

      assert.strictEqual(quote.quantity, 1);
      assert.strictEqual(quote.customer_price_cents, 499);
      assert.strictEqual(quote.total_seconds, 60);

      // Verify margin: cost = 60 * 0.0111 = 0.666, price = 4.99, margin = (4.99-0.67)/4.99 = 86.6%
      const marginPercent = parseFloat(quote.margin_percent);
      assert(marginPercent > 85, `Margin should be > 85%, got ${marginPercent}%`);
    });

    it('should calculate correct price for multiple units', async () => {
      const quote = await pricingEngine.quote(testUserId, 'TEST-1', 5, []);

      assert.strictEqual(quote.quantity, 5);
      assert.strictEqual(quote.customer_price_cents, 499 * 5);
      assert.strictEqual(quote.total_seconds, 60 * 5);
    });

    it('should throw error for non-existent SKU', async () => {
      try {
        await pricingEngine.quote(testUserId, 'NONEXISTENT', 1, []);
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.strictEqual(error.message, 'sku_not_found');
      }
    });
  });

  describe('Flag Application', () => {
    it('should apply rapid multiplier correctly', async () => {
      const baseQuote = await pricingEngine.quote(testUserId, 'TEST-1', 1, []);
      const rapidQuote = await pricingEngine.quote(testUserId, 'TEST-1', 1, ['R']);

      // Rapid should be 1.4x base price
      const expectedPrice = Math.round(baseQuote.customer_price_cents * 1.4);
      assert.strictEqual(rapidQuote.customer_price_cents, expectedPrice);
    });

    it('should apply custom flat addition', async () => {
      const baseQuote = await pricingEngine.quote(testUserId, 'TEST-1', 1, []);
      const customQuote = await pricingEngine.quote(testUserId, 'TEST-1', 1, ['C']);

      // Custom adds $99
      const expectedPrice = baseQuote.customer_price_cents + 9900;
      assert.strictEqual(customQuote.customer_price_cents, expectedPrice);
    });

    it('should apply extended license flat addition', async () => {
      const baseQuote = await pricingEngine.quote(testUserId, 'TEST-1', 1, []);
      const extQuote = await pricingEngine.quote(testUserId, 'TEST-1', 1, ['L_EXT']);

      // Extended license adds $300
      const expectedPrice = baseQuote.customer_price_cents + 30000;
      assert.strictEqual(extQuote.customer_price_cents, expectedPrice);
    });

    it('should combine multiple flags correctly', async () => {
      const quote = await pricingEngine.quote(testUserId, 'TEST-1', 1, ['R', 'C']);

      // Base: $4.99, Rapid 1.4x = $6.99, Custom +$99 = $105.99
      const basePrice = 499;
      const afterMultiplier = Math.round(basePrice * 1.4);
      const expectedPrice = afterMultiplier + 9900;

      assert.strictEqual(quote.customer_price_cents, expectedPrice);
    });

    it('should include default flags from SKU', async () => {
      const quote = await pricingEngine.quote(testUserId, 'TEST-1', 1, []);

      // TEST-1 has L_STD as default flag
      assert(quote.applied_flags.includes('L_STD'));
    });

    it('should merge default and applied flags without duplicates', async () => {
      const quote = await pricingEngine.quote(testUserId, 'TEST-1', 1, ['L_STD', 'R']);

      // Should have L_STD only once
      const stdCount = quote.applied_flags.filter(f => f === 'L_STD').length;
      assert.strictEqual(stdCount, 1);
    });
  });

  describe('Batch Discounts', () => {
    it('should apply 15% discount for 10-49 units', async () => {
      const singleQuote = await pricingEngine.quote(testUserId, 'TEST-1', 1, []);
      const batchQuote = await pricingEngine.quote(testUserId, 'TEST-1', 10, []);

      const expectedPrice = Math.round(singleQuote.customer_price_cents * 10 * 0.85);
      assert.strictEqual(batchQuote.customer_price_cents, expectedPrice);
    });

    it('should apply 25% discount for 50+ units', async () => {
      const singleQuote = await pricingEngine.quote(testUserId, 'TEST-1', 1, []);
      const bulkQuote = await pricingEngine.quote(testUserId, 'TEST-1', 50, []);

      const expectedPrice = Math.round(singleQuote.customer_price_cents * 50 * 0.75);
      assert.strictEqual(bulkQuote.customer_price_cents, expectedPrice);
    });

    it('should not apply batch discount for < 10 units', async () => {
      const singleQuote = await pricingEngine.quote(testUserId, 'TEST-1', 1, []);
      const multiQuote = await pricingEngine.quote(testUserId, 'TEST-1', 5, []);

      // Should be exactly 5x single price (no discount)
      assert.strictEqual(multiQuote.customer_price_cents, singleQuote.customer_price_cents * 5);
    });
  });

  describe('Plan Integration', () => {
    beforeEach(() => {
      // Clean up any existing user plans
      db.prepare('DELETE FROM user_plans WHERE user_id = ?').run(testUserId);
      db.prepare('DELETE FROM plan_usage WHERE user_id = ?').run(testUserId);
    });

    it('should deduct from plan when user has active plan', async () => {
      // Create active plan for user
      const now = new Date();
      const startDate = now.toISOString();
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).toISOString();

      db.prepare(`
        INSERT INTO user_plans (user_id, plan_id, start_date, end_date, status, created_at)
        VALUES (?, ?, ?, ?, 'active', ?)
      `).run(testUserId, 'plan_test', startDate, endDate, now.toISOString());

      const quote = await pricingEngine.quote(testUserId, 'TEST-1', 1, []);

      // Should use plan seconds (60 seconds available, 60 needed)
      assert.strictEqual(quote.seconds_from_plan, 60);
      assert.strictEqual(quote.overage_seconds, 0);
      assert.strictEqual(quote.overage_cost_cents, 0);
    });

    it('should calculate overage when exceeding plan limit', async () => {
      // Create active plan
      const now = new Date();
      db.prepare(`
        INSERT INTO user_plans (user_id, plan_id, start_date, end_date, status, created_at)
        VALUES (?, ?, ?, ?, 'active', ?)
      `).run(testUserId, 'plan_test', now.toISOString(),
        new Date(now.getFullYear(), now.getMonth() + 1).toISOString(),
        now.toISOString());

      // Create usage that uses most of the plan (550 of 600 seconds)
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      db.prepare(`
        INSERT INTO plan_usage (user_id, plan_id, period_start, period_end, seconds_used, created_at, updated_at)
        VALUES (?, ?, ?, ?, 550, ?, ?)
      `).run(testUserId, 'plan_test', periodStart, periodEnd, now.toISOString(), now.toISOString());

      // Request 60 seconds (50 remaining, 10 overage)
      const quote = await pricingEngine.quote(testUserId, 'TEST-1', 1, []);

      assert.strictEqual(quote.seconds_from_plan, 50);
      assert.strictEqual(quote.overage_seconds, 10);
      assert.strictEqual(quote.overage_cost_cents, 10 * 20); // 10 seconds * $0.20

      // Total price should include overage
      assert.strictEqual(quote.customer_price_cents, 499 + 200);
    });

    it('should handle zero plan seconds remaining', async () => {
      const now = new Date();
      db.prepare(`
        INSERT INTO user_plans (user_id, plan_id, start_date, end_date, status, created_at)
        VALUES (?, ?, ?, ?, 'active', ?)
      `).run(testUserId, 'plan_test', now.toISOString(),
        new Date(now.getFullYear(), now.getMonth() + 1).toISOString(),
        now.toISOString());

      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      // Use all 600 seconds
      db.prepare(`
        INSERT INTO plan_usage (user_id, plan_id, period_start, period_end, seconds_used, created_at, updated_at)
        VALUES (?, ?, ?, ?, 600, ?, ?)
      `).run(testUserId, 'plan_test', periodStart, periodEnd, now.toISOString(), now.toISOString());

      const quote = await pricingEngine.quote(testUserId, 'TEST-1', 1, []);

      assert.strictEqual(quote.seconds_from_plan, 0);
      assert.strictEqual(quote.overage_seconds, 60);
      assert.strictEqual(quote.overage_cost_cents, 60 * 20);
    });
  });

  describe('Margin Protection', () => {
    it('should enforce minimum margin requirement', async () => {
      // Create a SKU with price too low to meet margin
      const now = new Date().toISOString();
      db.prepare(`INSERT INTO skus VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        'sku_lowmargin', 'LOW-MARGIN', 'Low Margin SKU', 'v1',
        1000, // 1000 credits = $11.10 cost
        1200, // $12.00 price = only 7.5% margin
        '[]', 'Low margin test', 1, now
      );

      try {
        await pricingEngine.quote(testUserId, 'LOW-MARGIN', 1, []);
        assert.fail('Should have thrown margin_too_low error');
      } catch (error) {
        assert(error.message.includes('margin_too_low'));
      }
    });

    it('should accept SKU with healthy margin', async () => {
      // TEST-1: 60 credits = $0.67 cost, $4.99 price = 86.6% margin
      const quote = await pricingEngine.quote(testUserId, 'TEST-1', 1, []);

      const marginPercent = parseFloat(quote.margin_percent);
      assert(marginPercent >= 40, `Margin ${marginPercent}% should be >= 40%`);
    });
  });

  describe('Usage Deduction', () => {
    beforeEach(() => {
      db.prepare('DELETE FROM user_plans WHERE user_id = ?').run(testUserId);
      db.prepare('DELETE FROM plan_usage WHERE user_id = ?').run(testUserId);
    });

    it('should create usage record if not exists', async () => {
      const now = new Date();
      db.prepare(`
        INSERT INTO user_plans (user_id, plan_id, start_date, end_date, status, created_at)
        VALUES (?, ?, ?, ?, 'active', ?)
      `).run(testUserId, 'plan_test', now.toISOString(),
        new Date(now.getFullYear(), now.getMonth() + 1).toISOString(),
        now.toISOString());

      pricingEngine.deductUsage(testUserId, 'plan_test', 100);

      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      const usage = db.prepare(`
        SELECT * FROM plan_usage 
        WHERE user_id = ? AND plan_id = ? AND period_start = ?
      `).get(testUserId, 'plan_test', periodStart);

      assert(usage, 'Usage record should be created');
      assert.strictEqual(usage.seconds_used, 100);
    });

    it('should increment existing usage record', async () => {
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      db.prepare(`
        INSERT INTO user_plans (user_id, plan_id, start_date, end_date, status, created_at)
        VALUES (?, ?, ?, ?, 'active', ?)
      `).run(testUserId, 'plan_test', now.toISOString(),
        new Date(now.getFullYear(), now.getMonth() + 1).toISOString(),
        now.toISOString());

      db.prepare(`
        INSERT INTO plan_usage (user_id, plan_id, period_start, period_end, seconds_used, created_at, updated_at)
        VALUES (?, ?, ?, ?, 100, ?, ?)
      `).run(testUserId, 'plan_test', periodStart, periodEnd, now.toISOString(), now.toISOString());

      pricingEngine.deductUsage(testUserId, 'plan_test', 50);

      const usage = db.prepare(`
        SELECT * FROM plan_usage 
        WHERE user_id = ? AND plan_id = ? AND period_start = ?
      `).get(testUserId, 'plan_test', periodStart);

      assert.strictEqual(usage.seconds_used, 150);
    });
  });
});

// Run tests if this file is executed directly
if (require.main === module) {
  console.log('Running PricingEngine tests...\n');

  const Mocha = require('mocha');
  const mocha = new Mocha();

  mocha.suite.emit('pre-require', global, null, mocha);

  // Load this file as a test
  mocha.addFile(__filename);

  mocha.run(failures => {
    process.exitCode = failures ? 1 : 0;
  });
}

module.exports = { describe, it, before, after, beforeEach };
