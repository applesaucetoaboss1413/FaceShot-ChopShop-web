# FaceShot ChopShop - Operator Guide

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Pricing Model](#pricing-model)
4. [Managing SKUs](#managing-skus)
5. [Managing Plans](#managing-plans)
6. [Managing Flags](#managing-flags)
7. [Monitoring & Analytics](#monitoring--analytics)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Overview

FaceShot ChopShop is a reseller platform for A2E.ai services with a sophisticated pricing engine that ensures healthy margins while offering competitive prices to customers.

### Key Components
- **Plans**: Subscription tiers with included processing seconds
- **SKUs**: Individual service offerings (images, videos, voice, content)
- **Flags**: Pricing modifiers (rapid delivery, custom branding, licenses)
- **Vectors**: Service categories (V1-V7)

---

## System Architecture

### Database Schema

#### Core Tables
```
plans           → Subscription tiers
vectors         → Service categories (V1-V7)
skus            → Product offerings
flags           → Pricing modifiers
user_plans      → User subscription records
plan_usage      → Monthly usage tracking
orders          → Order history with pricing
jobs            → A2E.ai processing jobs
```

### Pricing Flow
```
1. User selects SKU + quantity + flags
2. PricingEngine calculates quote
3. Margin validation (≥40% minimum)
4. Order created with locked pricing
5. Usage deducted from plan if applicable
6. A2E.ai job initiated
7. Status polling until completion
```

---

## Pricing Model

### Cost Baseline
- **A2E.ai Rate**: $19.99 → 1,800 credits
- **Cost Per Credit (CPC)**: ~$0.0111
- **1 credit ≈ 1 second** of processing time

### Margin Protection
- **Minimum Margin**: 40% (configurable via `MIN_MARGIN` env var)
- **Target Margin**: 70-80% for most SKUs
- The pricing engine automatically rejects quotes below minimum margin

### Price Calculation Formula

```javascript
// Base calculation
base_price = sku.base_price_cents * quantity

// Apply multipliers (R flag, batch discounts)
price = base_price * totalMultiplier

// Add flat additions (C flag, licenses)
price = price + totalFlatAdd

// Add overage charges if user has plan
if (user_has_plan && total_seconds > remaining_seconds) {
  overage_cost = overage_seconds * plan.overage_rate_per_second_cents
  final_price = price + overage_cost
}

// Margin check
internal_cost = total_credits * COST_PER_CREDIT
margin = (final_price - internal_cost) / final_price
if (margin < MIN_MARGIN) → REJECT
```

---

## Managing SKUs

### Creating a New SKU

1. **Determine Base Credits**
   - Estimate processing time in seconds
   - Example: 30s video = 30 base_credits

2. **Calculate Base Price**
   ```
   Internal Cost = base_credits × $0.0111
   Target Margin = 70%
   Base Price = Internal Cost / (1 - 0.70)
   
   Example: 30 credits
   Internal Cost = 30 × $0.0111 = $0.333
   Base Price = $0.333 / 0.30 = $1.11
   Round to: $1.49 (133% markup, 70% margin)
   ```

3. **API Call**
   ```bash
   # SKUs are seeded on startup via index.js
   # To add manually, insert into database:
   
   INSERT INTO skus (
     id, code, name, vector_id, base_credits, 
     base_price_cents, default_flags, description, 
     active, created_at
   ) VALUES (
     'sku_new_id',
     'X1-CODE',
     'Service Name',
     'v1',
     100,
     1499,
     '["L_STD"]',
     'Service description',
     1,
     datetime('now')
   );
   ```

### Updating Existing SKUs

**Via Admin Panel:**
1. Navigate to `/admin` (requires admin email in `ADMIN_EMAILS` env var)
2. Click "SKUs" tab
3. Find SKU and click Edit icon
4. Modify fields:
   - Name
   - Base Price (in USD, converts to cents)
   - Base Credits
   - Description
5. Click Save

**Via API:**
```bash
curl -X PUT https://your-domain.com/api/admin/skus/sku_id \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "base_price_usd": "14.99",
    "base_credits": 140,
    "description": "Updated description"
  }'
```

### SKU Pricing Examples

| SKU | Service | Credits | Cost | Price | Margin |
|-----|---------|---------|------|-------|--------|
| A1-IG | Instagram Image 1080p | 60 | $0.67 | $4.99 | 87% |
| C2-30 | 30s Video | 180 | $2.00 | $59.00 | 97% |
| D2-CLONE | Voice Clone | 200 | $2.22 | $39.00 | 94% |
| F1-STARTER | 10 SEO Articles | 1000 | $11.10 | $49.00 | 77% |

---

## Managing Plans

### Plan Structure

**Current Plans:**
```
Starter: $19.99/mo → 600 seconds, $0.20/sec overage
Pro:     $79.99/mo → 3,000 seconds, $0.15/sec overage  
Agency:  $199.00/mo → 10,000 seconds, $0.10/sec overage
```

### Modifying Plans

**Via Admin Panel:**
1. Go to `/admin` → Plans tab
2. Click Edit on desired plan
3. Adjust:
   - Monthly Price (USD)
   - Included Seconds
   - Overage Rate (USD per second)
   - Description
4. Save changes

**Important Notes:**
- Changes apply to NEW subscriptions only
- Existing subscribers keep their original pricing until renewal
- Test pricing changes in staging environment first

### Plan Quota Management

**Monthly Reset:**
```javascript
// Automatic reset handled by PricingEngine.getCurrentPeriodUsage()
// Creates new usage record each calendar month
```

**Usage Deduction:**
```javascript
// Happens after order is placed and A2E job initiated
pricingEngine.deductUsage(userId, planId, totalSeconds)
```

---

## Managing Flags

### Flag Types

#### 1. Rapid (R)
- **Purpose**: Same-day delivery
- **Multiplier**: 1.4× (40% premium)
- **Use Case**: Urgent orders

#### 2. Custom (C)
- **Purpose**: Brand styling, custom avatars, voice clones
- **Flat Add**: $99.00
- **Use Case**: Personalization services

#### 3. Batch (B)
- **Purpose**: Volume discounts
- **Auto-applied**: 
  - 10-49 units: 0.85× (15% discount)
  - 50+ units: 0.75× (25% discount)
- **Use Case**: Bulk orders

#### 4. Licenses
- **L_STD**: Standard (default, no change)
- **L_EXT**: Extended → +$300.00
- **L_EXCL**: Exclusive → +$800.00

### Updating Flags

**Via Admin Panel:**
1. Navigate to Flags tab
2. Edit multiplier or flat addition
3. Changes apply immediately to new quotes

**Examples:**
```javascript
// Increase rapid premium to 50%
price_multiplier: 1.5

// Reduce extended license cost
price_add_flat_cents: 25000  // $250
```

---

## Monitoring & Analytics

### Admin Dashboard Statistics

**Access:** `/admin` → Statistics tab

**Metrics Available:**
- Total Revenue (USD)
- Total Orders
- Total Users
- Active Subscriptions
- Per-SKU Performance:
  - Order count
  - Average customer price
  - Average internal cost
  - Average margin

### Key Performance Indicators (KPIs)

**Healthy Metrics:**
```
Overall Margin: >70%
Order Volume: Growing week-over-week
Active Subscriptions: >15% of total users
Average Order Value: $50+
```

**Warning Signs:**
```
Margin <50%: Review pricing
High Overage Rates: Users on wrong plan
Low Subscription Rate: Plans not competitive
```

### Database Queries for Analysis

**Top Performing SKUs:**
```sql
SELECT 
  sku_code,
  COUNT(*) as orders,
  AVG(margin_percent) as avg_margin,
  SUM(customer_price_cents) as total_revenue
FROM orders
WHERE status != 'failed'
GROUP BY sku_code
ORDER BY total_revenue DESC;
```

**Subscription Health:**
```sql
SELECT 
  p.name,
  COUNT(up.id) as subscribers,
  AVG(pu.seconds_used) as avg_usage,
  AVG(p.included_seconds - pu.seconds_used) as avg_remaining
FROM user_plans up
JOIN plans p ON up.plan_id = p.id
LEFT JOIN plan_usage pu ON pu.user_id = up.user_id AND pu.plan_id = up.plan_id
WHERE up.status = 'active'
GROUP BY p.name;
```

---

## Best Practices

### Pricing Strategy

1. **Always Verify Margins**
   - Test new SKUs with quote endpoint before launch
   - Use admin stats to monitor actual margins
   - Adjust if margins drift below 60%

2. **Competitive Positioning**
   - Research competitor pricing
   - Bundle services for higher perceived value
   - Use flags to create pricing tiers

3. **Plan Design**
   - Ensure middle tier (Pro) is most attractive
   - Price points should show clear value progression
   - Keep overage rates reasonable (users should upgrade, not pay overages)

### Operational Guidelines

1. **Weekly Reviews**
   - Check SKU performance in admin dashboard
   - Review unusual orders or margin drops
   - Monitor A2E.ai credit balance

2. **Monthly Tasks**
   - Verify plan usage patterns
   - Adjust pricing based on A2E.ai rate changes
   - Review and respond to support tickets

3. **Quarterly Planning**
   - Introduce new SKUs based on demand
   - Sunset low-performing offerings
   - Adjust plan tiers if needed

### Safety Guardrails

**In Code:**
```javascript
// Maximum job size (prevent abuse)
const MAX_JOB_SECONDS = 5000;

// Minimum margin enforcement
if (margin < MIN_MARGIN) {
  throw new Error('margin_too_low');
}

// Plan overage warnings
if (overageSeconds > 300) {
  // Alert user before processing
}
```

---

## Troubleshooting

### Common Issues

#### 1. "Margin Too Low" Error

**Symptoms:** Quote endpoint returns `margin_too_low` error

**Causes:**
- SKU base_price_cents too low
- Too many discount flags applied
- Batch multiplier too aggressive

**Solution:**
```javascript
// Check current margin calculation
const internalCost = sku.base_credits * 0.0111 * 100; // cents
const currentMargin = (sku.base_price_cents - internalCost) / sku.base_price_cents;

// Increase base price to achieve 60% margin
const newPrice = internalCost / (1 - 0.60);
```

#### 2. Plan Usage Not Deducting

**Symptoms:** Plan seconds remain unchanged after orders

**Causes:**
- Order status not reaching 'processing'
- Plan usage record not created
- Wrong period dates

**Solution:**
```sql
-- Check plan usage records
SELECT * FROM plan_usage 
WHERE user_id = ? 
ORDER BY period_start DESC LIMIT 5;

-- Manually create if missing
INSERT INTO plan_usage (
  user_id, plan_id, period_start, period_end, 
  seconds_used, created_at, updated_at
) VALUES (?, ?, ?, ?, 0, datetime('now'), datetime('now'));
```

#### 3. Orders Stuck in "Pending"

**Symptoms:** Orders created but never processed

**Causes:**
- A2E.ai API errors
- Missing polling job
- Network timeouts

**Solution:**
```javascript
// Check job status in database
SELECT * FROM jobs WHERE order_id = ?;

// Restart polling if stopped
startStatusPolling(jobId, type, a2eTaskId);

// Check A2E.ai logs
// Look for API errors in winston logs
```

#### 4. Subscription Checkout Fails

**Symptoms:** Stripe session not created

**Causes:**
- Invalid plan_id
- Stripe API key missing/invalid
- User already has active plan

**Solution:**
```sql
-- Check for existing active plans
SELECT * FROM user_plans 
WHERE user_id = ? 
AND status = 'active'
AND end_date > datetime('now');

-- Verify plan exists and is active
SELECT * FROM plans WHERE id = ? AND active = 1;
```

### Logs and Debugging

**Enable Debug Logging:**
```bash
# Set in environment
LOG_LEVEL=debug

# Check logs for pricing calculations
grep "pricing_engine" logs.txt

# Monitor A2E.ai API calls
grep "a2e_" logs.txt
```

**Common Log Messages:**
```
✓ order_created - Order successfully created
✓ job_completed - A2E processing finished
⚠️ margin_too_low - Pricing below minimum
⚠️ plan_usage_exceeded - User over quota
✗ a2e_api_error - A2E.ai service issue
```

---

## Environment Variables

### Required Configuration

```bash
# Database
DB_PATH=production.db

# Authentication
SESSION_SECRET=your-secure-secret-key

# Stripe (for subscriptions)
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# A2E.ai Integration
A2E_API_KEY=your-a2e-api-key
A2E_BASE_URL=https://video.a2e.ai

# Pricing Configuration
COST_PER_CREDIT=0.0111
MIN_MARGIN=0.40

# Admin Access
ADMIN_EMAILS=admin@example.com,operator@example.com

# Frontend
FRONTEND_URL=https://your-domain.com
```

---

## Support & Escalation

### When to Escalate

1. **Margin Falls Below 30%** - Immediate pricing review needed
2. **A2E.ai API Down** - Contact A2E.ai support
3. **Mass Subscription Failures** - Check Stripe status
4. **Database Corruption** - Restore from backup

### Emergency Contacts

- **A2E.ai Support**: support@a2e.ai
- **Stripe Support**: https://support.stripe.com
- **Internal DevOps**: [Your team contact]

---

## Appendix

### Complete SKU List

| Code | Name | Vector | Credits | Price |
|------|------|--------|---------|-------|
| A1-IG | Instagram Image 1080p | V1 | 60 | $4.99 |
| A2-BH | Blog Hero 2K | V1 | 90 | $9.99 |
| A3-4K | 4K Print-Ready | V1 | 140 | $14.99 |
| A4-BR | Brand-Styled Image | V1 | 180 | $24.99 |
| B1-30SOC | 30 Social Creatives | V7 | 1800 | $79.00 |
| B2-90SOC | 90 Creatives + Captions | V7 | 5400 | $199.00 |
| C1-15 | 15s Promo/Reel | V3 | 90 | $29.00 |
| C2-30 | 30s Ad/UGC Clip | V3 | 180 | $59.00 |
| C3-60 | 60s Explainer/YouTube | V3 | 360 | $119.00 |
| D1-VO30 | 30s Voiceover | V5 | 30 | $15.00 |
| D2-CLONE | Standard Voice Clone | V4 | 200 | $39.00 |
| D3-CLPRO | Advanced Voice Clone | V4 | 600 | $99.00 |
| D4-5PK | 5×30s Voice Spots | V5 | 150 | $59.00 |
| F1-STARTER | 10 SEO Articles + Images | V6 | 1000 | $49.00 |
| F2-AUTH | 40 SEO Articles + Linking | V6 | 4000 | $149.00 |
| F3-DOMINATOR | 150 Articles + Strategy | V6 | 15000 | $399.00 |
| E1-ECOM25 | E-commerce Pack (25 SKUs) | V7 | 4500 | $225.00 |
| E2-LAUNCHKIT | Brand Launch Kit | V7 | 3000 | $449.00 |
| E3-AGENCY100 | Agency Asset Bank | V7 | 10000 | $599.00 |

### API Endpoints Reference

**Public Endpoints:**
```
GET  /api/plans              - List subscription plans
GET  /api/skus               - List SKUs (filter by vector_id)
GET  /api/flags              - List pricing flags
GET  /api/vectors            - List service categories
POST /api/auth/signup        - User registration
POST /api/auth/login         - User login
GET  /api/auth/me            - Current user info
```

**Authenticated Endpoints:**
```
POST /api/pricing/quote      - Get pricing quote
POST /api/orders/create      - Create order
GET  /api/orders             - List user orders
GET  /api/orders/:id         - Get order details
POST /api/subscribe          - Create subscription checkout
GET  /api/account/plan       - User's plan & usage
GET  /api/web/credits        - Credit balance
POST /api/web/process        - Process A2E.ai job
```

**Admin Endpoints:**
```
GET  /api/admin/stats        - Platform statistics
PUT  /api/admin/plans/:id    - Update plan
PUT  /api/admin/skus/:id     - Update SKU
PUT  /api/admin/flags/:id    - Update flag
GET  /api/admin/flags        - All flags (including inactive)
```

---

## Changelog

**v1.0.0** - Initial comprehensive pricing system
- 21 SKUs across 7 service vectors
- 3-tier subscription plans
- 6 pricing flags
- Margin-protected quote engine
- Admin management panel

---

*For technical implementation details, see [`services/pricing.js`](../services/pricing.js) and [`index.js`](../index.js).*
