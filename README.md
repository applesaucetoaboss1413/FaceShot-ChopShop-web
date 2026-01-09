# FaceShop-ChopShop Platform

A dual-layer AI media processing SaaS platform combining A2E API integration with enterprise pricing and subscription management.

**Status**: ✅ **Production Ready** - Ready to deploy and make money!

## Quick Start

### Deploy to Production (20 minutes)
1. **Preview**: Click Preview button to test
2. **Deploy**: Click Deploy button
3. **Configure**: See [`PRE_DEPLOYMENT_CHECKLIST.md`](./PRE_DEPLOYMENT_CHECKLIST.md)
4. **Launch**: Get your live URL and start selling!

📚 **Full deployment guide**: [`DEPLOYMENT.md`](./DEPLOYMENT.md)

## Architecture

- **Phase 0-1 (Engine Layer)**: A2E API integration, authentication, job processing, credit system
- **Phase 2 (Business Layer)**: Enterprise pricing, subscription plans, usage tracking, margin management

See [`spec.md`](./spec.md) for complete technical specification.

## Tech Stack

### Backend
- Node.js (>=20.0.0) + Express.js
- SQLite via better-sqlite3
- JWT authentication with bcrypt
- Stripe payments
- A2E API integration
- Cloudinary file storage

### Frontend
- **Vite** (Fast build tool)
- **React 18.3** with TypeScript
- **shadcn/ui** component library
- **React Query** for data fetching
- **Framer Motion** for animations
- **Tailwind CSS 3.4.17**
- Modern, professional UI/UX design

## Environment Variables

### Core Configuration
```env
# Server
PORT=3000
NODE_ENV=production
DB_PATH=production.db
PUBLIC_URL=https://your-backend.onrender.com
FRONTEND_URL=https://your-frontend.onrender.com
LOG_LEVEL=info
```

### Authentication
```env
# JWT Secret (generate with: openssl rand -hex 32)
JWT_SECRET=your_jwt_secret_here
```

### A2E API Integration (Phase 0-1)
```env
# A2E API credentials
A2E_API_KEY=your_a2e_api_key_here
A2E_BASE_URL=https://video.a2e.ai
```

### Stripe Payments
```env
# Stripe API keys (test or live)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### File Upload (Cloudinary)
```env
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

### Admin
```env
ADMIN_SECRET=your_admin_secret_here
```

### Pricing System (Phase 2)
```env
# Cost per A2E credit (based on A2E Pro subscription: $19.99/1800 credits)
COST_PER_CREDIT=0.0111

# Minimum margin percentage (0.40 = 40%)
MIN_MARGIN=0.40

# Maximum job duration in seconds
MAX_JOB_SECONDS=5000
```

## Installation

### Backend
```bash
npm install
```

### Frontend
```bash
cd frontend
npm install
```

## Development

### Start Backend (Development)
```bash
npm start
```
Server runs on `http://localhost:3000`

### Start Frontend (Development)
```bash
cd frontend
npm run dev
```
Frontend runs on `http://localhost:8080` with hot reload

**Note**: The frontend automatically proxies API requests to the backend during development.

## Build & Deploy

### Single Source of Truth

All deployment configurations use the same standardized commands:

#### Frontend Build Process
```bash
# Install backend dependencies
npm install

# Install frontend dependencies and build
cd frontend && npm install && npm run build
```
**Result**: Creates `frontend/dist/` directory with optimized production build

#### Backend Start Process
```bash
# Serve built frontend + API
NODE_ENV=production node index.js
```
**Behavior**: Express serves static files from `frontend/dist/` and handles API routes

### Platform-Specific Configurations

#### Local Development
```bash
# Start backend (serves built frontend)
npm start
```

#### Docker
```bash
# Build and run
docker-compose up --build
```

#### Render
- **Build Command**: `npm install && cd frontend && npm install && npm run build`
- **Start Command**: `NODE_ENV=production node index.js`

#### Vercel (Frontend Only)
- **Build Command**: `cd frontend && npm install && npm run build`
- **Output Directory**: `frontend/dist`

### Environment Variables
All platforms use the same environment variable names (see `.env.example`)

## Database Schema

### Phase 0-1 Tables
- `users` - User accounts (email/password)
- `user_credits` - Credit balances
- `purchases` - Purchase history
- `jobs` - A2E job processing records
- `miniapp_creations` - Uploaded media files
- `analytics_events` - Analytics tracking

### Phase 2 Tables
- `plans` - Subscription plans (Pro: $79.99/month)
- `skus` - Product catalog (3 SKUs: video, image, bundle)
- `flags` - Price modifiers (Rapid, Custom, Batch)
- `user_plans` - User subscriptions
- `plan_usage` - Monthly usage tracking
- `orders` - Order history with pricing details

**Migration**: Tables created automatically via `CREATE TABLE IF NOT EXISTS` on server start.

### Database Migration Guide

#### Environment Separation
- **Development**: Use `dev.db` (default) - ignored by Git, safe for local development
- **Production**: Use `production.db` or external database path - never committed to Git
- **Staging/Testing**: Use separate database files or environment-specific paths

