# Technical Specification: Phase 1 - Pricing & Plan System

## Task Complexity Assessment

**Difficulty: Hard**

This is Phase 1 of adding an enterprise pricing and subscription system to the existing FaceShot-ChopShop platform. The system will layer a sophisticated pricing engine on top of the already-implemented auth and A2E API integration.

## Technical Context

### Current State
- ✅ Auth endpoints implemented (signup, login, /api/auth/me)
- ✅ A2E API integration via `services/a2e.js`
- ✅ Background job polling for task status
- ✅ Credit system with transactions
- ✅ Stripe checkout for credit packs
- ✅ Frontend with Create page, prompt inputs

### Language & Runtime
- **Backend**: Node.js (>=20.0.0), Express.js
- **Frontend**: React 19.2.3 with React Router 7.11.0
- **Database**: SQLite (better-sqlite3) - staying with SQLite for Phase 1
- **Build Tools**: react-scripts (CRA), craco
- **Styling**: Tailwind CSS 3.4.17

### Dependencies (existing)
- `better-sqlite3` ^9.4.3 - Database
- `stripe` ^14.0.0 - Payments
- `jsonwebtoken` ^9.0.2 - Auth
- `bcryptjs` ^2.4.3 - Password hashing
- `axios` ^1.7.7 - HTTP client

### New Environment Variables
```env
# Pricing Constants
COST_PER_CREDIT=0.0111
MIN_MARGIN=0.40
MAX_JOB_SECONDS=5000
```

## Phase 1 Scope

### What We're Building
1. **Pricing Engine** - Core service to calculate quotes based on plans, SKUs, and flags
2. **Subscription System** - User plans with included seconds and overage rates
3. **SKU System** - Product catalog with base credits and prices
4. **Flag System** - Price modifiers (Rapid, Custom, etc.)
5. **Usage Tracking** - Per-plan-period usage tracking in seconds
6. **Integration** - Wire pricing into existing Create flow

### What We're NOT Building (Yet)
- ❌ Multiple creation screens (Images, Video, Voice, Text) - only extending existing Create page
- ❌ Full admin panel - seeding via SQL scripts is sufficient
- ❌ All 7 vectors and 20+ SKUs - starting with 3 SKUs only
- ❌ PostgreSQL migration - staying with SQLite
- ❌ License flag implementation (L_STD, L_EXT, L_EXCL) - deferred to Phase 2

## Data Model

### New Tables

#### 1. `plans`
```sql
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  monthly_price_cents INTEGER NOT NULL,
  included_seconds INTEGER NOT NULL,
  overage_rate_per_second_cents INTEGER NOT NULL,
  description TEXT,
  active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL
);
```

**Seed Data (Phase 1):**
```javascript
{
  id: 'plan_pro',
  code: 'PRO',
  name: 'Pro',
  monthly_price_cents: 7999, // $79.99
  included_seconds: 3000,
  overage_rate_per_second_cents: 15, // $0.15
  description: 'Professional plan with 3000 seconds included',
  active: 1
}
```

#### 2. `skus`
```sql
CREATE TABLE IF NOT EXISTS skus (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  base_credits INTEGER NOT NULL,
  base_price_cents INTEGER NOT NULL,
  default_flags TEXT DEFAULT '[]',
  description TEXT,
  active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL
);
```

**Seed Data (Phase 1):**
```javascript
[
  {
    id: 'sku_c2_30',
    code: 'C2-30',
    name: '30s Ad/UGC Clip',
    base_credits: 180,
    base_price_cents: 5900, // $59.00
    default_flags: '[]',
    description: '30-second promotional video or user-generated content clip'
  },
  {
    id: 'sku_a1_ig',
    code: 'A1-IG',
    name: 'Instagram Image 1080p',
    base_credits: 60,
    base_price_cents: 499, // $4.99
    default_flags: '[]',
    description: 'Social media ready image for Instagram'
  },
  {
    id: 'sku_b1_30soc',
    code: 'B1-30SOC',
    name: '30 Social Creatives',
    base_credits: 1800,
    base_price_cents: 7900, // $79.00
    default_flags: '["B"]',
    description: 'Bundle of 30 social media images'
  }
]
```

#### 3. `flags`
```sql
CREATE TABLE IF NOT EXISTS flags (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  price_multiplier REAL DEFAULT 1.0,
  price_add_flat_cents INTEGER DEFAULT 0,
  description TEXT,
  active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL
);
```

