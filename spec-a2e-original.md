# Technical Specification: Phase 0-1 - A2E API Integration

## Overview

This specification covers the foundational FaceShop-ChopShop platform: a standalone React/Node.js web application selling AI image/video processing services via the A2E API. This phase establishes authentication, A2E integration, credit system, and Stripe payments.

## Complexity Assessment

**Difficulty: Medium-Hard**

Requires integration with external APIs (A2E, Stripe), background job polling, database transactions, and frontend/backend coordination.

## Technical Stack

### Backend
- **Runtime**: Node.js (>=20.0.0)
- **Framework**: Express.js
- **Database**: SQLite via `better-sqlite3` ^9.4.3
- **Authentication**: JWT (`jsonwebtoken` ^9.0.2), bcrypt (`bcryptjs` ^2.4.3)
- **Payments**: Stripe ^14.0.0
- **HTTP Client**: axios ^1.7.7

### Frontend
- **Framework**: React 19.2.3
- **Routing**: React Router 7.11.0
- **Build**: Create React App (react-scripts)
- **Styling**: Tailwind CSS 3.4.17

## Environment Variables

```env
# Core Configuration
PORT=3000
NODE_ENV=production
DB_PATH=production.db
PUBLIC_URL=https://your-backend.onrender.com
FRONTEND_URL=https://your-frontend.onrender.com
LOG_LEVEL=info

# Authentication
JWT_SECRET=your_jwt_secret_here

# A2E API Integration
A2E_API_KEY=your_a2e_api_key_here
A2E_BASE_URL=https://video.a2e.ai

# Stripe Payments
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# File Uploads
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

# Admin
ADMIN_SECRET=your_admin_secret_here
```

## Database Schema

### Core Tables