#### Configuration
Set `DB_PATH` environment variable to control database location:
```env
# Development (default)
DB_PATH=dev.db

# Production
DB_PATH=/var/data/production.db

# Future Postgres migration
DB_PATH=postgresql://user:pass@host:5432/dbname
```

#### Migration Strategy
The app uses lightweight migrations compatible with SQLite:
1. **Automatic Schema Creation**: `CREATE TABLE IF NOT EXISTS` ensures tables exist
2. **Column Additions**: `ALTER TABLE ADD COLUMN IF NOT EXISTS` for schema evolution
3. **Data Seeding**: Initial data inserted with `INSERT OR IGNORE` to prevent duplicates

#### Resetting Database
To reset your database (⚠️ **destroys all data**):
```bash
# Remove database file
rm dev.db  # or production.db

# Restart server (auto-creates tables and seeds data)
npm start
```

#### Security Notes
- Database files contain sensitive user data - never commit to version control
- Use environment-specific database files to prevent data mixing
- Consider encrypting database files in production environments

## API Endpoints

### Authentication (Phase 0-1)
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### File Upload & Processing (Phase 0-1)
- `POST /api/web/upload` - Upload media to Cloudinary
- `POST /api/web/process` - Start A2E job processing
- `GET /api/web/status?id=<job_id>` - Get job status
- `GET /api/web/creations` - List user's jobs

### Credits & Payments (Phase 0-1)
- `GET /api/web/credits` - Get credit balance
- `GET /api/web/packs` - List credit packs
- `POST /api/web/checkout` - Create Stripe checkout session
- `POST /api/stripe/webhook` - Stripe webhook handler

### Pricing & Subscriptions (Phase 2)
- `POST /api/pricing/quote` - Get pricing estimate
- `GET /api/plans` - List subscription plans
- `POST /api/subscribe` - Create Stripe subscription
- `POST /api/orders/create` - Create order with pricing

### Catalog
- `GET /api/web/catalog` - Get available tools

## Workflow Examples

### Credit-Only User (Phase 0-1)
```
1. Sign up/login
2. Purchase credits via Stripe
3. Upload media
4. Process job (deducts credits)
5. Poll status
6. Download result
```

### Subscription User (Phase 2)
```
1. Sign up/login
2. Subscribe to plan
3. Get pricing quote
4. Create order
5. Upload media
6. Process job (uses order_id, deducts plan usage)
7. Poll status
8. Download result
```

## Testing

### Manual Testing Checklist (Phase 0-1)
- [ ] Signup/login with email/password
- [ ] Upload image file
- [ ] Process each catalog type (faceswap, img2vid, enhance, bgremove, avatar)
- [ ] Verify background polling updates job status
- [ ] Verify result_url returned on completion
- [ ] Purchase credit pack via Stripe
- [ ] Verify webhook updates credits

### Pricing System Testing (Phase 2)
- [ ] Get pricing quote for SKU
- [ ] Create order
- [ ] Process job with order_id
- [ ] Verify plan usage deducted
- [ ] Verify overage charges calculated
- [ ] Subscribe to plan via Stripe

## Project Structure

```
.
├── index.js                 # Express server + API routes
├── services/
│   ├── a2e.js              # A2E API client
│   └── pricing.js          # Pricing engine (Phase 2)
├── shared/
│   └── config/
│       ├── packs.js        # Credit pack definitions
│       └── catalog.js      # Tool catalog
├── frontend/
│   ├── src/
│   │   ├── pages/          # React pages
│   │   ├── lib/
│   │   │   ├── api.js      # API client
│   │   │   └── auth.js     # Auth context
│   │   └── App.js
│   └── public/
├── spec.md                  # Root specification
├── spec-a2e-original.md    # Phase 0-1 spec
├── spec-pricing.md         # Phase 2 spec
└── README.md               # This file
```

## Troubleshooting

### Database Initialization
Tables are created automatically on first run. To reset:
```bash
rm production.db
npm start
```

### A2E API Errors
- Verify `A2E_API_KEY` is correct
- Check A2E API status at https://video.a2e.ai
- Review logs with `LOG_LEVEL=debug`

### Stripe Webhook Not Working
- Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- Test locally with Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

### Pricing Margin Errors
- Ensure `COST_PER_CREDIT` and `MIN_MARGIN` are set correctly
- Review SKU base prices in database seed data
- Check logs for margin calculation details

## Related Documentation

- **Root Spec**: [`spec.md`](./spec.md) - Umbrella specification
- **Phase 0-1 Spec**: [`spec-a2e-original.md`](./spec-a2e-original.md) - A2E integration
- **Phase 2 Spec**: [`spec-pricing.md`](./spec-pricing.md) - Pricing system
- **Implementation Report**: [`report.md`](./report.md) - Detailed implementation notes

## License

Proprietary - All rights reserved

---

**Last Updated**: 2025-01-04  
**Version**: 2.0 (Phase 0-1 complete, Phase 2 in refactor)
