# A2E Platform Operator Guide

## Overview

This guide explains how to manage the A2E dual-purpose platform's pricing and packaging system. The platform consists of:

- **7 Vectors** (service categories): Image Generation, Image Utility, Video Generation, Voice Clone, Voiceover/TTS, Text Content/SEO, Multi-Modal Bundles
- **3 Subscription Plans**: Starter, Pro, Agency
- **20+ SKUs** across all vectors
- **6 Flags** for modifying pricing (Rapid, Custom, Batch, Standard/Extended/Exclusive licenses)

---

## Table of Contents

1. [Database Schema](#database-schema)
2. [Key API Endpoints](#key-api-endpoints)
3. [Pricing Rules](#pricing-rules)
4. [Managing SKUs](#managing-skus)
5. [Managing Plans](#managing-plans)
6. [Managing Flags](#managing-flags)
7. [Monitoring Usage & Margins](#monitoring-usage--margins)
8. [Common Operations](#common-operations)

---

## Database Schema

### Core Tables

**vectors**
- Stores service categories (V1-V7)
- Fields: `id`, `code`, `name`, `description`, `created_at`

**plans**
- Subscription tiers with monthly quotas
- Fields: `id`, `code`, `name`, `monthly_price_cents`, `included_seconds`, `overage_rate_per_second_cents`, `description`, `active`, `created_at`

**skus**
- Individual products/services offered
- Fields: `id`, `code`, `name`, `vector_id`, `base_credits`, `base_price_cents`, `default_flags`, `description`, `active`, `created_at`

**flags**
- Pricing modifiers (multipliers and flat additions)
- Fields: `id`, `code`, `label`, `price_multiplier`, `price_add_flat_cents`, `description`, `active`, `created_at`

**user_plans**
- Active subscriptions
- Fields: `id`, `user_id`, `plan_id`, `start_date`, `end_date`, `auto_renew`, `stripe_subscription_id`, `status`, `created_at`

**plan_usage**
- Monthly usage tracking per user
- Fields: `id`, `user_id`, `plan_id`, `period_start`, `period_end`, `seconds_used`, `created_at`, `updated_at`

**orders**
- Transaction records with pricing details
- Fields: `id`, `user_id`, `sku_code`, `quantity`, `applied_flags`, `customer_price_cents`, `internal_cost_cents`, `margin_percent`, `total_seconds`, `overage_seconds`, `stripe_payment_intent_id`, `status`, `created_at`

---

## Key API Endpoints

### Public Endpoints

**GET /api/plans**
- Returns all active subscription plans
- No authentication required

**GET /api/vectors**
- Returns all service categories
- No authentication required

**GET /api/skus**
- Returns all active SKUs
- Optional query param: `vector_id` to filter by category

**POST /api/pricing/quote** (authenticated)
- Request body: `{ sku_code, quantity, flags }`
- Returns detailed price quote with margin calculation

**POST /api/subscribe** (authenticated)
- Request body: `{ plan_id }`
- Creates Stripe checkout session for subscription

**GET /api/account/plan** (authenticated)
- Returns user's active plan, usage stats, and billing info

### Admin Endpoints

All admin endpoints require authentication + admin email in `ADMIN_EMAILS` env variable.

**GET /api/admin/stats**
- Returns SKU performance metrics and platform totals

**PUT /api/admin/plans/:id**
- Update plan pricing and parameters
- Body: `{ name, monthly_price_usd, included_seconds, overage_rate_per_second_usd, description, active }`

**PUT /api/admin/skus/:id**
- Update SKU pricing and parameters
- Body: `{ name, base_credits, base_price_usd, default_flags, description, active }`

**PUT /api/admin/flags/:id**
- Update flag parameters
- Body: `{ label, price_multiplier, price_add_flat_usd, description, active }`

**GET /api/admin/flags**
- Returns all flags (including inactive)

---

## Pricing Rules

### Constants

```
COST_PER_CREDIT = 0.0111 USD  (from A2E pricing: $19.99 / 1800 credits)
MIN_MARGIN = 0.40 (40% minimum)
```

### Quote Calculation Flow

1. **Base Price**: `base_price_cents * quantity`
2. **Apply Flags**:
   - Multiply by all `price_multiplier` values
   - Add all `price_add_flat_cents` values
3. **Plan Quota Check** (if user has active plan):
   - `seconds_from_plan = min(total_seconds, remaining_seconds)`
   - `overage_seconds = max(0, total_seconds - remaining_seconds)`
   - `overage_cost = overage_seconds * plan.overage_rate_per_second_cents`
4. **Final Customer Price**: `base_price + overage_cost`
5. **Internal Cost**: `total_credits * COST_PER_CREDIT * 100` (in cents)
6. **Margin Check**: `(customer_price - internal_cost) / customer_price >= MIN_MARGIN`

### Flag Behavior

- **R (Rapid)**: Multiply price by 1.4 (40% premium for same-day delivery)
- **C (Custom)**: Add $99.00 flat fee for brand customization
- **B (Batch)**: Apply 0.85 multiplier for 10+ quantity, 0.75 for 50+
- **L_STD**: Standard license (no price change)
- **L_EXT**: Add $300.00 for extended commercial rights
- **L_EXCL**: Add $800.00 for exclusive rights

---

## Managing SKUs

### Creating a New SKU

1. **Choose Vector**: Determine which category (V1-V7) the SKU belongs to
2. **Set Base Pricing**:
   ```
   base_credits = estimated_seconds_to_generate
   base_price_cents = (base_credits * 0.0111 * 100) / 0.60  // 40% margin
   ```
3. **Set Default Flags**: Usually `["L_STD"]` for most SKUs
4. **Insert via SQL**:
   ```sql
   INSERT INTO skus (id, code, name, vector_id, base_credits, base_price_cents, default_flags, description, created_at)
   VALUES ('sku_x1_new', 'X1-NEW', 'New Service', 'v1', 120, 2220, '["L_STD"]', 'Description here', datetime('now'));
   ```

### Updating SKU Pricing

**Via Admin API** (recommended):
```bash
curl -X PUT https://your-domain.com/api/admin/skus/sku_a1_ig \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "base_price_usd": "5.99",
    "base_credits": 70
  }'
```

**Via SQL** (direct):
```sql
UPDATE skus
SET base_price_cents = 599, base_credits = 70
WHERE code = 'A1-IG';
```

### Verifying Margins

After updating pricing:
1. Check `/api/admin/stats` to see average margins
2. Test quote: `POST /api/pricing/quote` with the SKU code
3. Verify `margin_percent >= 40` in response

### Deactivating a SKU

```sql
UPDATE skus SET active = 0 WHERE code = 'OBSOLETE-SKU';
```

---

## Managing Plans

### Updating Plan Pricing

**Example: Increase Pro plan price**
```bash
curl -X PUT https://your-domain.com/api/admin/plans/plan_pro \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "monthly_price_usd": "89.99",
    "included_seconds": 3500,
    "overage_rate_per_second_usd": "0.14"
  }'
```

### Creating a New Plan

```sql
INSERT INTO plans (id, code, name, monthly_price_cents, included_seconds, overage_rate_per_second_cents, description, created_at)
VALUES ('plan_enterprise', 'ENTERPRISE', 'Enterprise', 49900, 50000, 8, 'Enterprise plan for large teams', datetime('now'));
```

### Best Practices

- **Included Seconds**: Set based on typical usage patterns (e.g., 600s = ~10 short videos)
- **Overage Rate**: Should be lower than ad-hoc SKU pricing to incentivize plans
- **Price Tiers**: Maintain 3-4x gap between tiers (Starter $19.99, Pro $79.99, Agency $199.00)

---

## Managing Flags

### Updating Flag Parameters

**Example: Increase Rapid delivery premium**
```bash
curl -X PUT https://your-domain.com/api/admin/flags/flag_r \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "price_multiplier": 1.5
  }'
```

### Adding a New Flag

```sql
INSERT INTO flags (id, code, label, price_multiplier, price_add_flat_cents, description, created_at)
VALUES ('flag_rush', 'RUSH', 'Rush (4-hour)', 2.0, 0, '4-hour rush delivery', datetime('now'));
```

### Flag Interaction Rules

- Multiple multipliers compound: `1.4 * 1.5 = 2.1x`
- Flat additions are summed: `$99 + $300 = $399`
- Batch flag (`B`) is automatically applied based on quantity in code logic

---

## Monitoring Usage & Margins

### Admin Stats Dashboard

Access: `GET /api/admin/stats`

Returns:
```json
{
  "sku_stats": [
    {
      "code": "A1-IG",
      "name": "Instagram Image 1080p",
      "order_count": 145,
      "avg_customer_price_usd": "4.99",
      "avg_internal_cost_usd": "0.67",
      "avg_margin_percent": "86.6"
    }
  ],
  "totals": {
    "orders": 523,
    "revenue_usd": "12450.87",
    "users": 89,
    "active_subscriptions": 23
  }
}
```

### Key Metrics to Monitor

1. **Margin by SKU**: Ensure all SKUs maintain >= 70% margin
2. **Overage Revenue**: Track how much comes from plan overages
3. **Conversion Rate**: Active subscriptions / total users
4. **Avg Order Value**: Total revenue / total orders

### SQL Queries for Analysis

**Top 10 SKUs by Revenue:**
```sql
SELECT sku_code, COUNT(*) as orders, SUM(customer_price_cents) / 100.0 as revenue_usd
FROM orders
WHERE status != 'failed'
GROUP BY sku_code
ORDER BY revenue_usd DESC
LIMIT 10;
```

**Plan Usage Statistics:**
```sql
SELECT p.name, COUNT(up.id) as subscribers, AVG(pu.seconds_used) as avg_usage
FROM plans p
LEFT JOIN user_plans up ON p.id = up.plan_id AND up.status = 'active'
LEFT JOIN plan_usage pu ON up.user_id = pu.user_id AND up.plan_id = pu.plan_id
GROUP BY p.name;
```

**Users Close to Quota:**
```sql
SELECT u.email, p.name, pu.seconds_used, pl.included_seconds,
       (pu.seconds_used * 100.0 / pl.included_seconds) as usage_percent
FROM user_plans up
JOIN users u ON up.user_id = u.id
JOIN plans pl ON up.plan_id = pl.id
JOIN plan_usage pu ON up.user_id = pu.user_id AND up.plan_id = pu.plan_id
WHERE up.status = 'active'
  AND (pu.seconds_used * 100.0 / pl.included_seconds) > 80
ORDER BY usage_percent DESC;
```

---

## Common Operations

### Scenario: Launch a Holiday Sale

**Goal**: 20% off all SKUs for 1 week

**Approach 1: Temporary Flag**
```sql
-- Create sale flag
INSERT INTO flags (id, code, label, price_multiplier, price_add_flat_cents, description, created_at)
VALUES ('flag_holiday', 'HOLIDAY', 'Holiday Sale', 0.80, 0, '20% off sale', datetime('now'));

-- Apply to all SKUs
UPDATE skus SET default_flags = json_insert(default_flags, '$[#]', 'HOLIDAY');

-- After sale ends:
UPDATE skus SET default_flags = json_remove(
  default_flags,
  (SELECT key FROM json_each(default_flags) WHERE value = 'HOLIDAY')
);
DELETE FROM flags WHERE code = 'HOLIDAY';
```

**Approach 2: Direct Price Reduction** (cleaner rollback)
```sql
-- Backup original prices
CREATE TEMP TABLE sku_backup AS SELECT id, base_price_cents FROM skus;

-- Apply 20% discount
UPDATE skus SET base_price_cents = ROUND(base_price_cents * 0.80);

-- Rollback after sale
UPDATE skus
SET base_price_cents = (SELECT base_price_cents FROM sku_backup WHERE sku_backup.id = skus.id);
```

### Scenario: Sunset an Old SKU

1. **Mark as inactive** (prevents new orders):
   ```sql
   UPDATE skus SET active = 0 WHERE code = 'OLD-SKU';
   ```

2. **Monitor active jobs**:
   ```sql
   SELECT COUNT(*) FROM jobs WHERE type = 'old_sku_type' AND status = 'processing';
   ```

3. **Archive after 30 days** (optional):
   ```sql
   DELETE FROM skus WHERE code = 'OLD-SKU' AND active = 0;
   ```

### Scenario: Grant Free Trial Credits

```sql
-- Give user 500 credits
INSERT INTO user_credits (user_id, balance)
VALUES (123, 500)
ON CONFLICT(user_id) DO UPDATE SET balance = balance + 500;

-- Log as purchase for tracking
INSERT INTO purchases (user_id, pack_type, points, amount_cents, created_at)
VALUES (123, 'trial', 500, 0, datetime('now'));
```

### Scenario: Refund an Order

```sql
BEGIN TRANSACTION;

-- Mark order as refunded
UPDATE orders SET status = 'refunded' WHERE id = 456;

-- Refund usage to plan quota (if applicable)
UPDATE plan_usage
SET seconds_used = seconds_used - (SELECT total_seconds FROM orders WHERE id = 456)
WHERE user_id = (SELECT user_id FROM orders WHERE id = 456)
  AND period_start <= (SELECT created_at FROM orders WHERE id = 456)
  AND period_end >= (SELECT created_at FROM orders WHERE id = 456);

COMMIT;

-- Process Stripe refund separately via dashboard or API
```

### Scenario: Analyze A2E Cost Accuracy

Compare actual A2E costs vs. estimated `internal_cost`:

```sql
SELECT
  o.sku_code,
  o.internal_cost_cents / 100.0 as estimated_cost_usd,
  j.cost_credits * 0.0111 as actual_cost_usd,
  ((j.cost_credits * 0.0111) - (o.internal_cost_cents / 100.0)) as variance_usd
FROM orders o
JOIN jobs j ON j.order_id = o.id
WHERE o.status = 'completed'
  AND j.cost_credits > 0
ORDER BY ABS(variance_usd) DESC
LIMIT 20;
```

If variance is high, adjust `base_credits` for affected SKUs.

---

## Environment Variables

Ensure these are set in your `.env` file:

```env
# Pricing
COST_PER_CREDIT=0.0111
MIN_MARGIN=0.40

# Admin Access
ADMIN_EMAILS=admin@example.com,operator@example.com

# A2E API
A2E_API_KEY=your_a2e_api_key
A2E_BASE_URL=https://api.a2e.ai/api/v1

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
FRONTEND_URL=https://yourapp.com
SESSION_SECRET=your_jwt_secret
```

---

## Safety Checklist

Before making pricing changes:

- [ ] Test quote API with new values
- [ ] Verify margin >= 40% for all affected SKUs
- [ ] Backup database: `sqlite3 production.db .backup backup.db`
- [ ] Update in staging environment first
- [ ] Monitor `/api/admin/stats` for 24 hours after change
- [ ] Communicate changes to customer support team

---

## Support & Troubleshooting

### Issue: "Margin too low" error

**Cause**: SKU pricing doesn't meet 40% minimum margin

**Fix**:
```sql
-- Calculate safe price
SELECT
  code,
  base_credits,
  base_price_cents / 100.0 as current_price,
  ROUND(base_credits * 0.0111 / 0.60, 2) as recommended_price
FROM skus
WHERE (base_price_cents - (base_credits * 0.0111 * 100)) / base_price_cents < 0.40;

-- Update to recommended price
UPDATE skus
SET base_price_cents = ROUND(base_credits * 0.0111 * 100 / 0.60)
WHERE code = 'PROBLEM-SKU';
```

### Issue: Subscription not activating after payment

**Check Stripe webhook**:
```sql
-- Verify webhook received
SELECT * FROM user_plans WHERE stripe_subscription_id = 'sub_xxx';
```

If empty, manually create:
```sql
INSERT INTO user_plans (user_id, plan_id, start_date, end_date, stripe_subscription_id, status, created_at)
VALUES (123, 'plan_pro', datetime('now'), datetime('now', '+1 month'), 'sub_xxx', 'active', datetime('now'));
```

### Issue: Usage not updating

**Check plan_usage table**:
```sql
SELECT * FROM plan_usage WHERE user_id = 123;
```

If missing, PricingEngine will auto-create on next quote. Or manually:
```sql
INSERT INTO plan_usage (user_id, plan_id, period_start, period_end, seconds_used, created_at, updated_at)
VALUES (
  123,
  'plan_pro',
  date('now', 'start of month'),
  date('now', 'start of month', '+1 month', '-1 second'),
  0,
  datetime('now'),
  datetime('now')
);
```

---

## Testing

Run unit tests:
```bash
npm test tests/pricing.test.js
```

Test pricing API manually:
```bash
# Get quote (requires user auth token)
curl -X POST https://your-domain.com/api/pricing/quote \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sku_code": "A1-IG", "quantity": 1, "flags": []}'
```

---

## Deployment Notes

When deploying pricing changes:

1. **Database migrations are automatic** on server restart (see index.js lines 168-188)
2. **New SKUs/Plans/Flags** take effect immediately
3. **Price changes** apply to new orders only (past orders unchanged)
4. **Plan updates** apply to new subscriptions; existing subscriptions use old pricing until renewal

---

## Contact

For questions or issues:
- Technical: Review `services/pricing.js` and `index.js` lines 565-949
- Business: Consult with product/finance team before major pricing changes

---

**Last Updated**: 2026-01-05
**Platform Version**: 0.1.1
