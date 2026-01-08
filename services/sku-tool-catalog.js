/**
 * SKU Tool Catalog Service
 * Maps all 20 SKUs to their A2E tools and configurations
 */

class SKUToolCatalog {
    constructor(db) {
        this.db = db;
        this.toolMappings = this.initializeToolMappings();
    }

    /**
     * Initialize SKU to A2E tool mappings
     */
    initializeToolMappings() {
        return {
            // ===== IMAGE GENERATION & UTILITY (V1/V2) =====
            'A1-IG': {
                a2e_tool: 'faceswap',
                display_name: 'Instagram Image 1080p',
                description: 'Create stunning social media images optimized for Instagram, Facebook, and TikTok. Perfect for influencers and content creators',
                category: 'image',
                icon: '📸',
                inputs: ['image'],
                options: {
                    resolution: '1080p',
                    format: 'jpg'
                },
                seo_keywords: ['instagram image maker', 'social media graphics', 'AI instagram post creator'],
                benefits: ['Instantly ready for posting', 'Perfect 1:1 square format', 'High engagement quality']
            },
            'A2-BH': {
                a2e_tool: 'img2img',
                display_name: 'Blog Hero 2K',
                description: 'Generate eye-catching 2K blog headers that boost reader engagement and improve SEO rankings',
                category: 'image',
                icon: '🖼️',
                inputs: ['image'],
                options: {
                    resolution: '2k',
                    format: 'jpg',
                    enhance: true
                },
                seo_keywords: ['blog header image', 'featured image generator', 'article thumbnail creator'],
                benefits: ['SEO-optimized dimensions', 'Fast page loading', 'Professional appearance']
            },
            'A3-4K': {
                a2e_tool: 'enhance',
                display_name: '4K Print-Ready',
                description: 'Transform images into ultra-high-resolution 4K quality for professional printing, posters, and large format displays',
                category: 'image',
                icon: '🎨',
                inputs: ['image'],
                options: {
                    resolution: '4k',
                    format: 'png',
                    enhance: true
                },
                seo_keywords: ['4K image upscaler', 'print ready images', 'high resolution converter'],
                benefits: ['Professional print quality', 'No pixelation', 'Commercial use ready']
            },
            'A4-BR': {
                a2e_tool: 'faceswap',
                display_name: 'Brand-Styled Image',
                description: 'Apply your unique brand identity to images with custom colors, styles, and visual elements',
                category: 'image',
                icon: '🏢',
                inputs: ['image', 'prompt'],
                options: {
                    custom_branding: true,
                    resolution: '2k',
                    style_transfer: true
                },
                seo_keywords: ['branded content creator', 'custom brand images', 'corporate image styling'],
                benefits: ['Consistent brand identity', 'Custom styling options', 'Marketing-ready assets']
            },

            // ===== SOCIAL BUNDLES (V7) =====
            'B1-30SOC': {
                a2e_tool: 'batch_img2img',
                display_name: '30 Social Creatives',
                description: 'Supercharge your social media with 30 platform-optimized images. Perfect for monthly content calendars',
                category: 'bundle',
                icon: '📱',
                inputs: ['image', 'prompt'],
                options: {
                    batch_size: 30,
                    variations: true,
                    social_formats: ['instagram', 'facebook', 'twitter']
                },
                seo_keywords: ['social media bundle', 'content calendar images', 'bulk social posts'],
                benefits: ['One month of content', 'Multiple platform formats', 'Time-saving batch creation']
            },
            'B2-90SOC': {
                a2e_tool: 'batch_img2img',
                display_name: '90 Creatives + Captions',
                description: 'Complete 3-month social media solution with 90 AI-generated images and engaging captions ready to post',
                category: 'bundle',
                icon: '💬',
                inputs: ['image', 'prompt'],
                options: {
                    batch_size: 90,
                    variations: true,
                    generate_captions: true,
                    social_formats: ['instagram', 'facebook', 'twitter', 'linkedin']
                },
                seo_keywords: ['social media automation', 'AI caption generator', 'quarterly content pack'],
                benefits: ['3 months of content', 'AI-written captions', 'Multi-platform coverage']
            },

            // ===== VIDEO GENERATION (V3) =====
            'C1-15': {
                a2e_tool: 'img2vid',
                display_name: '15s Promo/Reel',
                description: 'Create viral-worthy 15-second reels and TikTok videos that capture attention and drive engagement',
                category: 'video',
                icon: '🎬',
                inputs: ['image', 'prompt'],
                options: {
                    duration: 15,
                    format: 'mp4',
                    fps: 30
                },
                seo_keywords: ['instagram reel maker', 'tiktok video creator', '15 second video'],
                benefits: ['Perfect for reels', 'Maximum engagement length', 'Social media optimized']
            },
            'C2-30': {
                a2e_tool: 'img2vid',
                display_name: '30s Ad/UGC Clip',
                description: 'Produce authentic 30-second promotional videos and user-generated content style clips that convert viewers into customers',
                category: 'video',
                icon: '📹',
                inputs: ['image', 'prompt'],
                options: {
                    duration: 30,
                    format: 'mp4',
                    fps: 30,
                    style: 'ugc'
                },
                seo_keywords: ['video ad creator', 'UGC style video', 'promotional video maker'],
                benefits: ['Advertising ready', 'UGC authenticity', 'Conversion optimized']
            },
            'C3-60': {
                a2e_tool: 'img2vid',
                display_name: '60s Explainer/YouTube',
                description: 'Craft compelling 60-second explainer videos and YouTube shorts that educate and inspire your audience',
                category: 'video',
                icon: '🎥',
                inputs: ['image', 'prompt'],
                options: {
                    duration: 60,
                    format: 'mp4',
                    fps: 30,
                    youtube_optimized: true
                },
                seo_keywords: ['explainer video maker', 'youtube shorts creator', 'tutorial video'],
                benefits: ['YouTube optimized', 'Perfect for tutorials', 'Educational content ready']
            },

            // ===== VOICE & CLONE (V4/V5) =====
            'D1-VO30': {
                a2e_tool: 'tts',
                display_name: '30s Voiceover',
                description: 'Generate broadcast-quality 30-second voiceovers perfect for ads, podcasts, and video narration',
                category: 'voice',
                icon: '🎙️',
                inputs: ['text'],
                options: {
                    duration: 30,
                    format: 'mp3',
                    voice_type: 'professional'
                },
                seo_keywords: ['AI voiceover generator', 'text to speech professional', 'voice narration'],
                benefits: ['Professional quality', 'Multiple voice options', 'Instant delivery']
            },
            'D2-CLONE': {
                a2e_tool: 'voice_clone',
                display_name: 'Standard Voice Clone',
                description: 'Clone any voice with standard quality - ideal for creating consistent branded voice content',
                category: 'voice',
                icon: '🗣️',
                inputs: ['audio'],
                options: {
                    quality: 'standard',
                    sample_duration: 30
                },
                seo_keywords: ['voice cloning AI', 'custom voice generator', 'personal voice AI'],
                benefits: ['Your unique voice', 'Unlimited use', 'Fast processing']
            },
            'D3-CLPRO': {
                a2e_tool: 'voice_clone',
                display_name: 'Advanced Voice Clone',
                description: 'Professional-grade voice cloning with emotion control for audiobooks, podcasts, and premium content',
                category: 'voice',
                icon: '🎤',
                inputs: ['audio'],
                options: {
                    quality: 'professional',
                    sample_duration: 60,
                    emotion_control: true
                },
                seo_keywords: ['professional voice clone', 'emotion AI voice', 'audiobook narrator'],
                benefits: ['Studio quality', 'Emotion control', 'Natural inflection']
            },
            'D4-5PK': {
                a2e_tool: 'tts',
                display_name: '5x30s Voice Spots',
                description: 'Bulk create five 30-second voice spots with varied tones for radio ads, announcements, and marketing',
                category: 'voice',
                icon: '📻',
                inputs: ['text'],
                options: {
                    batch_size: 5,
                    duration: 30,
                    format: 'mp3',
                    voice_variety: true
                },
                seo_keywords: ['radio spot creator', 'voice ad package', 'bulk voiceover'],
                benefits: ['5 unique variations', 'Cost-effective bundle', 'Campaign ready']
            },

            // ===== SEO CONTENT (V6) =====
            'F1-STARTER': {
                a2e_tool: 'text_generation',
                display_name: '10 SEO Articles + Images',
                description: 'Kickstart your content strategy with 10 SEO-optimized articles and matching images that rank on Google',
                category: 'content',
                icon: '📝',
                inputs: ['prompt'],
                options: {
                    article_count: 10,
                    seo_optimized: true,
                    include_images: true,
                    word_count: 1000
                },
                seo_keywords: ['SEO article writer', 'blog content generator', 'AI content creation'],
                benefits: ['Google-friendly content', 'Keyword optimized', 'Images included']
            },
            'F2-AUTH': {
                a2e_tool: 'text_generation',
                display_name: '40 SEO Articles + Linking',
                description: 'Build topical authority with 40 interconnected SEO articles featuring strategic internal linking to dominate search rankings',
                category: 'content',
                icon: '🔗',
                inputs: ['prompt'],
                options: {
                    article_count: 40,
                    seo_optimized: true,
                    include_images: true,
                    internal_linking: true,
                    word_count: 1500
                },
                seo_keywords: ['content marketing package', 'topical authority builder', 'SEO link strategy'],
                benefits: ['Topical authority', 'Internal link strategy', 'Search engine dominance']
            },
            'F3-DOMINATOR': {
                a2e_tool: 'text_generation',
                display_name: '150 Articles + Strategy',
                description: 'Dominate your niche with 150 premium SEO articles, comprehensive keyword strategy, and content calendar',
                category: 'content',
                icon: '👑',
                inputs: ['prompt'],
                options: {
                    article_count: 150,
                    seo_optimized: true,
                    include_images: true,
                    internal_linking: true,
                    content_strategy: true,
                    word_count: 2000
                },
                seo_keywords: ['content domination', 'enterprise SEO package', 'authority site builder'],
                benefits: ['Market domination', 'Complete strategy', '6 months of content']
            },

            // ===== MULTI-MODAL BUNDLES (V7) =====
            'E1-ECOM25': {
                a2e_tool: 'batch_img2img',
                display_name: 'E-commerce Pack (25 SKUs)',
                description: 'Launch your online store with 75 professional product images (3 angles per SKU) optimized for Shopify, Amazon, and more',
                category: 'bundle',
                icon: '🛒',
                inputs: ['image', 'prompt'],
                options: {
                    product_count: 25,
                    images_per_product: 3,
                    ecommerce_optimized: true,
                    white_background: true
                },
                seo_keywords: ['product photography', 'ecommerce images', 'shopify product photos'],
                benefits: ['Store-ready images', 'Multiple angles', 'White background standard']
            },
            'E2-LAUNCHKIT': {
                a2e_tool: 'multimodal_bundle',
                display_name: 'Brand Launch Kit',
                description: 'Everything you need to launch your brand: logo, banners, social graphics, video intro, and marketing materials',
                category: 'bundle',
                icon: '🚀',
                inputs: ['image', 'prompt', 'text'],
                options: {
                    includes: ['logo', 'banner', 'social_posts', 'video_intro'],
                    brand_kit: true,
                    comprehensive: true
                },
                seo_keywords: ['brand launch package', 'startup branding kit', 'business identity'],
                benefits: ['Complete brand assets', 'Launch-ready materials', 'Cohesive design']
            },
            'E3-AGENCY100': {
                a2e_tool: 'multimodal_bundle',
                display_name: 'Agency Asset Bank (100 assets)',
                description: 'Empower your agency with 100 premium mixed-media assets including images, videos, and graphics with commercial licensing',
                category: 'bundle',
                icon: '💼',
                inputs: ['image', 'prompt', 'text'],
                options: {
                    asset_count: 100,
                    mixed_types: true,
                    commercial_license: true,
                    asset_variety: ['images', 'videos', 'graphics']
                },
                seo_keywords: ['agency asset pack', 'white label content', 'commercial use media'],
                benefits: ['100 premium assets', 'Commercial rights', 'Client-ready content']
            }
        };
    }

