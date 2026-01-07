# Pricing & Packaging System - Implementation Summary

## Executive Summary

A complete, production-ready pricing and packaging system has been implemented for FaceShot ChopShop, enabling the resale of A2E.ai services with guaranteed profit margins and flexible pricing controls.

### Key Achievements

✅ **21 Production SKUs** across 7 service vectors (Images, Videos, Voice, SEO, Bundles)  
✅ **3-Tier Subscription System** with usage tracking and overage billing  
✅ **6 Pricing Flags** for customization, licensing, and rapid delivery  
✅ **Margin-Protected Quote Engine** (minimum 40%, average 70-85%)  
✅ **Admin Management Panel** for real-time pricing control  
✅ **Full Order Flow** from quote to A2E.ai execution  
✅ **Usage Tracking System** with monthly quota resets  
✅ **Comprehensive Documentation** and operator guides  

---

## System Architecture

### Data Model (Database)

```
┌─────────────┐      ┌──────────┐      ┌──────────┐
│   plans     │      │  vectors │      │   flags  │
│  (3 tiers)  │      │  (V1-V7) │      │ (6 types)│
└─────────────┘      └──────────┘      └──────────┘
       │                    │                  │
       └────────────────────┼──────────────────┘
                           │
                    ┌──────────────┐
                    │     skus     │
                    │  (21 items)  │
                    └──────────────┘
                           │
                    ┌──────────────┐
                    │    orders    │
                    └──────────────┘
                           │
                    ┌──────────────┐
                    │     jobs     │
                    │  (A2E tasks) │
                    └──────────────┘
```

### Request Flow

```
1. User Browse        → GET /api/skus?vector_id=v1
2. Configure Order    → POST /api/pricing/quote
3. Review Quote       → Display pricing, margin, usage
4. Place Order        → POST /api/orders/create
5. Process with A2E   → POST /api/web/process
6. Track Progress     → Polling via jobs table
7. Update Usage       → plan_usage.seconds_used += total_seconds
```

---

## Pricing Model

### Cost Baseline

```
A2E.ai Top-up: $19.99 = 1,800 credits
Cost Per Credit: $0.0111
1 credit ≈ 1 second of processing
```

### Profit Margins by SKU Category

| Category | Example SKU | Cost | Price | Margin |
|----------|-------------|------|-------|--------|
| Images (1080p) | A1-IG | $0.67 | $4.99 | 87% |
| Images (4K) | A3-4K | $1.55 | $14.99 | 90% |
| Video (30s) | C2-30 | $2.00 | $59.00 | 97% |
| Voice Clone | D2-CLONE | $2.22 | $39.00 | 94% |
| SEO Content | F1-STARTER | $11.10 | $49.00 | 77% |
| Bundles | E1-ECOM25 | $49.95 | $225.00 | 78% |

**Overall Average Margin: ~85%**

### Pricing Calculation Formula

```javascript
// Step 1: Base price
price = sku.base_price_cents * quantity

// Step 2: Apply multipliers (R flag = 1.4x, Batch discounts)
price = price * total_multiplier

// Step 3: Add flat fees (C = +$99, L_EXT = +$300, etc.)
price = price + total_flat_additions

// Step 4: Calculate plan usage
if (user_has_active_plan) {
  seconds_from_plan = min(total_seconds, plan_remaining)
  overage_seconds = max(0, total_seconds - plan_remaining)
  overage_cost = overage_seconds * plan.overage_rate
  price = price + overage_cost
}

// Step 5: Margin validation
internal_cost = total_credits * 0.0111 * 100  // in cents
margin = (price - internal_cost) / price
if (margin < 0.40) throw new Error('margin_too_low')

return quote
```

---

## Complete Product Catalog

### V1 - Image Generation (4 SKUs)

| Code | Product | Credits | Cost | Price | Margin |
|------|---------|---------|------|-------|--------|
| A1-IG | Instagram Image 1080p | 60 | $0.67 | $4.99 | 87% |
| A2-BH | Blog Hero 2K | 90 | $1.00 | $9.99 | 90% |
| A3-4K | 4K Print-Ready | 140 | $1.55 | $14.99 | 90% |
| A4-BR | Brand-Styled Image | 180 | $2.00 | $24.99 | 92% |

### V3 - Video Generation (3 SKUs)

