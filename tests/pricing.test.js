const Database = require('better-sqlite3');
const PricingEngine = require('../services/pricing');
const fs = require('fs');
const path = require('path');

describe('PricingEngine', () => {
  let db;
  let engine;
  let testUserId;

  beforeAll(() => {
    // Create an in-memory test database
    db = new Database(':memory:');
    
    // Set up schema
    db.exec(`
      CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT);
      CREATE TABLE vectors (id TEXT PRIMARY KEY, code TEXT, name TEXT, description TEXT, created_at TEXT);
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
        code TEXT, 
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
        code TEXT, 
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

    // Insert test data
    const now = new Date().toISOString();
    
    db.prepare('INSERT INTO users (id, email) VALUES (?, ?)').run(1, 'test@example.com');
    testUserId = 1;

    db.prepare('INSERT INTO vectors (id, code, name, description, created_at) VALUES (?, ?, ?, ?, ?)').run('v1', 'V1', 'Image Generation', 'Test', now);
    
    db.prepare('INSERT INTO plans (id, code, name, monthly_price_cents, included_seconds, overage_rate_per_second_cents, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run('plan_pro', 'PRO', 'Pro', 7999, 3000, 15, 'Pro plan', now);
    
    db.prepare('INSERT INTO skus (id, code, name, vector_id, base_credits, base_price_cents, default_flags, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run('sku_test', 'TEST-SKU', 'Test SKU', 'v1', 100, 1000, '["L_STD"]', 'Test SKU', now);
    
    db.prepare('INSERT INTO flags (id, code, label, price_multiplier, price_add_flat_cents, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run('flag_r', 'R', 'Rapid', 1.4, 0, 'Rush', now);
    db.prepare('INSERT INTO flags (id, code, label, price_multiplier, price_add_flat_cents, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run('flag_l_std', 'L_STD', 'Standard License', 1.0, 0, 'Standard', now);
    db.prepare('INSERT INTO flags (id, code, label, price_multiplier, price_add_flat_cents, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run('flag_l_ext', 'L_EXT', 'Extended License', 1.0, 30000, 'Extended', now);

    engine = new PricingEngine(db);
  });

  afterAll(() => {
    db.close();
  });

  describe('quote()', () => {
    test('should calculate basic quote without plan', async () => {
      const quote = await engine.quote(testUserId, 'TEST-SKU', 1, []);
      
      expect(quote).toBeDefined();
      expect(quote.sku_code).toBe('TEST-SKU');
      expect(quote.quantity).toBe(1);
      expect(quote.customer_price_cents).toBe(1000);
      expect(quote.total_seconds).toBe(100);
      expect(quote.overage_seconds).toBe(0);
      expect(parseFloat(quote.margin_percent)).toBeGreaterThan(70);
    });

    test('should calculate quote with quantity', async () => {
      const quote = await engine.quote(testUserId, 'TEST-SKU', 5, []);
      
      expect(quote.quantity).toBe(5);
      expect(quote.customer_price_cents).toBe(5000);
      expect(quote.total_seconds).toBe(500);
    });

    test('should apply batch discount for 10+ quantity', async () => {
      const quote = await engine.quote(testUserId, 'TEST-SKU', 10, []);
      
      // Base: 10 * 1000 = 10000
      // With 0.85 batch discount: 10000 * 0.85 = 8500
      expect(quote.customer_price_cents).toBe(8500);
    });

    test('should apply batch discount for 50+ quantity', async () => {
      const quote = await engine.quote(testUserId, 'TEST-SKU', 50, []);
      
      // Base: 50 * 1000 = 50000
      // With 0.75 batch discount: 50000 * 0.75 = 37500
      expect(quote.customer_price_cents).toBe(37500);
    });

    test('should apply flag multiplier', async () => {
      const quote = await engine.quote(testUserId, 'TEST-SKU', 1, ['R']);
      
      // Base: 1000
      // With rapid flag (1.4x): 1000 * 1.4 = 1400
      expect(quote.customer_price_cents).toBe(1400);
    });

    test('should apply flat fee flag', async () => {
      const quote = await engine.quote(testUserId, 'TEST-SKU', 1, ['L_EXT']);
      
      // Base: 1000
      // With extended license flat fee: 1000 + 30000 = 31000
      expect(quote.customer_price_cents).toBe(31000);
    });

    test('should calculate margin correctly', async () => {
      const quote = await engine.quote(testUserId, 'TEST-SKU', 1, []);
      
      // Internal cost: 100 credits * 0.0111 = 1.11 USD = 111 cents
      expect(quote.internal_cost_cents).toBe(111);
      
      // Margin: (1000 - 111) / 1000 = 0.889 = 88.9%
      expect(parseFloat(quote.margin_percent)).toBeGreaterThan(88);
      expect(parseFloat(quote.margin_percent)).toBeLessThan(89);
    });

    test('should throw error for non-existent SKU', async () => {
      await expect(
        engine.quote(testUserId, 'INVALID-SKU', 1, [])
      ).rejects.toThrow('sku_not_found');
    });

    test('should throw error if margin too low', async () => {
      // Create a SKU with very low price (below minimum margin)
      const now = new Date().toISOString();
      db.prepare('INSERT INTO skus (id, code, name, vector_id, base_credits, base_price_cents, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run('sku_lowprice', 'LOW-PRICE', 'Low Price SKU', 'v1', 1000, 10, 'Low price', now);
      
      await expect(
        engine.quote(testUserId, 'LOW-PRICE', 1, [])
      ).rejects.toThrow(/margin_too_low/);
    });
  });

  describe('quote() with active plan', () => {
    beforeAll(() => {
      // Add active plan for user
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
      
      db.prepare(`
        INSERT INTO user_plans (user_id, plan_id, start_date, end_date, status, created_at)
        VALUES (?, ?, ?, ?, 'active', ?)
      `).run(testUserId, 'plan_pro', startDate, endDate, now.toISOString());
    });

    test('should use plan seconds when available', async () => {
      const quote = await engine.quote(testUserId, 'TEST-SKU', 1, []);
      
      // 100 seconds should come from plan (no overage)
      expect(quote.seconds_from_plan).toBe(100);
      expect(quote.overage_seconds).toBe(0);
      expect(quote.overage_cost_cents).toBe(0);
    });

    test('should calculate overage when exceeding plan', async () => {
      // Use up most of the plan seconds first
      const periodStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const periodEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59).toISOString();
      
      db.prepare(`
        INSERT INTO plan_usage (user_id, plan_id, period_start, period_end, seconds_used, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(testUserId, 'plan_pro', periodStart, periodEnd, 2950, new Date().toISOString(), new Date().toISOString());
      
      const quote = await engine.quote(testUserId, 'TEST-SKU', 1, []);
      
      // Plan has 3000 seconds, 2950 used, 50 remaining
      // Order needs 100 seconds: 50 from plan, 50 overage
      expect(quote.seconds_from_plan).toBe(50);
      expect(quote.overage_seconds).toBe(50);
      
      // Overage cost: 50 seconds * 15 cents/second = 750 cents
      expect(quote.overage_cost_cents).toBe(750);
      
      // Total: base price + overage
      expect(quote.customer_price_cents).toBe(1000 + 750);
    });
  });

  describe('deductUsage()', () => {
    test('should deduct usage from plan', () => {
      const periodStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const periodEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59).toISOString();
      
      // Ensure period record exists
      engine.getCurrentPeriodUsage(testUserId, 'plan_pro');
      
      // Deduct 100 seconds
      engine.deductUsage(testUserId, 'plan_pro', 100);
      
      const usage = db.prepare(`
        SELECT seconds_used FROM plan_usage 
        WHERE user_id = ? AND plan_id = ? AND period_start = ?
      `).get(testUserId, 'plan_pro', periodStart);
      
      expect(usage.seconds_used).toBeGreaterThanOrEqual(100);
    });
  });
});
