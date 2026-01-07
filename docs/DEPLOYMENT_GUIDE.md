# API Tool Mapping Deployment Guide

## Overview

This guide covers the deployment of the complete API Tool Mapping implementation for the FaceShot-ChopShop production application. This is a **critical deployment** for a live monetized application.

## Pre-Deployment Checklist

### 1. Environment Variables

Ensure all required environment variables are set:

```bash
# Core Application
NODE_ENV=production
PORT=3000
DB_PATH=production.db
SESSION_SECRET=<strong-secret-key>
LOG_LEVEL=info

# Frontend
FRONTEND_URL=https://your-domain.com

# A2E API
A2E_API_KEY=<your-a2e-api-key>
A2E_BASE_URL=https://video.a2e.ai

# Cloudinary
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>

# Stripe
STRIPE_SECRET_KEY=<your-stripe-secret>
STRIPE_WEBHOOK_SECRET=<your-webhook-secret>

# Admin Access
ADMIN_EMAILS=admin@yourcompany.com,admin2@yourcompany.com

# Pricing Configuration
COST_PER_CREDIT=0.0111
MIN_MARGIN=0.40
```

### 2. Database Backup

**CRITICAL**: Back up your production database before deployment:

```bash
# Create backup
cp production.db production.db.backup.$(date +%Y%m%d_%H%M%S)

# Verify backup
sqlite3 production.db.backup.* ".schema" > /dev/null && echo "Backup OK"
```

### 3. Dependency Installation

```bash
# Install all dependencies
npm install

# Verify installation
npm list --depth=0
```

## Deployment Steps

### Step 1: Run Database Migrations

```bash
# Run migration script
node scripts/run-migrations.js
```

Expected output:
```
=== Database Migration Runner ===
Database: production.db
Migrations directory: /path/to/migrations

Found 1 migration file(s):

Applying migration 001: 001_add_sku_tool_configs.sql...
✓ Successfully applied migration 001

=== Migration Summary ===
Applied: 1
Skipped: 0
Total: 1
```

**Verification**:
```bash
# Verify new tables exist
sqlite3 production.db ".tables" | grep -E "sku_tool|job_steps|a2e_api|error_logs"
```

### Step 2: Seed SKU Configurations

```bash
# Seed tool configurations for all SKUs
node scripts/seed-sku-configs.js
```

Expected output:
```
=== Seeding SKU Tool Configurations ===
✓ Successfully seeded SKU tool configurations
✓ Configured 9 SKUs
```

**Verification**:
```bash
# Check configurations
sqlite3 production.db "SELECT COUNT(*) FROM sku_tool_configs;"
# Should return at least 9

sqlite3 production.db "SELECT sku_code FROM sku_tool_configs;"
# Should list: C1-15, C2-30, C3-60, D1-VO30, D2-CLONE, D3-CLPRO, A1-IG, A4-BR, E2-LAUNCHKIT
```

### Step 3: Integrate Enhanced Routes

Add to `index.js` before the static file serving section (around line 1103):

```javascript
// Enhanced API Routes
const enhancedApiRoutes = require('./routes/enhanced-api')(db, authenticateToken, isAdmin);
app.use(enhancedApiRoutes);

logger.info('Enhanced API routes registered');
```

### Step 4: Update Frontend API Client

The frontend API client (`frontend/src/lib/api.ts`) already has the necessary types. Add these new methods:

```typescript
// In ApiClient class

async getSKUConfig(skuCode: string): Promise<ApiResponse<any>> {
  return this.request<any>(`/api/skus/${skuCode}/config`);
}

async validateSKUInputs(skuCode: string, inputs: any): Promise<ApiResponse<any>> {
  return this.request<any>(`/api/skus/${skuCode}/validate`, {
    method: 'POST',
    body: JSON.stringify({ customer_inputs: inputs })
  });
}

async createAdvancedJob(skuCode: string, customerInputs: any, orderId?: number): Promise<ApiResponse<any>> {
  return this.request<any>('/api/jobs/create-advanced', {
    method: 'POST',
    body: JSON.stringify({ sku_code: skuCode, customer_inputs: customerInputs, order_id: orderId })
  });
}

async getJobStatus(jobId: number): Promise<ApiResponse<any>> {
  return this.request<any>(`/api/jobs/${jobId}/status`);
}

async uploadMedia(file: File, resourceType: string = 'auto'): Promise<ApiResponse<any>> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('resource_type', resourceType);
  
  return this.request<any>('/api/upload/media', {
    method: 'POST',
    body: formData,
    headers: {} // Let browser set multipart headers
  });
}

async getA2EAvatars(): Promise<ApiResponse<any>> {
  return this.request<any>('/api/a2e/avatars');
}

async getA2EVoices(): Promise<ApiResponse<any>> {
  return this.request<any>('/api/a2e/voices');
}
```

### Step 5: Restart Application

```bash
# If using PM2
pm2 restart faceshot-chopshop

# If using systemd
sudo systemctl restart faceshot-chopshop

# If running directly
npm start
```

### Step 6: Verify Deployment

Run the verification script:

```bash
# Check all health endpoints
curl https://your-domain.com/health
curl https://your-domain.com/ready
curl https://your-domain.com/alive

# Check A2E health (requires auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" https://your-domain.com/api/health/a2e

# Verify SKU configs are loaded
curl -H "Authorization: Bearer YOUR_TOKEN" https://your-domain.com/api/skus/C1-15/config
```

## Post-Deployment Monitoring