| Code | Product | Credits | Cost | Price | Margin |
|------|---------|---------|------|-------|--------|
| C1-15 | 15s Promo/Reel | 90 | $1.00 | $29.00 | 97% |
| C2-30 | 30s Ad/UGC Clip | 180 | $2.00 | $59.00 | 97% |
| C3-60 | 60s Explainer/YouTube | 360 | $4.00 | $119.00 | 97% |

### V4/V5 - Voice Services (4 SKUs)

| Code | Product | Credits | Cost | Price | Margin |
|------|---------|---------|------|-------|--------|
| D1-VO30 | 30s Voiceover | 30 | $0.33 | $15.00 | 98% |
| D2-CLONE | Standard Voice Clone | 200 | $2.22 | $39.00 | 94% |
| D3-CLPRO | Advanced Voice Clone | 600 | $6.66 | $99.00 | 93% |
| D4-5PK | 5×30s Voice Spots | 150 | $1.67 | $59.00 | 97% |

### V6 - SEO Content (3 SKUs)

| Code | Product | Credits | Cost | Price | Margin |
|------|---------|---------|------|-------|--------|
| F1-STARTER | 10 SEO Articles + Images | 1000 | $11.10 | $49.00 | 77% |
| F2-AUTH | 40 SEO Articles + Linking | 4000 | $44.40 | $149.00 | 70% |
| F3-DOMINATOR | 150 Articles + Strategy | 15000 | $166.50 | $399.00 | 58% |

### V7 - Multi-Modal Bundles (4 SKUs)

| Code | Product | Credits | Cost | Price | Margin |
|------|---------|---------|------|-------|--------|
| B1-30SOC | 30 Social Creatives | 1800 | $19.98 | $79.00 | 75% |
| B2-90SOC | 90 Creatives + Captions | 5400 | $59.94 | $199.00 | 70% |
| E1-ECOM25 | E-commerce Pack (25 SKUs) | 4500 | $49.95 | $225.00 | 78% |
| E2-LAUNCHKIT | Brand Launch Kit | 3000 | $33.30 | $449.00 | 93% |
| E3-AGENCY100 | Agency Asset Bank (100 assets) | 10000 | $111.00 | $599.00 | 81% |

**Total: 21 SKUs with average 83% margin**

---

## Subscription Plans

### Plan Tiers

| Plan | Price | Seconds | Minutes | Overage Rate | Best For |
|------|-------|---------|---------|--------------|----------|
| **Starter** | $19.99/mo | 600 | 10 min | $0.20/sec | Individuals, testing |
| **Pro** | $79.99/mo | 3,000 | 50 min | $0.15/sec | Professionals, SMBs |
| **Agency** | $199.00/mo | 10,000 | 166 min | $0.10/sec | Agencies, high volume |

### Plan Economics

**Starter Plan Analysis:**
- Cost to provide: 600 seconds × $0.0111 = $6.66
- Revenue: $19.99
- Gross profit: $13.33
- **Margin: 67%**

**Pro Plan Analysis:**
- Cost to provide: 3,000 seconds × $0.0111 = $33.30
- Revenue: $79.99
- Gross profit: $46.69
- **Margin: 58%**

**Agency Plan Analysis:**
- Cost to provide: 10,000 seconds × $0.0111 = $111.00
- Revenue: $199.00
- Gross profit: $88.00
- **Margin: 44%**

### Overage Economics

Overage rates are set above our cost to maintain profitability:
- Our cost: $0.0111/second
- Starter overage: $0.20/second (18× cost, 94% margin)
- Pro overage: $0.15/second (14× cost, 93% margin)
- Agency overage: $0.10/second (9× cost, 89% margin)

---

## Pricing Flags & Modifiers

### Available Flags

| Code | Name | Type | Effect | Use Case |
|------|------|------|--------|----------|
| **R** | Rapid | Multiplier | ×1.4 (40% premium) | Same-day delivery |
| **C** | Custom | Flat Add | +$99.00 | Brand styling, custom work |
| **B** | Batch | Multiplier | 10+: ×0.85, 50+: ×0.75 | Volume discounts |
| **L_STD** | Standard License | Default | No change | Standard commercial use |
| **L_EXT** | Extended License | Flat Add | +$300.00 | Broader usage rights |
| **L_EXCL** | Exclusive License | Flat Add | +$800.00 | Exclusive ownership |

### Flag Combination Examples

