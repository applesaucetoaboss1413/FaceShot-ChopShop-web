# Technical Specification: A2E Dual-Purpose Platform

## Task Complexity Assessment

**Difficulty: Hard**

This is a complex implementation requiring:
- Backend authentication system implementation (missing endpoints)
- Third-party API integration (A2E) with async processing
- Webhook/polling mechanism for job status updates
- Database schema updates
- Frontend cleanup and refactoring
- Deployment configuration updates
- Multiple architectural considerations for production readiness

## Technical Context

### Language & Runtime
- **Backend**: Node.js (>=20.0.0), Express.js
- **Frontend**: React 19.2.3 with React Router 7.11.0
- **Database**: SQLite (better-sqlite3)
- **Build Tools**: react-scripts (CRA), craco
- **Styling**: Tailwind CSS 3.4.17

### Dependencies
**Backend:**
- `express` ^4.19.2 - Web framework
- `better-sqlite3` ^9.4.3 - SQLite database
- `stripe` ^14.0.0 - Payment processing
- `cloudinary` ^2.5.1 - Media storage
- `jsonwebtoken` ^9.0.2 - JWT authentication
- `bcryptjs` ^2.4.3 - Password hashing
- `axios` ^1.7.7 - HTTP client (for A2E API)
- `multer` ^1.4.5-lts.1 - File uploads
- `helmet` ^7.1.0, `cors` ^2.8.5 - Security

**Frontend:**
- `axios` ^1.13.2 - API client
- `react-router-dom` ^7.11.0 - Routing
- `tailwindcss` ^3.4.17 - Styling

### Environment Variables Required
```
# Core
NODE_ENV=production
PORT=10000
SESSION_SECRET=<generated>
DB_PATH=production.db

# A2E API
A2E_API_KEY=<user's subscription key>
A2E_BASE_URL=https://video.a2e.ai

# Stripe
STRIPE_SECRET_KEY=<stripe key>
STRIPE_WEBHOOK_SECRET=<stripe webhook secret>

# Cloudinary
CLOUDINARY_CLOUD_NAME=<cloudinary name>
CLOUDINARY_API_KEY=<cloudinary key>
CLOUDINARY_API_SECRET=<cloudinary secret>

# URLs
FRONTEND_URL=https://faceshot-chopshop-1.onrender.com
REACT_APP_BACKEND_URL=<empty for production, relative paths>
```

## Problem Analysis

### Current Issues

1. **Missing Authentication Endpoints** (Critical)
   - Frontend expects: `/api/auth/signup`, `/api/auth/login`, `/api/auth/me`
   - Backend has: None of these routes implemented
   - Current: JWT middleware exists but no way to issue tokens

2. **API Connectivity Issue** (Critical)
   - Frontend: `baseURL: process.env.REACT_APP_BACKEND_URL || ''`
   - In production, uses relative paths (correct)
   - In development, needs explicit backend URL
   - **Root cause**: Missing auth endpoints, not baseURL configuration

3. **A2E API Integration** (Critical)
   - Current `/api/web/process` only creates DB entry, doesn't call A2E
   - No service layer for A2E API communication
   - No status polling/webhook mechanism
   - No mapping between catalog items and A2E endpoints

4. **Telegram Login Buttons** (Low)
   - `TelegramLoginButton` component on Landing page (line 36-40)
   - No backend support for Telegram auth (intentional)
   - Should be removed per requirements

5. **Deployment Configuration** (Medium)
   - `render.yaml` uses `npm ci` which is strict about package-lock.json
   - Should use `npm install` for more flexible deployments
   - Current buildCommand: `npm ci && cd frontend && npm ci && npm run build`

6. **Database Schema** (Medium)
   - Current `jobs` table lacks fields for A2E task tracking:
     - `a2e_task_id` - A2E's task identifier
     - `result_url` - URL to completed media
     - `error_message` - Error details if failed
     - `cost_credits` - Credits consumed

## Implementation Approach

### 1. Authentication System Implementation

**New Backend Routes:**

