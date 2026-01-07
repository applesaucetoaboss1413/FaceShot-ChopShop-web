const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const dotenv = require('dotenv')
const winston = require('winston')
const multer = require('multer')
const Stripe = require('stripe')
const cloudinary = require('cloudinary').v2
const axios = require('axios')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

dotenv.config()

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.json(),
    transports: [new winston.transports.Console()]
})

const app = express()
app.use(express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
        if (req.originalUrl === '/webhook/stripe') {
            req.rawBody = buf
        }
    }
}))
app.use(express.urlencoded({ extended: true }))
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }))
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
            connectSrc: ["'self'"],
        },
    },
}))

const rateLimitMap = new Map()
const RATE_LIMIT_WINDOW = 15 * 60 * 1000
const RATE_LIMIT_MAX = 100

setInterval(() => {
    const now = Date.now()
    for (const [ip, data] of rateLimitMap.entries()) {
        if (now - data.startTime > RATE_LIMIT_WINDOW) {
            rateLimitMap.delete(ip)
        }
    }
}, 60 * 60 * 1000)

const limiter = (req, res, next) => {
    if (req.path === '/health' || req.path === '/alive' || req.path === '/ready') return next()

    const ip = req.ip
    const now = Date.now()

    if (!rateLimitMap.has(ip)) {
        rateLimitMap.set(ip, { count: 1, startTime: now })
        return next()
    }

    const data = rateLimitMap.get(ip)

    if (now - data.startTime > RATE_LIMIT_WINDOW) {
        data.count = 1
        data.startTime = now
        return next()
    }

    if (data.count >= RATE_LIMIT_MAX) {
        return res.status(429).json({ error: 'too_many_requests' })
    }

    data.count++
    next()
}

const db = new Database(process.env.DB_PATH || 'production.db')