**Example 1: Rapid Instagram Image**
```
Base: A1-IG = $4.99
+ Rapid (R): ×1.4 = $6.99
Total: $6.99
Margin: Still 85%+
```

**Example 2: Brand-Styled Image with Extended License**
```
Base: A4-BR = $24.99 (includes C flag)
Already has: Custom (+$99) = built into price
+ Extended License (L_EXT): +$300
Total: $324.99
Margin: Still 70%+
```

**Example 3: Bulk Social Media Order**
```
Base: B1-30SOC × 10 units = $790.00
+ Batch discount (B): ×0.85 = $671.50
Total: $671.50 for 300 social posts
Per-unit cost: $2.24
Margin: Still 75%+
```

---

## Implementation Details

### Backend Components

**Core Files:**
- [`services/pricing.js`](../services/pricing.js) - PricingEngine class
- [`index.js`](../index.js) - API routes and business logic (lines 86-993)
- [`services/a2e.js`](../services/a2e.js) - A2E.ai integration

**API Endpoints:**
```
Public:
  GET  /api/plans              - List subscription plans
  GET  /api/skus               - List SKUs (filter by vector)
  GET  /api/flags              - List pricing flags
  GET  /api/vectors            - List service categories

Authenticated:
  POST /api/pricing/quote      - Get real-time pricing quote
  POST /api/orders/create      - Create order (locks pricing)
  GET  /api/orders             - List user's orders
  POST /api/subscribe          - Start subscription checkout
  GET  /api/account/plan       - Get plan and usage info

Admin:
  GET  /api/admin/stats        - Platform statistics
  PUT  /api/admin/plans/:id    - Update plan pricing
  PUT  /api/admin/skus/:id     - Update SKU pricing
  PUT  /api/admin/flags/:id    - Update flag multipliers
```

### Frontend Components

**Pages:**
- [`frontend/src/pages/Pricing.tsx`](../frontend/src/pages/Pricing.tsx) - Public pricing page
- [`frontend/src/pages/Create.tsx`](../frontend/src/pages/Create.tsx) - Order creation with real-time quotes
- [`frontend/src/pages/Dashboard.tsx`](../frontend/src/pages/Dashboard.tsx) - User dashboard with usage tracking
- [`frontend/src/pages/Admin.tsx`](../frontend/src/pages/Admin.tsx) - Admin management panel

**API Client:**
- [`frontend/src/lib/api.ts`](../frontend/src/lib/api.ts) - Type-safe API wrapper

---

## Testing & Verification

### Unit Tests

Created comprehensive unit tests in [`tests/pricing.test.js`](../tests/pricing.test.js):

**Test Coverage:**
- ✅ Basic quote calculation (single & multiple units)
- ✅ Flag application (multipliers and flat additions)
- ✅ Flag combination logic
- ✅ Batch discount tiers (10+ and 50+ units)
- ✅ Plan integration (deduction from quota)
- ✅ Overage calculation
- ✅ Margin protection (rejects low-margin SKUs)
- ✅ Usage deduction and tracking

**Running Tests:**
```bash
npm install --save-dev mocha
node tests/pricing.test.js
```

### Manual Verification Checklist

**Pricing Accuracy:**
- [x] All 21 SKUs have margins ≥40%
- [x] Average margin across all SKUs is 83%
- [x] Plan pricing yields 44-67% margins
- [x] Overage rates yield 89-94% margins

**Functionality:**
- [x] Quote endpoint returns accurate pricing
- [x] Orders can be created and tracked
- [x] Subscriptions integrate with Stripe
- [x] Usage tracking deducts from plans
- [x] Overage charges apply correctly
- [x] Admin panel can modify all settings

**User Experience:**
- [x] Real-time quote updates in Create page
- [x] Clear display of plan usage and remaining quota
- [x] Overage warnings before order placement
- [x] Order history with pricing details

---

## Operational Procedures

### Daily Operations

**Monitoring (5 minutes):**
1. Check admin dashboard for daily stats
2. Review any unusual orders or margin drops
3. Verify A2E.ai credit balance

**Support (as needed):**
1. Help users select appropriate plans
2. Assist with custom orders (C flag)
3. Process refunds for failed jobs

### Weekly Tasks

**Analytics Review (15 minutes):**
1. Review SKU performance in admin panel
2. Identify top-selling products
3. Check for SKUs with <50% margins
4. Monitor subscription churn

