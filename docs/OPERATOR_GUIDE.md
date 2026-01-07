# Operator Guide - Pricing System

## Overview

This guide explains how to operate and maintain the FaceShot-ChopShop pricing system. The system includes subscription plans, SKUs (Stock Keeping Units), usage tracking, and dynamic pricing with batch discounts.

## System Architecture

### Core Components

1. **Database Tables**
   - `plans` - Subscription plans with included seconds and overage rates
   - `vectors` - Service categories (Image, Video, Voice, etc.)
   - `skus` - Individual services/products
   - `flags` - Price modifiers (Rush, Custom, Licenses)
   - `user_plans` - User subscription records
   - `plan_usage` - Monthly usage tracking
   - `orders` - Order history with pricing details

2. **PricingEngine Service** (`services/pricing.js`)
   - Calculates dynamic quotes based on user plan, SKU, quantity, and flags
   - Enforces minimum margins (40% by default)
   - Applies batch discounts (15% for 10+, 25% for 50+)
   - Tracks usage and calculates overages

3. **API Endpoints**
   - `GET /api/plans` - List active plans
   - `GET /api/skus` - List SKUs (filterable by vector)
   - `POST /api/pricing/quote` - Get real-time pricing quote
   - `POST /api/subscribe` - Create subscription checkout
   - `GET /api/account/plan` - Get user's plan and usage
   - Admin endpoints for CRUD operations

## Configuration

### Environment Variables

```bash
# Pricing Constants
COST_PER_CREDIT=0.0111  # A2E upstream cost per credit
MIN_MARGIN=0.40          # Minimum margin (40%)

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Admin Access
ADMIN_EMAILS=admin@example.com,operator@example.com
```

### Cost Model

- **Upstream Cost**: $19.99 for 1,800 credits = $0.0111/credit
- **Internal Conversion**: 1 second of generation ≈ 1 credit
- **Minimum Margin**: 40% (configurable via `MIN_MARGIN`)

## Managing Plans

### View Current Plans

Plans are defined in the database. To view:

```sql
SELECT * FROM plans WHERE active = 1;
```

### Create a New Plan

```sql
INSERT INTO plans (
  id, code, name, 
  monthly_price_cents, 
  included_seconds, 
  overage_rate_per_second_cents, 
  description, 
  active, 
  created_at
) VALUES (
  'plan_custom',
  'CUSTOM',
  'Custom Plan',
  29900,  -- $299.00
  20000,  -- ~333 minutes
  8,      -- $0.08/second overage
  'Custom enterprise plan',
  1,
  datetime('now')
);
```

### Update Plan Pricing

Use the admin API:

```bash
curl -X PUT http://localhost:3000/api/admin/plans/plan_pro \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "monthly_price_usd": "89.99",
    "included_seconds": 3500,
    "overage_rate_per_second_usd": "0.12"
  }'
```

**Important**: Plan changes only affect new subscriptions. Existing subscriptions maintain their original pricing until renewal.

## Managing SKUs

### Create a New SKU

```sql
INSERT INTO skus (
  id, code, name, vector_id,
  base_credits, base_price_cents,
  default_flags, description,
  active, created_at
) VALUES (
  'sku_new_product',
  'NEW-PROD',
  'New Product Name',
  'v1',
  120,       -- 120 credits (~2 minutes)
  1999,      -- $19.99
  '["L_STD"]',
  'Description of new product',
  1,
  datetime('now')
);
```

### Update SKU Pricing

Use the admin API:

```bash
curl -X PUT http://localhost:3000/api/admin/skus/sku_a1_ig \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "base_price_usd": "5.99",
    "base_credits": 70
  }'
```

### Pricing Best Practices

1. **Always Check Margins**
   - Use the quote endpoint to verify margins before setting prices
   - Ensure margin > 40% (or your configured MIN_MARGIN)
   - Formula: `margin = (customer_price - internal_cost) / customer_price`

2. **Internal Cost Calculation**
   ```
   internal_cost = base_credits * 0.0111 (COST_PER_CREDIT)
   ```

3. **Recommended Markup**
   - Standard SKUs: 500-800% markup (70-80% margin)
   - Premium SKUs: 800-1500% markup (80-90% margin)
   - Bundles: 400-600% markup (60-75% margin)

## Managing Flags

### Available Flags

| Code | Name | Type | Value |
|------|------|------|-------|
| R | Rapid (same-day) | Multiplier | 1.4x |
| C | Custom (brand style) | Flat Fee | +$99.00 |
| B | Batch | Multiplier | 0.85x (10+), 0.75x (50+) |
| L_STD | Standard License | None | No change |
| L_EXT | Extended License | Flat Fee | +$300.00 |
| L_EXCL | Exclusive License | Flat Fee | +$800.00 |

### Update Flag Pricing

```bash
curl -X PUT http://localhost:3000/api/admin/flags/flag_r \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "price_multiplier": 1.5,
    "description": "Same-day rush processing"
  }'
```

### Batch Discount Logic

Batch discounts are automatically applied by quantity:
- **Quantity 10-49**: 15% discount (0.85x multiplier)
- **Quantity 50+**: 25% discount (0.75x multiplier)

This is hardcoded in `services/pricing.js` and applied to all orders.

## Monitoring and Reports

### View Usage Statistics

```bash
curl http://localhost:3000/api/admin/stats \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Returns:
- SKU order counts and average pricing
- Total orders, revenue, users
- Active subscriptions

### Query Order History

```sql
SELECT 
  o.id,
  u.email,
  o.sku_code,
  o.quantity,
  o.customer_price_cents / 100.0 as price_usd,
  o.internal_cost_cents / 100.0 as cost_usd,
  o.margin_percent,
  o.status,
  o.created_at
