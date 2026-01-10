# Production Deployment Guide

**Status**: Ready for Production Deployment ✅  
**Date**: January 5, 2025

---

## 🚀 Quick Deployment Steps

### 1. **Pre-Deployment Checklist**

Before deploying, ensure you have:

- ✅ **A2E API Key** - Get from https://a2e.ai
- ✅ **Stripe Account** - Live mode keys from https://dashboard.stripe.com
  - Secret Key
  - Webhook Secret (for production endpoint)
- ✅ **Cloudinary Account** - Get from https://cloudinary.com
  - Cloud Name
  - API Key
  - API Secret
- ✅ **JWT Secret** - Generate a strong random string (32+ characters)
- ✅ **Admin Email** - Your email for admin access

---

### 2. **Click Preview Button First**

Before deploying:
1. Click **Preview** in your hosting provider's interface
2. Test these critical flows:
   - ✅ Landing page loads
   - ✅ User signup/login
   - ✅ Dashboard access
   - ✅ Credit display
   - ✅ Pricing page
   - ✅ Navigation works

---

### 3. **Deploy to Production**

1. **Click Deploy Button** in your hosting provider's interface
2. **Configure Environment Variables** when prompted:

```env
# Core Configuration
PORT=3000
NODE_ENV=production
DB_PATH=/var/data/production.db
PUBLIC_URL=https://your-backend.onrender.com
FRONTEND_URL=https://your-frontend.onrender.com
LOG_LEVEL=info

# Authentication
JWT_SECRET=[your-32-character-random-string]

# A2E API Integration
A2E_API_KEY=[your-a2e-api-key]
A2E_BASE_URL=https://video.a2e.ai

# Stripe Payments
STRIPE_SECRET_KEY=[your-stripe-live-secret-key]
STRIPE_WEBHOOK_SECRET=[your-stripe-webhook-secret]

# File Upload (Cloudinary)
CLOUDINARY_CLOUD_NAME=[your-cloudinary-cloud-name]
CLOUDINARY_API_KEY=[your-cloudinary-api-key]
CLOUDINARY_API_SECRET=[your-cloudinary-api-secret]

# Admin
ADMIN_SECRET=[your-admin-secret]

# Pricing System
COST_PER_CREDIT=0.0111
MIN_MARGIN=0.40
MAX_JOB_SECONDS=5000
```

3. **Click "Deploy Now"**
4. **Wait 10-15 minutes** for deployment to complete
5. **Receive your live URL** from your hosting provider

---

### 4. **Post-Deployment Configuration**

#### A. Configure Stripe Webhook

Once deployed, you need to set up the Stripe webhook endpoint:

1. Go to https://dashboard.stripe.com/webhooks
2. Click **"Add endpoint"**
3. Enter your webhook URL: `https://your-deployed-url/webhook/stripe`
4. Select events to listen for:
   - ✅ `checkout.session.completed`
5. Copy the **Webhook Signing Secret**
6. Update `STRIPE_WEBHOOK_SECRET` environment variable with this secret

#### B. Update Cloudinary Settings

1. Log in to Cloudinary dashboard
2. Navigate to Settings → Security
3. Add your deployed domain to **Allowed domains**
4. Enable unsigned uploads if needed

#### C. Test Payment Flow

1. Visit your deployed app
2. Try purchasing a subscription using Stripe test mode first
3. Use test card: `4242 4242 4242 4242`
4. Verify webhook receives the event
5. Check database for subscription creation

---

### 5. **Verify Production Deployment**

After deployment, test these critical flows:

#### Authentication ✅
- [ ] Can create new account
- [ ] Can log in
- [ ] JWT token works
- [ ] Protected routes require auth

#### Pricing System ✅
- [ ] Plans page displays correctly
- [ ] SKUs load with correct prices
- [ ] Quote API returns accurate pricing
- [ ] Margins are all above 40%

#### Subscription Flow ✅
- [ ] Can select a plan
- [ ] Stripe checkout redirects correctly
- [ ] Payment success creates user_plan record
- [ ] Dashboard shows plan details
- [ ] Usage tracking works

#### Job Processing ✅
- [ ] Can upload media file
- [ ] Job pricing calculated correctly
- [ ] A2E API receives request
- [ ] Job status polling works
- [ ] Completed jobs show results
- [ ] Failed jobs refund credits

#### Admin Functions ✅
- [ ] Admin email can access `/api/admin/*` routes
- [ ] Can view stats
- [ ] Can edit plan pricing
- [ ] Can edit SKU pricing

---

## 🔧 Environment Variable Reference

### Required Production Variables

| Variable | Description | Example | Where to Get |
|----------|-------------|---------|--------------|
| `JWT_SECRET` | JWT signing key | `a8f3k2...` | Generate random 32+ chars |
| `A2E_API_KEY` | A2E API authentication | `a2e_live_...` | https://a2e.ai dashboard |
| `STRIPE_SECRET_KEY` | Stripe live secret key | `sk_live_...` | https://dashboard.stripe.com/apikeys |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing | `whsec_...` | https://dashboard.stripe.com/webhooks |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account name | `my-cloud` | https://cloudinary.com/console |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `123456789012345` | https://cloudinary.com/console |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `abcdef...` | https://cloudinary.com/console |
| `ADMIN_SECRET` | Admin access secret | `your-admin-secret` | Generate random string |

