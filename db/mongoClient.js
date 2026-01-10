const mongoose = require('mongoose');

// Import models to ensure they are registered with Mongoose
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
} = require('../FaceShot-ChopShop-web/models.js');

let isConnected = false;

/**
 * Connect to MongoDB Atlas using Mongoose
 * Connection is created once and reused
 */
const connectDB = async () => {
    if (isConnected) {
        return mongoose.connection.db;
    }

    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB_NAME;

    if (!uri) {
        throw new Error('MONGODB_URI environment variable is required');
    }

    try {
        await mongoose.connect(uri, {
            dbName: dbName || undefined, // Use dbName if provided, otherwise let URI handle it
            serverSelectionTimeoutMS: 5000,
        });

        isConnected = true;
        console.log('✅ MongoDB connected successfully via mongoClient');
        return mongoose.connection.db;
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        throw error;
    }
};

/**
 * Get MongoDB collections as Mongoose models
 * All collections are accessed through their respective models
 */
const getCollections = () => {
    return {
        users: User,
        userCredits: UserCredits,
        jobs: Job,
        purchases: Purchase,
        processedEvents: ProcessedEvent,
        vectors: Vector,
        plans: Plan,
        skus: Sku,
        flags: Flag,
        userPlans: UserPlan,
        planUsage: PlanUsage,
        orders: Order,
        analyticsEvents: AnalyticsEvent,
        miniappCreations: MiniappCreation,
        skuToolConfigs: SkuToolConfig,
        skuToolSteps: SkuToolStep,
        skuCustomerOptions: SkuCustomerOption,
        jobSteps: JobStep,
        a2eApiCalls: A2eApiCall,
        errorLogs: ErrorLog,
        a2eHealthChecks: A2eHealthCheck,
        systemHealthMetrics: SystemHealthMetric,
        schemaMigrations: SchemaMigration,
        stats: Stats
    };
};

/**
 * Get the native MongoDB database instance
 */
const getDB = () => {
    if (!isConnected) {
        throw new Error('Database not connected. Call connectDB() first.');
    }
    return mongoose.connection.db;
};

/**
 * Close the database connection
 */
const closeDB = async () => {
    if (isConnected) {
        await mongoose.connection.close();
        isConnected = false;
        console.log('✅ MongoDB connection closed');
    }
};

module.exports = {
    connectDB,
    getCollections,
    getDB,
    closeDB
};