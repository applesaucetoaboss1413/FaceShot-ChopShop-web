// Centralized configuration with environment variable validation
// Ensures all secrets are read from environment variables only, with no hardcoded defaults

const requiredEnvVars = [
    'SESSION_SECRET',
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
    jwtSecret: process.env.SESSION_SECRET,

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
    dbPath: process.env.DB_PATH || (process.env.NODE_ENV === 'production' ? undefined : 'dev.db'),
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

// Validate pricing constants for misconfigurations
const costPerCredit = module.exports.costPerCredit;
const minMargin = module.exports.minMargin;
const maxJobSeconds = module.exports.maxJobSeconds;

if (isNaN(costPerCredit) || costPerCredit <= 0) {
    console.error('❌ CRITICAL: COST_PER_CREDIT must be a positive number');
    process.exit(1);
}

if (isNaN(minMargin) || minMargin < 0 || minMargin > 1) {
    console.error('❌ CRITICAL: MIN_MARGIN must be between 0 and 1');
    process.exit(1);
}

if (isNaN(maxJobSeconds) || maxJobSeconds <= 0) {
    console.error('❌ CRITICAL: MAX_JOB_SECONDS must be a positive integer');
    process.exit(1);
}

console.log('✅ Pricing constants validated successfully.');
console.log(`   - COST_PER_CREDIT: $${costPerCredit.toFixed(4)} per credit`);
console.log(`   - MIN_MARGIN: ${(minMargin * 100).toFixed(1)}%`);
console.log(`   - MAX_JOB_SECONDS: ${maxJobSeconds}`);

// Validate database path configuration
if (module.exports.nodeEnv === 'production' && !module.exports.dbPath) {
    console.error('❌ CRITICAL: DB_PATH must be explicitly set in production environment.');
    console.error('💡 Please set DB_PATH in your environment variables (e.g., DB_PATH=/var/data/production.db)');
    console.error('   Never use default paths like "production.db" to prevent accidental commits.');
    process.exit(1);
}