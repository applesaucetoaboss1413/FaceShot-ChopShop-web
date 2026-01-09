const catalog = [
    // IMAGE GENERATION & UTILITY (4 SKUs)
    { 
        key: 'A1-IG', 
        name: 'Instagram Image 1080p', 
        description: 'Create stunning social media images optimized for Instagram, Facebook, and TikTok',
        category: 'image',
        basePrice: 99,
        icon: '📸'
    },
    { 
        key: 'A2-BH', 
        name: 'Blog Hero 2K', 
        description: 'Generate eye-catching 2K blog headers that boost reader engagement',
        category: 'image',
        basePrice: 199,
        icon: '🖼️'
    },
    { 
        key: 'A3-4K', 
        name: '4K Print-Ready', 
        description: 'Ultra-high-resolution 4K quality for professional printing and large format displays',
        category: 'image',
        basePrice: 499,
        icon: '🎨'
    },
    { 
        key: 'A4-BR', 
        name: 'Brand-Styled Image', 
        description: 'Apply your unique brand identity with custom colors and styles',
        category: 'image',
        basePrice: 299,
        icon: '🏢'
    },

    // VIDEO GENERATION (3 SKUs)
    { 
        key: 'C1-15', 
        name: '15s Promo/Reel', 
        description: 'Viral-worthy 15-second reels and TikTok videos that capture attention',
        category: 'video',
        basePrice: 499,
        icon: '🎬'
    },
    { 
        key: 'C2-30', 
        name: '30s Ad/UGC Clip', 
        description: 'Authentic 30-second promotional videos that convert viewers into customers',
        category: 'video',
        basePrice: 799,
        icon: '📹'
    },
    { 
        key: 'C3-60', 
        name: '60s Explainer/YouTube', 
        description: 'Compelling 60-second explainer videos and YouTube shorts',
        category: 'video',
        basePrice: 1299,
        icon: '🎥'
    },

    // VOICE & CLONE (4 SKUs)
    { 
        key: 'D1-VO30', 
        name: '30s Voiceover', 
        description: 'Broadcast-quality 30-second voiceovers for ads, podcasts, and videos',
        category: 'voice',
        basePrice: 299,
        icon: '🎙️'
    },
    { 
        key: 'D2-CLONE', 
        name: 'Standard Voice Clone', 
        description: 'Clone any voice with standard quality for consistent branded content',
        category: 'voice',
        basePrice: 999,
        icon: '🗣️'
    },
    { 
        key: 'D3-CLPRO', 
        name: 'Advanced Voice Clone', 
        description: 'Professional voice cloning with emotion control for audiobooks and podcasts',
        category: 'voice',
        basePrice: 1999,
        icon: '🎤'
    },
    { 
        key: 'D4-5PK', 
        name: '5x30s Voice Spots', 
        description: 'Five 30-second voice spots with varied tones for radio ads',
        category: 'voice',
        basePrice: 1299,
        icon: '📻'
    },

    // SEO CONTENT (3 SKUs)
    { 
        key: 'F1-STARTER', 
        name: '10 SEO Articles + Images', 
        description: '10 SEO-optimized articles with matching images that rank on Google',
        category: 'content',
        basePrice: 4999,
        icon: '📝'
    },
    { 
        key: 'F2-AUTH', 
        name: '40 SEO Articles + Linking', 
        description: '40 interconnected SEO articles with strategic internal linking',
        category: 'content',
        basePrice: 14999,
        icon: '🔗'
    },
    { 
        key: 'F3-DOMINATOR', 
        name: '150 Articles + Strategy', 
        description: '150 premium SEO articles with comprehensive keyword strategy',
        category: 'content',
        basePrice: 39999,
        icon: '👑'
    },

    // SOCIAL BUNDLES (2 SKUs)
    { 
        key: 'B1-30SOC', 
        name: '30 Social Creatives', 
        description: '30 platform-optimized images perfect for monthly content calendars',
        category: 'bundle',
        basePrice: 1999,
        icon: '📱'
    },
    { 
        key: 'B2-90SOC', 
        name: '90 Creatives + Captions', 
        description: 'Complete 3-month social solution with 90 AI images and captions',
        category: 'bundle',
        basePrice: 4999,
        icon: '💬'
    },

    // MULTI-MODAL BUNDLES (3 SKUs)
    { 
        key: 'E1-ECOM25', 
        name: 'E-commerce Pack (25 SKUs)', 
        description: '75 professional product images (3 angles per SKU) for online stores',
        category: 'bundle',
        basePrice: 9999,
        icon: '🛒'
    },
    { 
        key: 'E2-LAUNCHKIT', 
        name: 'Brand Launch Kit', 
        description: 'Complete brand assets: logo, banners, social graphics, video intro',
        category: 'bundle',
        basePrice: 14999,
        icon: '🚀'
    },
    { 
        key: 'E3-AGENCY100', 
        name: 'Agency Asset Bank (100 assets)', 
        description: '100 premium mixed-media assets with commercial licensing',
        category: 'bundle',
        basePrice: 29999,
        icon: '💼'
    },

    // ADDITIONAL A2E TOOLS (kept from original to maintain compatibility)
    { 
        key: 'faceswap', 
        name: 'Face Swap', 
        description: 'Swap faces in images or videos',
        category: 'image',
        basePrice: 299,
        icon: '😊'
    },
    { 
        key: 'avatar', 
        name: 'Custom Avatar', 
        description: 'Generate stylized profile avatars',
        category: 'image',
        basePrice: 399,
        icon: '👨‍🎨'
    }
]

module.exports = { catalog }

