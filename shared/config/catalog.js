const catalog = [
    // ===== IMAGE GENERATION & UTILITY (V1/V2) =====
    {
        key: 'faceswap',
        sku_code: 'A1-IG',
        name: 'Instagram Image 1080p',
        description: 'Create stunning social media images optimized for Instagram, Facebook, and TikTok. Perfect for influencers and content creators',
        category: 'image',
        icon: '📸',
        inputs: ['source_image', 'target_image'],
        adjustments: [],
        pricing_profile: {
            base_credits: 60,
            base_price_cents: 499,
            default_flags: ['L_STD']
        },
        flags: {
            free_tier: false,
            starter_available: true,
            pro_available: true,
            agency_available: true
        }
    },
    {
        key: 'img2img',
        sku_code: 'A2-BH',
        name: 'Blog Hero 2K',
        description: 'Generate eye-catching 2K blog headers that boost reader engagement and improve SEO rankings',
        category: 'image',
        icon: '🖼️',
        inputs: ['image'],
        adjustments: ['resolution', 'format', 'enhance'],
        pricing_profile: {
            base_credits: 90,
            base_price_cents: 999,
            default_flags: ['L_STD']
        },
        flags: {
            free_tier: false,
            starter_available: true,
            pro_available: true,
            agency_available: true
        }
    },
    {
        key: 'enhance',
        sku_code: 'A3-4K',
        name: '4K Print-Ready',
        description: 'Transform images into ultra-high-resolution 4K quality for professional printing, posters, and large format displays',
        category: 'image',
        icon: '🎨',
        inputs: ['image'],
        adjustments: ['resolution', 'format', 'enhance'],
        pricing_profile: {
            base_credits: 140,
            base_price_cents: 1499,
            default_flags: ['L_STD']
        },
        flags: {
            free_tier: false,
            starter_available: true,
            pro_available: true,
            agency_available: true
        }
    },
    {
        key: 'bgremove',
        sku_code: 'A4-BR',
        name: 'Brand-Styled Image',
        description: 'Apply your unique brand identity to images with custom colors, styles, and visual elements',
        category: 'image',
        icon: '🏢',
        inputs: ['image', 'prompt'],
        adjustments: ['custom_branding', 'resolution', 'style_transfer'],
        pricing_profile: {
            base_credits: 180,
            base_price_cents: 2499,
            default_flags: ['C', 'L_STD']
        },
        flags: {
            free_tier: false,
            starter_available: true,
            pro_available: true,
            agency_available: true
        }
    },

    // ===== SOCIAL BUNDLES (V7) =====
    {
        key: 'batch_img2img_social_30',
        sku_code: 'B1-30SOC',
        name: '30 Social Creatives',
        description: 'Supercharge your social media with 30 platform-optimized images. Perfect for monthly content calendars',
        category: 'bundle',
        icon: '📱',
        inputs: ['image', 'prompt'],
        adjustments: ['batch_size', 'variations', 'social_formats'],
        pricing_profile: {
            base_credits: 1800,
            base_price_cents: 7900,
            default_flags: ['B']
        },
        flags: {
            free_tier: false,
            starter_available: true,
            pro_available: true,
            agency_available: true
        }
    },
    {
        key: 'batch_img2img_social_90',
        sku_code: 'B2-90SOC',
        name: '90 Creatives + Captions',
        description: 'Complete 3-month social media solution with 90 AI-generated images and engaging captions ready to post',
        category: 'bundle',
        icon: '💬',
        inputs: ['image', 'prompt'],
        adjustments: ['batch_size', 'variations', 'generate_captions', 'social_formats'],
        pricing_profile: {
            base_credits: 5400,
            base_price_cents: 19900,
            default_flags: ['B']
        },
        flags: {
            free_tier: false,
            starter_available: true,
            pro_available: true,
            agency_available: true
        }
    },

    // ===== VIDEO GENERATION (V3) =====
    {
        key: 'img2vid_15',
        sku_code: 'C1-15',
        name: '15s Promo/Reel',
        description: 'Create viral-worthy 15-second reels and TikTok videos that capture attention and drive engagement',
        category: 'video',
        icon: '🎬',
        inputs: ['image', 'prompt'],
        adjustments: ['duration', 'format', 'fps'],
        pricing_profile: {
            base_credits: 90,
            base_price_cents: 2900,
            default_flags: ['L_STD']
        },
        flags: {
            free_tier: false,
            starter_available: true,
            pro_available: true,
            agency_available: true
        }
    },
    {
        key: 'img2vid_30',
        sku_code: 'C2-30',
        name: '30s Ad/UGC Clip',
        description: 'Produce authentic 30-second promotional videos and user-generated content style clips that convert viewers into customers',
        category: 'video',
        icon: '📹',
        inputs: ['image', 'prompt'],
        adjustments: ['duration', 'format', 'fps', 'style'],
        pricing_profile: {
            base_credits: 180,
            base_price_cents: 5900,
            default_flags: ['L_STD']
        },
        flags: {
            free_tier: false,
            starter_available: true,
            pro_available: true,
            agency_available: true
        }
    },
    {
        key: 'img2vid_60',
        sku_code: 'C3-60',
        name: '60s Explainer/YouTube',
        description: 'Craft compelling 60-second explainer videos and YouTube shorts that educate and inspire your audience',
        category: 'video',
        icon: '🎥',
        inputs: ['image', 'prompt'],
        adjustments: ['duration', 'format', 'fps', 'youtube_optimized'],
        pricing_profile: {
            base_credits: 360,
            base_price_cents: 11900,
            default_flags: ['L_STD']
        },
        flags: {
            free_tier: false,
            starter_available: true,
            pro_available: true,
            agency_available: true
        }
    },

    // ===== VOICE & CLONE (V4/V5) =====
    {
        key: 'tts_30',
        sku_code: 'D1-VO30',
        name: '30s Voiceover',
        description: 'Generate broadcast-quality 30-second voiceovers perfect for ads, podcasts, and video narration',
        category: 'voice',
        icon: '🎙️',
        inputs: ['text'],
        adjustments: ['duration', 'format', 'voice_type'],
        pricing_profile: {
            base_credits: 30,
            base_price_cents: 1500,
            default_flags: ['L_STD']
        },
        flags: {
            free_tier: false,
            starter_available: true,
            pro_available: true,
            agency_available: true
        }
    },
    {
        key: 'voice_clone_standard',
        sku_code: 'D2-CLONE',
        name: 'Standard Voice Clone',
        description: 'Clone any voice with standard quality - ideal for creating consistent branded voice content',
        category: 'voice',
        icon: '🗣️',
        inputs: ['audio'],
        adjustments: ['quality', 'sample_duration'],
        pricing_profile: {
            base_credits: 200,
            base_price_cents: 3900,
            default_flags: ['C']
        },
        flags: {
            free_tier: false,
            starter_available: true,
            pro_available: true,
            agency_available: true
        }
    },
    {
        key: 'voice_clone_pro',
        sku_code: 'D3-CLPRO',
        name: 'Advanced Voice Clone',
        description: 'Professional-grade voice cloning with emotion control for audiobooks, podcasts, and premium content',
        category: 'voice',
        icon: '🎤',
        inputs: ['audio'],
        adjustments: ['quality', 'sample_duration', 'emotion_control'],
        pricing_profile: {
            base_credits: 600,
            base_price_cents: 9900,
            default_flags: ['C']
        },
        flags: {
            free_tier: false,
            starter_available: true,
            pro_available: true,
            agency_available: true
        }
    },
    {
        key: 'tts_bulk_5',
        sku_code: 'D4-5PK',
        name: '5x30s Voice Spots',
        description: 'Bulk create five 30-second voice spots with varied tones for radio ads, announcements, and marketing',
        category: 'voice',
        icon: '📻',
        inputs: ['text'],
        adjustments: ['batch_size', 'duration', 'format', 'voice_variety'],
        pricing_profile: {
            base_credits: 150,
            base_price_cents: 5900,
            default_flags: ['L_STD']
        },
        flags: {
            free_tier: false,
            starter_available: true,
            pro_available: true,
            agency_available: true
        }
    },

    // ===== SEO CONTENT (V6) =====
    {
        key: 'text_generation_starter',
        sku_code: 'F1-STARTER',
        name: '10 SEO Articles + Images',
        description: 'Kickstart your content strategy with 10 SEO-optimized articles and matching images that rank on Google',
        category: 'content',
        icon: '📝',
        inputs: ['prompt'],
        adjustments: ['article_count', 'seo_optimized', 'include_images', 'word_count'],
        pricing_profile: {
            base_credits: 1000,
            base_price_cents: 4900,
            default_flags: []
        },
        flags: {
            free_tier: false,
            starter_available: true,
            pro_available: true,
            agency_available: true
        }
    },
    {
        key: 'text_generation_auth',
        sku_code: 'F2-AUTH',
        name: '40 SEO Articles + Linking',
        description: 'Build topical authority with 40 interconnected SEO articles featuring strategic internal linking to dominate search rankings',
        category: 'content',
        icon: '🔗',
        inputs: ['prompt'],
        adjustments: ['article_count', 'seo_optimized', 'include_images', 'internal_linking', 'word_count'],
        pricing_profile: {
            base_credits: 4000,
            base_price_cents: 14900,
            default_flags: []
        },
        flags: {
            free_tier: false,
            starter_available: true,
            pro_available: true,
            agency_available: true
        }
    },
    {
        key: 'text_generation_dom',
        sku_code: 'F3-DOMINATOR',
        name: '150 Articles + Strategy',
        description: 'Dominate your niche with 150 premium SEO articles, comprehensive keyword strategy, and content calendar',
        category: 'content',
        icon: '👑',
        inputs: ['prompt'],
        adjustments: ['article_count', 'seo_optimized', 'include_images', 'internal_linking', 'content_strategy', 'word_count'],
        pricing_profile: {
            base_credits: 15000,
            base_price_cents: 39900,
            default_flags: []
        },
        flags: {
            free_tier: false,
            starter_available: true,
            pro_available: true,
            agency_available: true
        }
    },

    // ===== MULTI-MODAL BUNDLES (V7) =====
    {
        key: 'ecommerce_pack',
        sku_code: 'E1-ECOM25',
        name: 'E-commerce Pack (25 SKUs)',
        description: 'Launch your online store with 75 professional product images (3 angles per SKU) optimized for Shopify, Amazon, and more',
        category: 'bundle',
        icon: '🛒',
        inputs: ['image', 'prompt'],
        adjustments: ['product_count', 'images_per_product', 'ecommerce_optimized', 'white_background'],
        pricing_profile: {
            base_credits: 4500,
            base_price_cents: 22500,
            default_flags: []
        },
        flags: {
            free_tier: false,
            starter_available: true,
            pro_available: true,
            agency_available: true
        }
    },
    {
        key: 'brand_launch_kit',
        sku_code: 'E2-LAUNCHKIT',
        name: 'Brand Launch Kit',
        description: 'Everything you need to launch your brand: logo, banners, social graphics, video intro, and marketing materials',
        category: 'bundle',
        icon: '🚀',
        inputs: ['image', 'prompt', 'text'],
        adjustments: ['includes', 'brand_kit', 'comprehensive'],
        pricing_profile: {
            base_credits: 3000,
            base_price_cents: 44900,
            default_flags: []
        },
        flags: {
            free_tier: false,
            starter_available: true,
            pro_available: true,
            agency_available: true
        }
    },
    {
        key: 'agency_asset_bank',
        sku_code: 'E3-AGENCY100',
        name: 'Agency Asset Bank (100 assets)',
        description: 'Empower your agency with 100 premium mixed-media assets including images, videos, and graphics with commercial licensing',
        category: 'bundle',
        icon: '💼',
        inputs: ['image', 'prompt', 'text'],
        adjustments: ['asset_count', 'mixed_types', 'commercial_license', 'asset_variety'],
        pricing_profile: {
            base_credits: 10000,
            base_price_cents: 59900,
            default_flags: []
        },
        flags: {
            free_tier: false,
            starter_available: true,
            pro_available: true,
            agency_available: true
        }
    },

    // ===== LEGACY TOOLS (for backward compatibility) =====
    {
        key: 'text2img',
        sku_code: 'A1-IG', // Map to basic image generation
        name: 'Text to Image',
        description: 'Generate images from text descriptions',
        category: 'image',
        icon: '🎨',
        inputs: ['prompt'],
        adjustments: ['resolution', 'style', 'num_images', 'negative_prompt'],
        pricing_profile: {
            base_credits: 60,
            base_price_cents: 499,
            default_flags: ['L_STD']
        },
        flags: {
            free_tier: false,
            starter_available: true,
            pro_available: true,
            agency_available: true
        }
    },
    {
        key: 'nano_banana',
        sku_code: 'A1-IG', // Map to basic image generation
        name: 'Nano Banana (Gemini)',
        description: 'AI image generation and editing powered by Gemini',
        category: 'image',
        icon: '🍌',
        inputs: ['prompt'],
        adjustments: ['aspect_ratio', 'operation'],
        pricing_profile: {
            base_credits: 60,
            base_price_cents: 499,
            default_flags: ['L_STD']
        },
        flags: {
            free_tier: false,
            starter_available: true,
            pro_available: true,
            agency_available: true
        }
    },
    {
        key: 'vid2vid',
        sku_code: 'C2-30', // Map to 30s video
        name: 'Video to Video',
        description: 'Transform videos with AI styling',
        category: 'video',
        icon: '🎬',
        inputs: ['video'],
        adjustments: ['prompt', 'style', 'strength'],
        pricing_profile: {
            base_credits: 180,
            base_price_cents: 5900,
            default_flags: ['L_STD']
        },
        flags: {
            free_tier: false,
            starter_available: true,
            pro_available: true,
            agency_available: true
        }
    },
    {
        key: 'avatar_video',
        sku_code: 'C2-30', // Map to 30s video
        name: 'AI Avatar Video',
        description: 'Generate realistic avatar videos with lip-sync',
        category: 'video',
        icon: '🎭',
        inputs: ['avatar_id', 'voice_id', 'script'],
        adjustments: ['video_length', 'resolution', 'aspect_ratio', 'background_music'],
        pricing_profile: {
            base_credits: 180,
            base_price_cents: 5900,
            default_flags: ['L_STD']
        },
        flags: {
            free_tier: false,
            starter_available: true,
            pro_available: true,
            agency_available: true
        }
    },
    {
        key: 'talking_photo',
        sku_code: 'C2-30', // Map to 30s video
        name: 'Talking Photo',
        description: 'Make photos talk with AI voice',
        category: 'video',
        icon: '🗣️',
        inputs: ['image'],
        adjustments: ['audio_url', 'voice_text', 'voice_id', 'duration'],
        pricing_profile: {
            base_credits: 180,
            base_price_cents: 5900,
            default_flags: ['L_STD']
        },
        flags: {
            free_tier: false,
            starter_available: true,
            pro_available: true,
            agency_available: true
        }
    },
    {
        key: 'talking_video',
        sku_code: 'C2-30', // Map to 30s video
        name: 'Talking Video',
        description: 'Add AI voiceover to videos with lip-sync',
        category: 'video',
        icon: '🎬',
        inputs: ['video'],
        adjustments: ['audio_url', 'voice_text', 'voice_id'],
        pricing_profile: {
            base_credits: 180,
            base_price_cents: 5900,
            default_flags: ['L_STD']
        },
        flags: {
            free_tier: false,
            starter_available: true,
            pro_available: true,
            agency_available: true
        }
    },
    {
        key: 'caption_removal',
        sku_code: 'C2-30', // Map to 30s video
        name: 'Caption Removal',
        description: 'Remove captions and text overlays from videos',
        category: 'video',
        icon: '✂️',
        inputs: ['video'],
        adjustments: [],
        pricing_profile: {
            base_credits: 180,
            base_price_cents: 5900,
            default_flags: ['L_STD']
        },
        flags: {
            free_tier: false,
            starter_available: true,
            pro_available: true,
            agency_available: true
        }
    },
    {
        key: 'tts',
        sku_code: 'D1-VO30', // Map to 30s voiceover
        name: 'Text-to-Speech',
        description: 'Convert text to natural-sounding speech',
        category: 'voice',
        icon: '🔊',
        inputs: ['text'],
        adjustments: ['voice_id', 'voice_type', 'language', 'speed', 'pitch'],
        pricing_profile: {
            base_credits: 30,
            base_price_cents: 1500,
            default_flags: ['L_STD']
        },
        flags: {
            free_tier: false,
            starter_available: true,
            pro_available: true,
            agency_available: true
        }
    },
    {
        key: 'voice_clone',
        sku_code: 'D2-CLONE', // Map to standard voice clone
        name: 'Voice Clone',
        description: 'Clone any voice for unlimited use',
        category: 'voice',
        icon: '🎤',
        inputs: ['audio'],
        adjustments: ['quality', 'emotion_control'],
        pricing_profile: {
            base_credits: 200,
            base_price_cents: 3900,
            default_flags: ['C']
        },
        flags: {
            free_tier: false,
            starter_available: true,
            pro_available: true,
            agency_available: true
        }
    },
    {
        key: 'dubbing',
        sku_code: 'D1-VO30', // Map to voiceover
        name: 'AI Dubbing',
        description: 'Translate and dub videos into any language',
        category: 'voice',
        icon: '🌍',
        inputs: ['video'],
        adjustments: ['target_language', 'voice_type', 'preserve_timing'],
        pricing_profile: {
            base_credits: 30,
            base_price_cents: 1500,
            default_flags: ['L_STD']
        },
        flags: {
            free_tier: false,
            starter_available: true,
            pro_available: true,
            agency_available: true
        }
    },
    {
        key: 'create_avatar',
        sku_code: 'A1-IG', // Map to basic image
        name: 'Custom Avatar',
        description: 'Create custom avatars from photos or videos',
        category: 'avatar',
        icon: '👤',
        inputs: ['media'],
        adjustments: ['type'],
        pricing_profile: {
            base_credits: 60,
            base_price_cents: 499,
            default_flags: ['L_STD']
        },
        flags: {
            free_tier: false,
            starter_available: true,
            pro_available: true,
            agency_available: true
        }
    },
    {
        key: 'virtual_tryon',
        sku_code: 'A1-IG', // Map to basic image
        name: 'Virtual Try-On',
        description: 'Try on clothes virtually using AI',
        category: 'special',
        icon: '👕',
        inputs: ['person_image', 'garment_image'],
        adjustments: ['category'],
        pricing_profile: {
            base_credits: 60,
            base_price_cents: 499,
            default_flags: ['L_STD']
        },
        flags: {
            free_tier: false,
            starter_available: true,
            pro_available: true,
            agency_available: true
        }
    },
    {
        key: 'product_avatar',
        sku_code: 'A1-IG', // Map to basic image
        name: 'Product Avatar',
        description: 'Create AI presenters for products',
        category: 'special',
        icon: '📦',
        inputs: ['product_image'],
        adjustments: ['avatar_style', 'background'],
        pricing_profile: {
            base_credits: 60,
            base_price_cents: 499,
            default_flags: ['L_STD']
        },
        flags: {
            free_tier: false,
            starter_available: true,
            pro_available: true,
            agency_available: true
        }
    }
]

