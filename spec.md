# FaceShop-ChopShop: Technical Specification

## Overview

FaceShop-ChopShop is a web-based AI media processing platform that provides image and video generation services through the A2E API. The platform implements a sophisticated dual-layer architecture:

1. **Engine Layer** (Phase 0-1): Core A2E integration, authentication, job processing
2. **Business Layer** (Phase 2): Enterprise pricing, subscription plans, usage tracking, and margin management

This document serves as the umbrella specification coordinating both phases.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     PHASE 2: BUSINESS LAYER                 │
│  ┌───────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ Pricing Engine│  │ Subscription │  │ Usage Tracking  │  │
│  │  - Plans      │  │  - Stripe    │  │  - Plan quotas  │  │
│  │  - SKUs       │  │  - Auto-renew│  │  - Overage calc │  │
│  │  - Flags      │  │  - Billing   │  │  - Monthly reset│  │
│  │  - Margins    │  │              │  │                 │  │
│  └───────┬───────┘  └──────┬───────┘  └────────┬────────┘  │
│          │                 │                    │           │
│          └─────────────────┴────────────────────┘           │
│                             │                                │
└─────────────────────────────┼────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    PHASE 0-1: ENGINE LAYER                  │
│  ┌───────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ Authentication│  │ A2E API      │  │ Job Processing  │  │
│  │  - JWT tokens │  │  - Face swap │  │  - Status poll  │  │
│  │  - bcrypt     │  │  - Img2Vid   │  │  - Result URLs  │  │
│  │  - Email/pass │  │  - Enhance   │  │  - Error refund │  │
│  └───────────────┘  └──────────────┘  └─────────────────┘  │
│                                                              │
│  ┌───────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ Credit System │  │ File Upload  │  │ Database (SQLite)│ │
│  │  - Balance    │  │  - Cloudinary│  │  - Jobs, users  │  │
│  │  - Packs      │  │  - Validation│  │  - Credits, logs│  │
│  └───────────────┘  └──────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase Breakdown

### Phase 0-1: A2E Integration & Core Platform ✅

**Status**: Implemented and functional  
**Spec Document**: [`spec-a2e-original.md`](./spec-a2e-original.md)

**Key Deliverables**:
- Email/password authentication with JWT
- A2E API integration for 5 task types (faceswap, img2vid, enhance, bgremove, avatar)
- Background job polling with 10-second intervals
- Credit system with Stripe checkout
- Cloudinary file upload
- React frontend (Landing, Dashboard, Create, Gallery, Purchase pages)
- Deployment to Render

**Tech Stack**:
- Backend: Node.js + Express + SQLite
- Frontend: React 19 + React Router 7
- APIs: A2E, Stripe, Cloudinary

**Core Tables**:
- `users`, `user_credits`, `purchases`, `jobs`, `miniapp_creations`, `analytics_events`

---

### Phase 2: Enterprise Pricing & Subscription System ✅

**Status**: Implemented, pending refactor  
**Spec Document**: [`spec-pricing.md`](./spec-pricing.md)

**Key Deliverables**:
- **PricingEngine** service (`services/pricing.js`)
  - Dynamic quote calculation
  - Plan-based pricing with included seconds
  - Overage rate calculation
  - 40% minimum margin enforcement
- **5 New Database Tables**:
  - `plans` - Subscription tiers (Pro: $79.99/month, 3000 seconds)
  - `skus` - Product catalog (3 SKUs: video, image, bundle)
  - `flags` - Price modifiers (Rapid 1.4x, Custom +$99, Batch 0.85x)
  - `user_plans` - User subscriptions with Stripe integration
  - `plan_usage` - Monthly usage tracking per user/plan
  - `orders` - Complete order history with margins
- **3 New API Endpoints**:
  - `POST /api/pricing/quote` - Get pricing estimate
  - `GET /api/plans` - List subscription plans
  - `POST /api/subscribe` - Create Stripe subscription