// Initialize DB and migrate if necessary
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY, 
        email TEXT UNIQUE, 
        password_hash TEXT, 
        first_name TEXT,
        telegram_user_id TEXT UNIQUE,
        created_at TEXT
    );
    CREATE TABLE IF NOT EXISTS user_credits (user_id INTEGER, balance INTEGER DEFAULT 0);
    CREATE TABLE IF NOT EXISTS purchases (id INTEGER PRIMARY KEY, user_id INTEGER, pack_type TEXT, points INTEGER, amount_cents INTEGER, created_at TEXT);
    CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY, 
        user_id INTEGER, 
        type TEXT, 
        status TEXT, 
        a2e_task_id TEXT,
        result_url TEXT, 
        error_message TEXT,
        cost_credits INTEGER DEFAULT 0,
        order_id INTEGER,
        created_at TEXT, 
        updated_at TEXT
    );
    CREATE TABLE IF NOT EXISTS analytics_events (id INTEGER PRIMARY KEY, type TEXT, user_id INTEGER, data TEXT, created_at TEXT);
    CREATE TABLE IF NOT EXISTS miniapp_creations (id INTEGER PRIMARY KEY, user_id INTEGER, type TEXT, status TEXT, url TEXT, created_at TEXT);
    CREATE TABLE IF NOT EXISTS vectors (id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, name TEXT NOT NULL, description TEXT, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS plans (id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, name TEXT NOT NULL, monthly_price_cents INTEGER NOT NULL, included_seconds INTEGER NOT NULL, overage_rate_per_second_cents INTEGER NOT NULL, description TEXT, active INTEGER DEFAULT 1, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS skus (id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, name TEXT NOT NULL, vector_id TEXT, base_credits INTEGER NOT NULL, base_price_cents INTEGER NOT NULL, default_flags TEXT DEFAULT '[]', description TEXT, active INTEGER DEFAULT 1, created_at TEXT NOT NULL, FOREIGN KEY(vector_id) REFERENCES vectors(id));
    CREATE TABLE IF NOT EXISTS flags (id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, label TEXT NOT NULL, price_multiplier REAL DEFAULT 1.0, price_add_flat_cents INTEGER DEFAULT 0, description TEXT, active INTEGER DEFAULT 1, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS user_plans (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, plan_id TEXT NOT NULL, start_date TEXT NOT NULL, end_date TEXT, auto_renew INTEGER DEFAULT 1, stripe_subscription_id TEXT, status TEXT DEFAULT 'active', created_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS idx_user_plans_user_id ON user_plans(user_id);
    CREATE TABLE IF NOT EXISTS plan_usage (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, plan_id TEXT NOT NULL, period_start TEXT NOT NULL, period_end TEXT NOT NULL, seconds_used INTEGER DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS idx_plan_usage_user_period ON plan_usage(user_id, period_start, period_end);
    CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, sku_code TEXT NOT NULL, quantity INTEGER DEFAULT 1, applied_flags TEXT DEFAULT '[]', customer_price_cents INTEGER NOT NULL, internal_cost_cents INTEGER NOT NULL, margin_percent REAL NOT NULL, total_seconds INTEGER NOT NULL, overage_seconds INTEGER DEFAULT 0, stripe_payment_intent_id TEXT, status TEXT DEFAULT 'pending', created_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
`)

const nowSeed = new Date().toISOString()

db.prepare(`INSERT OR IGNORE INTO vectors (id, code, name, description, created_at) VALUES (?, ?, ?, ?, ?)`).run('v1', 'V1', 'Image Generation', 'AI-powered image creation and generation', nowSeed)
db.prepare(`INSERT OR IGNORE INTO vectors (id, code, name, description, created_at) VALUES (?, ?, ?, ?, ?)`).run('v2', 'V2', 'Image Utility', 'Image enhancement, background removal, and utilities', nowSeed)
db.prepare(`INSERT OR IGNORE INTO vectors (id, code, name, description, created_at) VALUES (?, ?, ?, ?, ?)`).run('v3', 'V3', 'Video Generation', 'Video creation and animation services', nowSeed)
db.prepare(`INSERT OR IGNORE INTO vectors (id, code, name, description, created_at) VALUES (?, ?, ?, ?, ?)`).run('v4', 'V4', 'Voice Clone', 'Custom voice cloning services', nowSeed)
db.prepare(`INSERT OR IGNORE INTO vectors (id, code, name, description, created_at) VALUES (?, ?, ?, ?, ?)`).run('v5', 'V5', 'Voiceover / TTS', 'Text-to-speech and voiceover services', nowSeed)
db.prepare(`INSERT OR IGNORE INTO vectors (id, code, name, description, created_at) VALUES (?, ?, ?, ?, ?)`).run('v6', 'V6', 'Text Content / SEO', 'SEO content and article writing', nowSeed)
db.prepare(`INSERT OR IGNORE INTO vectors (id, code, name, description, created_at) VALUES (?, ?, ?, ?, ?)`).run('v7', 'V7', 'Multi-Modal Bundles', 'Comprehensive packages combining multiple services', nowSeed)

db.prepare(`INSERT OR IGNORE INTO plans (id, code, name, monthly_price_cents, included_seconds, overage_rate_per_second_cents, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run('plan_starter', 'STARTER', 'Starter', 1999, 600, 20, 'Perfect for individuals and small projects', nowSeed)
db.prepare(`INSERT OR IGNORE INTO plans (id, code, name, monthly_price_cents, included_seconds, overage_rate_per_second_cents, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run('plan_pro', 'PRO', 'Pro', 7999, 3000, 15, 'Ideal for professionals and growing businesses', nowSeed)
db.prepare(`INSERT OR IGNORE INTO plans (id, code, name, monthly_price_cents, included_seconds, overage_rate_per_second_cents, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run('plan_agency', 'AGENCY', 'Agency', 19900, 10000, 10, 'Enterprise-grade solution for agencies and teams', nowSeed)

db.prepare(`INSERT OR IGNORE INTO flags (id, code, label, price_multiplier, price_add_flat_cents, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).run('flag_r', 'R', 'Rapid (same-day)', 1.4, 0, 'Priority processing with same-day delivery', nowSeed)
db.prepare(`INSERT OR IGNORE INTO flags (id, code, label, price_multiplier, price_add_flat_cents, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).run('flag_c', 'C', 'Custom (brand style)', 1.0, 9900, 'Custom branding and style application', nowSeed)
db.prepare(`INSERT OR IGNORE INTO flags (id, code, label, price_multiplier, price_add_flat_cents, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).run('flag_b', 'B', 'Batch discount', 0.85, 0, 'Automatic discount for bulk orders (10+ items)', nowSeed)
db.prepare(`INSERT OR IGNORE INTO flags (id, code, label, price_multiplier, price_add_flat_cents, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).run('flag_l_std', 'L_STD', 'Standard License', 1.0, 0, 'Standard commercial usage rights', nowSeed)
db.prepare(`INSERT OR IGNORE INTO flags (id, code, label, price_multiplier, price_add_flat_cents, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).run('flag_l_ext', 'L_EXT', 'Extended License', 1.0, 30000, 'Extended commercial rights for broader usage', nowSeed)
db.prepare(`INSERT OR IGNORE INTO flags (id, code, label, price_multiplier, price_add_flat_cents, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).run('flag_l_excl', 'L_EXCL', 'Exclusive License', 1.0, 80000, 'Exclusive rights with no redistribution', nowSeed)

db.prepare(`INSERT OR IGNORE INTO skus (id, code, name, vector_id, base_credits, base_price_cents, default_flags, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('sku_a1_ig', 'A1-IG', 'Instagram Image 1080p', 'v1', 60, 499, '["L_STD"]', 'Social media ready 1080p image', nowSeed)
db.prepare(`INSERT OR IGNORE INTO skus (id, code, name, vector_id, base_credits, base_price_cents, default_flags, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('sku_a2_bh', 'A2-BH', 'Blog Hero 2K', 'v1', 90, 999, '["L_STD"]', 'High-quality 2K blog header image', nowSeed)
db.prepare(`INSERT OR IGNORE INTO skus (id, code, name, vector_id, base_credits, base_price_cents, default_flags, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('sku_a3_4k', 'A3-4K', '4K Print-Ready', 'v1', 140, 1499, '["L_STD"]', '4K resolution print-ready image', nowSeed)
db.prepare(`INSERT OR IGNORE INTO skus (id, code, name, vector_id, base_credits, base_price_cents, default_flags, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('sku_a4_br', 'A4-BR', 'Brand-Styled Image', 'v1', 180, 2499, '["C","L_STD"]', 'Custom brand-styled image creation', nowSeed)
db.prepare(`INSERT OR IGNORE INTO skus (id, code, name, vector_id, base_credits, base_price_cents, default_flags, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('sku_b1_30soc', 'B1-30SOC', '30 Social Creatives', 'v7', 1800, 7900, '["B"]', 'Bundle of 30 social media images', nowSeed)
db.prepare(`INSERT OR IGNORE INTO skus (id, code, name, vector_id, base_credits, base_price_cents, default_flags, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('sku_b2_90soc', 'B2-90SOC', '90 Creatives + Captions', 'v7', 5400, 19900, '["B"]', '90 social images with AI-generated captions', nowSeed)
db.prepare(`INSERT OR IGNORE INTO skus (id, code, name, vector_id, base_credits, base_price_cents, default_flags, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('sku_c1_15', 'C1-15', '15s Promo/Reel', 'v3', 90, 2900, '["L_STD"]', '15-second promotional video or reel', nowSeed)
db.prepare(`INSERT OR IGNORE INTO skus (id, code, name, vector_id, base_credits, base_price_cents, default_flags, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('sku_c2_30', 'C2-30', '30s Ad/UGC Clip', 'v3', 180, 5900, '["L_STD"]', '30-second ad or UGC style video', nowSeed)
db.prepare(`INSERT OR IGNORE INTO skus (id, code, name, vector_id, base_credits, base_price_cents, default_flags, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('sku_c3_60', 'C3-60', '60s Explainer/YouTube', 'v3', 360, 11900, '["L_STD"]', '60-second explainer or YouTube video', nowSeed)
db.prepare(`INSERT OR IGNORE INTO skus (id, code, name, vector_id, base_credits, base_price_cents, default_flags, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('sku_d1_vo30', 'D1-VO30', '30s Voiceover', 'v5', 30, 1500, '["L_STD"]', '30-second professional voiceover', nowSeed)
db.prepare(`INSERT OR IGNORE INTO skus (id, code, name, vector_id, base_credits, base_price_cents, default_flags, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('sku_d2_clone', 'D2-CLONE', 'Standard Voice Clone', 'v4', 200, 3900, '["C"]', 'Standard quality voice cloning', nowSeed)
db.prepare(`INSERT OR IGNORE INTO skus (id, code, name, vector_id, base_credits, base_price_cents, default_flags, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('sku_d3_clpro', 'D3-CLPRO', 'Advanced Voice Clone', 'v4', 600, 9900, '["C"]', 'Professional-grade voice cloning', nowSeed)
db.prepare(`INSERT OR IGNORE INTO skus (id, code, name, vector_id, base_credits, base_price_cents, default_flags, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('sku_d4_5pk', 'D4-5PK', '5x30s Voice Spots', 'v5', 150, 5900, '["L_STD"]', 'Package of 5 x 30-second voiceovers', nowSeed)
db.prepare(`INSERT OR IGNORE INTO skus (id, code, name, vector_id, base_credits, base_price_cents, default_flags, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('sku_f1_starter', 'F1-STARTER', '10 SEO Articles + Images', 'v6', 1000, 4900, '[]', '10 SEO-optimized articles with images', nowSeed)
db.prepare(`INSERT OR IGNORE INTO skus (id, code, name, vector_id, base_credits, base_price_cents, default_flags, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('sku_f2_auth', 'F2-AUTH', '40 SEO Articles + Linking', 'v6', 4000, 14900, '[]', '40 articles with internal link strategy', nowSeed)
db.prepare(`INSERT OR IGNORE INTO skus (id, code, name, vector_id, base_credits, base_price_cents, default_flags, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('sku_f3_dominator', 'F3-DOMINATOR', '150 Articles + Strategy', 'v6', 15000, 39900, '[]', 'Complete content domination package', nowSeed)
db.prepare(`INSERT OR IGNORE INTO skus (id, code, name, vector_id, base_credits, base_price_cents, default_flags, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('sku_e1_ecom25', 'E1-ECOM25', 'E-commerce Pack (25 SKUs)', 'v7', 4500, 22500, '[]', '25 product SKUs with 3 images each', nowSeed)
db.prepare(`INSERT OR IGNORE INTO skus (id, code, name, vector_id, base_credits, base_price_cents, default_flags, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('sku_e2_launchkit', 'E2-LAUNCHKIT', 'Brand Launch Kit', 'v7', 3000, 44900, '[]', 'Complete brand launch asset package', nowSeed)
db.prepare(`INSERT OR IGNORE INTO skus (id, code, name, vector_id, base_credits, base_price_cents, default_flags, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('sku_e3_agency100', 'E3-AGENCY100', 'Agency Asset Bank (100 assets)', 'v7', 10000, 59900, '[]', '100 mixed assets for agency use', nowSeed)

// Simple migration to ensure columns exist
try {
    const tableInfo = db.prepare('PRAGMA table_info(users)').all();
    if (!tableInfo.some(col => col.name === 'email')) db.exec('ALTER TABLE users ADD COLUMN email TEXT UNIQUE');
    if (!tableInfo.some(col => col.name === 'password_hash')) db.exec('ALTER TABLE users ADD COLUMN password_hash TEXT');
    if (!tableInfo.some(col => col.name === 'first_name')) db.exec('ALTER TABLE users ADD COLUMN first_name TEXT');
    if (!tableInfo.some(col => col.name === 'telegram_user_id')) db.exec('ALTER TABLE users ADD COLUMN telegram_user_id TEXT UNIQUE');
    if (!tableInfo.some(col => col.name === 'created_at')) db.exec('ALTER TABLE users ADD COLUMN created_at TEXT');

    const jobsInfo = db.prepare('PRAGMA table_info(jobs)').all();
    if (!jobsInfo.some(col => col.name === 'a2e_task_id')) db.exec('ALTER TABLE jobs ADD COLUMN a2e_task_id TEXT');
    if (!jobsInfo.some(col => col.name === 'result_url')) db.exec('ALTER TABLE jobs ADD COLUMN result_url TEXT');
    if (!jobsInfo.some(col => col.name === 'error_message')) db.exec('ALTER TABLE jobs ADD COLUMN error_message TEXT');
    if (!jobsInfo.some(col => col.name === 'cost_credits')) db.exec('ALTER TABLE jobs ADD COLUMN cost_credits INTEGER DEFAULT 0');
    if (!jobsInfo.some(col => col.name === 'order_id')) db.exec('ALTER TABLE jobs ADD COLUMN order_id INTEGER');

    const skusInfo = db.prepare('PRAGMA table_info(skus)').all();
    if (!skusInfo.some(col => col.name === 'vector_id')) db.exec('ALTER TABLE skus ADD COLUMN vector_id TEXT');
} catch (e) {
    logger.error({ msg: 'migration_error', error: String(e) });
}

const addCredits = (userId, amount) => {
    const transaction = db.transaction(() => {
        const current = db.prepare('SELECT balance FROM user_credits WHERE user_id = ?').get(userId)
        const newBalance = (current ? current.balance : 0) + amount

        if (current) {
            db.prepare('UPDATE user_credits SET balance = ? WHERE user_id = ?').run(newBalance, userId)
        } else {
            db.prepare('INSERT INTO user_credits (user_id, balance) VALUES (?, ?)').run(userId, newBalance)
        }

        return newBalance
    })

    return transaction()
}

const deductCredits = (userId, amount) => {
    const transaction = db.transaction(() => {
        const current = db.prepare('SELECT balance FROM user_credits WHERE user_id = ?').get(userId)

        if (!current || current.balance < amount) {
            throw new Error('insufficient_credits')
        }

        const newBalance = current.balance - amount
        db.prepare('UPDATE user_credits SET balance = ? WHERE user_id = ?').run(newBalance, userId)

        return newBalance
    })

    return transaction()
}

const authenticateToken = (req, res, next) => {
    const auth = req.headers['authorization'] || ''
    if (!auth.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'unauthorized' })
    }
    const token = auth.slice(7)
    try {
        const payload = jwt.verify(token, process.env.SESSION_SECRET)
        req.user = { id: payload && payload.id ? payload.id : payload?.sub || 0 }
        next()
    } catch (e) {
        return res.status(401).json({ error: 'invalid_token' })
    }
}

const stripeKey = process.env.STRIPE_SECRET_KEY
const stripe = stripeKey ? new Stripe(stripeKey) : null

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const upload = multer({ storage: multer.memoryStorage() })
const packsConfig = require('./shared/config/packs')
const catalogConfig = require('./shared/config/catalog')
const A2EService = require('./services/a2e')
const PricingEngine = require('./services/pricing')

const pollingJobs = new Map()

function startStatusPolling(jobId, type, a2eTaskId) {
    const pollInterval = setInterval(async () => {
        try {
            const a2eService = new A2EService(process.env.A2E_API_KEY, process.env.A2E_BASE_URL)
            const status = await a2eService.getTaskStatus(type, a2eTaskId)

            if (!status || !status.data) {
                logger.error({ msg: 'polling_invalid_response', jobId, type, a2eTaskId })
                return
            }

            const currentStatus = status.data.current_status || status.data.status

            if (currentStatus === 'completed' || currentStatus === 'success') {
                const resultUrl = status.data.result_url || status.data.video_url || status.data.media_url || ''

                db.prepare(`
                    UPDATE jobs 
                    SET status='completed', result_url=?, updated_at=? 
                    WHERE id=?
                `).run(resultUrl, new Date().toISOString(), jobId)

                clearInterval(pollInterval)
                pollingJobs.delete(jobId)
                logger.info({ msg: 'job_completed', jobId, resultUrl })
            } else if (currentStatus === 'failed' || currentStatus === 'error') {
                const errorMessage = status.data.failed_message || status.data.error_message || 'Unknown error'

                const job = db.prepare('SELECT user_id, cost_credits FROM jobs WHERE id=?').get(jobId)
                if (job && job.cost_credits > 0) {
                    db.prepare('UPDATE user_credits SET balance = balance + ? WHERE user_id = ?').run(job.cost_credits, job.user_id)
                }

                db.prepare(`
                    UPDATE jobs 
                    SET status='failed', error_message=?, updated_at=? 
                    WHERE id=?
                `).run(errorMessage, new Date().toISOString(), jobId)

                clearInterval(pollInterval)
                pollingJobs.delete(jobId)
                logger.error({ msg: 'job_failed', jobId, errorMessage })
            }
        } catch (error) {
            logger.error({ msg: 'polling_error', jobId, error: String(error) })
        }
    }, 10000)

    pollingJobs.set(jobId, pollInterval)
}

app.use(limiter)

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }))
app.get('/ready', (req, res) => res.status(200).json({ status: 'ready' }))
app.get('/alive', (req, res) => res.status(200).json({ status: 'alive' }))

app.get('/stats', (req, res) => {
    try {
        const videos = db.prepare("SELECT COUNT(*) AS c FROM jobs WHERE status='completed'").get().c + db.prepare("SELECT COUNT(*) AS c FROM miniapp_creations WHERE status='completed'").get().c
        const payingUsers = db.prepare('SELECT COUNT(DISTINCT user_id) AS c FROM purchases').get().c
        const totalUsers = db.prepare('SELECT COUNT(*) AS c FROM users').get().c
        const revenueCents = db.prepare('SELECT COALESCE(SUM(amount_cents),0) AS s FROM purchases').get().s
        const conversionRate = totalUsers ? Math.round((payingUsers / totalUsers) * 100) : 0
        res.json({ videos, paying_users: payingUsers, total_users: totalUsers, conversion_rate: conversionRate, revenue_cents: revenueCents })
    } catch (e) {
        res.status(500).json({ error: 'stats_failed' })
    }
})

app.post('/api/auth/signup', async (req, res) => {
    try {
        const { email, password } = req.body
        if (!email || !password) return res.status(400).json({ error: 'missing_fields' })

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) return res.status(400).json({ error: 'invalid_email' })
        if (password.length < 6) return res.status(400).json({ error: 'password_too_short' })

        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
        if (existing) return res.status(409).json({ error: 'email_exists' })

        const passwordHash = await bcrypt.hash(password, 10)
        const result = db.prepare('INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)').run(email, passwordHash, new Date().toISOString())
        const userId = result.lastInsertRowid

        db.prepare('INSERT INTO user_credits (user_id, balance) VALUES (?, ?)').run(userId, 0)
        const token = jwt.sign({ id: userId }, process.env.SESSION_SECRET, { expiresIn: '30d' })

        res.status(201).json({ token, user: { id: userId, email } })
    } catch (e) {
        logger.error({ msg: 'signup_error', error: String(e) })
        res.status(500).json({ error: 'signup_failed' })
    }
})

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body
        if (!email || !password) return res.status(401).json({ error: 'invalid_credentials' })

        const user = db.prepare('SELECT id, email, password_hash FROM users WHERE email = ?').get(email)
        if (!user || !user.password_hash) return res.status(401).json({ error: 'invalid_credentials' })

        const valid = await bcrypt.compare(password, user.password_hash)
        if (!valid) return res.status(401).json({ error: 'invalid_credentials' })

        const token = jwt.sign({ id: user.id }, process.env.SESSION_SECRET, { expiresIn: '30d' })
        res.json({ token, user: { id: user.id, email: user.email } })
    } catch (e) {
        logger.error({ msg: 'login_error', error: String(e) })
        res.status(500).json({ error: 'login_failed' })
    }
})

app.get('/api/auth/me', authenticateToken, (req, res) => {
    const user = db.prepare('SELECT id, email, first_name, created_at FROM users WHERE id = ?').get(req.user.id)
    if (!user) return res.status(404).json({ error: 'user_not_found' })

    const credits = db.prepare('SELECT balance FROM user_credits WHERE user_id = ?').get(req.user.id)
    const subscription = db.prepare(`
        SELECT s.*, p.name as plan_name 
        FROM user_subscriptions s 
        JOIN subscription_plans p ON s.plan_id = p.id 
        WHERE s.user_id = ? AND s.status = 'active'
    `).get(req.user.id)

    res.json({
        ...user,
        credits: credits ? credits.balance : 0,
        subscription: subscription || null
    })
})

app.post('/webhook/stripe', async (req, res) => {
    const sig = req.headers['stripe-signature']
    let event

    try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`)
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object
        const { user_id, points, pack_type, plan_id, source } = session.metadata || {}

        if (source === 'web' && user_id) {
            try {
                if (plan_id) {
                    const now = new Date()
                    const startDate = now.toISOString()
                    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).toISOString()

                    db.prepare(`
                        INSERT INTO user_plans (user_id, plan_id, start_date, end_date, auto_renew, stripe_subscription_id, status, created_at)
                        VALUES (?, ?, ?, ?, 1, ?, 'active', ?)
                    `).run(user_id, plan_id, startDate, endDate, session.subscription, now.toISOString())

                    logger.info({ msg: 'subscription_created', user_id, plan_id, subscription_id: session.subscription })
                } else if (points) {
                    db.prepare('INSERT INTO purchases (user_id, pack_type, points, amount_cents, created_at) VALUES (?, ?, ?, ?, ?)').run(
                        user_id, pack_type, Number(points), session.amount_total, new Date().toISOString()
                    )
                    addCredits(user_id, Number(points))
                    logger.info({ msg: 'payment_success', user_id, points })
                }
            } catch (e) {
                logger.error({ msg: 'payment_db_error', error: String(e) })
            }
        }
    }
    res.json({ received: true })
})

app.get('/api/web/credits', authenticateToken, (req, res) => {
    const row = db.prepare('SELECT balance FROM user_credits WHERE user_id=?').get(req.user.id)
    res.json({ balance: row ? row.balance : 0 })
})

app.get('/api/web/creations', authenticateToken, (req, res) => {
    try {
        const creations = db.prepare(`
            SELECT m.*, j.status as job_status, j.result_url, j.cost_credits, j.error_message
            FROM miniapp_creations m
            LEFT JOIN jobs j ON j.user_id = m.user_id AND j.type = m.type AND j.id = (
                SELECT MAX(id) FROM jobs WHERE user_id = m.user_id AND type = m.type AND created_at >= m.created_at
            )
            WHERE m.user_id = ? ORDER BY m.id DESC LIMIT 20
        `).all(req.user.id)
        res.json({ items: creations })
    } catch (e) {
        res.status(500).json({ error: 'creations_fetch_failed' })
    }
})

app.post('/api/web/upload', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        const { type } = req.body
        if (!type) return res.status(400).json({ error: 'invalid_payload' })

        let url = null
        if (req.file) {
            const uploaded = await cloudinary.uploader.upload(`data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`)
            url = uploaded.secure_url
        }
        db.prepare('INSERT INTO miniapp_creations (user_id, type, status, url, created_at) VALUES (?,?,?,?,?)').run(req.user.id, type, 'uploaded', url, new Date().toISOString())
        res.json({ status: 'uploaded', url })
    } catch (e) {
        res.status(500).json({ error: 'upload_failed' })
    }
})

app.post('/api/web/process', authenticateToken, async (req, res) => {
    try {
        const { type, order_id, options = {} } = req.body
        const userId = req.user.id

        if (!type) return res.status(400).json({ error: 'invalid_payload' })

        let orderId = order_id
        let quote = null

        if (!orderId) {
            const typeToSku = {
                'img2vid': 'C2-30',
                'faceswap': 'A1-IG',
                'avatar': 'A1-IG',
                'enhance': 'A1-IG',
                'bgremove': 'A1-IG'
            }

            const skuCode = typeToSku[type] || 'A1-IG'

            const pricingEngine = new PricingEngine(db)
            try {
                quote = await pricingEngine.quote(userId, skuCode, 1, [])
            } catch (quoteError) {
                logger.error({ msg: 'quote_error', error: String(quoteError) })
                return res.status(500).json({ error: 'pricing_error', details: quoteError.message })
            }

            const orderResult = db.prepare(`
                INSERT INTO orders (user_id, sku_code, quantity, applied_flags, customer_price_cents, internal_cost_cents, margin_percent, total_seconds, overage_seconds, status, created_at)
                VALUES (?, ?, 1, '[]', ?, ?, ?, ?, ?, 'processing', ?)
            `).run(
                userId,
                skuCode,
                quote.customer_price_cents,
                quote.internal_cost_cents,
                parseFloat(quote.margin_percent),
                quote.total_seconds,
                quote.overage_seconds,
                new Date().toISOString()
            )

            orderId = orderResult.lastInsertRowid
        } else {
            const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(orderId, userId)
            if (!order) {
                return res.status(404).json({ error: 'order_not_found' })
            }

            db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('processing', orderId)
        }

        const creation = db.prepare('SELECT url FROM miniapp_creations WHERE user_id=? AND type=? ORDER BY id DESC LIMIT 1').get(userId, type)
        if (!creation || !creation.url) {
            return res.status(400).json({ error: 'no_media_uploaded' })
        }

        const a2eService = new A2EService(process.env.A2E_API_KEY, process.env.A2E_BASE_URL)
        let a2eResponse
        try {
            a2eResponse = await a2eService.startTask(type, creation.url, options)
        } catch (a2eError) {
            logger.error({ msg: 'a2e_api_error', error: String(a2eError) })
            db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('failed', orderId)
            return res.status(500).json({ error: 'a2e_api_error', details: a2eError.message })
        }

        if (!a2eResponse || !a2eResponse.data || !a2eResponse.data._id) {
            db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('failed', orderId)
            return res.status(500).json({ error: 'a2e_api_error', details: 'Invalid response from A2E API' })
        }

        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId)

        const jobResult = db.prepare(`
            INSERT INTO jobs (user_id, type, status, a2e_task_id, cost_credits, order_id, created_at, updated_at) 
            VALUES (?,?,?,?,?,?,?,?)
        `).run(
            userId,
            type,
            'processing',
            a2eResponse.data._id,
            a2eResponse.data.coins || (order ? order.total_seconds : 0),
            orderId,
            new Date().toISOString(),
            new Date().toISOString()
        )

        const pricingEngine = new PricingEngine(db)
        const userPlan = pricingEngine.getUserActivePlan(userId)
        if (userPlan && order) {
            pricingEngine.deductUsage(userId, userPlan.plan_id, order.total_seconds)
        }

        startStatusPolling(jobResult.lastInsertRowid, type, a2eResponse.data._id)

        res.json({
            job_id: jobResult.lastInsertRowid,
            order_id: orderId,
            status: 'processing',
            quote
        })
    } catch (e) {
        logger.error({ msg: 'process_error', error: String(e) })
        res.status(500).json({ error: 'process_failed', details: e.message })
    }
})

app.get('/api/plans', (req, res) => {
    try {
        const plans = db.prepare('SELECT * FROM plans WHERE active = 1 ORDER BY monthly_price_cents ASC').all()
        res.json({
            plans: plans.map(p => ({
                id: p.id,
                code: p.code,
                name: p.name,
                monthly_price_usd: (p.monthly_price_cents / 100).toFixed(2),
                monthly_price_cents: p.monthly_price_cents,
                included_seconds: p.included_seconds,
                overage_rate_per_second_usd: (p.overage_rate_per_second_cents / 100).toFixed(2),
                overage_rate_per_second_cents: p.overage_rate_per_second_cents,
                description: p.description
            }))
        })
    } catch (e) {
        logger.error({ msg: 'plans_fetch_error', error: String(e) })
        res.status(500).json({ error: 'fetch_failed' })
    }
})

app.get('/api/vectors', (req, res) => {
    try {
        const vectors = db.prepare('SELECT * FROM vectors ORDER BY code ASC').all()
        res.json({ vectors })
    } catch (e) {
        logger.error({ msg: 'vectors_fetch_error', error: String(e) })
        res.status(500).json({ error: 'fetch_failed' })
    }
})

app.get('/api/skus', (req, res) => {
    try {
        const { vector_id } = req.query
        let query = 'SELECT s.*, v.name as vector_name, v.code as vector_code FROM skus s LEFT JOIN vectors v ON s.vector_id = v.id WHERE s.active = 1'
        let params = []

        if (vector_id) {
            query += ' AND s.vector_id = ?'
            params.push(vector_id)
        }

        query += ' ORDER BY s.code ASC'

        const skus = db.prepare(query).all(...params)
        res.json({
            skus: skus.map(s => ({
                id: s.id,
                code: s.code,
                name: s.name,
                vector_id: s.vector_id,
                vector_name: s.vector_name,
                vector_code: s.vector_code,
                base_credits: s.base_credits,
                base_price_usd: (s.base_price_cents / 100).toFixed(2),
                base_price_cents: s.base_price_cents,
                default_flags: JSON.parse(s.default_flags || '[]'),
                description: s.description
            }))
        })
    } catch (e) {
        logger.error({ msg: 'skus_fetch_error', error: String(e) })
        res.status(500).json({ error: 'fetch_failed' })
    }
})

app.post('/api/pricing/quote', authenticateToken, async (req, res) => {
    try {
        const { sku_code, quantity = 1, flags = [] } = req.body

        if (!sku_code) {
            return res.status(400).json({ error: 'sku_code_required' })
        }

        const pricingEngine = new PricingEngine(db)
        const quote = await pricingEngine.quote(req.user.id, sku_code, quantity, flags)

        res.json({ quote })
    } catch (e) {
        logger.error({ msg: 'quote_error', error: String(e), user_id: req.user.id })

        if (e.message === 'sku_not_found') {
            return res.status(404).json({ error: 'sku_not_found' })
        }
        if (e.message && e.message.includes('margin_too_low')) {
            return res.status(400).json({ error: 'pricing_error', details: e.message })
        }

        res.status(500).json({ error: 'quote_failed', details: e.message })
    }
})

app.post('/api/subscribe', authenticateToken, async (req, res) => {
    try {
        const { plan_id } = req.body
        const userId = req.user.id

        if (!plan_id) {
            return res.status(400).json({ error: 'plan_id_required' })
        }

        const plan = db.prepare('SELECT * FROM plans WHERE id = ? AND active = 1').get(plan_id)
        if (!plan) {
            return res.status(404).json({ error: 'plan_not_found' })
        }

        const existingActive = db.prepare(`
            SELECT * FROM user_plans 
            WHERE user_id = ? AND status = 'active' 
            AND (end_date IS NULL OR end_date > ?)
        `).get(userId, new Date().toISOString())

        if (existingActive) {
            return res.status(400).json({ error: 'active_plan_exists', message: 'You already have an active subscription' })
        }

        if (!stripe) {
            return res.status(500).json({ error: 'stripe_not_configured' })
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: plan.name,
                        description: plan.description
                    },
                    unit_amount: plan.monthly_price_cents,
                    recurring: {
                        interval: 'month'
                    }
                },
                quantity: 1
            }],
            success_url: `${process.env.FRONTEND_URL}/account?subscription=success`,
            cancel_url: `${process.env.FRONTEND_URL}/pricing?subscription=cancelled`,
            metadata: {
                user_id: userId,
                plan_id: plan.id,
                source: 'web'
            }
        })

        res.json({ session_url: session.url, session_id: session.id })
    } catch (e) {
        logger.error({ msg: 'subscribe_error', error: String(e), user_id: req.user.id })
        res.status(500).json({ error: 'subscription_failed', details: e.message })
    }
})

app.get('/api/account/plan', authenticateToken, (req, res) => {
    try {
        const userId = req.user.id
        const pricingEngine = new PricingEngine(db)

        const userPlan = pricingEngine.getUserActivePlan(userId)

        if (!userPlan) {
            return res.json({ has_plan: false })
        }

        const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(userPlan.plan_id)
        const usage = pricingEngine.getCurrentPeriodUsage(userId, userPlan.plan_id)

        const remainingSeconds = Math.max(0, plan.included_seconds - (usage?.seconds_used || 0))
        const usagePercent = plan.included_seconds > 0
            ? ((usage?.seconds_used || 0) / plan.included_seconds * 100).toFixed(1)
            : 0

        res.json({
            has_plan: true,
            plan: {
                id: plan.id,
                code: plan.code,
                name: plan.name,
                monthly_price_usd: (plan.monthly_price_cents / 100).toFixed(2),
                included_seconds: plan.included_seconds,
                overage_rate_per_second_usd: (plan.overage_rate_per_second_cents / 100).toFixed(2),
                description: plan.description
            },
            subscription: {
                start_date: userPlan.start_date,
                end_date: userPlan.end_date,
                auto_renew: userPlan.auto_renew === 1,
                status: userPlan.status
            },
            usage: {
                period_start: usage?.period_start,
                period_end: usage?.period_end,
                seconds_used: usage?.seconds_used || 0,
                remaining_seconds: remainingSeconds,
                usage_percent: parseFloat(usagePercent)
            }
        })
    } catch (e) {
        logger.error({ msg: 'account_plan_error', error: String(e), user_id: req.user.id })
        res.status(500).json({ error: 'fetch_failed' })
    }
})

const isAdmin = (req, res, next) => {
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim())
    const user = db.prepare('SELECT email FROM users WHERE id = ?').get(req.user.id)

    if (!user || !adminEmails.includes(user.email)) {
        return res.status(403).json({ error: 'admin_access_required' })
    }

    next()
}

app.get('/api/admin/stats', authenticateToken, isAdmin, (req, res) => {
    try {
        const skuStats = db.prepare(`
            SELECT 
                s.code,
                s.name,
                COUNT(o.id) as order_count,
                AVG(o.customer_price_cents) as avg_customer_price,
                AVG(o.internal_cost_cents) as avg_internal_cost,
                AVG(o.margin_percent) as avg_margin
            FROM skus s
            LEFT JOIN orders o ON s.code = o.sku_code
            WHERE s.active = 1
            GROUP BY s.code, s.name
            ORDER BY order_count DESC
        `).all()

        const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get()
        const totalRevenue = db.prepare('SELECT SUM(customer_price_cents) as total FROM orders WHERE status != "failed"').get()
        const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get()
        const activeSubscriptions = db.prepare('SELECT COUNT(*) as count FROM user_plans WHERE status = "active"').get()

        res.json({
            sku_stats: skuStats.map(s => ({
                code: s.code,
                name: s.name,
                order_count: s.order_count || 0,
                avg_customer_price_usd: s.avg_customer_price ? (s.avg_customer_price / 100).toFixed(2) : '0.00',
                avg_internal_cost_usd: s.avg_internal_cost ? (s.avg_internal_cost / 100).toFixed(2) : '0.00',
                avg_margin_percent: s.avg_margin ? s.avg_margin.toFixed(1) : '0.0'
            })),
            totals: {
                orders: totalOrders.count,
                revenue_usd: totalRevenue.total ? (totalRevenue.total / 100).toFixed(2) : '0.00',
                users: totalUsers.count,
                active_subscriptions: activeSubscriptions.count
            }
        })
    } catch (e) {
        logger.error({ msg: 'admin_stats_error', error: String(e) })
        res.status(500).json({ error: 'fetch_failed' })
    }
})

app.put('/api/admin/plans/:id', authenticateToken, isAdmin, (req, res) => {
    try {
        const { id } = req.params
        const { name, monthly_price_usd, included_seconds, overage_rate_per_second_usd, description, active } = req.body

        const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(id)
        if (!plan) {
            return res.status(404).json({ error: 'plan_not_found' })
        }

        const updates = []
        const values = []

        if (name !== undefined) { updates.push('name = ?'); values.push(name) }
        if (monthly_price_usd !== undefined) { updates.push('monthly_price_cents = ?'); values.push(Math.round(parseFloat(monthly_price_usd) * 100)) }
        if (included_seconds !== undefined) { updates.push('included_seconds = ?'); values.push(parseInt(included_seconds)) }
        if (overage_rate_per_second_usd !== undefined) { updates.push('overage_rate_per_second_cents = ?'); values.push(Math.round(parseFloat(overage_rate_per_second_usd) * 100)) }
        if (description !== undefined) { updates.push('description = ?'); values.push(description) }
        if (active !== undefined) { updates.push('active = ?'); values.push(active ? 1 : 0) }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'no_updates_provided' })
        }

        values.push(id)
        db.prepare(`UPDATE plans SET ${updates.join(', ')} WHERE id = ?`).run(...values)

        const updated = db.prepare('SELECT * FROM plans WHERE id = ?').get(id)
        res.json({ plan: updated })
        logger.info({ msg: 'plan_updated', plan_id: id, updated_by: req.user.id })
    } catch (e) {
        logger.error({ msg: 'plan_update_error', error: String(e) })
        res.status(500).json({ error: 'update_failed' })
    }
})

app.put('/api/admin/skus/:id', authenticateToken, isAdmin, (req, res) => {
    try {
        const { id } = req.params
        const { name, base_credits, base_price_usd, default_flags, description, active } = req.body

        const sku = db.prepare('SELECT * FROM skus WHERE id = ?').get(id)
        if (!sku) {
            return res.status(404).json({ error: 'sku_not_found' })
        }

        const updates = []
        const values = []

        if (name !== undefined) { updates.push('name = ?'); values.push(name) }
        if (base_credits !== undefined) { updates.push('base_credits = ?'); values.push(parseInt(base_credits)) }
        if (base_price_usd !== undefined) { updates.push('base_price_cents = ?'); values.push(Math.round(parseFloat(base_price_usd) * 100)) }
        if (default_flags !== undefined) { updates.push('default_flags = ?'); values.push(JSON.stringify(default_flags)) }
        if (description !== undefined) { updates.push('description = ?'); values.push(description) }
        if (active !== undefined) { updates.push('active = ?'); values.push(active ? 1 : 0) }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'no_updates_provided' })
        }

        values.push(id)
        db.prepare(`UPDATE skus SET ${updates.join(', ')} WHERE id = ?`).run(...values)

        const updated = db.prepare('SELECT * FROM skus WHERE id = ?').get(id)
        res.json({ sku: updated })
        logger.info({ msg: 'sku_updated', sku_id: id, updated_by: req.user.id })
    } catch (e) {
        logger.error({ msg: 'sku_update_error', error: String(e) })
        res.status(500).json({ error: 'update_failed' })
    }
})

app.put('/api/admin/flags/:id', authenticateToken, isAdmin, (req, res) => {
    try {
        const { id } = req.params
        const { label, price_multiplier, price_add_flat_usd, description, active } = req.body

        const flag = db.prepare('SELECT * FROM flags WHERE id = ?').get(id)
        if (!flag) {
            return res.status(404).json({ error: 'flag_not_found' })
        }

        const updates = []
        const values = []

        if (label !== undefined) { updates.push('label = ?'); values.push(label) }
        if (price_multiplier !== undefined) { updates.push('price_multiplier = ?'); values.push(parseFloat(price_multiplier)) }
        if (price_add_flat_usd !== undefined) { updates.push('price_add_flat_cents = ?'); values.push(Math.round(parseFloat(price_add_flat_usd) * 100)) }
        if (description !== undefined) { updates.push('description = ?'); values.push(description) }
        if (active !== undefined) { updates.push('active = ?'); values.push(active ? 1 : 0) }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'no_updates_provided' })
        }

        values.push(id)
        db.prepare(`UPDATE flags SET ${updates.join(', ')} WHERE id = ?`).run(...values)

        const updated = db.prepare('SELECT * FROM flags WHERE id = ?').get(id)
        res.json({ flag: updated })
        logger.info({ msg: 'flag_updated', flag_id: id, updated_by: req.user.id })
    } catch (e) {
        logger.error({ msg: 'flag_update_error', error: String(e) })
        res.status(500).json({ error: 'update_failed' })
    }
})

app.get('/api/flags', (req, res) => {
    try {
        const flags = db.prepare('SELECT * FROM flags WHERE active = 1 ORDER BY code ASC').all()
        res.json({
            flags: flags.map(f => ({
                id: f.id,
                code: f.code,
                label: f.label,
                price_multiplier: f.price_multiplier,
                price_add_flat_usd: (f.price_add_flat_cents / 100).toFixed(2),
                price_add_flat_cents: f.price_add_flat_cents,
                description: f.description
            }))
        })
    } catch (e) {
        logger.error({ msg: 'flags_fetch_error', error: String(e) })
        res.status(500).json({ error: 'fetch_failed' })
    }
})

app.get('/api/admin/flags', authenticateToken, isAdmin, (req, res) => {
    try {
        const flags = db.prepare('SELECT * FROM flags ORDER BY code ASC').all()
        res.json({ flags })
    } catch (e) {
        logger.error({ msg: 'flags_fetch_error', error: String(e) })
        res.status(500).json({ error: 'fetch_failed' })
    }
})

app.post('/api/orders/create', authenticateToken, async (req, res) => {
    try {
        const { sku_code, quantity = 1, flags = [] } = req.body
        const userId = req.user.id

        if (!sku_code) {
            return res.status(400).json({ error: 'sku_code_required' })
        }

        const pricingEngine = new PricingEngine(db)
        let quote

        try {
            quote = await pricingEngine.quote(userId, sku_code, quantity, flags)
        } catch (quoteError) {
            logger.error({ msg: 'order_quote_error', error: String(quoteError) })
            return res.status(400).json({ error: 'pricing_error', details: quoteError.message })
        }

        const orderResult = db.prepare(`
            INSERT INTO orders (user_id, sku_code, quantity, applied_flags, customer_price_cents, internal_cost_cents, margin_percent, total_seconds, overage_seconds, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
        `).run(
            userId,
            sku_code,
            quantity,
            JSON.stringify(quote.applied_flags),
            quote.customer_price_cents,
            quote.internal_cost_cents,
            parseFloat(quote.margin_percent),
            quote.total_seconds,
            quote.overage_seconds,
            new Date().toISOString()
        )

        const orderId = orderResult.lastInsertRowid

        res.json({
            order_id: orderId,
            quote,
            status: 'pending',
            message: 'Order created successfully. Please proceed with payment or processing.'
        })

        logger.info({ msg: 'order_created', order_id: orderId, user_id: userId, sku_code, quantity })
    } catch (e) {
        logger.error({ msg: 'order_create_error', error: String(e), user_id: req.user.id })
        res.status(500).json({ error: 'order_creation_failed', details: e.message })
    }
})

app.get('/api/orders', authenticateToken, (req, res) => {
    try {
        const userId = req.user.id
        const { limit = 20, offset = 0 } = req.query

        const orders = db.prepare(`
            SELECT o.*, s.name as sku_name, s.description as sku_description
            FROM orders o
            LEFT JOIN skus s ON o.sku_code = s.code
            WHERE o.user_id = ?
            ORDER BY o.created_at DESC
            LIMIT ? OFFSET ?
        `).all(userId, parseInt(String(limit)), parseInt(String(offset)))

        res.json({
            orders: orders.map(o => ({
                id: o.id,
                skuCode: o.sku_code,
                skuName: o.sku_name,
                skuDescription: o.sku_description,
                quantity: o.quantity,
                appliedFlags: JSON.parse(o.applied_flags || '[]'),
                customerPriceCents: o.customer_price_cents,
                customerPriceUsd: (o.customer_price_cents / 100).toFixed(2),
                internalCostCents: o.internal_cost_cents,
                marginPercent: o.margin_percent,
                totalSeconds: o.total_seconds,
                overageSeconds: o.overage_seconds,
                status: o.status,
                createdAt: o.created_at
            }))
        })
    } catch (e) {
        logger.error({ msg: 'orders_fetch_error', error: String(e), user_id: req.user.id })
        res.status(500).json({ error: 'fetch_failed' })
    }
})

app.get('/api/orders/:id', authenticateToken, (req, res) => {
    try {
        const userId = req.user.id
        const { id } = req.params

        const order = db.prepare(`
            SELECT o.*, s.name as sku_name, s.description as sku_description
            FROM orders o
            LEFT JOIN skus s ON o.sku_code = s.code
            WHERE o.id = ? AND o.user_id = ?
        `).get(id, userId)

        if (!order) {
            return res.status(404).json({ error: 'order_not_found' })
        }

        res.json({
            order: {
                id: order.id,
                skuCode: order.sku_code,
                skuName: order.sku_name,
                skuDescription: order.sku_description,
                quantity: order.quantity,
                appliedFlags: JSON.parse(order.applied_flags || '[]'),
                customerPriceCents: order.customer_price_cents,
                customerPriceUsd: (order.customer_price_cents / 100).toFixed(2),
                internalCostCents: order.internal_cost_cents,
                marginPercent: order.margin_percent,
                totalSeconds: order.total_seconds,
                overageSeconds: order.overage_seconds,
                status: order.status,
                createdAt: order.created_at
            }
        })
    } catch (e) {
        logger.error({ msg: 'order_fetch_error', error: String(e), user_id: req.user.id })
        res.status(500).json({ error: 'fetch_failed' })
    }
})

if (process.env.NODE_ENV === 'production') {
    const buildPath = path.join(__dirname, 'frontend/dist')
    logger.info('Starting production server with build path: ' + buildPath)

    if (fs.existsSync(buildPath)) {
        app.use(express.static(buildPath))
        app.get('*', (req, res) => {
            const indexPath = path.join(buildPath, 'index.html')
            if (fs.existsSync(indexPath)) {
                res.sendFile(indexPath)
            } else {
                logger.error('CRITICAL: index.html missing from dist folder')
                res.status(404).send('Frontend index.html missing. Check build logs.')
            }
        })
    } else {
        logger.error('CRITICAL: frontend/dist directory missing')
        app.get('*', (req, res) => {
            res.status(500).send('Frontend build missing. Ensure build command was successful.')
        })
    }
}

const PORT = process.env.PORT || 3000
app.listen(PORT, () => logger.info(`Server running on port ${PORT}`))