```javascript
// POST /api/auth/signup
// - Validate email/password
// - Hash password with bcryptjs
// - Insert into users table (add email, password_hash fields)
// - Initialize user_credits entry
// - Generate JWT token
// - Return { token, user }

// POST /api/auth/login
// - Validate email/password
// - Compare password hash
// - Generate JWT token
// - Return { token, user }

// GET /api/auth/me
// - Use existing authenticateToken middleware
// - Fetch user from database by id
// - Return user object
```

**Database Schema Updates:**
```sql
-- Add email auth to users table
ALTER TABLE users ADD COLUMN email TEXT UNIQUE;
ALTER TABLE users ADD COLUMN password_hash TEXT;
ALTER TABLE users ADD COLUMN first_name TEXT;
ALTER TABLE users ADD COLUMN created_at TEXT;
```

### 2. A2E API Integration

**New Backend Service: `services/a2e.js`**

```javascript
class A2EService {
  constructor(apiKey, baseURL) {}
  
  // Map catalog types to A2E endpoints
  async startTask(type, mediaUrl, options) {
    switch(type) {
      case 'faceswap':
        return this.startFaceSwap(mediaUrl, options);
      case 'img2vid':
        return this.startImage2Video(mediaUrl, options);
      case 'enhance':
        return this.startEnhancement(mediaUrl);
      case 'bgremove':
        return this.startBackgroundRemoval(mediaUrl);
      case 'avatar':
        return this.startAvatarCreation(mediaUrl);
    }
  }
  
  async getTaskStatus(type, taskId) {}
  
  // A2E-specific implementations
  private async startFaceSwap(faceUrl, videoUrl) {
    // POST /api/v1/userFaceSwapTask/add
  }
  
  private async startImage2Video(imageUrl, prompt) {
    // POST /api/v1/userImage2Video/start
  }
  
  // ... other A2E endpoints
}
```

**A2E API Endpoints Mapping:**

| Catalog Type | A2E Endpoint | Method | Required Fields |
|-------------|--------------|--------|----------------|
| faceswap | `/api/v1/userFaceSwapTask/add` | POST | `face_url`, `video_url`, `name` |
| img2vid | `/api/v1/userImage2Video/start` | POST | `image_url`, `name`, `prompt`, `negative_prompt` |
| enhance | TBD (use watermark as placeholder) | POST | `media_url` |
| bgremove | TBD (use matting API) | POST | `media_url` |
| avatar | `/api/v1/userAvatar/create` | POST | `image_url` or `video_url` |

**Status Polling:**
- A2E tasks are async, return `current_status: "initialized"` or `"sent"`
- Need to poll status endpoints until `current_status: "completed"`
- Implement background polling with setInterval
- Update SQLite `jobs` table when completed

**Cost Tracking:**
- A2E returns `coins` field indicating cost
- Deduct from `user_credits` when task starts
- Refund if task fails

### 3. Updated `/api/web/process` Route

```javascript
app.post('/api/web/process', authenticateToken, async (req, res) => {
  const { type, options } = req.body;
  const userId = req.user.id;
  
  // 1. Check user credits
  const credits = db.prepare('SELECT balance FROM user_credits WHERE user_id=?').get(userId);
  if (!credits || credits.balance < 10) {
    return res.status(402).json({ error: 'insufficient_credits' });
  }
  
  // 2. Get uploaded media URL from miniapp_creations
  const upload = db.prepare('SELECT url FROM miniapp_creations WHERE user_id=? AND type=? ORDER BY id DESC LIMIT 1').get(userId, type);
  if (!upload || !upload.url) {
    return res.status(400).json({ error: 'no_media_uploaded' });
  }
  
  // 3. Start A2E task
  const a2eService = new A2EService(process.env.A2E_API_KEY, process.env.A2E_BASE_URL);
  const a2eResponse = await a2eService.startTask(type, upload.url, options);
  
  // 4. Create job record
  const job = db.prepare(`
    INSERT INTO jobs (user_id, type, status, a2e_task_id, cost_credits, created_at, updated_at) 
    VALUES (?,?,?,?,?,?,?)
  `).run(userId, type, 'processing', a2eResponse.data._id, a2eResponse.data.coins, new Date().toISOString(), new Date().toISOString());
  
  // 5. Deduct credits
  db.prepare('UPDATE user_credits SET balance = balance - ? WHERE user_id = ?').run(a2eResponse.data.coins, userId);
  
  // 6. Start background polling
  startStatusPolling(job.lastInsertRowid, type, a2eResponse.data._id);
  
  res.json({ job_id: job.lastInsertRowid, status: 'processing' });
});
```