**Seed Data (Phase 1):**
```javascript
[
  {
    id: 'flag_r',
    code: 'R',
    label: 'Rapid (same-day)',
    price_multiplier: 1.4,
    price_add_flat_cents: 0,
    description: 'Priority processing for same-day delivery',
    active: 1
  },
  {
    id: 'flag_c',
    code: 'C',
    label: 'Custom (brand style)',
    price_multiplier: 1.0,
    price_add_flat_cents: 9900, // $99.00
    description: 'Custom branding, avatar, or voice',
    active: 1
  },
  {
    id: 'flag_b',
    code: 'B',
    label: 'Batch discount',
    price_multiplier: 0.85,
    price_add_flat_cents: 0,
    description: 'Automatic batch discount for 10+ items',
    active: 1
  }
]
```

#### 4. `user_plans`
```sql
CREATE TABLE IF NOT EXISTS user_plans (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  plan_id TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT,
  auto_renew INTEGER DEFAULT 1,
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (plan_id) REFERENCES plans(id)
);

CREATE INDEX IF NOT EXISTS idx_user_plans_user_id ON user_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_plans_status ON user_plans(status);
```

#### 5. `plan_usage`
```sql
CREATE TABLE IF NOT EXISTS plan_usage (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  plan_id TEXT NOT NULL,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  seconds_used INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (plan_id) REFERENCES plans(id)
);

CREATE INDEX IF NOT EXISTS idx_plan_usage_user_period ON plan_usage(user_id, period_start, period_end);
```

#### 6. `orders`
```sql
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  sku_code TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  applied_flags TEXT DEFAULT '[]',
  customer_price_cents INTEGER NOT NULL,
  internal_cost_cents INTEGER NOT NULL,
  margin_percent REAL NOT NULL,
  total_seconds INTEGER NOT NULL,
  overage_seconds INTEGER DEFAULT 0,
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
```

### Modified Tables

#### Update `jobs` table
Already has necessary fields:
- `a2e_task_id` - A2E task identifier
- `cost_credits` - Credits consumed
- `result_url` - Completed media URL

**Add new field:**
```sql
ALTER TABLE jobs ADD COLUMN order_id INTEGER;
```

## Pricing Engine Implementation

### Core Service: `services/pricing.js`