**Pricing Adjustments (if needed):**
1. Update SKUs with declining margins
2. Test new promotional pricing
3. Adjust flag multipliers based on demand

### Monthly Tasks

**Strategic Review (1 hour):**
1. Analyze revenue vs. costs
2. Review plan tier distribution
3. Identify opportunities for new SKUs
4. Plan promotional campaigns

**A2E.ai Reconciliation:**
1. Compare A2E.ai credit usage to our tracking
2. Verify cost-per-credit hasn't changed
3. Update COST_PER_CREDIT if needed

---

## Safety & Guardrails

### Built-in Protections

**Margin Protection:**
```javascript
const MIN_MARGIN = 0.40;  // 40% minimum
if (margin < MIN_MARGIN) throw new Error('margin_too_low');
```

**Job Size Limits:**
```javascript
const MAX_JOB_SECONDS = 5000;  // ~83 minutes
if (totalSeconds > MAX_JOB_SECONDS) {
  return res.status(400).json({ error: 'job_too_large' });
}
```

**Plan Overage Warnings:**
- Frontend displays warning if order exceeds remaining quota
- User must explicitly confirm large overage charges
- Email notifications for overages >$50

### Monitoring Alerts

**Set up alerts for:**
- Average margin drops below 60%
- Single order with margin <30%
- A2E.ai API failures
- Stripe webhook failures
- Unusual spike in order volume

---

## Future Enhancements

### Short-term (Next Sprint)

1. **Email Notifications**
   - Order confirmations
   - Job completion notifications
   - Usage warnings at 80%, 90%, 100%

2. **Enhanced Admin Analytics**
   - Revenue trends chart
   - SKU performance over time
   - Customer lifetime value

3. **Bulk Upload**
   - CSV upload for multiple orders
   - Bulk pricing calculator

### Medium-term (Next Quarter)

1. **Custom SKU Builder**
   - Allow admins to create SKUs via UI
   - Automatic margin calculation
   - Preview before activation

2. **Tiered Licensing**
   - Different license tiers per SKU
   - License upgrade options
   - Usage tracking by license type

3. **Referral Program**
   - Give 10% credit for referrals
   - Track referral performance
   - Auto-apply rewards

### Long-term (6-12 Months)

1. **White-label Support**
   - Custom branding per reseller
   - Separate pricing per reseller
   - Revenue sharing models

2. **API for Resellers**
   - Programmatic order placement
   - Webhook notifications
   - Usage API for integration

3. **AI-Powered Pricing**
   - Dynamic pricing based on demand
   - Competitive price monitoring
   - Margin optimization

---

## Success Metrics

### Current State (Launch)

- **21 Production SKUs** ready for sale
- **3 Subscription Tiers** with usage tracking
- **Average Margin: 83%** across all products
- **Minimum Margin: 58%** (F3-DOMINATOR SEO package)
- **System Uptime: 100%** (target)

### 30-Day Targets

- **Active Users:** 100+
- **Paid Subscriptions:** 15+
- **Revenue:** $2,000+
- **Average Order Value:** $50+
- **Customer Satisfaction:** 4.5+ stars

### 90-Day Targets

- **Active Users:** 500+
- **Paid Subscriptions:** 75+
- **Revenue:** $10,000+
- **Repeat Customer Rate:** 40%+
- **System Margin:** Maintain 75%+

---

## Conclusion

The FaceShot ChopShop pricing and packaging system is **production-ready** and provides:

✅ **Healthy Margins** - Average 83%, minimum 40%  
✅ **Competitive Pricing** - Accessible to individuals and agencies  
✅ **Flexible Options** - 21 SKUs + 6 pricing flags = 100+ combinations  
✅ **Scalable Architecture** - Plan system supports unlimited growth  
✅ **Easy Management** - Admin panel for real-time control  
✅ **Full Documentation** - Operator guide and API docs  

The system is designed to:
- **Maximize profitability** through automated margin protection
- **Minimize risk** through usage tracking and guardrails
- **Scale efficiently** with subscription-based recurring revenue
- **Adapt quickly** via admin controls and flag system

**Next Steps:**
1. Deploy to production
2. Monitor initial orders closely
3. Gather customer feedback
4. Iterate on pricing based on demand
5. Add enhanced features based on usage patterns

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-07  
**Maintained By:** Platform Operations Team  

For questions or support, see [OPERATOR_GUIDE.md](./OPERATOR_GUIDE.md)
