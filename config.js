// Centralized configuration with environment variable validation
// Ensures all secrets are read from environment variables only, with no hardcoded defaults

const requiredEnvVars = [
    'JWT_SECRET',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'A2E_API_KEY',
    'ADMIN_SECRET'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error('❌ CRITICAL: Missing required environment variables:');
    missingVars.forEach(varName => {
        console.error(`   - ${varName}`);
    });
    console.error('\n💡 Please set these variables in your .env file or environment.');
    console.error('   See README.md for the complete list of required environment variables.');
    process.exit(1);
}

console.log('✅ All required environment variables are present.');

module.exports = {
    // Authentication
    jwtSecret: process.env.JWT_SECRET,

    // Stripe
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,

    // Cloudinary
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET
    },

    // A2E API
    a2e: {
        apiKey: process.env.A2E_API_KEY,
        baseUrl: process.env.A2E_BASE_URL || 'https://video.a2e.ai'
    },

    // Admin
    adminSecret: process.env.ADMIN_SECRET,

    // Other config (with defaults)
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    dbPath: process.env.DB_PATH || (process.env.NODE_ENV === 'production' ? 'production.db' : 'dev.db'),
    publicUrl: process.env.PUBLIC_URL,
    frontendUrl: process.env.FRONTEND_URL,
    logLevel: process.env.LOG_LEVEL || 'info',
    supportedCurrencies: (process.env.SUPPORTED_CURRENCIES || 'usd,eur,gbp,mxn,cad,aud,jpy,cny,inr,brl,chf,sek,nok,dkk,pln,czk,huf,ron,bgn,hrk,rub,try,zar,sgd,hkd,nzd,krw,thb,myr,php,idr,vnd,twd,ars,clp,cop,pen,uyu').split(',').map(c => c.trim().toLowerCase()),
    defaultCurrency: (process.env.DEFAULT_CURRENCY || 'mxn').toLowerCase(),
    costPerCredit: parseFloat(process.env.COST_PER_CREDIT || '0.0111'),
    minMargin: parseFloat(process.env.MIN_MARGIN || '0.40'),
    maxJobSeconds: parseInt(process.env.MAX_JOB_SECONDS || '5000'),
    adminEmails: (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim())
};