#### `users`
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  telegram_user_id TEXT UNIQUE,
  email TEXT UNIQUE,
  password_hash TEXT,
  first_name TEXT,
  created_at TEXT
);
```

#### `user_credits`
```sql
CREATE TABLE user_credits (
  user_id INTEGER PRIMARY KEY,
  balance INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### `purchases`
```sql
CREATE TABLE purchases (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  pack_type TEXT,
  points INTEGER,
  amount_cents INTEGER,
  created_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### `jobs`
```sql
CREATE TABLE jobs (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  type TEXT,
  status TEXT,
  a2e_task_id TEXT,
  result_url TEXT,
  error_message TEXT,
  cost_credits INTEGER DEFAULT 0,
  order_id INTEGER,
  created_at TEXT,
  updated_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### `miniapp_creations`
```sql
CREATE TABLE miniapp_creations (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  type TEXT,
  status TEXT,
  url TEXT,
  created_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### `analytics_events`
```sql
CREATE TABLE analytics_events (
  id INTEGER PRIMARY KEY,
  type TEXT,
  user_id INTEGER,
  data TEXT,
  created_at TEXT
);
```

## Core Features

### 1. Authentication System

#### POST `/api/auth/signup`
**Request**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response**:
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "created_at": "2025-01-04T19:49:51.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Implementation**:
- Validate email format and password strength
- Hash password with bcrypt (10 salt rounds)
- Create user record
- Auto-create `user_credits` entry with 0 balance
- Generate JWT token with user.id payload
- Return user object + token

#### POST `/api/auth/login`
**Request**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response**:
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Implementation**:
- Lookup user by email
- Verify password with bcrypt.compare()
- Generate JWT token
- Return user + token

#### GET `/api/auth/me`
**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "id": 1,
  "email": "user@example.com",
  "created_at": "2025-01-04T19:49:51.000Z"
}
```

**Implementation**:
- Use `authenticateToken` middleware to verify JWT
- Return user from req.user

### 2. A2E Service Integration

**File**: `services/a2e.js`

**Supported Task Types**:
- `faceswap` - Face swap with target image
- `img2vid` - Convert image to video (30s clips)
- `enhance` - Image enhancement
- `bgremove` - Background removal
- `avatar` - Avatar creation

**A2E API Endpoints Mapping**:
```javascript
{
  faceswap: 'POST /api/v1/userFaceSwapTask/add',
  img2vid: 'POST /api/v1/userImage2Video/start',
  enhance: 'POST /api/v1/userEnhanceTask/add',
  bgremove: 'POST /api/v1/userBgRemoveTask/add',
  avatar: 'POST /api/v1/userAvatarTask/add'
}
```

**Key Methods**:

```javascript
class A2EService {
  constructor(apiKey, baseURL)
  
  // Start a task based on type
  async startTask(type, mediaUrl, options = {})
  
  // Get task status
  async getTaskStatus(type, taskId)
  
  // Type-specific implementations
  async startFaceSwap(faceUrl, options)
  async startImage2Video(imageUrl, options)
  async startEnhancement(imageUrl, options)
  async startBackgroundRemoval(imageUrl, options)
  async startAvatarCreation(imageUrl, options)
}
```

**Authentication**:
- All requests include `Authorization: Bearer <A2E_API_KEY>`
- Base URL: `https://video.a2e.ai`
- Timeout: 30 seconds

**Error Handling**:
- Log all A2E errors with winston
- Throw errors with descriptive messages
- Include response.data in logs for debugging

### 3. Job Processing Flow

#### POST `/api/web/upload`
**Purpose**: Upload user media to Cloudinary before processing

**Request**: Multipart form-data
- `file`: Media file (image/video)
- `type`: Processing type (faceswap, img2vid, etc.)

**Response**:
```json
{
  "url": "https://res.cloudinary.com/.../image.jpg"
}
```

**Implementation**:
- Use Cloudinary upload_stream
- Store URL in `miniapp_creations` table
- Return Cloudinary URL for use in processing

#### POST `/api/web/process`
**Purpose**: Start A2E job processing

**Request**:
```json
{
  "type": "img2vid",
  "options": {
    "prompt": "Dancing in the rain",
    "negative_prompt": "blurry, distorted"
  }
}
```

**Response**:
```json
{
  "job_id": 123,
  "status": "processing"
}
```

**Implementation**:
1. Authenticate user via JWT
2. Fetch last uploaded media URL from `miniapp_creations`
3. Verify user has sufficient credits
4. Call `A2EService.startTask(type, mediaUrl, options)`
5. Create job record with `a2e_task_id`
6. Deduct credits from user balance
7. Start background status polling
8. Return job_id

**Background Polling**:
- Poll interval: 10 seconds
- Store active polls in `pollingJobs` Map
- On completion:
  - Update job status to 'completed'
  - Store result_url
  - Clear polling interval
- On failure:
  - Update job status to 'failed'
  - Store error_message
  - Refund credits to user
  - Clear polling interval

#### GET `/api/web/status?id=<job_id>`
**Purpose**: Check job processing status

**Response**:
```json
{
  "id": 123,
  "status": "completed",
  "result_url": "https://video.a2e.ai/results/...",
  "cost_credits": 180,
  "created_at": "2025-01-04T19:50:00.000Z"
}
```

#### GET `/api/web/creations`
**Purpose**: List user's completed jobs

**Response**:
```json
[
  {
    "id": 123,
    "type": "img2vid",
    "status": "completed",
    "result_url": "https://video.a2e.ai/results/...",
    "created_at": "2025-01-04T19:50:00.000Z"
  }
]
```

### 4. Credit System

#### GET `/api/web/credits`
**Response**:
```json
{
  "balance": 1500
}
```

#### GET `/api/web/packs`
**Response**: Credit pack configuration from `shared/config/packs.js`

**Example Packs**:
```javascript
[
  { code: 'small', name: 'Small Pack', points: 500, price_cents: 999 },
  { code: 'medium', name: 'Medium Pack', points: 1200, price_cents: 1999 },
  { code: 'large', name: 'Large Pack', points: 3000, price_cents: 3999 }
]
```

### 5. Stripe Integration

#### POST `/api/web/checkout`
**Purpose**: Create Stripe Checkout session for credit purchase

**Request**:
```json
{
  "pack_type": "medium"
}
```

**Response**:
```json
{
  "session_id": "cs_test_...",
  "url": "https://checkout.stripe.com/pay/cs_test_..."
}
```

**Webhook**: POST `/api/stripe/webhook`
- Event: `checkout.session.completed`
- Action:
  1. Verify webhook signature
  2. Extract user_id and pack_type from metadata
  3. Add credits to user balance
  4. Create purchase record
  5. Return 200 OK

## Catalog Configuration

**File**: `shared/config/catalog.js`

```javascript
[
  {
    key: 'faceswap',
    label: 'Face Swap',
    icon: '🎭',
    cost_credits: 60
  },
  {
    key: 'img2vid',
    label: 'Image to Video',
    icon: '🎬',
    cost_credits: 180,
    supports_prompts: true
  },
  {
    key: 'enhance',
    label: 'Enhance Image',
    icon: '✨',
    cost_credits: 40
  },
  {
    key: 'bgremove',
    label: 'Remove Background',
    icon: '🖼️',
    cost_credits: 30
  },
  {
    key: 'avatar',
    label: 'Create Avatar',
    icon: '👤',
    cost_credits: 100
  }
]
```

## Frontend Pages

### Landing Page
**Route**: `/`
- Hero section with value proposition
- Feature highlights
- Pricing (credit packs)
- Sign up / Login buttons
- **Note**: Telegram login button removed

### Dashboard
**Route**: `/dashboard`
**Authentication**: Required
- Display user email
- Show credit balance
- Navigation to Create, Gallery, Purchase pages

### Create Page
**Route**: `/create`
**Authentication**: Required
- Tool selector dropdown (catalog types)
- File upload button
- Prompt inputs (for img2vid)
- Cost estimate display
- Submit button
- Processing status feedback

### Gallery Page
**Route**: `/gallery`
**Authentication**: Required
- List of user's creations
- Thumbnails with download buttons
- Filter by type/status

### Purchase Page
**Route**: `/purchase`
**Authentication**: Required
- Credit pack cards
- Stripe checkout integration
- Purchase history

## Verification Steps

### Manual Testing Checklist

1. **Authentication**:
   - [ ] Sign up new user
   - [ ] Login with credentials
   - [ ] Access /dashboard with valid token
   - [ ] Verify invalid token returns 401

2. **File Upload**:
   - [ ] Upload image via /api/web/upload
   - [ ] Verify Cloudinary URL returned
   - [ ] Check miniapp_creations table

3. **Job Processing**:
   - [ ] Process img2vid job
   - [ ] Verify A2E task created
   - [ ] Watch database for status updates
   - [ ] Verify result_url populated on completion
   - [ ] Check credits deducted

4. **Credit Purchase**:
   - [ ] Create checkout session
   - [ ] Complete Stripe test payment
   - [ ] Verify webhook updates credits
   - [ ] Check purchase record created

5. **All Catalog Types**:
   - [ ] Test faceswap
   - [ ] Test img2vid with prompts
   - [ ] Test enhance
   - [ ] Test bgremove
   - [ ] Test avatar

6. **Error Scenarios**:
   - [ ] Insufficient credits
   - [ ] Invalid file upload
   - [ ] A2E API failure (refund credits)
   - [ ] Invalid authentication

## Deployment

### Render Configuration

**File**: `render.yaml`

```yaml
services:
  - type: web
    name: faceshop-backend
    env: node
    buildCommand: npm install && cd frontend && npm install && npm run build
    startCommand: node index.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: A2E_API_KEY
        sync: false
      - key: STRIPE_SECRET_KEY
        sync: false
      - key: JWT_SECRET
        sync: false
      # ... other secrets
```

**Build Steps**:
1. Backend dependencies: `npm install`
2. Frontend dependencies: `cd frontend && npm install`
3. Frontend build: `npm run build` (creates `frontend/build`)
4. Serve static: Express serves `frontend/build` via `app.use(express.static('frontend/build'))`

## Success Criteria

✅ **Phase 0-1 Complete When**:
1. Users can sign up/login with email/password
2. All 5 catalog types process jobs via A2E API
3. Background polling updates job status automatically
4. Stripe payments add credits correctly
5. Credit deduction works with transaction safety
6. Result URLs are returned and displayable
7. Error handling refunds credits on failure
8. Frontend displays real-time job status
9. Deployed to Render and fully functional
10. No Telegram login dependencies remain

## Related Documents

- **Phase 2 Spec**: `spec-pricing.md` - Enterprise pricing and subscription system
- **Root Spec**: `spec.md` - Umbrella document explaining phase relationship
- **Implementation Report**: `report.md` - Detailed implementation notes and test results
