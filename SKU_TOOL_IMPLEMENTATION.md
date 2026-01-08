# SKU Tool Catalog Implementation

## Overview
This implementation adds a comprehensive tool catalog system that properly displays and manages all 20 SKUs across different pricing tiers and categories. Previously, only 3-5 basic tools were visible in the ChopShop, despite having a sophisticated pricing model with 20 different SKUs.

## Problem Statement
- **Before**: ChopShop only displayed 5 basic tools (faceswap, avatar, img2vid, enhance, bgremove)
- **After**: All 20 SKUs are now properly organized and displayed by category with full pricing integration
- **Goal**: Each pricing tier (Starter, Pro, Agency) shows all available tools with their corresponding capabilities and pricing

## Implementation Details

### 1. Backend Changes

#### New Service: `services/sku-tool-catalog.js`
- Maps all 20 SKUs to their corresponding A2E tools
- Organizes tools by category: Image, Video, Voice, Content, Bundles
- Provides tool configuration including:
  - Display names and icons
  - Required inputs (image, text, audio, prompt)
  - Tool-specific options
  - A2E tool mapping

**Categories:**
- **Image Tools (V1/V2)**: A1-IG, A2-BH, A3-4K, A4-BR
- **Video Tools (V3)**: C1-15, C2-30, C3-60
- **Voice & Audio (V4/V5)**: D1-VO30, D2-CLONE, D3-CLPRO, D4-5PK
- **Content & SEO (V6)**: F1-STARTER, F2-AUTH, F3-DOMINATOR
- **Bundles (V7)**: B1-30SOC, B2-90SOC, E1-ECOM25, E2-LAUNCHKIT, E3-AGENCY100

#### Updated Endpoints in `index.js`

**New Endpoints:**
1. `GET /api/web/tool-catalog` - Returns complete tool catalog organized by category with user's plan information
2. `GET /api/web/tool-catalog/:sku_code` - Returns detailed configuration for a specific SKU

**Enhanced Endpoint:**
- `POST /api/web/process` - Now accepts `sku_code` parameter and properly maps to A2E tools
  - Supports both new SKU-based and legacy type-based workflows
  - Automatically applies tool-specific options from catalog
  - Integrates with pricing engine for accurate cost calculation

### 2. Frontend Changes

#### New Component: `FaceShot-ChopShop-web/frontend/src/pages/CreateNew.js`
A complete redesign of the Create page with:

**Features:**
- **Category Navigation**: Sidebar showing 5 tool categories with tool counts
- **Tool Grid**: Visual display of all tools in selected category with:
  - Icon and name
  - Description
  - Pricing information
  - Credit cost
  - Vector classification
- **Dynamic Form**: Adapts based on selected tool's requirements:
  - Image upload for image/video tools
  - Audio upload for voice tools
  - Text input for content generation
  - Prompt input for generative tools
  - Negative prompt for fine-tuning
- **Plan Integration**: Shows user's active plan and remaining credits
- **Pricing Transparency**: Displays cost before creation

**User Experience:**
1. User selects a category (Image, Video, Voice, Content, Bundles)
2. Available tools in that category are displayed with pricing
3. User selects a tool
4. Form adapts to show required inputs for that tool
5. User provides inputs and submits
6. Job is created with proper SKU code and pricing

#### Updated Router: `FaceShot-ChopShop-web/frontend/src/App.js`
- `/create` now routes to new `CreateNew` component
- `/create-legacy` preserves old `Create` component for backward compatibility

### 3. SKU to A2E Tool Mapping

The system now properly maps SKUs to A2E tools:

| SKU Code | Tool Name | A2E Tool | Category |
|----------|-----------|----------|----------|
| A1-IG | Instagram Image 1080p | faceswap | image |
| A2-BH | Blog Hero 2K | img2img | image |
| A3-4K | 4K Print-Ready | enhance | image |
| A4-BR | Brand-Styled Image | faceswap | image |
| B1-30SOC | 30 Social Creatives | batch_img2img | bundle |
| B2-90SOC | 90 Creatives + Captions | batch_img2img | bundle |
| C1-15 | 15s Promo/Reel | img2vid | video |
| C2-30 | 30s Ad/UGC Clip | img2vid | video |
| C3-60 | 60s Explainer/YouTube | img2vid | video |
| D1-VO30 | 30s Voiceover | tts | voice |
| D2-CLONE | Standard Voice Clone | voice_clone | voice |
| D3-CLPRO | Advanced Voice Clone | voice_clone | voice |
| D4-5PK | 5x30s Voice Spots | tts | voice |
| F1-STARTER | 10 SEO Articles + Images | text_generation | content |
| F2-AUTH | 40 SEO Articles + Linking | text_generation | content |
| F3-DOMINATOR | 150 Articles + Strategy | text_generation | content |
| E1-ECOM25 | E-commerce Pack (25 SKUs) | batch_img2img | bundle |
| E2-LAUNCHKIT | Brand Launch Kit | multimodal_bundle | bundle |
| E3-AGENCY100 | Agency Asset Bank (100 assets) | multimodal_bundle | bundle |

