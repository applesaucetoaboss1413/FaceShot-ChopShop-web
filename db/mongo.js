const mongoose = require('mongoose');
const {
    User,
    UserCredits,
    Job,
    Purchase,
    ProcessedEvent,
    Vector,
    Plan,
    Sku,
    Flag,
    UserPlan,
    PlanUsage,
    Order,
    AnalyticsEvent,
    MiniappCreation,
    SkuToolConfig,
    SkuToolStep,
    SkuCustomerOption,
    JobStep,
    A2eApiCall,
    ErrorLog,
    A2eHealthCheck,
    SystemHealthMetric,
    SchemaMigration,
    Stats
} = require('../FaceShot-ChopShop-web/models');

/**
 * MongoDB Database Operations
 * Provides MongoDB operations that match SQLite API for easy migration
 */

class MongoDatabase {
    constructor() {
        // Connection handled by mongoClient
    }

    // User operations
    async createUser(email, passwordHash, firstName = null, telegramUserId = null) {
        const user = await User.create({
            email: email.toLowerCase().trim(),
            password_hash: passwordHash,
            first_name: firstName,
            telegram_user_id: telegramUserId
        });

        // Initialize credits
        await UserCredits.create({
            user_id: user._id,
            balance: 0
        });

        // Update stats
        await Stats.updateOne({}, { $inc: { total_users: 1 } });

        return {
            id: user._id.toString(),
            email: user.email,
            first_name: user.first_name,
            telegram_user_id: user.telegram_user_id,
            created_at: user.created_at
        };
    }

    async getUserByEmail(email) {
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) return null;