```javascript
class PricingEngine {
  constructor(db) {
    this.db = db;
    this.COST_PER_CREDIT = Number(process.env.COST_PER_CREDIT || 0.0111);
    this.MIN_MARGIN = Number(process.env.MIN_MARGIN || 0.40);
  }

  /**
   * Generate a price quote for a user
   * @param {number} userId 
   * @param {string} skuCode 
   * @param {number} quantity 
   * @param {string[]} appliedFlags 
   * @returns {Promise<PriceQuote>}
   */
  async quote(userId, skuCode, quantity = 1, appliedFlags = []) {
    // 1. Load SKU
    const sku = this.db.prepare('SELECT * FROM skus WHERE code = ? AND active = 1').get(skuCode);
    if (!sku) throw new Error('sku_not_found');

    // 2. Load user's active plan (if any)
    const userPlan = this.getUserActivePlan(userId);
    
    // 3. Get user's current period usage
    let remainingSeconds = 0;
    if (userPlan) {
      const plan = this.db.prepare('SELECT * FROM plans WHERE id = ?').get(userPlan.plan_id);
      const usage = this.getCurrentPeriodUsage(userId, userPlan.plan_id);
      remainingSeconds = plan.included_seconds - (usage ? usage.seconds_used : 0);
      remainingSeconds = Math.max(0, remainingSeconds);
    }

    // 4. Calculate total credits/seconds
    const totalCredits = sku.base_credits * quantity;
    const totalSeconds = totalCredits; // 1 credit ≈ 1 second

    // 5. Merge flags (SKU defaults + applied)
    const defaultFlags = JSON.parse(sku.default_flags || '[]');
    const allFlags = [...new Set([...defaultFlags, ...appliedFlags])];

    // 6. Load flag definitions
    const flagRecords = allFlags.length > 0 
      ? this.db.prepare(`SELECT * FROM flags WHERE code IN (${allFlags.map(() => '?').join(',')}) AND active = 1`).all(...allFlags)
      : [];

    // 7. Calculate base price
    let price = sku.base_price_cents * quantity;

    // 8. Apply flag modifiers
    let totalMultiplier = 1.0;
    let totalFlatAdd = 0;

    for (const flag of flagRecords) {
      if (flag.price_multiplier !== 1.0) {
        totalMultiplier *= flag.price_multiplier;
      }
      if (flag.price_add_flat_cents > 0) {
        totalFlatAdd += flag.price_add_flat_cents;
      }
    }

    price = Math.round(price * totalMultiplier) + totalFlatAdd;

    // 9. Calculate overage if user has plan
    let secondsFromPlan = 0;
    let overageSeconds = 0;
    let overageCost = 0;

    if (userPlan) {
      const plan = this.db.prepare('SELECT * FROM plans WHERE id = ?').get(userPlan.plan_id);
      secondsFromPlan = Math.min(totalSeconds, remainingSeconds);
      overageSeconds = Math.max(0, totalSeconds - remainingSeconds);
      overageCost = overageSeconds * plan.overage_rate_per_second_cents;
    }

    const customerPrice = price + overageCost;

    // 10. Calculate internal cost and margin
    const internalCost = Math.round(totalCredits * this.COST_PER_CREDIT * 100); // in cents
    const margin = (customerPrice - internalCost) / customerPrice;

    // 11. Margin safety check
    if (margin < this.MIN_MARGIN) {
      throw new Error(`margin_too_low: ${(margin * 100).toFixed(1)}% < ${(this.MIN_MARGIN * 100)}%`);
    }

    return {
      sku_code: skuCode,
      sku_name: sku.name,
      quantity,
      applied_flags: allFlags,
      customer_price_cents: customerPrice,
      customer_price_usd: (customerPrice / 100).toFixed(2),
      internal_cost_cents: internalCost,
      internal_cost_usd: (internalCost / 100).toFixed(2),
      margin_percent: (margin * 100).toFixed(1),
      total_seconds: totalSeconds,
      seconds_from_plan: secondsFromPlan,
      overage_seconds: overageSeconds,
      overage_cost_cents: overageCost,
      overage_cost_usd: (overageCost / 100).toFixed(2),
      remaining_plan_seconds: remainingSeconds
    };
  }

  getUserActivePlan(userId) {
    const now = new Date().toISOString();
    return this.db.prepare(`
      SELECT * FROM user_plans 
      WHERE user_id = ? 
        AND status = 'active' 
        AND start_date <= ? 
        AND (end_date IS NULL OR end_date > ?)
      ORDER BY start_date DESC 
      LIMIT 1
    `).get(userId, now, now);
  }

  getCurrentPeriodUsage(userId, planId) {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    let usage = this.db.prepare(`
      SELECT * FROM plan_usage 
      WHERE user_id = ? 
        AND plan_id = ? 
        AND period_start = ? 
        AND period_end = ?
    `).get(userId, planId, periodStart, periodEnd);

    if (!usage) {
      // Create usage record for this period
      this.db.prepare(`
        INSERT INTO plan_usage (user_id, plan_id, period_start, period_end, seconds_used, created_at, updated_at)
        VALUES (?, ?, ?, ?, 0, ?, ?)
      `).run(userId, planId, periodStart, periodEnd, now.toISOString(), now.toISOString());

      usage = { user_id: userId, plan_id: planId, seconds_used: 0, period_start: periodStart, period_end: periodEnd };
    }

    return usage;
  }

  deductUsage(userId, planId, seconds) {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const usage = this.getCurrentPeriodUsage(userId, planId);
    
    this.db.prepare(`
      UPDATE plan_usage 
      SET seconds_used = seconds_used + ?, updated_at = ?
      WHERE user_id = ? AND plan_id = ? AND period_start = ? AND period_end = ?
    `).run(seconds, now.toISOString(), userId, planId, periodStart, periodEnd);
  }
}

module.exports = PricingEngine;
```

## API Endpoints

### New Endpoints

#### POST /api/pricing/quote
```javascript
app.post('/api/pricing/quote', authenticateToken, async (req, res) => {
  try {
    const { sku_code, quantity = 1, flags = [] } = req.body;
    
    if (!sku_code) {
      return res.status(400).json({ error: 'sku_code_required' });
    }

    const pricingEngine = new PricingEngine(db);
    const quote = await pricingEngine.quote(req.user.id, sku_code, quantity, flags);
    
    res.json(quote);
  } catch (error) {
    logger.error({ msg: 'quote_error', error: String(error) });
    res.status(500).json({ error: error.message });
  }
});
```

