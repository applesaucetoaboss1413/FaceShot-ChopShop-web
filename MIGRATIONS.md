# Database Migrations Guide

## Overview

FaceShop-ChopShop uses SQLite with idempotent migrations executed on server startup. This document tracks schema evolution across phases.

## Migration Strategy

### Approach
- **Idempotent**: All migrations use `CREATE TABLE IF NOT EXISTS`
- **Automatic**: Executed on every server start (`index.js:186-202`)
- **Seed Data**: Inserted via `INSERT OR IGNORE` to prevent duplicates
- **No Migration Files**: Schema defined inline in `index.js`

### Benefits
- ✅ No external migration tools required
- ✅ Fresh deploys work immediately
- ✅ Re-running migrations is safe
- ✅ Simple for single-instance SQLite

### Limitations
- ⚠️ Column additions require `ALTER TABLE` (SQLite limitations)
- ⚠️ Schema changes must be carefully ordered
- ⚠️ No rollback mechanism (use database backups)

## Schema Evolution Timeline

### Phase 0: Initial Schema

**Created**: Original implementation  
**File**: `index.js:187-192`

**Tables Added**:
```sql
users (id, telegram_user_id, email, password_hash, first_name, created_at)
user_credits (user_id, balance)
purchases (id, user_id, pack_type, points, amount_cents, created_at)
jobs (id, user_id, type, status, a2e_task_id, result_url, error_message, cost_credits, created_at, updated_at)
miniapp_creations (id, user_id, type, status, url, created_at)
analytics_events (id, type, user_id, data, created_at)
```

**Purpose**: Core authentication, credit system, A2E job tracking

---

### Phase 1: A2E Integration Enhancements

**Created**: Step 3 of original plan  
**File**: `index.js:190`

**Columns Added**:
```sql
ALTER TABLE jobs ADD COLUMN cost_credits INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN a2e_task_id TEXT;
ALTER TABLE jobs ADD COLUMN result_url TEXT;
ALTER TABLE jobs ADD COLUMN error_message TEXT;
```

**Purpose**: Track A2E task IDs, results, and credit costs

**Migration Notes**:
- SQLite `ALTER TABLE` only supports adding columns (no DROP or MODIFY)
- Columns included in initial `CREATE TABLE IF NOT EXISTS` for new deploys
- Existing deploys would need manual `ALTER TABLE` (not implemented)

---

### Phase 2: Pricing & Subscription System

**Created**: Phase 2 implementation  
**File**: `index.js:193-201`

**Tables Added**:
```sql
plans (id, code, name, monthly_price_cents, included_seconds, overage_rate_per_second_cents, description, active, created_at)

skus (id, code, name, base_credits, base_price_cents, default_flags, description, active, created_at)

flags (id, code, label, price_multiplier, price_add_flat_cents, description, active, created_at)

user_plans (id, user_id, plan_id, start_date, end_date, auto_renew, stripe_subscription_id, status, created_at)
CREATE INDEX idx_user_plans_user_id ON user_plans(user_id)

plan_usage (id, user_id, plan_id, period_start, period_end, seconds_used, created_at, updated_at)
CREATE INDEX idx_plan_usage_user_period ON plan_usage(user_id, period_start, period_end)

orders (id, user_id, sku_code, quantity, applied_flags, customer_price_cents, internal_cost_cents, margin_percent, total_seconds, overage_seconds, stripe_payment_intent_id, status, created_at)
CREATE INDEX idx_orders_user_id ON orders(user_id)
```

**Columns Modified**:
```sql
ALTER TABLE jobs ADD COLUMN order_id INTEGER;
```

**Seed Data** (Phase 2):
```sql
-- 1 Plan
INSERT OR IGNORE INTO plans VALUES ('plan_pro', 'PRO', 'Pro', 7999, 3000, 15, 'Professional plan with 3000 seconds included', '2025-01-04T...')

-- 3 SKUs
INSERT OR IGNORE INTO skus VALUES ('sku_c2_30', 'C2-30', '30s Ad/UGC Clip', 180, 5900, '[]', '...', '...')
INSERT OR IGNORE INTO skus VALUES ('sku_a1_ig', 'A1-IG', 'Instagram Image 1080p', 60, 499, '[]', '...', '...')
INSERT OR IGNORE INTO skus VALUES ('sku_b1_30soc', 'B1-30SOC', '30 Social Creatives', 1800, 7900, '["B"]', '...', '...')

-- 3 Flags
INSERT OR IGNORE INTO flags VALUES ('flag_r', 'R', 'Rapid (same-day)', 1.4, 0, '...', '...')
INSERT OR IGNORE INTO flags VALUES ('flag_c', 'C', 'Custom (brand style)', 1.0, 9900, '...', '...')
INSERT OR IGNORE INTO flags VALUES ('flag_b', 'B', 'Batch discount', 0.85, 0, '...', '...')
```

**Purpose**: Enterprise pricing, plan-based subscriptions, usage tracking, margin management

---

## Current Schema (Phase 2)

### Complete Table List

| Table | Phase | Purpose |
|-------|-------|---------|
| `users` | 0 | User accounts |
| `user_credits` | 0 | Credit balances |
| `purchases` | 0 | Purchase history |
| `jobs` | 0 | A2E job processing |
| `miniapp_creations` | 0 | Uploaded media |
| `analytics_events` | 0 | Analytics tracking |
| `plans` | 2 | Subscription plans |
| `skus` | 2 | Product catalog |
| `flags` | 2 | Price modifiers |
| `user_plans` | 2 | User subscriptions |
| `plan_usage` | 2 | Usage tracking |
| `orders` | 2 | Order history |

