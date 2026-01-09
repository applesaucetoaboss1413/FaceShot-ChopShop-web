# A2E.ai API Tool Mapping
## Complete SKU → A2E Endpoint Configuration

This document maps every SKU in the pricing system to specific A2E.ai API endpoints with exact parameters.

---

## 📋 Overview

**Cost Baseline**: 1 credit = $0.0111 (based on $19.99 → 1,800 credits worst-case)
**Credit-to-Second**: 1 second of video ≈ 1 credit (A2E's 60s video ≈ 60 credits)

---

## 🎨 V1: Image Generation SKUs

> **Note**: A2E.ai doesn't have direct text-to-image generation. We use **Image-to-Video** + **single frame extraction** OR integrate with external image gen APIs (Replicate/Stability) then use A2E for enhancement/processing.

### A1-IG: Instagram Image 1080p
**Price**: $4.99 | **Credits**: 60 | **Cost**: $0.67

**Implementation Strategy**:
```javascript
// Option 1: Use external image gen API (Flux/SDXL) then A2E enhancement
{
  step1_external: "replicate/flux-schnell",
  step2_a2e: "/api/v1/userImage2Video/start", // Generate 5s video
  step3_extract: "Extract frame 0 as image",
  params: {
    resolution: "1080x1080",
    style: "social_media",
    format: "jpg"
  }
}

// Option 2: Use A2E Avatar with static pose + screenshot
{
  endpoint: "/api/v1/video/generate",
  extract_frame: true,
  params: {
    resolution: 1080,
    duration: 1, // Minimal duration
    web_bg_width: 1080,
    web_bg_height: 1080
  }
}
```

**Customer Options**:
- Style: Photo, Illustration, Product Shot
- Aspect Ratio: Square (1:1), Portrait (4:5), Landscape (16:9)

---

### A2-BH: Blog Hero 2K
**Price**: $9.99 | **Credits**: 90 | **Cost**: $1.00

**A2E Configuration**:
```javascript
{
  method: "external_gen_then_upscale",
  upscale_endpoint: "/api/v1/video/generate", // Higher resolution
  params: {
    resolution: 1440, // 2K
    web_bg_width: 2560,
    web_bg_height: 1440,
    format: "png" // Higher quality for blog heroes
  }
}
```

**Customer Options**:
- Theme: Tech, Business, Lifestyle, Nature
- Text Overlay: Yes/No
- Format: JPG (smaller) / PNG (quality)

---

### A3-4K: 4K Print-Ready
**Price**: $14.99 | **Credits**: 140 | **Cost**: $1.55

**A2E Configuration**:
```javascript
{
  method: "max_quality_generation",
  params: {
    resolution: 2160, // 4K
    web_bg_width: 3840,
    web_bg_height: 2160,
    format: "png",
    quality: "maximum"
  }
}
```

**Customer Options**:
- Print Size: A4, A3, Poster
- Color Space: RGB, CMYK
- DPI: 300 (print), 150 (large format)

---

### A4-BR: Brand-Styled Image
**Price**: $24.99 | **Credits**: 180 | **Cost**: $2.00

**A2E Configuration**:
```javascript
{
  endpoint: "/api/v1/userVideoTwin/startTraining", // Custom avatar/style
  then: "/api/v1/video/generate",
  params: {
    custom_style: true,
    brand_colors: "user_provided",
    consistency_model: "trained",
    resolution: 1080
  }
}
```

**Customer Options**:
- Upload brand guidelines
- Brand colors (hex codes)
- Logo placement
- Style reference images

---

## 📱 V2: Image Utility Tools

These use **existing A2E background removal** capability:

```javascript
{
  background_removal: {
    // Already implemented in services/a2e.js
    method: "background_matting",
    a2e_param: "anchor_background_color" // or anchor_background_img
  }
}
```

---

## 🎬 V3: Video Generation SKUs

### C1-15: 15s Promo/Reel
**Price**: $29 | **Credits**: 90 | **Cost**: $1.00

**A2E Endpoint**: `/api/v1/video/generate`

```javascript
{
  endpoint: "/api/v1/video/generate",
  params: {
    title: "15s Promo",
    anchor_id: "user_selected_avatar",
    anchor_type: 1, // 0=system, 1=custom
    audioSrc: "from_tts_or_upload",
    resolution: 1080,
    web_bg_width: 1080,
    web_bg_height: 1920, // Vertical for reels
    isSkipRs: true, // Skip smart motion for speed
    duration: 15 // Actual duration controlled by audio length
  },
  credits_calculation: {
    base: 60, // 15s base
    resolution_modifier: 1.0, // 1080p standard
    additional: 30 // Processing overhead
  }
}
```

**Customer Options**:
- Avatar: Select from public or custom
- Orientation: Vertical (9:16), Square (1:1), Horizontal (16:9)
- Voice: Upload audio OR use TTS
- Background: Solid color, Custom image, Green screen

**A2E TTS Integration** (if customer wants TTS):
```javascript
{
  step1: "/api/v1/video/send_tts",
  params: {
    msg: "user_script",
    tts_id: "voice_id", // or user_voice_id for clone
    speechRate: 1.0,
    country: "en",
    region: "US"
  },
  step2_use_audio: "use returned audio URL in video/generate"
}
```

---

### C2-30: 30s Ad/UGC Clip
**Price**: $59 | **Credits**: 180 | **Cost**: $2.00

**A2E Endpoint**: `/api/v1/video/generate`

```javascript
{
  endpoint: "/api/v1/video/generate",
  params: {
    anchor_id: "user_avatar",
    audioSrc: "user_audio_or_tts",
    resolution: 1080,
    web_bg_width: 1920,
    web_bg_height: 1080,
    isSkipRs: true,
    // Caption options
    isCaptionEnabled: true,
    captionAlign: {
      language: "en-US",
      PrimaryColour: "rgba(255, 255, 255, 1)",
      FontName: "Arial",
      Fontsize: 50,
      subtitle_position: "0.2"
    }
  },
  credits_calculation: {
    base: 120, // 30s base
    captions: 30,
    processing: 30
  }
}
```

**Customer Options**:
- Duration: 15s, 30s, 45s (audio length determines)
- Captions: Auto-generated with timing
- Caption Style: 8 preset styles
- Background Music: Add/Mix levels

---

### C3-60: 60s YouTube/Explainer
**Price**: $119 | **Credits**: 360 | **Cost**: $4.00

**A2E Endpoint**: `/api/v1/video/generate`

```javascript
{
  endpoint: "/api/v1/video/generate",
  params: {
    anchor_id: "user_avatar",
    audioSrc: "narration_audio",
    resolution: 1080,
    web_bg_width: 1920,
    web_bg_height: 1080,
    isSkipRs: false, // Enable smart motion for quality
    isCaptionEnabled: true,
    msg: "script_for_captions", // Required for captions
    captionAlign: {
      language: "en-US",
      PrimaryColour: "rgba(255, 255, 255, 1)",
      OutlineColour: "rgba(0, 0, 0, 1)",
      BorderStyle: 4,
      FontName: "Arial",
      Fontsize: 50,
      subtitle_position: "0.2"
    }
  },
  credits_calculation: {
    base: 240, // 60s base
    smart_motion: 60, // isSkipRs=false adds cost
    captions: 30,
    processing: 30
  }
}
```

**Customer Options**:
- Quality: Standard (fast) / Premium (smart motion)
- Aspect Ratio: 16:9 (YouTube), 9:16 (Shorts), 1:1 (Social)
- Multiple Avatars: Switch speakers (extra cost)
- B-Roll: Insert product shots/slides

---

### C4-R: Rapid Same-Day Surcharge
**Price Modifier**: +40% on any video
**Credits Modifier**: +30%

**Implementation**:
```javascript
{
  priority_flag: true,
  isToPublicPool: true, // Use A2E's fast queue
  processing_boost: "dedicated_line",
  price_multiplier: 1.4,
  credit_multiplier: 1.3
}
```

---

## 🎙️ V4/V5: Voice Clone & TTS SKUs

### D1-VO30: 30s Standard Voiceover
**Price**: $15 | **Credits**: 30 | **Cost**: $0.33

**A2E Endpoint**: `/api/v1/video/send_tts`

```javascript
{
  endpoint: "/api/v1/video/send_tts",
  params: {
    msg: "script_text_here",
    tts_id: "66dc61ec5148817d26f5b79e", // Public voice
    speechRate: 1.0,
    // No user_voice_id = public TTS
  },
  response: {
    data: "audio_url" // Use this URL in video generation
  },
  credits: 30 // ~30 seconds of TTS
}
```

**Customer Options**:
- Voice Selection: 50+ public voices (male/female, accents)
- Speed: 0.8x (slow), 1.0x (normal), 1.2x (fast)
- Language: English, Spanish, French, German, etc.
- Emotion: Neutral, Excited, Professional

**Available Voices** (from A2E `/api/v1/anchor/voice_list`):
- Female: Alice, Aria, Jessica, Laura, Matilda, Sarah
- Male: Bill, Brian, Chris, Daniel, Liam, Will

---

### D2-CLONE: Standard Voice Clone
**Price**: $39 | **Credits**: 200 | **Cost**: $2.22

**A2E Endpoint**: `/api/v1/userVoice/training`

```javascript
{
  step1_training: {
    endpoint: "/api/v1/userVoice/training",
    params: {
      name: "user_voice_name",
      voice_urls: ["https://user-audio-sample.mp3"],
      model: "a2e", // or "cartesia", "minimax", "elevenlabs"
      language: "en",
      gender: "female", // or "male"
      denoise: true
    },
    requirements: {
      audio_duration: "10-60 seconds",
      format: "mp3, wav, m4a",
      quality: "clear vocals, no background noise",
      speakers: 1
    }
  },
  step2_check_status: {
    endpoint: "/api/v1/userVoice/completedRecord",
    wait_for: "current_status === 'completed'" // Usually 1-2 minutes
  },
  step3_usage: {
    endpoint: "/api/v1/video/send_tts",
    params: {
      msg: "new_script",
      user_voice_id: "_id_from_training",
      country: "en",
      region: "US",
      speechRate: 1.0
    }
  },
  credits: {
    training: 100,
    first_generation: 100,
    subsequent_use: 30 // per 30s usage
  }
}
```

**Customer Options**:
- Upload Voice Sample: 15-60 seconds of clear speech
- Model: A2E (best for English/Chinese), Cartesia (multilingual), ElevenLabs (expressive)
- Language: 13+ languages supported
- Auto-denoise: Remove background noise

---

### D3-CLPRO: Advanced Voice Clone
**Price**: $99 | **Credits**: 600 | **Cost**: $6.66

**A2E Endpoint**: Same as D2-CLONE but with premium features

```javascript
{
  endpoint: "/api/v1/userVoice/training",
  params: {
    name: "professional_voice_clone",
    voice_urls: ["sample1.mp3", "sample2.mp3"], // Multiple samples
    model: "elevenlabs", // Premium model
    language: "en",
    gender: "male",
    denoise: true
  },
  advanced_features: {
    emotion_control: true,
    multiple_samples: 3, // 3 voice samples for better quality
    languages: ["en", "es", "fr"], // Multi-language support
    studio_quality: true
  },
  credits: {
    training: 400,
    testing: 100,
    setup: 100
  }
}
```

**Customer Options**:
- Multi-Sample Training: Upload 3-5 voice samples
- Emotion Range: Train for multiple tones
- Multi-Language: Same voice across languages
- Priority Processing: 30-minute turnaround

---

### D4-5PK: Pack of 5×30s Voiceovers
**Price**: $59 | **Credits**: 150 | **Cost**: $1.67

**Implementation**: 5× calls to D1-VO30 with batch discount

```javascript
{
  batch_process: {
    count: 5,
    endpoint: "/api/v1/video/send_tts",
    params: {
      scripts: ["script1", "script2", "script3", "script4", "script5"],
      tts_id: "same_voice_id", // Consistency
      speechRate: 1.0
    }
  },
  credits: 150, // 30 credits × 5 = 150 (vs 30×5=150, no A2E discount, but we give pricing discount)
  batch_discount: "0.80" // 20% off retail
}
```

**Customer Options**:
- Same Voice: All 5 use same voice for brand consistency
- Mixed Voices: Different voices for variety
- Bulk Upload: Upload 5 scripts at once
- Delivery: All files in single ZIP

---

## 📝 V6: Text/SEO Content SKUs

> **Note**: A2E.ai doesn't have text generation. These use external APIs (OpenAI/Anthropic) + A2E for images.

### F1-STARTER: Content Starter
**Price**: $49 | **Credits**: ~100 (for images)

```javascript
{
  text_generation: {
    external_api: "openai/gpt-4",
    articles: 10,
    words_per_article: 800
  },
  image_generation: {
    per_article: 1,
    total: 10,
    method: "A1-IG", // Instagram Image 1080p
    a2e_credits: 60 * 10 = 600, // But amortized in bundle
    bundle_credits: 100 // Discounted
  }
}
```

**Deliverables**:
- 10 SEO-optimized articles (800-1000 words)
- 10 featured images
- Meta descriptions
- Internal linking suggestions

---

### F2-AUTH: Authority Builder
**Price**: $149 | **Credits**: ~400

```javascript
{
  articles: 40,
  images: 40,
  advanced_features: {
    keyword_research: true,
    internal_linking_strategy: true,
    topic_clusters: true
  },
  a2e_usage: {
    images: "40 × A1-IG",
    credits: 400
  }
}
```

---

### F3-DOMINATOR: SEO Dominator
**Price**: $399 | **Credits**: ~1500

```javascript
{
  articles: 150,
  images: 150,
  enterprise_features: {
    content_calendar: true,
    competitor_analysis: true,
    technical_seo_audit: true
  },
  a2e_usage: {
    images: "150 × A1-IG",
    credits: 1500
  }
}
```

---

## 🎁 V7: Multi-Modal Flagship Bundles

### E1-ECOM25: E-commerce Catalog Pack
**Price**: $225 | **Credits**: 4,500 | **Cost**: $49.95

**A2E Workflow**:
```javascript
{
  per_product: {
    step1_cutout: {
      method: "background_removal",
      a2e_endpoint: "/api/v1/video/generate",
      params: {
        anchor_background_color: "rgb(0,255,0)", // Green screen
        resolution: 1080,
        web_bg_width: 1200,
        web_bg_height: 1200
      },
      credits: 60
    },
    step2_lifestyle1: {
      method: "product_in_scene",
      a2e_composite: true,
      credits: 60
    },
    step3_lifestyle2: {
      method: "product_variant",
      credits: 60
    },
    total_per_product: 180
  },
  total_products: 25,
  total_credits: 25 * 180 = 4500
}
```

**Deliverables Per Product**:
1. Clean cut-out (white background)
2. Lifestyle scene 1 (e.g., on desk, in kitchen)
3. Lifestyle scene 2 (variant angle or context)

**Customer Options**:
- Product Category: Fashion, Electronics, Home, Food, etc.
- Scene Style: Minimal, Lifestyle, Studio, Outdoor
- Dimensions: Square, Tall (2:3), Wide (3:2)

---

### E2-LAUNCHKIT: Brand Launch Kit
**Price**: $449 | **Credits**: ~3,000 | **Cost**: $33.30

**Complete A2E Workflow**:
```javascript
{
  images_30: {
    breakdown: {
      social_posts: 20, // 20× A1-IG
      blog_heroes: 5,   // 5× A2-BH
      product_shots: 5  // 5× A3-4K
    },
    credits: (20*60) + (5*90) + (5*140) = 2350
  },
  videos_3: {
    video1: {
      type: "C2-30", // 30s intro
      a2e_endpoint: "/api/v1/video/generate",
      credits: 180
    },
    video2: {
      type: "C1-15", // 15s product demo
      credits: 90
    },
    video3: {
      type: "C1-15", // 15s testimonial
      credits: 90
    },
    total_video_credits: 360
  },
  voiceover_60s: {
    endpoint: "/api/v1/video/send_tts",
    split: ["30s", "30s"], // 2× D1-VO30
    credits: 60
  },
  text_content: {
    external: "5 social posts + LinkedIn templates",
    a2e_credits: 0 // No A2E usage
  },
  total_credits: 2350 + 360 + 60 = 2770 (~3000 with overhead)
}
```

**Complete Deliverables**:
- 30 branded images (social + blog + product)
- 3 videos (1×30s + 2×15s)
- 60s professional voiceover (brand intro)
- 5 social post templates + captions
- Brand style guide
- Content calendar (30 days)

**Customer Onboarding Flow**:
1. Brand questionnaire (colors, tone, audience)
2. Upload logo + product photos
3. Select avatar (create custom or use stock)
4. Write/approve scripts
5. Review and revise (1 round included)

---

### E3-AGENCY100: Agency Asset Bank
**Price**: $599 | **Credits**: ~10,000 | **Cost**: ~$111

**Flexible Asset Allocation**:
```javascript
{
  total_assets: 100,
  user_selects_mix: {
    images: "up_to_80", // Any resolution
    videos: "up_to_20", // Any length
    voiceovers: "up_to_50"
  },
  credit_budgeting: {
    average_per_asset: 100,
    total_budget: 10000,
    user_dashboard: "Asset calculator shows remaining credits"
  },
  agency_features: {
    white_label: true,
    priority_queue: true,
    dedicated_support: true,
    bulk_upload: true,
    team_access: 5 // seats
  }
}
```

**Implementation**:
```javascript
{
  dashboard_calculator: {
    image_costs: {
      "1080p": 60,
      "2K": 90,
      "4K": 140
    },
    video_costs: {
      "15s": 90,
      "30s": 180,
      "60s": 360
    },
    voice_costs: {
      "30s": 30,
      "clone": 200
    }
  },
  user_builds_order: {
    select: "20 images (1080p) + 10 videos (30s) + 5 voiceovers",
    calculate: (20*60) + (10*180) + (5*30) = 3150,
    remaining: 10000 - 3150 = 6850,
    show: "You can add 68 more 1080p images OR 38 more 30s videos"
  }
}
```

---

## 🔧 Implementation Architecture

### 1. SKU Configuration Database

```javascript
// Database schema addition: sku_tool_configs
{
  sku_code: "C2-30",
  a2e_endpoints: [
    {
      step: 1,
      optional: true,
      endpoint: "/api/v1/video/send_tts",
      condition: "if_user_wants_tts",
      params_template: {
        msg: "${user_script}",
        tts_id: "${selected_voice}",
        speechRate: 1.0
      }
    },
    {
      step: 2,
      required: true,
      endpoint: "/api/v1/video/generate",
      params_template: {
        anchor_id: "${selected_avatar}",
        audioSrc: "${audio_from_step1_or_upload}",
        resolution: 1080,
        web_bg_width: 1920,
        web_bg_height: 1080,
        isCaptionEnabled: "${customer_wants_captions}",
        captionAlign: "${caption_style}"
      }
    }
  ],
  customer_options: {
    avatar_selection: {
      type: "dropdown",
      source: "/api/v1/anchor/character_list",
      default: "system_avatar_1"
    },
    orientation: {
      type: "radio",
      options: [
        {label: "Vertical (9:16)", value: {w: 1080, h: 1920}},
        {label: "Square (1:1)", value: {w: 1080, h: 1080}},
        {label: "Horizontal (16:9)", value: {w: 1920, h: 1080}}
      ]
    },
    captions: {
      type: "checkbox",
      default: true,
      styles: ["Style1", "Style2", "Style3"]
    }
  }
}
```

### 2. Service Layer Enhancement

**File**: `services/a2e.js`

```javascript
class A2EService {
  async executeToolForSKU(skuCode, customerInputs, orderDetails) {
    // 1. Load SKU tool config
    const config = await db.query(
      'SELECT * FROM sku_tool_configs WHERE sku_code = ?',
      [skuCode]
    );
    
    // 2. Execute steps in sequence
    const results = [];
    for (const step of config.a2e_endpoints) {
      if (step.optional && !this.shouldExecuteStep(step, customerInputs)) {
        continue;
      }
      
      // 3. Interpolate params with customer inputs
      const params = this.interpolateParams(
        step.params_template,
        customerInputs,
        results // Previous step results
      );
      
      // 4. Call A2E API
      const result = await this.callA2EEndpoint(step.endpoint, params);
      results.push(result);
      
      // 5. If async (like video gen), track job
      if (result.status === 'IN_QUEUE' || result.status === 'start') {
        await this.trackAsyncJob(result.id, step.endpoint, orderDetails.id);
      }
    }
    
    return results;
  }
  
  async trackAsyncJob(jobId, endpoint, orderId) {
    // Poll A2E status endpoint until complete
    const statusEndpoint = this.getStatusEndpoint(endpoint);
    
    const pollInterval = setInterval(async () => {
      const status = await this.callA2EEndpoint(statusEndpoint, {_id: jobId});
      
      if (status.current_status === 'completed') {
        clearInterval(pollInterval);
        await db.query(
          'UPDATE orders SET status = ?, result_url = ? WHERE id = ?',
          ['completed', status.result_url, orderId]
        );
      } else if (status.current_status === 'failed') {
        clearInterval(pollInterval);
        await db.query(
          'UPDATE orders SET status = ?, error = ? WHERE id = ?',
          ['failed', status.failed_message, orderId]
        );
      }
    }, 10000); // Check every 10 seconds
  }
  
  getStatusEndpoint(generateEndpoint) {
    const statusMap = {
      '/api/v1/video/generate': '/api/v1/video/awsResult',
      '/api/v1/userImage2Video/start': '/api/v1/userImage2Video/{_id}',
      '/api/v1/userFaceSwapTask/add': '/api/v1/userFaceSwapTask/{_id}',
      '/api/v1/userDubbing/startDubbing': '/api/v1/userDubbing/{_id}'
    };
    return statusMap[generateEndpoint];
  }
}
```

### 3. Frontend: Tool Option Display

**File**: `frontend/src/pages/Create.tsx`

Add dynamic option rendering based on SKU:

```typescript
function ServiceConfiguration({ sku }: { sku: SKU }) {
  const [toolConfig, setToolConfig] = useState(null);
  const [customerInputs, setCustomerInputs] = useState({});
  
  useEffect(() => {
    // Fetch tool config for this SKU
    api.get(`/api/skus/${sku.code}/tool-config`)
      .then(config => setToolConfig(config));
  }, [sku.code]);
  
  if (!toolConfig) return <Skeleton />;
  
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">{sku.name} Configuration</h3>
      
      {/* Render customer options dynamically */}
      {Object.entries(toolConfig.customer_options).map(([key, option]) => (
        <div key={key}>
          {option.type === 'dropdown' && (
            <Select
              label={option.label}
              options={option.options}
              onChange={val => setCustomerInputs({...customerInputs, [key]: val})}
            />
          )}
          
          {option.type === 'radio' && (
            <RadioGroup
              label={option.label}
              options={option.options}
              onChange={val => setCustomerInputs({...customerInputs, [key]: val})}
            />
          )}
          
          {option.type === 'checkbox' && (
            <Checkbox
              label={option.label}
              defaultChecked={option.default}
              onChange={val => setCustomerInputs({...customerInputs, [key]: val})}
            />
          )}
        </div>
      ))}
      
      {/* Show estimated credits */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600">
          Estimated credits: {sku.base_credits}
        </p>
        <p className="text-sm text-gray-600">
          Your remaining credits: {user.credits}
        </p>
      </div>
      
      <Button
        onClick={() => handleCreateOrder(sku.code, customerInputs)}
        disabled={user.credits < sku.base_credits}
      >
        Create {sku.name} - ${sku.base_price}
      </Button>
    </div>
  );
}
```

---

## 📊 Credit Calculation Reference

### Video Length → Credits
```
15s video = 90 credits  (base 60 + overhead 30)
30s video = 180 credits (base 120 + overhead 60)
60s video = 360 credits (base 240 + overhead 120)
```

### Resolution Multipliers
```
1080p = 1.0x (standard)
2K = 1.5x
4K = 2.3x
```

### Feature Additions
```
Captions = +30 credits
Smart Motion (isSkipRs=false) = +60 credits
Background Music = +20 credits
Multiple Avatars = +40 credits per additional avatar
```

### Voice Clone
```
Initial Training = 100-400 credits (depending on model)
First Generation = 100 credits
Usage = 30 credits per 30s
```

---

## 🚀 Deployment Checklist

- [ ] Create `sku_tool_configs` database table
- [ ] Populate all 21 SKU mappings into database
- [ ] Extend `A2EService` class with new methods
- [ ] Add async job tracking system
- [ ] Build frontend option rendering components
- [ ] Create admin UI for editing tool configs
- [ ] Add credit calculator to user dashboard
- [ ] Test each SKU end-to-end
- [ ] Document customer-facing tool options
- [ ] Set up monitoring for failed A2E jobs

---

## 📞 A2E API Authentication

All A2E endpoints require bearer token:

```javascript
headers: {
  'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
  'Content-Type': 'application/json'
}
```

Get API key from: https://video.a2e.ai/ → Account Settings → API Token

---

## 🔗 Quick Reference: Key A2E Endpoints

| Function | Endpoint | Method |
|----------|----------|--------|
| Generate Avatar Video | `/api/v1/video/generate` | POST |
| Check Video Status | `/api/v1/video/awsResult` | POST |
| Generate TTS | `/api/v1/video/send_tts` | POST |
| Train Voice Clone | `/api/v1/userVoice/training` | POST |
| List Voice Clones | `/api/v1/userVoice/completedRecord` | GET |
| Create Avatar | `/api/v1/userVideoTwin/startTraining` | POST |
| List Avatars | `/api/v1/anchor/character_list` | GET |
| Image-to-Video | `/api/v1/userImage2Video/start` | POST |
| Face Swap | `/api/v1/userFaceSwapTask/add` | POST |
| Get Credits | `/api/v1/user/remainingCoins` | GET |

Base URL: `https://video.a2e.ai` (Global) or `https://video.a2e.com.cn` (China)

---

**Last Updated**: 2026-01-07
**Version**: 1.0
**Maintainer**: Development Team