### 4. Background Polling Implementation

```javascript
// In-memory map to track polling intervals
const pollingJobs = new Map();

function startStatusPolling(jobId, type, a2eTaskId) {
  const pollInterval = setInterval(async () => {
    try {
      const a2eService = new A2EService(process.env.A2E_API_KEY, process.env.A2E_BASE_URL);
      const status = await a2eService.getTaskStatus(type, a2eTaskId);
      
      if (status.data.current_status === 'completed') {
        db.prepare(`
          UPDATE jobs 
          SET status='completed', result_url=?, updated_at=? 
          WHERE id=?
        `).run(status.data.result_url, new Date().toISOString(), jobId);
        
        clearInterval(pollInterval);
        pollingJobs.delete(jobId);
      } else if (status.data.current_status === 'failed') {
        db.prepare(`
          UPDATE jobs 
          SET status='failed', error_message=?, updated_at=? 
          WHERE id=?
        `).run(status.data.failed_message, new Date().toISOString(), jobId);
        
        clearInterval(pollInterval);
        pollingJobs.delete(jobId);
      }
    } catch (error) {
      logger.error({ msg: 'polling_error', jobId, error: String(error) });
    }
  }, 10000); // Poll every 10 seconds
  
  pollingJobs.set(jobId, pollInterval);
}
```

### 5. Frontend Cleanup

**Remove Telegram Login:**
- `frontend/src/pages/Landing.js` lines 36-40: Remove `TelegramLoginButton`
- `frontend/src/components/TelegramLoginButton.js`: Can remain (unused, no harm)
- Update FAQ in `frontend/src/pages/FAQs.js` line 14: Remove Telegram reference