- **Frontend Integration**:
  - Real-time pricing display on Create page
  - Plan seconds used (green) vs overage (orange)
  - Remaining quota indicator

**Cost Model**:
- Internal cost: **$0.0111 per A2E credit** (based on A2E Pro subscription)
- 1 credit ≈ 1 second of processing
- Margin range: 70-97% across products
- Minimum margin: 40% (enforced by PricingEngine)

**Example Pricing**:
```
SKU: A1-IG (Instagram Image 1080p)
- Base Credits: 60
- Internal Cost: $0.67 (60 × $0.0111)
- Customer Price: $4.99
- Margin: 86.6%

User on Pro Plan ($79.99/month, 3000s included):
- First 3000 seconds: FREE (included in plan)
- Overage: $0.15 per second beyond quota
```

---

## How The Layers Interact

### Without Subscription (Credit-Only Users)

```
User → [Create Page] 
      → Upload file 
      → POST /api/web/process
      → Deduct credits
      → Call A2E API
      → Background polling
      → Return result_url
```

### With Subscription (Plan Users)

```
User → [Create Page]
      ↓
      GET /api/pricing/quote
      ↓
      [Display: "$4.99, uses 60s from plan, 2940s remaining"]
      ↓
      POST /api/orders/create (NEW - Phase 2 refactor)
      ↓
      POST /api/web/process (receives order_id)
      ↓
      Deduct plan usage (not credits)
      ↓
      Call A2E API
      ↓
      Background polling
      ↓
      Return result_url + order details
```

**Key Separation** (Refactor Goal):
- **Pricing logic** → Isolated in `services/pricing.js`
- **Order creation** → Separate endpoint (`POST /api/orders/create`)
- **Job processing** → Focused on A2E calls, polling, status updates
- **Frontend** → Quote → Order → Process flow

---

## Database Schema Evolution

### Phase 0-1 Tables (Original)
```sql
users
user_credits
purchases
jobs
miniapp_creations
analytics_events
```

### Phase 2 Tables (Added)
```sql
plans
skus
flags
user_plans
plan_usage
orders
```

### Modified Tables
```sql
-- Phase 2 modification
ALTER TABLE jobs ADD COLUMN order_id INTEGER;
```

**Migration Strategy**:
- SQLite retained for both phases
- Idempotent migrations using `CREATE TABLE IF NOT EXISTS`
- Seed data via `INSERT OR IGNORE` on startup
- Future: Consider PostgreSQL for multi-tenancy (Phase 3+)

---

## Environment Variables (Complete List)

### Phase 0-1 Variables
```env
# Core
PORT=3000
NODE_ENV=production
DB_PATH=production.db
PUBLIC_URL=https://your-backend.onrender.com
FRONTEND_URL=https://your-frontend.onrender.com
LOG_LEVEL=info

# Auth
JWT_SECRET=your_jwt_secret_here

# A2E API
A2E_API_KEY=your_a2e_api_key_here
A2E_BASE_URL=https://video.a2e.ai

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

# Admin
ADMIN_SECRET=your_admin_secret_here
```

### Phase 2 Variables (Added)
```env
# Pricing Constants
COST_PER_CREDIT=0.0111
MIN_MARGIN=0.40
MAX_JOB_SECONDS=5000
```

---

## Testing Strategy

### Phase 0-1 Tests
See [`spec-a2e-original.md`](./spec-a2e-original.md) → Manual Testing Checklist

**Key Tests**:
- [ ] Signup/login with email/password
- [ ] Upload → Process → Poll → Result for each catalog type
- [ ] Stripe checkout → Webhook → Credit balance update
- [ ] Credit refund on A2E job failure

### Phase 2 Tests
See [`spec-pricing.md`](./spec-pricing.md) → Testing section

