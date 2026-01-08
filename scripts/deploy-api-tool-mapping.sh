#!/bin/bash

# API Tool Mapping - Complete Deployment Script
# This script automates the deployment of the API Tool Mapping system

set -e  # Exit on error

echo "=========================================="
echo "API Tool Mapping - Deployment Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Step 1: Check environment
echo "Step 1: Checking environment..."
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Are you in the project root?"
    exit 1
fi
print_status "Project root confirmed"

# Step 2: Backup database
echo ""
echo "Step 2: Backing up database..."
if [ -f "production.db" ]; then
    BACKUP_FILE="production.db.backup.$(date +%Y%m%d_%H%M%S)"
    cp production.db "$BACKUP_FILE"
    print_status "Database backed up to: $BACKUP_FILE"
else
    print_warning "No existing production.db found (this is OK for first deployment)"
fi

# Step 3: Install dependencies
echo ""
echo "Step 3: Installing dependencies..."
if npm install; then
    print_status "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Step 4: Run database migrations
echo ""
echo "Step 4: Running database migrations..."
if node scripts/run-migrations.js; then
    print_status "Migrations completed successfully"
else
    print_error "Migration failed"
    print_warning "Rolling back to backup if available..."
    if [ -f "$BACKUP_FILE" ]; then
        cp "$BACKUP_FILE" production.db
        print_status "Database restored from backup"
    fi
    exit 1
fi

# Step 5: Seed SKU configurations
echo ""
echo "Step 5: Seeding SKU tool configurations..."
if node scripts/seed-sku-configs.js; then
    print_status "SKU configurations seeded successfully"
else
    print_error "Configuration seeding failed"
    print_warning "Rolling back to backup if available..."
    if [ -f "$BACKUP_FILE" ]; then
        cp "$BACKUP_FILE" production.db
        print_status "Database restored from backup"
    fi
    exit 1
fi

# Step 6: Verify deployment
echo ""
echo "Step 6: Verifying deployment..."

# Check that new tables exist
TABLE_COUNT=$(node -e "
const Database = require('better-sqlite3');
const db = new Database('production.db', { readonly: true });
const tables = db.prepare(\"SELECT name FROM sqlite_master WHERE type='table' AND name IN ('sku_tool_configs', 'job_steps', 'a2e_api_calls', 'error_logs')\").all();
console.log(tables.length);
db.close();
")

if [ "$TABLE_COUNT" -eq 4 ]; then
    print_status "All required database tables created"
else
    print_error "Missing database tables (found $TABLE_COUNT of 4)"
    exit 1
fi

# Check that SKU configurations exist
SKU_COUNT=$(node -e "
const Database = require('better-sqlite3');
const db = new Database('production.db', { readonly: true });
const count = db.prepare('SELECT COUNT(*) as count FROM sku_tool_configs').get().count;
console.log(count);
db.close();
")

if [ "$SKU_COUNT" -ge 9 ]; then
    print_status "SKU configurations seeded ($SKU_COUNT configurations)"
else
    print_error "Insufficient SKU configurations (found $SKU_COUNT, expected at least 9)"
    exit 1
fi

# Step 7: Display summary
echo ""
echo "=========================================="
echo "Deployment Summary"
echo "=========================================="
print_status "Dependencies installed"
print_status "Database migrations applied"
print_status "SKU configurations seeded ($SKU_COUNT SKUs)"
print_status "Deployment verification passed"
echo ""
echo "Next steps:"
echo "1. Restart your application (pm2 restart app-name or npm start)"
echo "2. Verify health endpoints:"
echo "   - GET /health"
echo "   - GET /api/health/a2e (requires auth)"
echo "3. Test SKU configuration:"
echo "   - GET /api/skus/C1-15/config (requires auth)"
echo "4. Monitor logs for errors"
echo ""
echo "For rollback: cp $BACKUP_FILE production.db"
echo "=========================================="