**Update Dashboard:**
- `frontend/src/pages/Dashboard.js` line 25: Change `user.first_name` to `user.email` (since we're using email auth now)

### 6. Deployment Configuration Updates

**Update `render.yaml`:**
```yaml
buildCommand: "npm install && cd frontend && npm install && npm run build"
```

**Update `package.json` (root):**
```json
{
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  }
}
```

## Source Code Structure Changes

### New Files

1. **`services/a2e.js`** - A2E API client service
   - `A2EService` class
   - Methods for each catalog type
   - Status polling logic
   - Error handling

2. **`routes/auth.js`** - Authentication routes (optional, can be in index.js)
   - POST `/api/auth/signup`
   - POST `/api/auth/login`
   - GET `/api/auth/me`

### Modified Files

1. **`index.js`** (Backend)
   - Add auth routes
   - Update database schema initialization
   - Import A2E service
   - Update `/api/web/process` route
   - Add polling mechanism
   - Update `/api/web/status` to return result_url

2. **`frontend/src/pages/Landing.js`**
   - Remove TelegramLoginButton (lines 36-40)

3. **`frontend/src/pages/Dashboard.js`**
   - Change `user.first_name` to `user.email` (line 25)

4. **`frontend/src/pages/FAQs.js`**
   - Update Telegram reference (line 14)

5. **`frontend/src/pages/Create.js`**
   - Add options input fields for img2vid (prompt, negative_prompt)
   - Pass options to processJob

6. **`render.yaml`**
   - Update buildCommand to use `npm install`

7. **`package.json`** (root)
   - Add npm version to engines

## Data Model Changes

### Database Schema Updates

```sql
-- Users table modifications
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  telegram_user_id TEXT UNIQUE,
  email TEXT UNIQUE,
  password_hash TEXT,
  first_name TEXT,
  created_at TEXT
);

-- Jobs table modifications
CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  type TEXT,
  status TEXT,
  a2e_task_id TEXT,
  result_url TEXT,
  error_message TEXT,
  cost_credits INTEGER DEFAULT 0,
  created_at TEXT,
  updated_at TEXT
);

-- Keep existing: user_credits, purchases, analytics_events, miniapp_creations
```

**Migration Strategy:**
- SQLite doesn't support ALTER TABLE ADD COLUMN IF NOT EXISTS
- Use defensive schema updates: check if column exists before adding
- Backwards compatible: telegram_user_id can coexist with email

## API Contract Changes

### New Endpoints

**POST /api/auth/signup**
```json
Request:
{
  "email": "user@example.com",
  "password": "securepassword123"
}

Response (201):
{
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": null
  }
}

Errors:
400 - { "error": "invalid_email" }
409 - { "error": "email_exists" }
```

**POST /api/auth/login**
```json
Request:
{
  "email": "user@example.com",
  "password": "securepassword123"
}

Response (200):
{
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": null
  }
}

Errors:
401 - { "error": "invalid_credentials" }
```

**GET /api/auth/me**
```json
Response (200):
{
  "id": 1,
  "email": "user@example.com",
  "first_name": null
}

Errors:
401 - { "error": "unauthorized" }
```

### Updated Endpoints

**POST /api/web/process**
```json
Request:
{
  "type": "img2vid",
  "options": {
    "prompt": "person speaking, looking at camera",
    "negative_prompt": "bad hands, six fingers"
  }
}

Response (200):
{
  "job_id": 123,
  "status": "processing",
  "estimated_credits": 100
}

Errors:
400 - { "error": "no_media_uploaded" }
402 - { "error": "insufficient_credits" }
500 - { "error": "a2e_api_error", "details": "..." }
```

**GET /api/web/status?id=123**
```json
Response (200):
{
  "job_id": 123,
  "status": "completed",
  "result_url": "https://...",
  "cost_credits": 100
}

Response (200 - failed):
{
  "job_id": 123,
  "status": "failed",
  "error_message": "Face detection failed"
}
```

**GET /api/web/creations**
```json
Response (200):
{
  "items": [
    {
      "id": 1,
      "type": "img2vid",
      "status": "completed",
      "url": "https://...", // result_url from jobs table
      "created_at": "2025-01-03T..."
    }
  ]
}
```

## Verification Approach

### 1. Unit Testing (Manual)

**Authentication:**
```bash
# Signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Get user
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <token>"
```

**A2E Integration:**
```bash
# Upload file
curl -X POST http://localhost:3000/api/web/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@test.jpg" \
  -F "type=img2vid"

# Process job
curl -X POST http://localhost:3000/api/web/process \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"type":"img2vid","options":{"prompt":"speaking"}}'

# Check status
curl "http://localhost:3000/api/web/status?id=1" \
  -H "Authorization: Bearer <token>"
```

### 2. Integration Testing

**Full User Flow:**
1. Sign up new user → Verify JWT token and user_credits entry
2. Purchase credits via Stripe → Verify webhook updates balance
3. Upload image → Verify Cloudinary storage and DB entry
4. Process job → Verify A2E API call and DB entry with a2e_task_id
5. Poll status → Verify background polling updates job status
6. View dashboard → Verify completed creation appears with result_url

### 3. E2E Testing (Frontend)

**Manual Testing Steps:**
1. Navigate to `/signup` → Create account → Redirected to `/dashboard`
2. Navigate to `/pricing` → Click "Buy Now" → Stripe checkout → Payment success
3. Navigate to `/create` → Select tool → Upload file → Submit → Redirected to `/status`
4. Watch status page → Verify polling → Verify "completed" state
5. Navigate to `/dashboard` → Verify creation appears with media preview

### 4. Deployment Verification

**On Render:**
1. Push to GitHub main branch
2. Verify Render auto-deploys with new buildCommand
3. Check logs for successful build and start
4. Test production URL: https://faceshot-chopshop-1.onrender.com
5. Verify environment variables are set correctly
6. Test full signup → purchase → create → status flow

### 5. Stripe Webhook Testing

**Using Stripe CLI:**
```bash
stripe listen --forward-to localhost:3000/webhook/stripe
stripe trigger checkout.session.completed
```

Verify user_credits table updates correctly.

### 6. A2E API Verification

**Prerequisites:**
- Valid A2E_API_KEY from user
- Test account with credits

**Test Cases:**
- Face Swap: Upload face + video, verify result
- Image-to-Video: Upload image with prompt, verify 5s video
- Background Remove: Upload image, verify background removed
- Enhance: Upload image, verify upscaled result
- Avatar: Upload image/video, verify avatar creation

### 7. Error Handling Verification

**Test Scenarios:**
- Insufficient credits → 402 error
- Invalid A2E API key → 500 error with details
- A2E task fails → Job status = "failed", error_message populated
- Network timeout → Retry logic works
- Stripe webhook signature invalid → 400 error

## Known Risks & Mitigations

### Risks

1. **A2E API Rate Limits**
   - Risk: Unknown rate limits may cause failures
   - Mitigation: Implement exponential backoff, queue system

2. **Polling Resource Consumption**
   - Risk: Many concurrent jobs = many polling intervals
   - Mitigation: Limit max concurrent jobs per user, use webhooks if A2E supports

3. **SQLite Concurrent Writes**
   - Risk: Polling updates + user requests = write conflicts
   - Mitigation: better-sqlite3 handles this well in WAL mode, keep transactions short

4. **A2E API Changes**
   - Risk: Endpoints may change without notice
   - Mitigation: Version lock A2E endpoints, monitor for errors

5. **Credit Deduction Race Condition**
   - Risk: User starts multiple jobs simultaneously
   - Mitigation: Use SQLite transactions, check-and-deduct atomically

### Mitigations Implementation

```javascript
// Credit deduction with transaction
const deductCredits = db.transaction((userId, amount) => {
  const current = db.prepare('SELECT balance FROM user_credits WHERE user_id=?').get(userId);
  if (!current || current.balance < amount) {
    throw new Error('insufficient_credits');
  }
  db.prepare('UPDATE user_credits SET balance = balance - ? WHERE user_id = ?').run(amount, userId);
});

try {
  deductCredits(userId, cost);
} catch (error) {
  return res.status(402).json({ error: 'insufficient_credits' });
}
```

## Success Criteria

1. ✅ Users can sign up and log in with email/password
2. ✅ No Telegram login UI elements visible
3. ✅ Users can purchase credits via Stripe
4. ✅ Users can upload images/videos
5. ✅ Users can process jobs via A2E API
6. ✅ Job status updates automatically in background
7. ✅ Completed creations appear in dashboard with result media
8. ✅ All A2E catalog types work (faceswap, img2vid, enhance, bgremove, avatar)
9. ✅ Render deployment succeeds with updated buildCommand
10. ✅ Production environment works end-to-end

## Implementation Sequence

1. **Phase 1: Authentication** (Highest Priority)
   - Update database schema
   - Implement auth routes
   - Test login/signup flow

2. **Phase 2: A2E Service** (Critical Path)
   - Create A2E service class
   - Implement endpoint mappings
   - Test with A2E API directly

3. **Phase 3: Integration** (Blocking)
   - Update /api/web/process
   - Implement polling mechanism
   - Update /api/web/status and /api/web/creations

4. **Phase 4: Frontend Updates** (Quick Wins)
   - Remove Telegram login
   - Update Dashboard greeting
   - Update FAQs

5. **Phase 5: Deployment** (Final)
   - Update render.yaml
   - Test on Render
   - Verify end-to-end

## Estimated Effort

- **Authentication System**: 2-3 hours
- **A2E Service Integration**: 4-6 hours
- **Polling Mechanism**: 2-3 hours
- **Frontend Cleanup**: 1 hour
- **Testing & Debugging**: 3-4 hours
- **Deployment & Verification**: 1-2 hours

**Total: 13-19 hours**

## Dependencies & Prerequisites

1. **A2E API Key**: User must provide valid subscription key
2. **Stripe Account**: Already configured (from existing setup)
3. **Cloudinary Account**: Already configured (from existing setup)
4. **Render Account**: Already set up with service running
5. **Test Media**: Sample images/videos for testing each catalog type

## Questions for User

1. Do you have a valid A2E API key? If yes, what credits/quota do you have?
2. Are there specific A2E features you want to prioritize (e.g., face swap vs image-to-video)?
3. Should we implement webhook support if A2E provides webhook URLs, or is polling acceptable?
4. What should be the default credit cost for each operation (or should we use A2E's returned costs)?
5. Do you want to keep the telegram_user_id column for future Telegram integration, or remove it entirely?
6. Should we add rate limiting per user (e.g., max 5 concurrent jobs)?