#### GET /api/plans
```javascript
app.get('/api/plans', (req, res) => {
  const plans = db.prepare('SELECT * FROM plans WHERE active = 1 ORDER BY monthly_price_cents ASC').all();
  res.json(plans);
});
```

#### POST /api/subscribe
```javascript
app.post('/api/subscribe', authenticateToken, async (req, res) => {
  try {
    if (!stripe) return res.status(400).json({ error: 'stripe_not_configured' });
    
    const { plan_id } = req.body;
    const plan = db.prepare('SELECT * FROM plans WHERE id = ? AND active = 1').get(plan_id);
    
    if (!plan) return res.status(400).json({ error: 'invalid_plan' });

    const user = db.prepare('SELECT email FROM users WHERE id = ?').get(req.user.id);
    
    // Create Stripe subscription
    const subscription = await stripe.subscriptions.create({
      customer: await getOrCreateStripeCustomer(user.email, req.user.id),
      items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `${plan.name} Plan` },
          recurring: { interval: 'month' },
          unit_amount: plan.monthly_price_cents
        }
      }],
      metadata: {
        user_id: String(req.user.id),
        plan_id: plan.id
      }
    });

    // Create user_plan record
    const now = new Date().toISOString();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    db.prepare(`
      INSERT INTO user_plans (user_id, plan_id, start_date, end_date, stripe_subscription_id, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'active', ?)
    `).run(req.user.id, plan.id, now, endDate.toISOString(), subscription.id, now);

    res.json({ subscription_id: subscription.id, status: 'active' });
  } catch (error) {
    logger.error({ msg: 'subscribe_error', error: String(error) });
    res.status(500).json({ error: 'subscription_failed' });
  }
});
```

### Modified Endpoints

#### Update POST /api/web/process
Add usage tracking and order creation:

```javascript
app.post('/api/web/process', authenticateToken, async (req, res) => {
  try {
    const { type, options = {} } = req.body;
    const userId = req.user.id;

    // Map catalog type to SKU code
    const typeToSku = {
      'img2vid': 'C2-30', // Assuming 30s video
      'faceswap': 'A1-IG', // Simplified
      'avatar': 'A1-IG',
      'enhance': 'A1-IG',
      'bgremove': 'A1-IG'
    };

    const skuCode = typeToSku[type] || 'A1-IG';

    // Get quote
    const pricingEngine = new PricingEngine(db);
    const quote = await pricingEngine.quote(userId, skuCode, 1, []);

    // Get uploaded media
    const upload = db.prepare('SELECT url FROM miniapp_creations WHERE user_id=? AND type=? ORDER BY id DESC LIMIT 1').get(userId, type);
    if (!upload || !upload.url) {
      return res.status(400).json({ error: 'no_media_uploaded' });
    }

    // Start A2E task
    const a2eService = new A2EService(process.env.A2E_API_KEY, process.env.A2E_BASE_URL);
    const a2eResponse = await a2eService.startTask(type, upload.url, options);

    // Create order record
    const orderResult = db.prepare(`
      INSERT INTO orders (user_id, sku_code, quantity, customer_price_cents, internal_cost_cents, margin_percent, total_seconds, overage_seconds, status, created_at)
      VALUES (?, ?, 1, ?, ?, ?, ?, ?, 'processing', ?)
    `).run(
      userId,
      skuCode,
      quote.customer_price_cents,
      quote.internal_cost_cents,
      parseFloat(quote.margin_percent),
      quote.total_seconds,
      quote.overage_seconds,
      new Date().toISOString()
    );

    // Create job record
    const job = db.prepare(`
      INSERT INTO jobs (user_id, type, status, a2e_task_id, cost_credits, order_id, created_at, updated_at) 
      VALUES (?,?,?,?,?,?,?,?)
    `).run(
      userId,
      type,
      'processing',
      a2eResponse.data._id,
      a2eResponse.data.coins || quote.total_seconds,
      orderResult.lastInsertRowid,
      new Date().toISOString(),
      new Date().toISOString()
    );

    // Deduct usage from plan if user has one
    const userPlan = pricingEngine.getUserActivePlan(userId);
    if (userPlan) {
      pricingEngine.deductUsage(userId, userPlan.plan_id, quote.total_seconds);
    }

    // Start background polling
    startStatusPolling(job.lastInsertRowid, type, a2eResponse.data._id);

    res.json({ 
      job_id: job.lastInsertRowid, 
      status: 'processing',
      quote
    });
  } catch (error) {
    logger.error({ msg: 'process_error', error: String(error) });
    res.status(500).json({ error: error.message });
  }
});
```