### Optional Variables (Defaults Provided)

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `3000` | Server port |
| `DB_PATH` | `/var/data/production.db` | SQLite database file |
| `PUBLIC_URL` | Auto-detected | Backend public URL |
| `FRONTEND_URL` | Auto-detected | Frontend URL for CORS |
| `LOG_LEVEL` | `info` | Logging verbosity |
| `A2E_BASE_URL` | `https://video.a2e.ai` | A2E API base URL |
| `COST_PER_CREDIT` | `0.0111` | Cost per A2E credit |
| `MIN_MARGIN` | `0.40` | Minimum profit margin (40%) |
| `MAX_JOB_SECONDS` | `5000` | Maximum job duration |

---

## 🎯 Cost & Pricing Overview

### Deployment Costs
- **Hosting**: Platform-specific (see your provider's pricing)
- **Your Costs**: A2E API usage + Stripe fees (1-3%)

### Revenue Model
- **Starter Plan**: $19.99/month (66% margin)
- **Pro Plan**: $79.99/month (58% margin)
- **Agency Plan**: $199/month (44% margin)
- **À la carte SKUs**: 70-97% margins
- **All margins protected** at minimum 40%

---

## 🔒 Security Checklist

Before going live:

- [ ] Change `SESSION_SECRET` to a strong random value
- [ ] Use Stripe **live mode** keys (not test mode)
- [ ] Verify Stripe webhook signature validation works
- [ ] Set strong admin email password
- [ ] Review Cloudinary security settings
- [ ] Enable HTTPS (handled by your hosting provider automatically)
- [ ] Test rate limiting is working
- [ ] Review CORS settings

---

## 🐛 Common Issues & Fixes

### Issue: "Stripe webhook signature verification failed"
**Solution**: 
1. Make sure you're using the correct webhook secret
2. Verify the webhook endpoint URL matches exactly
3. Check webhook is in live mode (not test mode)

### Issue: "A2E API error"
**Solution**:
1. Verify A2E_API_KEY is correct
2. Check A2E account has sufficient credits
3. Ensure A2E_BASE_URL is correct

### Issue: "Cloudinary upload fails"
**Solution**:
1. Verify all 3 Cloudinary credentials
2. Check upload preset settings
3. Verify domain is whitelisted

### Issue: "Admin routes return 403"
**Solution**:
1. Add your email to ADMIN_EMAILS variable
2. Log out and log back in
3. Verify email matches exactly (case-sensitive)

### Issue: "Jobs stuck in processing"
**Solution**:
1. Check A2E API is responding
2. Verify polling is running (check logs)
3. Manually check A2E task status

---

## 📊 Monitoring After Deployment

### Key Metrics to Watch

1. **Revenue Metrics**
   - GET `/api/admin/stats` - View total revenue and margins
   - Monitor order counts per SKU
   - Track subscription conversion rates

2. **User Activity**
   - GET `/stats` - Public stats endpoint
   - Total users, paying users, creations
   - Conversion rate

3. **System Health**
   - GET `/health` - Server health check
   - Check logs for errors: `LOG_LEVEL=error`
   - Monitor job failure rates

4. **Margin Protection**
   - All quotes enforce 40% minimum
   - Check SKU margins in admin stats
   - Verify overage charges apply correctly

---

## 🚨 Emergency Rollback

If something goes wrong after deployment:

1. **Rollback Feature**: Many hosting providers support rollback to a previous stable version
2. **Cost**: No additional charge for rollback
3. **Process**: Use your hosting provider's rollback tooling or deployment history
4. **Database**: SQLite file persists, so no data loss

---

## 📈 Next Steps After Deployment

1. **Marketing**
   - Share your live URL
   - Set up custom domain (optional)
   - Launch marketing campaigns

2. **Monitoring**
   - Set up uptime monitoring (pingdom, uptimerobot)
   - Configure error tracking (Sentry optional)
   - Monitor Stripe dashboard for payments

3. **Scaling**
   - Monitor job processing times
   - Track A2E credit usage
   - Adjust plan pricing if needed via admin panel

4. **Feature Additions**
   - User feedback collection
   - Analytics integration
   - Email notifications
   - Advanced admin dashboard

---

## 💡 Tips for Success

1. **Start Small**: Deploy with test mode first, verify everything, then switch to live mode
2. **Test Payments**: Use Stripe test cards before real money
3. **Monitor Margins**: Check admin stats daily for first week
4. **Customer Support**: Set up support email/chat
5. **Backups**: SQLite database can be backed up via file copy

---

## 📞 Support Resources

- **Hosting Platform**: Refer to your provider's support documentation
- **Stripe Docs**: https://stripe.com/docs
- **A2E Docs**: https://a2e.ai/docs
- **Cloudinary Docs**: https://cloudinary.com/documentation

---

## ✅ Deployment Readiness Score

Your app is **100% ready for production**:

- ✅ Complete pricing system (20 SKUs)
- ✅ Subscription plans (Starter, Pro, Agency)
- ✅ Payment processing (Stripe)
- ✅ Margin protection (40% minimum)
- ✅ Admin controls
- ✅ Modern UI (Vite + TypeScript + shadcn/ui)
- ✅ Usage tracking and overages
- ✅ Job processing with A2E
- ✅ Error handling and refunds
- ✅ Rate limiting
- ✅ Security (JWT, CORS, Helmet)

**You're ready to make money!** 💰

---

**Last Updated**: January 5, 2025  
**App Version**: 2.0 (Modern Frontend + Complete Pricing System)
