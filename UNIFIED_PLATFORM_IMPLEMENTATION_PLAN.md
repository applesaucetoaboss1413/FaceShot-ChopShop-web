# Unified Platform Implementation Plan

## Executive Summary
This document outlines the comprehensive refactoring to unify the FaceShot-ChopShop platform, addressing user confusion, improving UX clarity, and creating a single unified interface.

## Current State Analysis

### Tools Inventory
**Actual Tool Count: 20 SKUs** (NOT 21 as claimed on landing page)

#### Image Generation (4 tools)
- A1-IG: Instagram Image 1080p (faceswap)
- A2-BH: Blog Hero 2K (img2img)
- A3-4K: 4K Print-Ready (enhance)
- A4-BR: Brand-Styled Image (faceswap)

#### Social Bundles (2 tools)
- B1-30SOC: 30 Social Creatives (batch_img2img)
- B2-90SOC: 90 Creatives + Captions (batch_img2img)

#### Video Generation (3 tools)
- C1-15: 15s Promo/Reel (img2vid)
- C2-30: 30s Ad/UGC Clip (img2vid)
- C3-60: 60s Explainer/YouTube (img2vid)

#### Voice & Clone (4 tools)
- D1-VO30: 30s Voiceover (tts)
- D2-CLONE: Standard Voice Clone (voice_clone)
- D3-CLPRO: Advanced Voice Clone (voice_clone)
- D4-5PK: 5x30s Voice Spots (tts)

#### SEO Content (3 tools)
- F1-STARTER: 10 SEO Articles + Images
- F2-AUTH: 40 SEO Articles + Linking
- F3-DOMINATOR: 150 Articles + Strategy

#### Multi-Modal Bundles (3 tools)
- E1-ECOM25: E-commerce Pack (25 SKUs)
- E2-LAUNCHKIT: Brand Launch Kit
- E3-AGENCY100: Agency Asset Bank (100 assets)

### Dashboard Tools (Current)
- Face Swap: 1 credit
- AI Avatar: 3 credits
- Image to Video: 5 credits

### Current Pricing Structure
**Subscriptions:**
- Starter: $19.99/mo - 4,000 credits (~10 min video)
- Pro: $79.99/mo - 20,000 credits (~50 min video)
- Agency: $199/mo - 60,000 credits (~150 min video)

**One-Time Bundles:**
- E-commerce Pack: $225 - 45,000 credits
- Brand Launch: $449 - 100,000 credits
- Agency Asset Bank: $599 - 150,000 credits

## Implementation Plan

### Phase 1: Fix Tool Count & Bundle Specifications ✅

#### 1.1 Update Tool Count References
- [x] Update landing page from "21" to "20 professional tools"
- [ ] Create ToolCatalogSection component displaying all 20 tools by category
- [ ] Add tool category icons and descriptions

#### 1.2 Create Bundle Specification Component
- [ ] Design BundleSpecificationSection with:
  - Tool breakdown per bundle
  - Credit allocation visualization
  - Usage examples
  - Output specifications
  - Interactive calculator

### Phase 2: Pricing Clarity & Free Tier 🔄

#### 2.1 Enhanced Pricing with Video Limits
Update EnhancedPricingSection to show:
```
Starter ($19.99/mo):
- 4,000 credits
- Video: ~10 minutes total (max 60s per video, SD quality)
- Face Swap: ~40 operations
- AI Avatars: ~13 generations
- Example: 20x 30-second videos

Pro ($79.99/mo):
- 20,000 credits  
- Video: ~50 minutes total (max 120s per video, HD quality)
- Face Swap: ~200 operations
- AI Avatars: ~66 generations
- Example: 100x 30-second videos

Agency ($199/mo):
- 60,000 credits
- Video: ~150 minutes total (max 300s per video, 4K quality)
- Face Swap: Unlimited
- AI Avatars: Unlimited
- Example: 300x 30-second videos
```

#### 2.2 Free Tier Implementation
- [ ] Add "Free" plan to database schema
- [ ] Free tier: 0$/mo - 100 credits (one-time trial)
- [ ] Limit to 1x face swap, 1x avatar, basic quality
- [ ] Add "Try Free" CTA on landing page
- [ ] Backend: Support free tier credit allocation

### Phase 3: Currency Detection & Conversion 💱

#### 3.1 Create CurrencySelector Component
```typescript
Features:
- Auto-detect user currency from browser locale
- Support: USD, EUR, GBP, CAD, AUD, JPY, INR
- Manual currency selector dropdown
- Real-time price conversion
- Store preference in localStorage
```

#### 3.2 Currency Conversion Logic
- Use fixed exchange rates (update quarterly)
- Display format: "$19.99 USD" or "¥1,299 JPY"
- Add currency info to pricing API

### Phase 4: Points/Credits Visibility 📊

#### 4.1 Add Credit Balance Display
- [ ] Update Navbar with CreditBalance widget
- [ ] Show: Available credits, pending usage
- [ ] Link to purchase more credits
- [ ] Real-time updates via API

#### 4.2 Create Points History Page
```typescript
PointsHistoryPage features:
- Transaction log (purchases, usage, refunds)
- Filter by date range, type
- Download CSV export
- Usage analytics charts
- Credit expiration warnings
```

### Phase 5: Unified ChopShop Interface 🎨

#### 5.1 Dashboard Migration Analysis
Current Dashboard features to migrate:
1. Tool selector (face-swap, avatar, image-to-video)
2. Image upload interface
3. Processing queue with status
4. Results display & download
5. History panel
6. Credit balance display