### 1. Monitor Error Logs

```bash
# Watch application logs
tail -f logs/application.log

# Or with PM2
pm2 logs faceshot-chopshop
```

### 2. Check A2E API Calls

Access monitoring dashboard (admin only):
```
https://your-domain.com/api/monitoring/api-calls?limit=50
```

### 3. Monitor Circuit Breakers

```
https://your-domain.com/api/health/circuit-breakers
```

### 4. Database Metrics

```bash
# Check job success rate
sqlite3 production.db "
  SELECT status, COUNT(*) as count 
  FROM jobs 
  WHERE created_at > datetime('now', '-24 hours')
  GROUP BY status;
"

# Check A2E API success rate
sqlite3 production.db "
  SELECT success, COUNT(*) as count 
  FROM a2e_api_calls 
  WHERE created_at > datetime('now', '-1 hour')
  GROUP BY success;
"

# Check error frequency
sqlite3 production.db "
  SELECT severity, COUNT(*) as count 
  FROM error_logs 
  WHERE created_at > datetime('now', '-1 hour')
  GROUP BY severity;
"
```

## Rollback Procedures

### If Issues Occur

1. **Stop the application**:
```bash
pm2 stop faceshot-chopshop
```

2. **Restore database backup**:
```bash
# Find latest backup
ls -lt production.db.backup.* | head -1

# Restore
cp production.db.backup.YYYYMMDD_HHMMSS production.db
```

3. **Revert code changes**:
```bash
git revert <commit-hash>
```

4. **Restart with previous version**:
```bash
pm2 restart faceshot-chopshop
```

## Performance Tuning

### 1. Database Optimization

```bash
# Run VACUUM to optimize database
sqlite3 production.db "VACUUM;"

# Analyze tables for query optimization
sqlite3 production.db "ANALYZE;"
```

### 2. Rate Limiting

Adjust rate limits in enhanced-api.js if needed:
```javascript
const maxRequestsPerMinute = 60; // Adjust based on load
```

### 3. Circuit Breaker Tuning

In a2e-enhanced.js, adjust circuit breaker thresholds:
```javascript
new CircuitBreaker(threshold = 5, timeout = 60000)
// Increase threshold for high-traffic scenarios
```

### 4. Polling Intervals

In job-processor.js, adjust polling interval:
```javascript
this.pollingInterval = 10000; // Increase to reduce API calls
```

## Security Hardening

### 1. Input Validation

All inputs are sanitized in enhanced-api.js. Verify XSS protection:
```javascript
// Test sanitization
curl -X POST https://your-domain.com/api/skus/C1-15/validate \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"customer_inputs": {"script": "<script>alert(1)</script>"}}'
```

### 2. Rate Limiting

Monitor rate limit effectiveness:
```bash
# Check rate limit hits
grep "Rate limit reached" logs/application.log | wc -l
```

### 3. Authentication

Verify all sensitive endpoints require authentication:
```bash
# Should return 401
curl https://your-domain.com/api/a2e/credits
curl https://your-domain.com/api/admin/skus/C1-15/config
```

## Scaling Considerations

### Horizontal Scaling

If scaling to multiple instances:

1. **Use external database** (PostgreSQL instead of SQLite)
2. **Implement Redis** for job queue and caching
3. **Use load balancer** for distributing requests
4. **Shared file storage** for uploads (S3)

### Vertical Scaling

Recommended server specs:
- **Minimum**: 2 CPU cores, 4GB RAM
- **Recommended**: 4 CPU cores, 8GB RAM
- **High Traffic**: 8+ CPU cores, 16GB+ RAM

## Troubleshooting

### Issue: Jobs stuck in "processing"

**Solution**:
```bash
# Check for orphaned jobs
sqlite3 production.db "
  SELECT id, type, created_at 
  FROM jobs 
  WHERE status = 'processing' 
  AND created_at < datetime('now', '-1 hour');
"

# Manual intervention may be required
```

### Issue: Circuit breaker constantly OPEN

**Solution**:
1. Check A2E API status
2. Verify API key is valid
3. Check rate limits
4. Review error logs for patterns

### Issue: High memory usage

**Solution**:
1. Clear configuration cache: `configManager.clearCache()`
2. Restart application
3. Check for memory leaks in long-running jobs

## Maintenance Tasks

### Daily

- Check error logs
- Monitor A2E API usage vs. budget
- Verify job completion rate

### Weekly

- Review circuit breaker states
- Analyze slow API calls
- Check database size growth

### Monthly

- Database VACUUM and ANALYZE
- Review and archive old job data
- Update SKU configurations if needed
- Security audit

## Support

For issues:
1. Check logs: `/api/monitoring/errors`
2. Review circuit breaker states: `/api/health/circuit-breakers`
3. Contact A2E support if API issues persist
4. Open internal ticket with full logs

## Success Metrics

Track these KPIs post-deployment:

- **Job Success Rate**: > 95%
- **API Response Time**: < 500ms
- **A2E API Success Rate**: > 98%
- **Error Rate**: < 1%
- **User Satisfaction**: Monitor support tickets

## Conclusion

This deployment introduces comprehensive API tool mapping with production-ready features:

✅ Multi-step job orchestration
✅ Circuit breaker pattern
✅ Retry logic with exponential backoff
✅ Comprehensive error handling
✅ Input validation and sanitization
✅ Monitoring and observability
✅ Security hardening

Monitor closely for the first 48 hours and be prepared to rollback if issues arise.