    /**
     * Get tool configuration for a specific SKU
     */
    getToolConfig(skuCode) {
        return this.toolMappings[skuCode] || null;
    }

    /**
     * Get all tools organized by category
     */
    getToolsByCategory() {
        const categories = {
            image: [],
            video: [],
            voice: [],
            content: [],
            bundle: []
        };

        // Get all SKUs from database with pricing
        const skus = this.db.prepare(`
            SELECT s.*, v.name as vector_name, v.code as vector_code
            FROM skus s
            LEFT JOIN vectors v ON s.vector_id = v.id
            WHERE s.active = 1
            ORDER BY s.base_price_cents ASC
        `).all();

        skus.forEach(sku => {
            const toolConfig = this.getToolConfig(sku.code);
            if (toolConfig) {
                const category = toolConfig.category;
                categories[category].push({
                    sku_code: sku.code,
                    name: sku.name,
                    display_name: toolConfig.display_name,
                    description: sku.description,
                    icon: toolConfig.icon,
                    vector_name: sku.vector_name,
                    vector_code: sku.vector_code,
                    base_price_usd: (sku.base_price_cents / 100).toFixed(2),
                    base_price_cents: sku.base_price_cents,
                    base_credits: sku.base_credits,
                    inputs: toolConfig.inputs,
                    a2e_tool: toolConfig.a2e_tool
                });
            }
        });

        return categories;
    }