### Foreign Key Relationships

```
users
├── user_credits (user_id)
├── purchases (user_id)
├── jobs (user_id)
├── miniapp_creations (user_id)
├── user_plans (user_id)
├── plan_usage (user_id)
└── orders (user_id)

jobs
└── orders (order_id)

user_plans
└── plans (plan_id)

plan_usage
└── plans (plan_id)
```

**Note**: SQLite foreign keys are declarative but not enforced by default. Enable with:
```sql
PRAGMA foreign_keys = ON;
```

---

## Running Migrations

### Fresh Installation
```bash
# Tables created automatically on first start
npm start
```

### Existing Database (Phase 0 → Phase 2)
```bash
# Backup first
cp production.db production.db.backup

# Start server (migrations run automatically)
npm start

# Verify tables
sqlite3 production.db "SELECT name FROM sqlite_master WHERE type='table';"
```

**Expected Output**:
```
users
user_credits
purchases
jobs
miniapp_creations
analytics_events
plans
skus
flags
user_plans
plan_usage
orders
```

### Verify Seed Data
```bash
sqlite3 production.db "SELECT COUNT(*) FROM plans;"
# Expected: 1

sqlite3 production.db "SELECT COUNT(*) FROM skus;"
# Expected: 3

sqlite3 production.db "SELECT COUNT(*) FROM flags;"
# Expected: 3
```

---

## Manual Migration Commands

### Add order_id to existing jobs table
```sql
-- Run if upgrading from Phase 0/1 to Phase 2
ALTER TABLE jobs ADD COLUMN order_id INTEGER;
```

### Recreate database from scratch
```bash
rm production.db
npm start
```

---

## Future Migrations (Phase 3+)

### Planned Schema Changes

1. **License Flags** (Phase 3)
   ```sql
   INSERT INTO flags VALUES ('flag_l_std', 'L_STD', 'Standard License', 1.0, 0, '...', '...');
   INSERT INTO flags VALUES ('flag_l_ext', 'L_EXT', 'Extended License', 1.5, 0, '...', '...');
   INSERT INTO flags VALUES ('flag_l_excl', 'L_EXCL', 'Exclusive Rights', 3.0, 0, '...', '...');
   ```

2. **Additional SKUs** (Phase 3)
   - 20+ SKUs across 7 vectors (Images, Video, Voice, Text, etc.)
   - See `spec-pricing.md` for full catalog

3. **PostgreSQL Migration** (Phase 4)
   - Export SQLite to PostgreSQL
   - Benefits: Connection pooling, full foreign key enforcement, JSON operators
   - Migration tool: `pgloader` or custom export script

### PostgreSQL Schema (Future)
```sql
-- Example: Convert SQLite TEXT timestamps to TIMESTAMP
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add UUID support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
ALTER TABLE orders ADD COLUMN uuid UUID DEFAULT uuid_generate_v4();
```

---

## Rollback Strategy

### SQLite Limitations
- No built-in rollback mechanism
- **Solution**: Database backups before migrations

### Backup Procedures

**Before deploying**:
```bash
# Local backup
cp production.db production.db.$(date +%Y%m%d_%H%M%S)

# Render backup (manual download via dashboard)
# Dashboard → Shell → sqlite3 .dump > backup.sql
```

**Restore from backup**:
```bash
# Local
cp production.db.20250104_195500 production.db

# Render (re-upload database file)
```

---

## Migration Best Practices

### Do's ✅
- Always use `CREATE TABLE IF NOT EXISTS`
- Always use `INSERT OR IGNORE` for seed data
- Test migrations on local database first
- Backup before production deployments
- Document schema changes in this file

### Don'ts ❌
- Don't use `DROP TABLE` in startup migrations
- Don't modify existing columns (SQLite limitation)
- Don't rely on foreign key enforcement without `PRAGMA`
- Don't delete seed data in migrations

---

## Troubleshooting

### Issue: "Table already exists" error
**Cause**: Missing `IF NOT EXISTS`  
**Fix**: Add `IF NOT EXISTS` to all `CREATE TABLE` statements

### Issue: Duplicate seed data
**Cause**: Missing `OR IGNORE` in INSERT  
**Fix**: Use `INSERT OR IGNORE` or `INSERT ON CONFLICT DO NOTHING`

### Issue: order_id column missing
**Cause**: Upgrading from Phase 0/1 database  
**Fix**: Run `ALTER TABLE jobs ADD COLUMN order_id INTEGER;`

### Issue: Foreign key constraint failed
**Cause**: Foreign keys not enabled  
**Fix**: Add at connection: `db.pragma('foreign_keys = ON');`

---

## Schema Export

### Generate SQL dump
```bash
sqlite3 production.db .dump > schema_dump.sql
```

### View table schema
```bash
sqlite3 production.db "SELECT sql FROM sqlite_master WHERE type='table' AND name='orders';"
```

### View all indexes
```bash
sqlite3 production.db "SELECT name, sql FROM sqlite_master WHERE type='index';"
```

---

**Last Updated**: 2025-01-04  
**Current Phase**: Phase 2 (12 tables, 3 indexes)