### 4. Pricing Integration

Each tool displays its pricing tier:
- **Base Price**: Shown in USD (e.g., $4.99 - $599.00)
- **Credit Cost**: Shows how many credits/seconds required
- **Plan Benefits**: If user has active plan, shows remaining seconds
- **Overage Costs**: Automatically calculated based on user's plan

**Pricing Tiers:**
- **Starter Plan** ($19.99/mo): 600 seconds included
- **Pro Plan** ($79.99/mo): 3,000 seconds included  
- **Agency Plan** ($199.00/mo): 10,000 seconds included

### 5. Tool-Specific Options

Each SKU has pre-configured options that are automatically applied:

**Example: Video Tools**
```javascript
'C1-15': {
    a2e_tool: 'img2vid',
    options: {
        duration: 15,
        format: 'mp4',
        fps: 30
    }
}
```

**Example: Voice Clone**
```javascript
'D3-CLPRO': {
    a2e_tool: 'voice_clone',
    options: {
        quality: 'professional',
        sample_duration: 60,
        emotion_control: true
    }
}
```

## Benefits

1. **Complete Tool Visibility**: All 20 SKUs are now accessible and properly displayed
2. **Better Organization**: Tools categorized by type for easier discovery
3. **Pricing Transparency**: Users see exact costs before creating
4. **Plan Integration**: Shows how tools fit within user's subscription plan
5. **Scalability**: Easy to add new tools by adding SKU configs
6. **Backward Compatible**: Legacy endpoints still work for existing integrations

## API Usage Examples

### Get Full Catalog
```bash
GET /api/web/tool-catalog
Authorization: Bearer <token>
```

**Response:**
```json
{
  "categories": {
    "image": [...],
    "video": [...],
    "voice": [...],
    "content": [...],
    "bundle": [...]
  },
  "user_plan": {
    "code": "PRO",
    "included_seconds": 3000,
    "remaining_seconds": 2450,
    "usage_percent": "18.3"
  },
  "total_tools": 20,
  "category_names": {...}
}
```

### Create Job with SKU
```bash
POST /api/web/process
Authorization: Bearer <token>
Content-Type: application/json

{
  "sku_code": "C2-30",
  "media_url": "https://...",
  "options": {
    "prompt": "Dynamic camera movement",
    "negative_prompt": "blurry, static"
  }
}
```

## Testing Checklist

- [ ] Verify all 20 SKUs appear in catalog
- [ ] Test tool selection and form adaptation
- [ ] Verify image upload for image/video tools
- [ ] Test prompt input for generative tools
- [ ] Verify pricing display matches database
- [ ] Test job creation with various SKUs
- [ ] Verify plan integration shows correct remaining seconds
- [ ] Test legacy endpoints still work
- [ ] Verify A2E tool mapping is correct
- [ ] Test error handling for missing inputs

## Deployment Notes

1. **Database**: No schema changes required - uses existing SKU tables
2. **Environment**: No new environment variables needed
3. **Dependencies**: No new npm packages required
4. **Migration**: Automatic - new catalog service uses existing data
5. **Rollback**: Can revert to `/create-legacy` if needed

## Future Enhancements

1. **Tool Previews**: Add sample outputs for each tool
2. **Batch Creation**: Enable creating multiple jobs at once
3. **Advanced Options**: Expose more A2E parameters per tool
4. **Tool Recommendations**: Suggest tools based on user's plan and usage
5. **Favorites**: Let users favorite frequently used tools
6. **Custom Bundles**: Allow users to create custom tool bundles

## Support

For issues or questions about this implementation:
1. Check SKU configurations in `services/sku-tool-catalog.js`
2. Verify API responses in browser console
3. Check backend logs for pricing/job creation errors
4. Ensure A2E service is responding correctly