// Adjustment definitions with UI metadata
const adjustments = {
    // RESOLUTION
    resolution: {
        type: 'select',
        label: 'Resolution',
        options: [
            { value: '1080p', label: '1080p (Full HD)', price_multiplier: 1.0 },
            { value: '2k', label: '2K (2560x1440)', price_multiplier: 1.3 },
            { value: '4k', label: '4K (3840x2160)', price_multiplier: 1.8 }
        ],
        default: '1080p'
    },

    // DURATION / LENGTH
    duration: {
        type: 'slider',
        label: 'Duration (seconds)',
        min: 5,
        max: 120,
        step: 5,
        default: 15,
        price_per_second: 0.02
    },

    video_length: {
        type: 'slider',
        label: 'Video Length (seconds)',
        min: 10,
        max: 180,
        step: 10,
        default: 30,
        price_per_second: 0.03
    },

    // ASPECT RATIO
    aspect_ratio: {
        type: 'select',
        label: 'Aspect Ratio',
        options: [
            { value: '1:1', label: '1:1 (Square - Instagram)', price_multiplier: 1.0 },
            { value: '16:9', label: '16:9 (Widescreen - YouTube)', price_multiplier: 1.0 },
            { value: '9:16', label: '9:16 (Vertical - TikTok/Reels)', price_multiplier: 1.0 },
            { value: '4:3', label: '4:3 (Standard)', price_multiplier: 1.0 }
        ],
        default: '16:9'
    },

    // STYLE
    style: {
        type: 'select',
        label: 'Style',
        options: [
            { value: 'realistic', label: 'Realistic', price_multiplier: 1.0 },
            { value: 'artistic', label: 'Artistic', price_multiplier: 1.2 },
            { value: 'anime', label: 'Anime', price_multiplier: 1.2 },
            { value: 'cartoon', label: 'Cartoon', price_multiplier: 1.1 },
            { value: '3d_render', label: '3D Render', price_multiplier: 1.3 },
            { value: 'ugc', label: 'UGC Style', price_multiplier: 1.0 }
        ],
        default: 'realistic'
    },

    // FORMAT
    format: {
        type: 'select',
        label: 'Format',
        options: [
            { value: 'jpg', label: 'JPG', price_multiplier: 1.0 },
            { value: 'png', label: 'PNG', price_multiplier: 1.1 },
            { value: 'webp', label: 'WebP', price_multiplier: 1.0 },
            { value: 'mp4', label: 'MP4', price_multiplier: 1.0 },
            { value: 'mp3', label: 'MP3', price_multiplier: 1.0 }
        ],
        default: 'jpg'
    },

    // FPS
    fps: {
        type: 'select',
        label: 'Frame Rate',
        options: [
            { value: 24, label: '24 FPS (Cinematic)', price_multiplier: 1.0 },
            { value: 30, label: '30 FPS (Standard)', price_multiplier: 1.1 },
            { value: 60, label: '60 FPS (Smooth)', price_multiplier: 1.4 }
        ],
        default: 30
    },

    // VOICE TYPE
    voice_type: {
        type: 'select',
        label: 'Voice Type',
        options: [
            { value: 'professional', label: 'Professional', price_multiplier: 1.0 },
            { value: 'casual', label: 'Casual', price_multiplier: 1.0 },
            { value: 'energetic', label: 'Energetic', price_multiplier: 1.1 },
            { value: 'soothing', label: 'Soothing', price_multiplier: 1.1 }
        ],
        default: 'professional'
    },

    // LANGUAGE
    language: {
        type: 'select',
        label: 'Language',
        options: [
            { value: 'en-US', label: 'English (US)', price_multiplier: 1.0 },
            { value: 'en-GB', label: 'English (UK)', price_multiplier: 1.0 },
            { value: 'es-ES', label: 'Spanish', price_multiplier: 1.1 },
            { value: 'fr-FR', label: 'French', price_multiplier: 1.1 },
            { value: 'de-DE', label: 'German', price_multiplier: 1.1 },
            { value: 'it-IT', label: 'Italian', price_multiplier: 1.1 },
            { value: 'pt-BR', label: 'Portuguese', price_multiplier: 1.1 },
            { value: 'zh-CN', label: 'Chinese', price_multiplier: 1.2 },
            { value: 'ja-JP', label: 'Japanese', price_multiplier: 1.2 },
            { value: 'ko-KR', label: 'Korean', price_multiplier: 1.2 }
        ],
        default: 'en-US'
    },

    // QUALITY
    quality: {
        type: 'select',
        label: 'Quality',
        options: [
            { value: 'standard', label: 'Standard', price_multiplier: 1.0 },
            { value: 'high', label: 'High', price_multiplier: 1.3 },
            { value: 'professional', label: 'Professional', price_multiplier: 1.6 }
        ],
        default: 'standard'
    },

    // SPEED
    speed: {
        type: 'slider',
        label: 'Speed',
        min: 0.5,
        max: 2.0,
        step: 0.1,
        default: 1.0,
        price_multiplier: 1.0
    },

    // PITCH
    pitch: {
        type: 'slider',
        label: 'Pitch',
        min: 0.5,
        max: 2.0,
        step: 0.1,
        default: 1.0,
        price_multiplier: 1.0
    },

    // TEXT INPUTS
    prompt: {
        type: 'textarea',
        label: 'Prompt',
        placeholder: 'Describe what you want to create...',
        required: true
    },

    negative_prompt: {
        type: 'textarea',
        label: 'Negative Prompt (Optional)',
        placeholder: 'What to avoid in the output...',
        required: false
    },

    script: {
        type: 'textarea',
        label: 'Script',
        placeholder: 'Enter the script for the avatar to speak...',
        required: true
    },

    text: {
        type: 'textarea',
        label: 'Text',
        placeholder: 'Enter text to convert to speech...',
        required: true
    },

    // BOOLEAN OPTIONS
    emotion_control: {
        type: 'checkbox',
        label: 'Emotion Control',
        default: false,
        price_add: 500 // $5.00
    },

    background_music: {
        type: 'checkbox',
        label: 'Add Background Music',
        default: false,
        price_add: 300 // $3.00
    },

    preserve_timing: {
        type: 'checkbox',
        label: 'Preserve Original Timing',
        default: true,
        price_multiplier: 1.0
    },

    // NUMBER INPUTS
    num_images: {
        type: 'number',
        label: 'Number of Images',
        min: 1,
        max: 10,
        default: 1,
        price_per_unit: 299 // $2.99 per additional image
    },

    strength: {
        type: 'slider',
        label: 'Transformation Strength',
        min: 0.1,
        max: 1.0,
        step: 0.1,
        default: 0.7,
        price_multiplier: 1.0
    },

    // SPECIAL SELECTORS
    operation: {
        type: 'select',
        label: 'Operation',
        options: [
            { value: 'generate', label: 'Generate New Image', price_multiplier: 1.0 },
            { value: 'edit', label: 'Edit Existing Image', price_multiplier: 1.2 }
        ],
        default: 'generate'
    },

    target_language: {
        type: 'select',
        label: 'Target Language',
        options: [
            { value: 'es', label: 'Spanish', price_multiplier: 1.0 },
            { value: 'fr', label: 'French', price_multiplier: 1.0 },
            { value: 'de', label: 'German', price_multiplier: 1.0 },
            { value: 'it', label: 'Italian', price_multiplier: 1.0 },
            { value: 'pt', label: 'Portuguese', price_multiplier: 1.0 },
            { value: 'zh', label: 'Chinese', price_multiplier: 1.2 },
            { value: 'ja', label: 'Japanese', price_multiplier: 1.2 },
            { value: 'ko', label: 'Korean', price_multiplier: 1.2 },
            { value: 'ar', label: 'Arabic', price_multiplier: 1.2 },
            { value: 'hi', label: 'Hindi', price_multiplier: 1.2 }
        ],
        default: 'es'
    },

    category: {
        type: 'select',
        label: 'Category',
        options: [
            { value: 'upper_body', label: 'Upper Body', price_multiplier: 1.0 },
            { value: 'lower_body', label: 'Lower Body', price_multiplier: 1.0 },
            { value: 'full_body', label: 'Full Body', price_multiplier: 1.3 },
            { value: 'dress', label: 'Dress', price_multiplier: 1.2 }
        ],
        default: 'upper_body'
    },

    avatar_style: {
        type: 'select',
        label: 'Avatar Style',
        options: [
            { value: 'professional', label: 'Professional', price_multiplier: 1.0 },
            { value: 'casual', label: 'Casual', price_multiplier: 1.0 },
            { value: 'animated', label: 'Animated', price_multiplier: 1.2 },
            { value: 'futuristic', label: 'Futuristic', price_multiplier: 1.3 }
        ],
        default: 'professional'
    },

    background: {
        type: 'select',
        label: 'Background',
        options: [
            { value: 'studio', label: 'Studio', price_multiplier: 1.0 },
            { value: 'office', label: 'Office', price_multiplier: 1.0 },
            { value: 'outdoor', label: 'Outdoor', price_multiplier: 1.1 },
            { value: 'custom', label: 'Custom', price_multiplier: 1.3 }
        ],
        default: 'studio'
    },

    type: {
        type: 'select',
        label: 'Type',
        options: [
            { value: 'image', label: 'From Image', price_multiplier: 1.0 },
            { value: 'video', label: 'From Video', price_multiplier: 1.5 }
        ],
        default: 'image'
    },

    // NEW ADJUSTMENTS FOR SKU-BASED TOOLS
    enhance: {
        type: 'checkbox',
        label: 'Enhance Quality',
        default: true,
        price_multiplier: 1.0
    },

    custom_branding: {
        type: 'checkbox',
        label: 'Custom Branding',
        default: false,
        price_multiplier: 1.0
    },

    style_transfer: {
        type: 'checkbox',
        label: 'Style Transfer',
        default: false,
        price_multiplier: 1.0
    },

    batch_size: {
        type: 'number',
        label: 'Batch Size',
        min: 1,
        max: 100,
        default: 30,
        price_per_unit: 50 // $0.50 per additional item
    },

    variations: {
        type: 'checkbox',
        label: 'Generate Variations',
        default: true,
        price_multiplier: 1.0
    },

    social_formats: {
        type: 'multiselect',
        label: 'Social Formats',
        options: [
            { value: 'instagram', label: 'Instagram' },
            { value: 'facebook', label: 'Facebook' },
            { value: 'twitter', label: 'Twitter' },
            { value: 'linkedin', label: 'LinkedIn' }
        ],
        default: ['instagram']
    },

    generate_captions: {
        type: 'checkbox',
        label: 'Generate AI Captions',
        default: false,
        price_add: 1000 // $10.00
    },

    youtube_optimized: {
        type: 'checkbox',
        label: 'YouTube Optimized',
        default: false,
        price_multiplier: 1.0
    },

    sample_duration: {
        type: 'slider',
        label: 'Sample Duration (seconds)',
        min: 10,
        max: 120,
        step: 10,
        default: 30,
        price_multiplier: 1.0
    },

    voice_variety: {
        type: 'checkbox',
        label: 'Voice Variety',
        default: false,
        price_multiplier: 1.0
    },

    article_count: {
        type: 'number',
        label: 'Article Count',
        min: 1,
        max: 150,
        default: 10,
        price_per_unit: 400 // $4.00 per article
    },

    seo_optimized: {
        type: 'checkbox',
        label: 'SEO Optimized',
        default: true,
        price_multiplier: 1.0
    },

    include_images: {
        type: 'checkbox',
        label: 'Include Images',
        default: true,
        price_multiplier: 1.0
    },

    word_count: {
        type: 'number',
        label: 'Word Count',
        min: 500,
        max: 2000,
        default: 1000,
        price_multiplier: 1.0
    },

    internal_linking: {
        type: 'checkbox',
        label: 'Internal Linking',
        default: false,
        price_multiplier: 1.0
    },

    content_strategy: {
        type: 'checkbox',
        label: 'Content Strategy',
        default: false,
        price_add: 5000 // $50.00
    },

    product_count: {
        type: 'number',
        label: 'Product Count',
        min: 1,
        max: 100,
        default: 25,
        price_per_unit: 180 // $1.80 per product
    },

    images_per_product: {
        type: 'number',
        label: 'Images per Product',
        min: 1,
        max: 10,
        default: 3,
        price_multiplier: 1.0
    },

    ecommerce_optimized: {
        type: 'checkbox',
        label: 'E-commerce Optimized',
        default: true,
        price_multiplier: 1.0
    },

    white_background: {
        type: 'checkbox',
        label: 'White Background',
        default: true,
        price_multiplier: 1.0
    },

    includes: {
        type: 'multiselect',
        label: 'Includes',
        options: [
            { value: 'logo', label: 'Logo' },
            { value: 'banner', label: 'Banner' },
            { value: 'social_posts', label: 'Social Posts' },
            { value: 'video_intro', label: 'Video Intro' }
        ],
        default: ['logo', 'banner', 'social_posts', 'video_intro']
    },

    brand_kit: {
        type: 'checkbox',
        label: 'Brand Kit',
        default: true,
        price_multiplier: 1.0
    },

    comprehensive: {
        type: 'checkbox',
        label: 'Comprehensive Package',
        default: true,
        price_multiplier: 1.0
    },

    asset_count: {
        type: 'number',
        label: 'Asset Count',
        min: 1,
        max: 200,
        default: 100,
        price_per_unit: 100 // $1.00 per asset
    },

    mixed_types: {
        type: 'checkbox',
        label: 'Mixed Asset Types',
        default: true,
        price_multiplier: 1.0
    },

    commercial_license: {
        type: 'checkbox',
        label: 'Commercial License',
        default: true,
        price_multiplier: 1.0
    },

    asset_variety: {
        type: 'multiselect',
        label: 'Asset Types',
        options: [
            { value: 'images', label: 'Images' },
            { value: 'videos', label: 'Videos' },
            { value: 'graphics', label: 'Graphics' }
        ],
        default: ['images', 'videos', 'graphics']
    },

    // LEGACY AUDIO INPUTS
    audio_url: {
        type: 'text',
        label: 'Audio URL',
        placeholder: 'Enter audio URL...',
        required: false
    },

    voice_text: {
        type: 'textarea',
        label: 'Voice Text',
        placeholder: 'Enter text for voice synthesis...',
        required: false
    },

    voice_id: {
        type: 'text',
        label: 'Voice ID',
        placeholder: 'Enter voice ID...',
        required: false
    },

    // LEGACY MEDIA INPUTS
    media: {
        type: 'file',
        label: 'Media File',
        accept: 'image/*,video/*',
        required: true
    },

    person_image: {
        type: 'file',
        label: 'Person Image',
        accept: 'image/*',
        required: true
    },

    garment_image: {
        type: 'file',
        label: 'Garment Image',
        accept: 'image/*',
        required: true
    },

    product_image: {
        type: 'file',
        label: 'Product Image',
        accept: 'image/*',
        required: true
    },

    avatar_id: {
        type: 'text',
        label: 'Avatar ID',
        placeholder: 'Enter avatar ID...',
        required: true
    }
}

module.exports = { catalog, adjustments }

