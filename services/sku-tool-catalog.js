/**
 * SKU Tool Catalog Service
 * Now consumes from unified catalog.js as single source of truth
 */

const { getMonthPeriod } = require('./date-utils');
const { catalog } = require('../shared/config/catalog');

class SKUToolCatalog {
    constructor(db) {
        this.db = db;
        this.catalog = catalog;
        this.skuToToolMap = this.buildSkuToToolMap();
    }

    /**
     * Build mapping from SKU codes to tool keys
     */
    buildSkuToToolMap() {
        const map = {};
        this.catalog.forEach(tool => {
            if (tool.sku_code) {
                map[tool.sku_code] = tool.key;
            }
        });
        return map;
    }

    /**
     * Get tool configuration by SKU code
     */
    getToolConfig(skuCode) {
        const toolKey = this.skuToToolMap[skuCode];
        if (!toolKey) return null;

        const tool = this.catalog.find(t => t.key === toolKey);
        if (!tool) return null;

        // Return in the format expected by existing code
        return {
            a2e_tool: toolKey, // For backward compatibility, use tool key as A2E tool
            display_name: tool.name,
            description: tool.description,
            category: tool.category,
            icon: tool.icon || '🔧',
            inputs: tool.inputs,
            options: {} // Options are now handled via adjustments
        };
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
            const tool = this.catalog.find(t => t.sku_code === sku.code);
            if (tool) {
                const category = tool.category;
                categories[category].push({
                    sku_code: sku.code,
                    name: sku.name,
                    display_name: tool.name,
                    description: tool.description,
                    icon: tool.icon || '🔧',
                    vector_name: sku.vector_name,
                    vector_code: sku.vector_code,
                    base_price_usd: (sku.base_price_cents / 100).toFixed(2),
                    base_price_cents: sku.base_price_cents,
                    base_credits: sku.base_credits,
                    inputs: tool.inputs,
                    a2e_tool: tool.key, // Use tool key as A2E tool identifier
                    pricing_profile: tool.pricing_profile,
                    flags: tool.flags
                });
            }
        });

        return categories;
    }

    /**
     * Get A2E tool name for a SKU (returns tool key from catalog)
     */
    getA2ETool(skuCode) {
        const toolKey = this.skuToToolMap[skuCode];
        return toolKey || null;
    }

    /**
     * Get tool options for a SKU (now empty as options are handled via adjustments)
     */
    getToolOptions(skuCode) {
        return {}; // Options are now handled via adjustments in catalog
    }

    /**
     * Get required inputs for a SKU
     */
    getRequiredInputs(skuCode) {
        const tool = this.catalog.find(t => t.sku_code === skuCode);
        return tool ? tool.inputs : [];
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
     * Get tools by user's plan - filter tools available to user based on their plan
     * Now uses unified catalog data
     */
    getToolsByPlan(userId) {
        const now = new Date().toISOString();

        // Get user's active plan
        const userPlan = this.db.prepare(`
            SELECT up.*, p.code as plan_code, p.included_seconds
            FROM user_plans up
            JOIN plans p ON up.plan_id = p.id
            WHERE up.user_id = ? AND up.status = 'active'
            AND (up.end_date IS NULL OR up.end_date > ?)
            ORDER BY up.created_at DESC
            LIMIT 1
        `).get(userId, now);

        const allTools = this.getFullCatalog();

        // If no plan, return all tools but mark availability
        if (!userPlan) {
            return {
                ...allTools,
                user_plan: null,
                note: 'All tools available for purchase. Subscribe to a plan for included credits.'
            };
        }

        // Use shared date helper for consistent period calculations
        const { periodStart, periodEnd } = getMonthPeriod(new Date());

        const usage = this.db.prepare(`
            SELECT seconds_used FROM plan_usage
            WHERE user_id = ? AND plan_id = ?
            AND period_start = ?
            AND period_end = ?
            ORDER BY created_at DESC
            LIMIT 1
        `).get(userId, userPlan.plan_id, periodStart, periodEnd);

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