## Frontend Integration

### Update `frontend/src/lib/api.js`

```javascript
export const getPricingQuote = (skuCode, quantity = 1, flags = []) => 
  api.post('/api/pricing/quote', { sku_code: skuCode, quantity, flags });

export const getPlans = () => api.get('/api/plans');
export const subscribe = (planId) => api.post('/api/subscribe', { plan_id: planId });
```

### Update `frontend/src/pages/Create.js`

Add pricing preview before submission:

```javascript
import { getPricingQuote } from '../lib/api';

// Add state
const [quote, setQuote] = useState(null);
const [loadingQuote, setLoadingQuote] = useState(false);

// Add useEffect to fetch quote when tool changes
useEffect(() => {
  if (!selectedTool || !user) return;

  const typeToSku = {
    'img2vid': 'C2-30',
    'faceswap': 'A1-IG',
    'avatar': 'A1-IG',
    'enhance': 'A1-IG',
    'bgremove': 'A1-IG'
  };

  const skuCode = typeToSku[selectedTool] || 'A1-IG';

  setLoadingQuote(true);
  getPricingQuote(skuCode, 1, [])
    .then(res => setQuote(res.data))
    .catch(err => console.error('Quote error:', err))
    .finally(() => setLoadingQuote(false));
}, [selectedTool, user]);

// Add pricing display before submit button
{quote && (
  <div className="mb-6 p-4 bg-blue-50 rounded border border-blue-200">
    <h3 className="font-bold mb-2">Pricing Estimate</h3>
    <p className="text-sm mb-1">
      <span className="font-medium">Cost:</span> ${quote.customer_price_usd}
    </p>
    <p className="text-sm mb-1">
      <span className="font-medium">Processing Time:</span> ~{quote.total_seconds} seconds
    </p>
    {quote.seconds_from_plan > 0 && (
      <p className="text-sm text-green-600">
        ✓ Using {quote.seconds_from_plan}s from your plan
      </p>
    )}
    {quote.overage_seconds > 0 && (
      <p className="text-sm text-orange-600">
        ⚠ ${quote.overage_cost_usd} overage charge ({quote.overage_seconds}s)
      </p>
    )}
  </div>
)}
```

## Testing & Verification

### Unit Tests (Manual)

**Pricing Engine:**
```bash
# Test quote calculation
curl -X POST http://localhost:3000/api/pricing/quote \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"sku_code":"A1-IG","quantity":1,"flags":[]}'

# Expected: margin >= 40%, customer_price > internal_cost

# Test with Rapid flag
curl -X POST http://localhost:3000/api/pricing/quote \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"sku_code":"C2-30","quantity":1,"flags":["R"]}'

# Expected: price should be 1.4x base price
```

### Integration Tests

**Full Flow:**
1. Sign up user → Subscribe to Pro plan
2. Check `/api/pricing/quote` shows plan seconds available
3. Process a job → Verify `plan_usage.seconds_used` increases
4. Check quote again → Verify remaining seconds decreased
5. Process enough jobs to exceed plan → Verify overage charges appear

### E2E Frontend Testing

1. Login → Navigate to Create page
2. Select tool → See pricing estimate appear
3. Upload file → See same pricing
4. Submit → Verify job processes
5. Navigate to Dashboard → See completed creation

## Migration Strategy

### Database Schema Updates