FROM orders o
JOIN users u ON o.user_id = u.id
ORDER BY o.created_at DESC
LIMIT 100;
```

### Monitor Margins

Check if any orders have low margins:

```sql
SELECT 
  sku_code,
  AVG(margin_percent) as avg_margin,
  COUNT(*) as order_count
FROM orders
WHERE status = 'completed'
GROUP BY sku_code
HAVING avg_margin < 50
ORDER BY avg_margin ASC;
```

## Usage Tracking

### How Usage Works

1. User subscribes to a plan (e.g., Pro: 3,000 seconds/month)
2. Each order deducts from their monthly quota
3. If quota exceeded, overage charges apply
4. Usage resets monthly (on subscription anniversary)

### Manual Usage Adjustment

If you need to adjust a user's usage (e.g., for refunds):

```sql
UPDATE plan_usage
SET seconds_used = seconds_used - 300  -- Refund 5 minutes
WHERE user_id = 123 
  AND period_start = '2026-01-01T00:00:00.000Z';
```

### Reset Usage for New Period

Usage is automatically reset when a new period starts. The system creates new `plan_usage` records on-demand.

## Pricing Quote Examples

### Basic Quote (No Plan)

```bash
curl -X POST http://localhost:3000/api/pricing/quote \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sku_code": "A1-IG",
    "quantity": 1,
    "flags": []
  }'
```

Response shows full price (no plan discount).

### Quote with Plan

Same request from user with active plan:
- Shows seconds from plan included
- Shows overage if usage exceeds plan
- Calculates total including overage charges

### Batch Quote

```bash
curl -X POST http://localhost:3000/api/pricing/quote \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sku_code": "A1-IG",
    "quantity": 50,
    "flags": []
  }'
```

Automatically receives 25% batch discount.

## Troubleshooting

### Quote Returns "margin_too_low"

**Problem**: SKU pricing doesn't meet minimum margin requirement.

**Solution**:
1. Calculate required price:
   ```
   min_price = internal_cost / (1 - MIN_MARGIN)
   ```
2. Update SKU with higher base_price_cents
3. Or adjust COST_PER_CREDIT or MIN_MARGIN in environment

### User Reports Incorrect Overage Charges

**Check**:
1. Verify user's plan: `SELECT * FROM user_plans WHERE user_id = X AND status = 'active'`
2. Check usage: `SELECT * FROM plan_usage WHERE user_id = X AND period_start >= '...'`
3. Verify order total_seconds matches expected

### Subscription Not Created After Payment

**Check**:
1. Stripe webhook logs: `docker logs faceshot-backend | grep webhook`
2. Verify webhook signature in environment
3. Check for errors in orders/user_plans tables

## Safety Limits

### Maximum Order Size

Orders are limited to prevent abuse:
- Maximum quantity: 100 units
- Maximum job seconds: 5,000 (not currently enforced at API level)

To add enforcement:

```javascript
// In /api/pricing/quote endpoint
if (quote.total_seconds > 5000) {
  return res.status(400).json({ 
    error: 'order_too_large',
    message: 'Maximum order size is 5,000 seconds. Please split into multiple orders.'
  });
}
```

### Usage Cap Warnings

Consider implementing warnings when users approach 2x their plan limit to prevent surprise charges.

## Database Maintenance

### Archive Old Usage Records

Keep plan_usage table clean by archiving old periods:

```sql
-- Archive usage older than 12 months
CREATE TABLE plan_usage_archive AS
SELECT * FROM plan_usage
WHERE period_end < date('now', '-12 months');

DELETE FROM plan_usage
WHERE period_end < date('now', '-12 months');
```

### Optimize Queries

Ensure indexes exist:

```sql
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_plan_usage_period ON plan_usage(user_id, period_start, period_end);
```

## API Access for Operators

### Get Admin Token

1. Login as admin user
2. Token is returned in login response
3. Store securely for API operations

### Admin Endpoints

- `GET /api/admin/stats` - System statistics
- `PUT /api/admin/plans/:id` - Update plan
- `PUT /api/admin/skus/:id` - Update SKU
- `PUT /api/admin/flags/:id` - Update flag
- `GET /api/admin/flags` - List all flags

All require authentication with admin email in ADMIN_EMAILS environment variable.

## Support Scenarios

### Scenario 1: Customer Wants Custom Pricing

1. Create custom plan or SKU in database
2. Manually subscribe user or send them custom checkout link
3. Document in support ticket for reference

### Scenario 2: Refund/Credit Adjustment

1. Identify affected orders
2. Adjust plan_usage to restore quota
3. Issue Stripe refund if payment involved
4. Document in support notes

### Scenario 3: Bulk Discount Request

1. Check if existing batch discount (10+, 50+) applies
2. If custom discount needed, create special SKU with lower price
3. Or apply coupon code via Stripe

## Best Practices

1. **Test Pricing Changes in Staging First**
   - Always test new SKUs/plans with quote API
   - Verify margins meet minimum requirements
   - Check calculations with various quantities

2. **Monitor Margins Regularly**
   - Weekly review of average margins per SKU
   - Adjust pricing if margins drop below target
   - Watch for upstream cost changes from A2E

3. **Communicate Price Changes**
   - Give users advance notice (30+ days)
   - Grandfather existing subscriptions when appropriate
   - Document all changes in changelog

4. **Audit Trail**
   - All price changes are logged via admin API
   - Keep records of who made changes and when
   - Review logs monthly for anomalies

## Getting Help

For system issues:
1. Check logs: `docker logs faceshot-backend`
2. Review database state
3. Test endpoints with curl/Postman
4. Contact development team if needed

For business/pricing questions:
- Review this guide
- Check historical data in admin stats
- Consult finance team for margin targets