**Key Tests**:
- [ ] Quote calculation with flags (Rapid, Custom, Batch)
- [ ] Plan usage deduction and overage charges
- [ ] Margin validation (reject quotes below 40%)
- [ ] Monthly usage period rollover
- [ ] Stripe subscription creation and tracking

---

## Current Status & Next Steps

### ✅ Completed
1. Phase 0-1 A2E integration fully implemented
2. Phase 2 pricing/subscription system implemented
3. Frontend shows real-time pricing estimates
4. Database schema extended with 5 new tables
5. PricingEngine service with margin protection
6. Basic Stripe subscription flow

### 🚧 In Progress (Refactoring)
1. **Decouple pricing from job processing**:
   - Extract order creation to `POST /api/orders/create`
   - Modify `/api/web/process` to accept `order_id`
   - Separate concerns: quote → order → job
2. **Add tests**:
   - Pricing engine unit tests
   - Order creation integration tests
   - Plan usage tracking tests
3. **Documentation**:
   - Update README with Phase 2 env vars
   - Add DB migration notes
   - Document Phase 0-1 test evidence (Steps 4 & 5)

### 📋 Planned (Phase 3+)
- Admin panel for plan/SKU/flag management
- All 7 vectors + 20+ SKUs from original blueprint
- License flags (L_STD, L_EXT, L_EXCL)
- PostgreSQL migration for scalability
- Multi-tenant support
- Advanced analytics and reporting

---

## Key Design Decisions

### Why Two Layers?
- **Separation of Concerns**: A2E integration logic stays clean
- **Gradual Rollout**: Can toggle pricing system on/off
- **Testing**: Test engine and business layers independently
- **Flexibility**: Credit-only users coexist with plan users

### Why SQLite for Phase 2?
- **Simplicity**: Single-file database, no external dependencies
- **Sufficient Scale**: Handles 100K+ records comfortably
- **Migration Path**: Can switch to PostgreSQL when needed
- **Development Speed**: Faster iteration during Phase 2

### Why Margin Protection?
- **Business Safety**: Prevents accidental under-pricing
- **Cost Control**: Ensures profitability on every transaction
- **A2E Cost Basis**: Protects against A2E pricing changes
- **Audit Trail**: All orders stored with margin data

### Why Monthly Usage Tracking?
- **Standard Billing**: Aligns with subscription model
- **Predictable Overage**: Users see clear quota limits
- **Reset Cadence**: Calendar month (1st to last day)
- **Stripe Alignment**: Matches Stripe subscription periods

---

## Related Documents

- **Phase 0-1 Spec**: [`spec-a2e-original.md`](./spec-a2e-original.md)
- **Phase 2 Spec**: [`spec-pricing.md`](./spec-pricing.md)
- **Implementation Report**: [`report.md`](./report.md)
- **Original Plan**: [`plan_original.txt`](./plan_original.txt)

---

## Questions & Clarifications

**Q: Is the pricing system "scope creep"?**  
A: No. The pricing/subscription system is an explicit business requirement from the start, documented in the "ELITE" pricing blueprint. Phase 0-1 is the engine; Phase 2 is the business layer.

**Q: Why keep credit system if we have plans?**  
A: Both coexist. Users can:
- Buy credit packs (one-time payment)
- Subscribe to plans (monthly billing with included seconds + overage)
- Mix both (use plan quota first, then credits)

**Q: What's the relationship between credits and seconds?**  
A: **1 credit ≈ 1 second** of A2E processing time. This simplifies pricing and usage tracking.

**Q: Can users without plans use the platform?**  
A: Yes. Credit-only users bypass the pricing engine and pay per job using the existing credit system.

**Q: What happens when plan quota runs out?**  
A: Overage charges apply at the plan's per-second rate (e.g., $0.15/second for Pro plan). User is informed before job starts.

---

**Last Updated**: 2025-01-04  
**Version**: 2.0 (Phase 0-1 complete, Phase 2 in refactor)