```javascript
// In index.js, after existing db.exec():
db.exec(`
  CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    monthly_price_cents INTEGER NOT NULL,
    included_seconds INTEGER NOT NULL,
    overage_rate_per_second_cents INTEGER NOT NULL,
    description TEXT,
    active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS skus (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    base_credits INTEGER NOT NULL,
    base_price_cents INTEGER NOT NULL,
    default_flags TEXT DEFAULT '[]',
    description TEXT,
    active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS flags (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL,
    price_multiplier REAL DEFAULT 1.0,
    price_add_flat_cents INTEGER DEFAULT 0,
    description TEXT,
    active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS user_plans (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    plan_id TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT,
    auto_renew INTEGER DEFAULT 1,
    stripe_subscription_id TEXT,
    status TEXT DEFAULT 'active',
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_user_plans_user_id ON user_plans(user_id);

  CREATE TABLE IF NOT EXISTS plan_usage (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    plan_id TEXT NOT NULL,
    period_start TEXT NOT NULL,
    period_end TEXT NOT NULL,
    seconds_used INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_plan_usage_user_period ON plan_usage(user_id, period_start, period_end);

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    sku_code TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    applied_flags TEXT DEFAULT '[]',
    customer_price_cents INTEGER NOT NULL,
    internal_cost_cents INTEGER NOT NULL,
    margin_percent REAL NOT NULL,
    total_seconds INTEGER NOT NULL,
    overage_seconds INTEGER DEFAULT 0,
    stripe_payment_intent_id TEXT,
    status TEXT DEFAULT 'pending',
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
`);

// Seed data
const now = new Date().toISOString();

// Seed plan
db.prepare(`
  INSERT OR IGNORE INTO plans (id, code, name, monthly_price_cents, included_seconds, overage_rate_per_second_cents, description, created_at)
  VALUES ('plan_pro', 'PRO', 'Pro', 7999, 3000, 15, 'Professional plan with 3000 seconds included', ?)
`).run(now);

// Seed SKUs
db.prepare(`INSERT OR IGNORE INTO skus (id, code, name, base_credits, base_price_cents, default_flags, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run('sku_c2_30', 'C2-30', '30s Ad/UGC Clip', 180, 5900, '[]', '30-second promotional video', now);
db.prepare(`INSERT OR IGNORE INTO skus (id, code, name, base_credits, base_price_cents, default_flags, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run('sku_a1_ig', 'A1-IG', 'Instagram Image 1080p', 60, 499, '[]', 'Social media ready image', now);
db.prepare(`INSERT OR IGNORE INTO skus (id, code, name, base_credits, base_price_cents, default_flags, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run('sku_b1_30soc', 'B1-30SOC', '30 Social Creatives', 1800, 7900, '["B"]', 'Bundle of 30 social media images', now);

// Seed flags
db.prepare(`INSERT OR IGNORE INTO flags (id, code, label, price_multiplier, price_add_flat_cents, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).run('flag_r', 'R', 'Rapid (same-day)', 1.4, 0, 'Priority processing', now);
db.prepare(`INSERT OR IGNORE INTO flags (id, code, label, price_multiplier, price_add_flat_cents, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).run('flag_c', 'C', 'Custom (brand style)', 1.0, 9900, 'Custom branding', now);
db.prepare(`INSERT OR IGNORE INTO flags (id, code, label, price_multiplier, price_add_flat_cents, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).run('flag_b', 'B', 'Batch discount', 0.85, 0, 'Batch discount', now);
```

## Success Criteria

- ✅ PricingEngine service calculates accurate quotes with margin >= 40%
- ✅ Users can subscribe to Pro plan via Stripe
- ✅ Usage is tracked per monthly period in `plan_usage` table
- ✅ Create page shows real-time pricing estimate
- ✅ Jobs deduct seconds from user's plan quota
- ✅ Overage charges calculated correctly when plan limit exceeded
- ✅ Orders table tracks all pricing details for analytics
- ✅ All database migrations run idempotently

## Phase 2 Considerations

**Future Enhancements** (out of scope for Phase 1):
- Admin panel for managing SKUs, plans, and flags
- Additional vectors (V1-V7) and 17 more SKUs
- Multiple creation screens (Images, Video, Voice, Text)
- License flag implementation (L_STD, L_EXT, L_EXCL)
- Referral system and promotional credits
- Advanced batch pricing rules
- PostgreSQL migration for production scale
- Webhook support from A2E (if available)
- Comprehensive analytics dashboard

## Estimated Effort

- Database schema & migrations: 1-2 hours
- PricingEngine service: 3-4 hours
- API endpoints: 2-3 hours
- Frontend integration: 2-3 hours
- Testing & debugging: 2-3 hours

**Total: 10-15 hours**