        return {
            id: user._id.toString(),
            email: user.email,
            password_hash: user.password_hash,
            first_name: user.first_name,
            telegram_user_id: user.telegram_user_id,
            created_at: user.created_at
        };
    }

    async getUserById(userId) {
        const user = await User.findById(userId);
        if (!user) return null;

        return {
            id: user._id.toString(),
            email: user.email,
            first_name: user.first_name,
            telegram_user_id: user.telegram_user_id,
            created_at: user.created_at
        };
    }

    // Credits operations
    async getCredits(userId) {
        let credits = await UserCredits.findOne({ user_id: userId });

        if (!credits) {
            credits = await UserCredits.create({
                user_id: userId,
                balance: 0
            });
        }

        return {
            user_id: userId,
            balance: credits.balance
        };
    }

    async addCredits(userId, amount) {
        let credits = await UserCredits.findOne({ user_id: userId });

        if (!credits) {
            credits = await UserCredits.create({
                user_id: userId,
                balance: amount
            });
        } else {
            credits.balance += amount;
            credits.updated_at = new Date();
            await credits.save();
        }

        return credits.balance;
    }

    async deductCredits(userId, amount) {
        const credits = await UserCredits.findOne({ user_id: userId });

        if (!credits || credits.balance < amount) {
            throw new Error('insufficient_credits');
        }

        credits.balance -= amount;
        credits.updated_at = new Date();
        await credits.save();

        return credits.balance;
    }

    // Job operations
    async createJob(userId, type, sourceUrl, options = {}, targetUrl = null, orderId = null) {
        const job = await Job.create({
            user_id: userId,
            type,
            source_url: sourceUrl,
            target_url: targetUrl,
            status: 'pending',
            options,
            order_id: orderId
        });

        // Update stats
        await Stats.updateOne({}, { $inc: { total_jobs: 1 } });

        return {
            id: job._id.toString(),
            user_id: userId,
            type: job.type,
            status: job.status,
            source_url: job.source_url,
            target_url: job.target_url,
            options: job.options,
            order_id: job.order_id,
            created_at: job.created_at
        };
    }

    async updateJob(jobId, updates) {
        const job = await Job.findById(jobId);
        if (!job) throw new Error('Job not found');

        Object.assign(job, updates);
        job.updated_at = new Date();

        if (updates.status === 'completed') {
            job.completed_at = new Date();

            // Update video stats if it's a video creation job
            if (['img2vid', 'avatar_video', 'talking_photo', 'talking_video'].includes(job.type)) {
                await Stats.updateOne({}, { $inc: { videos: 1 } });
            }
        }

        await job.save();

        return {
            id: job._id.toString(),
            status: job.status,
            result_url: job.result_url,
            error: job.error
        };
    }

    async getJob(jobId) {
        const job = await Job.findById(jobId);
        if (!job) return null;

        return {
            id: job._id.toString(),
            user_id: job.user_id.toString(),
            type: job.type,
            status: job.status,
            source_url: job.source_url,
            target_url: job.target_url,
            result_url: job.result_url,
            a2e_task_id: job.a2e_task_id,
            options: job.options,
            credits_used: job.credits_used,
            error: job.error,
            order_id: job.order_id,
            created_at: job.created_at,
            updated_at: job.updated_at,
            completed_at: job.completed_at
        };
    }

    async getUserJobs(userId, limit = 50) {
        const jobs = await Job.find({ user_id: userId })
            .sort({ created_at: -1 })
            .limit(limit);

        return jobs.map(job => ({
            id: job._id.toString(),
            type: job.type,
            status: job.status,
            result_url: job.result_url,
            created_at: job.created_at,
            url: job.result_url // Alias for compatibility
        }));
    }

    async getPendingJobs() {
        const jobs = await Job.find({
            status: { $in: ['pending', 'processing'] },
            a2e_task_id: { $exists: true, $ne: null }
        }).limit(100);

        return jobs.map(job => ({
            id: job._id.toString(),
            type: job.type,
            a2e_task_id: job.a2e_task_id,
            status: job.status
        }));
    }

    // Purchase operations
    async createPurchase(userId, stripePaymentId, amountCents, creditsPurchased, packType = null, currency = 'usd') {
        const purchase = await Purchase.create({
            user_id: userId,
            stripe_payment_id: stripePaymentId,
            amount_cents: amountCents,
            credits_purchased: creditsPurchased,
            pack_type: packType,
            currency,
            status: 'completed'
        });

        return {
            id: purchase._id.toString(),
            user_id: userId,
            amount_cents: amountCents,
            credits_purchased: creditsPurchased,
            pack_type: packType,
            currency
        };
    }

    // Vector operations
    async getVectors() {
        return await Vector.find({}).sort({ created_at: 1 });
    }

    async getVectorById(id) {
        return await Vector.findOne({ id });
    }

    async getVectorByCode(code) {
        return await Vector.findOne({ code });
    }

    // Plan operations
    async getPlans(active = true) {
        const query = active ? { active: true } : {};
        return await Plan.find(query).sort({ monthly_price_cents: 1 });
    }

    async getPlanById(id) {
        return await Plan.findOne({ id, active: true });
    }

    async getPlanByCode(code) {
        return await Plan.findOne({ code, active: true });
    }

    // SKU operations
    async getSkus(active = true) {
        const query = active ? { active: true } : {};
        return await Sku.find(query).sort({ created_at: 1 });
    }

    async getSkuById(id) {
        return await Sku.findOne({ id, active: true });
    }

    async getSkuByCode(code) {
        return await Sku.findOne({ code, active: true });
    }

    // Flag operations
    async getFlags(active = true) {
        const query = active ? { active: true } : {};
        return await Flag.find(query).sort({ created_at: 1 });
    }

    async getFlagsByCodes(codes) {
        return await Flag.find({ code: { $in: codes }, active: true });
    }

    // User Plan operations
    async getUserActivePlan(userId) {
        const now = new Date();
        return await UserPlan.findOne({
            user_id: userId,
            status: 'active',
            start_date: { $lte: now },
            $or: [{ end_date: null }, { end_date: { $gt: now } }]
        }).sort({ start_date: -1 });
    }

    async createUserPlan(userId, planId, startDate, endDate = null, stripeSubscriptionId = null) {
        return await UserPlan.create({
            user_id: userId,
            plan_id: planId,
            start_date: startDate,
            end_date: endDate,
            stripe_subscription_id: stripeSubscriptionId
        });
    }

    // Plan Usage operations
    async getCurrentPeriodUsage(userId, planId, periodStart, periodEnd) {
        return await PlanUsage.findOne({
            user_id: userId,
            plan_id: planId,
            period_start: periodStart,
            period_end: periodEnd
        });
    }

    async createOrUpdatePlanUsage(userId, planId, periodStart, periodEnd, secondsUsed = 0) {
        let usage = await PlanUsage.findOne({
            user_id: userId,
            plan_id: planId,
            period_start: periodStart,
            period_end: periodEnd
        });

        if (!usage) {
            usage = await PlanUsage.create({
                user_id: userId,
                plan_id: planId,
                period_start: periodStart,
                period_end: periodEnd,
                seconds_used: secondsUsed
            });
        } else {
            usage.seconds_used = secondsUsed;
            usage.updated_at = new Date();
            await usage.save();
        }

        return usage;
    }

    async deductUsage(userId, planId, periodStart, periodEnd, seconds) {
        const usage = await PlanUsage.findOne({
            user_id: userId,
            plan_id: planId,
            period_start: periodStart,
            period_end: periodEnd
        });

        if (usage) {
            usage.seconds_used += seconds;
            usage.updated_at = new Date();
            await usage.save();
        }

        return usage;
    }

    // Order operations
    async createOrder(userId, skuCode, quantity, appliedFlags, customerPriceCents, internalCostCents, marginPercent, totalSeconds, overageSeconds = 0, stripePaymentIntentId = null, currency = 'usd') {
        return await Order.create({
            user_id: userId,
            sku_code: skuCode,
            quantity,
            applied_flags: appliedFlags,
            customer_price_cents: customerPriceCents,
            internal_cost_cents: internalCostCents,
            margin_percent: marginPercent,
            total_seconds: totalSeconds,
            overage_seconds: overageSeconds,
            stripe_payment_intent_id: stripePaymentIntentId,
            currency
        });
    }

    async updateOrderStatus(orderId, status) {
        return await Order.findByIdAndUpdate(orderId, { status }, { new: true });
    }

    async getUserOrders(userId, limit = 50) {
        return await Order.find({ user_id: userId }).sort({ created_at: -1 }).limit(limit);
    }

    // Analytics Events operations
    async createAnalyticsEvent(type, userId = null, data = {}) {
        return await AnalyticsEvent.create({
            type,
            user_id: userId,
            data
        });
    }

    // Miniapp Creations operations
    async createMiniappCreation(userId, type, status, url = null) {
        return await MiniappCreation.create({
            user_id: userId,
            type,
            status,
            url
        });
    }

    async getLatestMiniappCreation(userId, type) {
        return await MiniappCreation.findOne({
            user_id: userId,
            type
        }).sort({ created_at: -1 });
    }

    // SKU Tool Config operations
    async getSkuToolConfig(skuCode) {
        const config = await SkuToolConfig.findOne({ sku_code: skuCode, active: true });
        if (!config) return null;

        const steps = await this.getSkuToolSteps(config._id);
        const options = await this.getSkuCustomerOptions(config._id);

        return {
            ...config.toObject(),
            steps: steps.map(step => ({
                ...step.toObject(),
                params_template: step.params_template || {},
                condition_expression: step.condition_expression
            })),
            customer_options: options.map(opt => ({
                ...opt.toObject(),
                option_values: opt.option_values,
                validation_rules: opt.validation_rules
            }))
        };
    }

    async createSkuToolConfig(skuCode) {
        return await SkuToolConfig.create({ sku_code: skuCode });
    }

    async updateSkuToolConfig(configId, updates) {
        return await SkuToolConfig.findByIdAndUpdate(configId, { ...updates, updated_at: new Date() }, { new: true });
    }

    async getAllConfiguredSKUs() {
        const configs = await SkuToolConfig.find({ active: true });
        return configs.map(config => config.sku_code);
    }

    // SKU Tool Steps operations
    async getSkuToolSteps(configId) {
        return await SkuToolStep.find({ config_id: configId }).sort({ step_order: 1 });
    }

    async createSkuToolStep(configId, stepData) {
        return await SkuToolStep.create({
            config_id: configId,
            ...stepData
        });
    }

    async deleteSkuToolSteps(configId) {
        return await SkuToolStep.deleteMany({ config_id: configId });
    }

    // SKU Customer Options operations
    async getSkuCustomerOptions(configId) {
        return await SkuCustomerOption.find({ config_id: configId }).sort({ display_order: 1 });
    }

    async createSkuCustomerOption(configId, optionData) {
        return await SkuCustomerOption.create({
            config_id: configId,
            ...optionData
        });
    }

    async deleteSkuCustomerOptions(configId) {
        return await SkuCustomerOption.deleteMany({ config_id: configId });
    }

    // Job Steps operations
    async createJobStep(jobId, stepOrder, toolType, inputData = {}) {
        return await JobStep.create({
            job_id: jobId,
            step_order: stepOrder,
            tool_type: toolType,
            input_data: inputData
        });
    }

    async updateJobStep(stepId, updates) {
        const updateData = { ...updates };
        if (updates.status) updateData.status = updates.status;
        if (updates.output_data) updateData.output_data = updates.output_data;
        if (updates.error_message) updateData.error_message = updates.error_message;
        if (updates.completed_at) updateData.completed_at = updates.completed_at;

        return await JobStep.findByIdAndUpdate(stepId, updateData, { new: true });
    }

    async getJobSteps(jobId) {
        return await JobStep.find({ job_id: jobId }).sort({ step_order: 1 });
    }

    async getJobStep(stepId) {
        return await JobStep.findById(stepId);
    }

    // A2E API Calls operations
    async createA2eApiCall(endpoint, method, requestData = {}, responseData = {}, responseTimeMs = null, success = true, errorMessage = null, creditsUsed = 0) {
        return await A2eApiCall.create({
            endpoint,
            method,
            request_data: requestData,
            response_data: responseData,
            response_time_ms: responseTimeMs,
            success,
            error_message: errorMessage,
            credits_used: creditsUsed
        });
    }

    // Error Logs operations
    async createErrorLog(type, message, stackTrace = null, userId = null, jobId = null, metadata = {}) {
        return await ErrorLog.create({
            type,
            message,
            stack_trace: stackTrace,
            user_id: userId,
            job_id: jobId,
            metadata
        });
    }

    // A2E Health Checks operations
    async createA2eHealthCheck(endpointType, responseTimeMs = null, success = true, creditsRemaining = null, errorMessage = null) {
        return await A2eHealthCheck.create({
            endpoint_type: endpointType,
            response_time_ms: responseTimeMs,
            success,
            credits_remaining: creditsRemaining,
            error_message: errorMessage
        });
    }

    // System Health Metrics operations
    async createSystemHealthMetric(metricName, value, unit = null) {
        return await SystemHealthMetric.create({
            metric_name: metricName,
            value,
            unit
        });
    }

    // Processed Webhooks operations
    async getProcessedEvent(eventId) {
        return await ProcessedEvent.findOne({ event_id: eventId });
    }

    async createProcessedEvent(eventId, eventType, status = 'processed') {
        return await ProcessedEvent.create({
            event_id: eventId,
            event_type: eventType,
            status
        });
    }

    // Stats operations
    async getStats() {
        const stats = await Stats.findOne();
        if (!stats) {
            return { total_users: 0, total_jobs: 0, videos: 0 };
        }

        return {
            total_users: stats.total_users,
            total_jobs: stats.total_jobs,
            videos: stats.videos
        };
    }

    // Schema Migrations operations
    async getAppliedMigrations() {
        const migrations = await SchemaMigration.find({}).sort({ version: 1 });
        return migrations.map(m => ({ version: m.version, name: m.name, applied_at: m.applied_at }));
    }

    async applyMigration(version, name) {
        return await SchemaMigration.create({
            version,
            name
        });
    }

    // Transaction helper (MongoDB doesn't need explicit transactions for single operations)
    transaction(fn) {
        return fn;
    }

    // Prepare statement helper (for compatibility with SQLite API)
    prepare(query) {
        // This is a compatibility layer - MongoDB operations are async
        return {
            get: async (...args) => {
                throw new Error('Use async methods instead of prepare().get()');
            },
            all: async (...args) => {
                throw new Error('Use async methods instead of prepare().all()');
            },
            run: async (...args) => {
                throw new Error('Use async methods instead of prepare().run()');
            }
        };
    }
}

module.exports = new MongoDatabase();