    /**
     * Get A2E tool name for a SKU
     */
    getA2ETool(skuCode) {
        const config = this.getToolConfig(skuCode);
        return config ? config.a2e_tool : null;
    }

    /**
     * Get tool options for a SKU
     */
    getToolOptions(skuCode) {
        const config = this.getToolConfig(skuCode);
        return config ? config.options : {};
    }

    /**
     * Get required inputs for a SKU
     */
    getRequiredInputs(skuCode) {
        const config = this.getToolConfig(skuCode);
        return config ? config.inputs : [];
    }

    /**
     * Get full catalog with all details
     */
    getFullCatalog() {
        const categories = this.getToolsByCategory();
        
        return {
            categories,
            total_tools: Object.values(categories).reduce((sum, cat) => sum + cat.length, 0),
            category_names: {
                image: 'Image Generation & Editing',
                video: 'Video Creation',
                voice: 'Voice & Audio',
                content: 'SEO Content',
                bundle: 'Multi-Modal Bundles'
            }
        };
    }

    /**
     * Get SKU by user's plan - filter tools available to user based on their plan
     */
    getToolsByPlan(userId) {
        // Get user's active plan
        const userPlan = this.db.prepare(`
            SELECT up.*, p.code as plan_code, p.included_seconds
            FROM user_plans up
            JOIN plans p ON up.plan_id = p.id
            WHERE up.user_id = ? AND up.status = 'active'
            AND (up.end_date IS NULL OR up.end_date > datetime('now'))
            ORDER BY up.created_at DESC
            LIMIT 1
        `).get(userId);

        const allTools = this.getFullCatalog();

        // If no plan, return all tools but mark availability
        if (!userPlan) {
            return {
                ...allTools,
                user_plan: null,
                note: 'All tools available for purchase. Subscribe to a plan for included credits.'
            };
        }

        // Calculate usage
        const usage = this.db.prepare(`
            SELECT seconds_used FROM plan_usage
            WHERE user_id = ? AND plan_id = ?
            AND period_start <= datetime('now')
            AND period_end >= datetime('now')
            ORDER BY created_at DESC
            LIMIT 1
        `).get(userId, userPlan.plan_id);

        const remainingSeconds = userPlan.included_seconds - (usage?.seconds_used || 0);

        return {
            ...allTools,
            user_plan: {
                code: userPlan.plan_code,
                included_seconds: userPlan.included_seconds,
                remaining_seconds: Math.max(0, remainingSeconds),
                usage_percent: ((usage?.seconds_used || 0) / userPlan.included_seconds * 100).toFixed(1)
            }
        };
    }
}

module.exports = SKUToolCatalog;