#### 5.2 Enhanced ChopShop Interface
Create unified interface with:
- All 20 tools organized by category tabs
- Tool selector with SKU descriptions
- Smart input forms (adapts to tool requirements)
- Preview & estimate credits before processing
- Processing queue with progress
- Results gallery with download/share
- Purchase credits inline if insufficient

#### 5.3 Remove Redundant Dashboard
Once ChopShop migration complete:
- [ ] Verify all tools accessible from ChopShop
- [ ] Test complete user workflows
- [ ] Update navigation (remove /dashboard route)
- [ ] Redirect /dashboard → /chopshop

### Phase 6: Backend Improvements 🔧

#### 6.1 Free Tier Support
```sql
-- Add free plan
INSERT INTO plans (code, name, included_seconds, overage_rate_per_second_cents)
VALUES ('FREE', 'Free Trial', 100, 0);

-- Grant to new users
UPDATE users SET initial_free_credits = 100 WHERE created_at > NOW();
```

#### 6.2 Credit Deduction Logic
- [ ] Validate credit balance before processing
- [ ] Proper error handling for insufficient credits
- [ ] Transaction logging for all operations
- [ ] Refund logic for failed jobs

#### 6.3 Tool Availability by Tier
- Free: Basic tools only (face swap, simple avatar)
- Starter: All tools, standard quality
- Pro: All tools, HD quality, priority queue
- Agency: All tools, 4K quality, dedicated support

## Component Architecture

### New Components to Create

```
ai-image-chop-shop-src/src/
├── components/
│   ├── landing/
│   │   ├── ToolCatalogSection.tsx        [NEW]
│   │   ├── BundleSpecificationSection.tsx [NEW]
│   │   └── EnhancedPricingSection.tsx     [UPDATED]
│   ├── chopshop/
│   │   ├── UnifiedToolSelector.tsx        [NEW]
│   │   ├── ToolInputForm.tsx              [NEW]
│   │   ├── ProcessingQueue.tsx            [NEW]
│   │   └── ResultsGallery.tsx             [NEW]
│   ├── shared/
│   │   ├── CurrencySelector.tsx           [NEW]
│   │   ├── CreditBalance.tsx              [NEW]
│   │   └── CreditCalculator.tsx           [NEW]
├── pages/
│   ├── PointsHistory.tsx                  [NEW]
│   ├── ChopShop.tsx                       [UPDATED]
│   └── Dashboard.tsx                      [DEPRECATE]
└── lib/
    ├── currency.ts                        [NEW]
    └── toolCatalog.ts                     [NEW]
```

## Testing Checklist

### Frontend Tests
- [ ] All 20 tools displayed correctly
- [ ] Currency detection works
- [ ] Currency selector updates prices
- [ ] Credit balance updates in real-time
- [ ] Points history loads and filters correctly
- [ ] Free tier signup grants 100 credits
- [ ] Tool unavailable when insufficient credits

### Backend Tests
- [ ] Free tier credits allocated correctly
- [ ] Credit deduction accurate per tool
- [ ] Transaction logging works
- [ ] Refunds process correctly
- [ ] Tool availability enforced by tier
- [ ] Margin calculations correct

### Integration Tests
- [ ] Complete user flow: Signup → Try Free → Purchase → Use Tool
- [ ] Bundle purchase adds correct credits
- [ ] Subscription renewal works
- [ ] Credit expiration logic
- [ ] Multi-currency checkout

## Success Metrics

### UX Improvements
- ✅ Users can see all 20 tools before purchase
- ✅ Bundle specifications clearly displayed
- ✅ Video length limits explicit per tier
- ✅ Try before buy with free tier
- ✅ Credit balance always visible
- ✅ Transaction history accessible

### Technical Improvements
- ✅ Single unified interface (no dashboard confusion)
- ✅ Consistent tool count across all pages
- ✅ Currency localization working
- ✅ Free tier backend support
- ✅ Proper error handling

## Timeline

- **Phase 1-2**: 2 days (Tool catalog, bundle specs, pricing clarity)
- **Phase 3-4**: 1 day (Currency, points history)
- **Phase 5**: 2 days (ChopShop unification)
- **Phase 6**: 1 day (Backend improvements)
- **Testing**: 1 day
- **Total**: 7 days

## Risk Mitigation

### Potential Issues
1. **Breaking changes**: Gradual rollout, feature flags
2. **Performance**: Lazy load tool catalog, optimize images
3. **Currency API**: Use fallback static rates if API fails
4. **Migration**: Keep dashboard as fallback for 1 release cycle

### Rollback Plan
- Feature flags for new components
- Database migrations reversible
- Keep old dashboard accessible via direct URL
- A/B test unified interface before full rollout

## Launch Strategy

1. **Beta Testing** (Week 1)
   - Enable for 10% of users
   - Collect feedback
   - Fix critical bugs

2. **Gradual Rollout** (Week 2-3)
   - 25% → 50% → 75% → 100%
   - Monitor error rates
   - Performance metrics

3. **Full Launch** (Week 4)
   - Remove old dashboard
   - Update all documentation
   - Send announcement email

## Notes

- All credit values in pricing are estimates based on tool costs
- Video minute calculations: 1 credit ≈ 0.0025 minutes (400 credits/min)
- Free tier prevents abuse with rate limiting
- Currency rates update via scheduled job
- Tool descriptions sourced from sku-tool-catalog.js

## References

- `/services/sku-tool-catalog.js` - Complete tool mapping
- `/services/pricing.js` - Pricing engine logic
- `/ai-image-chop-shop-src/src/pages/Dashboard.tsx` - Current dashboard
- `/ai-image-chop-shop-src/src/components/landing/EnhancedPricingSection.tsx` - Pricing UI
