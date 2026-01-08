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
                description: 'AI-generated social media ready images',
                category: 'image',
                icon: '📸',
                inputs: ['image'],
                options: {
                    resolution: '1080p',
                    format: 'jpg'
                }
            },
            'A2-BH': {
                a2e_tool: 'img2img',
                display_name: 'Blog Hero 2K',
                description: 'High-quality 2K blog header images',
                category: 'image',
                icon: '🖼️',
                inputs: ['image'],
                options: {
                    resolution: '2k',
                    format: 'jpg',
                    enhance: true
                }
            },
            'A3-4K': {
                a2e_tool: 'enhance',
                display_name: '4K Print-Ready',
                description: '4K resolution print-ready images',
                category: 'image',
                icon: '🎨',
                inputs: ['image'],
                options: {
                    resolution: '4k',
                    format: 'png',
                    enhance: true
                }
            },
            'A4-BR': {
                a2e_tool: 'faceswap',
                display_name: 'Brand-Styled Image',
                description: 'Custom brand-styled image creation',
                category: 'image',
                icon: '🏢',
                inputs: ['image', 'prompt'],
                options: {
                    custom_branding: true,
                    resolution: '2k',
                    style_transfer: true
                }
            },

            // ===== SOCIAL BUNDLES (V7) =====
            'B1-30SOC': {
                a2e_tool: 'batch_img2img',
                display_name: '30 Social Creatives',
                description: 'Bundle of 30 social media images',
                category: 'bundle',
                icon: '📱',
                inputs: ['image', 'prompt'],
                options: {
                    batch_size: 30,
                    variations: true,
                    social_formats: ['instagram', 'facebook', 'twitter']
                }
            },
            'B2-90SOC': {
                a2e_tool: 'batch_img2img',
                display_name: '90 Creatives + Captions',
                description: '90 social images with AI-generated captions',
                category: 'bundle',
                icon: '💬',
                inputs: ['image', 'prompt'],
                options: {
                    batch_size: 90,
                    variations: true,
                    generate_captions: true,
                    social_formats: ['instagram', 'facebook', 'twitter', 'linkedin']
                }
            },

            // ===== VIDEO GENERATION (V3) =====
            'C1-15': {
                a2e_tool: 'img2vid',
                display_name: '15s Promo/Reel',
                description: '15-second promotional video or reel',
                category: 'video',
                icon: '🎬',
                inputs: ['image', 'prompt'],
                options: {
                    duration: 15,
                    format: 'mp4',
                    fps: 30
                }
            },
            'C2-30': {
                a2e_tool: 'img2vid',
                display_name: '30s Ad/UGC Clip',
                description: '30-second ad or UGC style video',
                category: 'video',
                icon: '📹',
                inputs: ['image', 'prompt'],
                options: {
                    duration: 30,
                    format: 'mp4',
                    fps: 30,
                    style: 'ugc'
                }
            },
            'C3-60': {
                a2e_tool: 'img2vid',
                display_name: '60s Explainer/YouTube',
                description: '60-second explainer or YouTube video',
                category: 'video',
                icon: '🎥',
                inputs: ['image', 'prompt'],
                options: {
                    duration: 60,
                    format: 'mp4',
                    fps: 30,
                    youtube_optimized: true
                }
            },

            // ===== VOICE & CLONE (V4/V5) =====
            'D1-VO30': {
                a2e_tool: 'tts',
                display_name: '30s Voiceover',
                description: '30-second professional voiceover',
                category: 'voice',
                icon: '🎙️',
                inputs: ['text'],
                options: {
                    duration: 30,
                    format: 'mp3',
                    voice_type: 'professional'
                }
            },
            'D2-CLONE': {
                a2e_tool: 'voice_clone',
                display_name: 'Standard Voice Clone',
                description: 'Standard quality voice cloning',
                category: 'voice',
                icon: '🗣️',
                inputs: ['audio'],
                options: {
                    quality: 'standard',
                    sample_duration: 30
                }
            },
            'D3-CLPRO': {
                a2e_tool: 'voice_clone',
                display_name: 'Advanced Voice Clone',
                description: 'Professional-grade voice cloning',
                category: 'voice',
                icon: '🎤',
                inputs: ['audio'],
                options: {
                    quality: 'professional',
                    sample_duration: 60,
                    emotion_control: true
                }
            },
            'D4-5PK': {
                a2e_tool: 'tts',
                display_name: '5x30s Voice Spots',
                description: 'Package of 5 x 30-second voiceovers',
                category: 'voice',
                icon: '📻',
                inputs: ['text'],
                options: {
                    batch_size: 5,
                    duration: 30,
                    format: 'mp3',
                    voice_variety: true
                }
            },

            // ===== SEO CONTENT (V6) =====
            'F1-STARTER': {
                a2e_tool: 'text_generation',
                display_name: '10 SEO Articles + Images',
                description: '10 SEO-optimized articles with images',
                category: 'content',
                icon: '📝',
                inputs: ['prompt'],
                options: {
                    article_count: 10,
                    seo_optimized: true,
                    include_images: true,
                    word_count: 1000
                }
            },
            'F2-AUTH': {
                a2e_tool: 'text_generation',
                display_name: '40 SEO Articles + Linking',
                description: '40 articles with internal link strategy',
                category: 'content',
                icon: '🔗',
                inputs: ['prompt'],
                options: {
                    article_count: 40,
                    seo_optimized: true,
                    include_images: true,
                    internal_linking: true,
                    word_count: 1500
                }
            },
            'F3-DOMINATOR': {
                a2e_tool: 'text_generation',
                display_name: '150 Articles + Strategy',
                description: 'Complete content domination package',
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
                }
            },

            // ===== MULTI-MODAL BUNDLES (V7) =====
            'E1-ECOM25': {
                a2e_tool: 'batch_img2img',
                display_name: 'E-commerce Pack (25 SKUs)',
                description: '25 product SKUs with 3 images each',
                category: 'bundle',
                icon: '🛒',
                inputs: ['image', 'prompt'],
                options: {
                    product_count: 25,
                    images_per_product: 3,
                    ecommerce_optimized: true,
                    white_background: true
                }
            },
            'E2-LAUNCHKIT': {
                a2e_tool: 'multimodal_bundle',
                display_name: 'Brand Launch Kit',
                description: 'Complete brand launch asset package',
                category: 'bundle',
                icon: '🚀',
                inputs: ['image', 'prompt', 'text'],
                options: {
                    includes: ['logo', 'banner', 'social_posts', 'video_intro'],
                    brand_kit: true,
                    comprehensive: true
                }
            },
            'E3-AGENCY100': {
                a2e_tool: 'multimodal_bundle',
                display_name: 'Agency Asset Bank (100 assets)',
                description: '100 mixed assets for agency use',
                category: 'bundle',
                icon: '💼',
                inputs: ['image', 'prompt', 'text'],
                options: {
                    asset_count: 100,
                    mixed_types: true,
                    commercial_license: true,
                    asset_variety: ['images', 'videos', 'graphics']
                }
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
