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
            scriptSrc: ["'self'", "'unsafe-inline'", "https://telegram.org"],
            frameSrc: ["'self'", "https://oauth.telegram.org"],
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
        const { user_id, points, pack_type, source } = session.metadata || {}

        if (source === 'web' && user_id) {
            try {
                db.prepare('INSERT INTO purchases (user_id, pack_type, points, amount_cents, created_at) VALUES (?, ?, ?, ?, ?)').run(
                    user_id, 
                    pack_type, 
                    Number(points), 
                    session.amount_total, 
                    new Date().toISOString()
                )
                
                addCredits(user_id, Number(points))
                
                logger.info({ msg: 'payment_success', user_id, points })
            } catch (e) {
                logger.error({ msg: 'payment_db_error', error: String(e) })
            }
        }
    }

    res.json({ received: true })
})

app.use(limiter)

const stripeKey = process.env.STRIPE_SECRET_KEY
const stripe = stripeKey ? new Stripe(stripeKey) : null

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const upload = multer({ storage: multer.memoryStorage() })

const db = new Database(process.env.DB_PATH || 'production.db')
db.exec(
    `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, telegram_user_id TEXT UNIQUE, email TEXT UNIQUE, password_hash TEXT, first_name TEXT, created_at TEXT);
   CREATE TABLE IF NOT EXISTS user_credits (user_id INTEGER, balance INTEGER DEFAULT 0);
   CREATE TABLE IF NOT EXISTS purchases (id INTEGER PRIMARY KEY, user_id INTEGER, pack_type TEXT, points INTEGER, amount_cents INTEGER, created_at TEXT);
   CREATE TABLE IF NOT EXISTS jobs (id INTEGER PRIMARY KEY, user_id INTEGER, type TEXT, status TEXT, a2e_task_id TEXT, result_url TEXT, error_message TEXT, cost_credits INTEGER DEFAULT 0, order_id INTEGER, created_at TEXT, updated_at TEXT);
   CREATE TABLE IF NOT EXISTS analytics_events (id INTEGER PRIMARY KEY, type TEXT, user_id INTEGER, data TEXT, created_at TEXT);
   CREATE TABLE IF NOT EXISTS miniapp_creations (id INTEGER PRIMARY KEY, user_id INTEGER, type TEXT, status TEXT, url TEXT, created_at TEXT);
   CREATE TABLE IF NOT EXISTS plans (id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, name TEXT NOT NULL, monthly_price_cents INTEGER NOT NULL, included_seconds INTEGER NOT NULL, overage_rate_per_second_cents INTEGER NOT NULL, description TEXT, active INTEGER DEFAULT 1, created_at TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS skus (id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, name TEXT NOT NULL, base_credits INTEGER NOT NULL, base_price_cents INTEGER NOT NULL, default_flags TEXT DEFAULT '[]', description TEXT, active INTEGER DEFAULT 1, created_at TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS flags (id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, label TEXT NOT NULL, price_multiplier REAL DEFAULT 1.0, price_add_flat_cents INTEGER DEFAULT 0, description TEXT, active INTEGER DEFAULT 1, created_at TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS user_plans (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, plan_id TEXT NOT NULL, start_date TEXT NOT NULL, end_date TEXT, auto_renew INTEGER DEFAULT 1, stripe_subscription_id TEXT, status TEXT DEFAULT 'active', created_at TEXT NOT NULL);
   CREATE INDEX IF NOT EXISTS idx_user_plans_user_id ON user_plans(user_id);
   CREATE TABLE IF NOT EXISTS plan_usage (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, plan_id TEXT NOT NULL, period_start TEXT NOT NULL, period_end TEXT NOT NULL, seconds_used INTEGER DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
   CREATE INDEX IF NOT EXISTS idx_plan_usage_user_period ON plan_usage(user_id, period_start, period_end);
   CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, sku_code TEXT NOT NULL, quantity INTEGER DEFAULT 1, applied_flags TEXT DEFAULT '[]', customer_price_cents INTEGER NOT NULL, internal_cost_cents INTEGER NOT NULL, margin_percent REAL NOT NULL, total_seconds INTEGER NOT NULL, overage_seconds INTEGER DEFAULT 0, stripe_payment_intent_id TEXT, status TEXT DEFAULT 'pending', created_at TEXT NOT NULL);
   CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);`
)

const now = new Date().toISOString()

db.prepare(`INSERT OR IGNORE INTO plans (id, code, name, monthly_price_cents, included_seconds, overage_rate_per_second_cents, description, created_at) VALUES ('plan_pro', 'PRO', 'Pro', 7999, 3000, 15, 'Professional plan with 3000 seconds included', ?)`).run(now)

db.prepare(`INSERT OR IGNORE INTO skus (id, code, name, base_credits, base_price_cents, default_flags, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run('sku_c2_30', 'C2-30', '30s Ad/UGC Clip', 180, 5900, '[]', '30-second promotional video', now)
db.prepare(`INSERT OR IGNORE INTO skus (id, code, name, base_credits, base_price_cents, default_flags, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run('sku_a1_ig', 'A1-IG', 'Instagram Image 1080p', 60, 499, '[]', 'Social media ready image', now)
db.prepare(`INSERT OR IGNORE INTO skus (id, code, name, base_credits, base_price_cents, default_flags, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run('sku_b1_30soc', 'B1-30SOC', '30 Social Creatives', 1800, 7900, '["B"]', 'Bundle of 30 social media images', now)

db.prepare(`INSERT OR IGNORE INTO flags (id, code, label, price_multiplier, price_add_flat_cents, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).run('flag_r', 'R', 'Rapid (same-day)', 1.4, 0, 'Priority processing', now)
db.prepare(`INSERT OR IGNORE INTO flags (id, code, label, price_multiplier, price_add_flat_cents, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).run('flag_c', 'C', 'Custom (brand style)', 1.0, 9900, 'Custom branding', now)
db.prepare(`INSERT OR IGNORE INTO flags (id, code, label, price_multiplier, price_add_flat_cents, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).run('flag_b', 'B', 'Batch discount', 0.85, 0, 'Batch discount', now)

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

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' })
})

app.get('/ready', (req, res) => {
    res.status(200).json({ status: 'ready' })
})

app.get('/alive', (req, res) => {
    res.status(200).json({ status: 'alive' })
})

app.get('/stats', (req, res) => {
    const videos = db.prepare("SELECT COUNT(*) AS c FROM jobs WHERE status='completed'").get().c + db.prepare("SELECT COUNT(*) AS c FROM miniapp_creations WHERE status='completed'").get().c
    const payingUsers = db.prepare('SELECT COUNT(DISTINCT user_id) AS c FROM purchases').get().c
    const totalUsers = db.prepare('SELECT COUNT(*) AS c FROM users').get().c
    const revenueCents = db.prepare('SELECT COALESCE(SUM(amount_cents),0) AS s FROM purchases').get().s
    const conversionRate = totalUsers ? Math.round((payingUsers / totalUsers) * 100) : 0
    res.json({ videos, paying_users: payingUsers, total_users: totalUsers, conversion_rate: conversionRate, revenue_cents: revenueCents })
})

app.post('/api/auth/signup', async (req, res) => {
    try {
        const { email, password } = req.body
        if (!email || !password) {
            return res.status(400).json({ error: 'invalid_email' })
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'invalid_email' })
        }
        
        if (password.length < 6) {
            return res.status(400).json({ error: 'password_too_short' })
        }
        
        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
        if (existing) {
            return res.status(409).json({ error: 'email_exists' })
        }
        
        const passwordHash = await bcrypt.hash(password, 10)
        const result = db.prepare('INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)').run(
            email, 
            passwordHash, 
            new Date().toISOString()
        )
        
        db.prepare('INSERT INTO user_credits (user_id, balance) VALUES (?, ?)').run(result.lastInsertRowid, 0)
        
        const token = jwt.sign({ id: result.lastInsertRowid }, process.env.SESSION_SECRET, { expiresIn: '30d' })
        
        res.status(201).json({
            token,
            user: {
                id: result.lastInsertRowid,
                email,
                first_name: null
            }
        })
    } catch (e) {
        logger.error({ msg: 'signup_error', error: String(e) })
        res.status(500).json({ error: 'signup_failed' })
    }
})

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body
        if (!email || !password) {
            return res.status(401).json({ error: 'invalid_credentials' })
        }
        
        const user = db.prepare('SELECT id, email, password_hash, first_name FROM users WHERE email = ?').get(email)
        if (!user || !user.password_hash) {
            return res.status(401).json({ error: 'invalid_credentials' })
        }
        
        const valid = await bcrypt.compare(password, user.password_hash)
        if (!valid) {
            return res.status(401).json({ error: 'invalid_credentials' })
        }
        
        const token = jwt.sign({ id: user.id }, process.env.SESSION_SECRET, { expiresIn: '30d' })
        
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name
            }
        })
    } catch (e) {
        logger.error({ msg: 'login_error', error: String(e) })
        res.status(500).json({ error: 'login_failed' })
    }
})

app.get('/api/auth/me', authenticateToken, (req, res) => {
    try {
        const user = db.prepare('SELECT id, email, first_name FROM users WHERE id = ?').get(req.user.id)
        if (!user) {
            return res.status(401).json({ error: 'unauthorized' })
        }
        res.json(user)
    } catch (e) {
        logger.error({ msg: 'auth_me_error', error: String(e) })
        res.status(500).json({ error: 'auth_failed' })
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
        
        res.json(quote)
    } catch (error) {
        logger.error({ msg: 'quote_error', error: String(error) })
        res.status(500).json({ error: error.message })
    }
})

app.get('/api/plans', (req, res) => {
    const plans = db.prepare('SELECT * FROM plans WHERE active = 1 ORDER BY monthly_price_cents ASC').all()
    res.json(plans)
})

async function getOrCreateStripeCustomer(email, userId) {
    const customers = await stripe.customers.list({ email, limit: 1 })
    if (customers.data.length > 0) {
        return customers.data[0].id
    }
    const customer = await stripe.customers.create({ 
        email,
        metadata: { user_id: String(userId) }
    })
    return customer.id
}

app.post('/api/subscribe', authenticateToken, async (req, res) => {
    try {
        if (!stripe) return res.status(400).json({ error: 'stripe_not_configured' })
        
        const { plan_id } = req.body
        const plan = db.prepare('SELECT * FROM plans WHERE id = ? AND active = 1').get(plan_id)
        
        if (!plan) return res.status(400).json({ error: 'invalid_plan' })

        const user = db.prepare('SELECT email FROM users WHERE id = ?').get(req.user.id)
        
        const subscription = await stripe.subscriptions.create({
            customer: await getOrCreateStripeCustomer(user.email, req.user.id),
            items: [{
                price_data: {
                    currency: 'usd',
                    product_data: { name: `${plan.name} Plan` },
                    recurring: { interval: 'month' },
                    unit_amount: plan.monthly_price_cents
                }
            }],
            metadata: {
                user_id: String(req.user.id),
                plan_id: plan.id
            }
        })

        const now = new Date().toISOString()
        const endDate = new Date()
        endDate.setMonth(endDate.getMonth() + 1)

        db.prepare(`
            INSERT INTO user_plans (user_id, plan_id, start_date, end_date, stripe_subscription_id, status, created_at)
            VALUES (?, ?, ?, ?, ?, 'active', ?)
        `).run(req.user.id, plan.id, now, endDate.toISOString(), subscription.id, now)

        res.json({ subscription_id: subscription.id, status: 'active' })
    } catch (error) {
        logger.error({ msg: 'subscribe_error', error: String(error) })
        res.status(500).json({ error: 'subscription_failed' })
    }
})

app.get('/api/web/catalog', (req, res) => {
    res.json(catalogConfig.catalog)
})

app.get('/api/web/packs', (req, res) => {
    res.json(packsConfig.packs)
})

app.post('/api/web/checkout', authenticateToken, async (req, res) => {
    try {
        if (!stripe) return res.status(400).json({ error: 'stripe_not_configured' })
        const { pack_type } = req.body || {}
        const pack = packsConfig.packs.find(p => p.type === pack_type)
        if (!pack) return res.status(400).json({ error: 'invalid_pack' })
        const successUrl = `${process.env.FRONTEND_URL}/status?session_id={CHECKOUT_SESSION_ID}`
        const cancelUrl = `${process.env.FRONTEND_URL}/pricing`
        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            client_reference_id: String(req.user.id),
            metadata: { points: String(pack.points), pack_type: pack.type, source: 'web', user_id: String(req.user.id) },
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: { name: `Pack ${pack.type}` },
                        unit_amount: pack.price_cents
                    },
                    quantity: 1
                }
            ],
            success_url: successUrl,
            cancel_url: cancelUrl
        })
        res.json({ id: session.id, url: session.url })
    } catch (e) {
        logger.error({ msg: 'checkout_error', error: String(e) })
        res.status(500).json({ error: 'checkout_failed' })
    }
})

app.get('/api/web/credits', authenticateToken, (req, res) => {
    const creditRow = db.prepare('SELECT balance FROM user_credits WHERE user_id=?').get(req.user.id)
    res.json({ balance: creditRow ? creditRow.balance : 0 })
})

app.get('/api/web/creations', authenticateToken, (req, res) => {
    try {
        const creations = db.prepare(`
            SELECT 
                m.id,
                m.user_id,
                m.type,
                m.url as upload_url,
                m.created_at,
                j.id as job_id,
                j.status as job_status,
                j.result_url,
                j.cost_credits,
                j.error_message
            FROM miniapp_creations m
            LEFT JOIN jobs j ON j.user_id = m.user_id 
                AND j.type = m.type 
                AND j.id = (
                    SELECT MAX(id) FROM jobs 
                    WHERE user_id = m.user_id 
                    AND type = m.type 
                    AND created_at >= m.created_at
                )
            WHERE m.user_id = ?
            ORDER BY m.id DESC
            LIMIT 20
        `).all(req.user.id)
        
        const items = creations.map(c => ({
            id: c.id,
            user_id: c.user_id,
            type: c.type,
            status: c.job_status || 'uploaded',
            url: c.result_url || c.upload_url,
            upload_url: c.upload_url,
            result_url: c.result_url,
            job_id: c.job_id,
            cost_credits: c.cost_credits || 0,
            error_message: c.error_message,
            created_at: c.created_at
        }))
        
        res.json({ items })
    } catch (e) {
        logger.error({ msg: 'creations_error', error: String(e) })
        res.status(500).json({ error: 'creations_fetch_failed', message: 'Failed to retrieve creations' })
    }
})

app.post('/api/web/upload', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        const type = req.body.type
        if (!type) return res.status(400).json({ error: 'invalid_payload' })
        
        let url = null
        if (req.file && cloudinary.config().cloud_name) {
            const uploaded = await cloudinary.uploader.upload(`data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`)
            url = uploaded.secure_url
        }
        db.prepare('INSERT INTO miniapp_creations (user_id, type, status, url, created_at) VALUES (?,?,?,?,?)').run(req.user.id, type, 'uploaded', url, new Date().toISOString())
        res.json({ status: 'uploaded', url })
    } catch (e) {
        logger.error({ msg: 'upload_error', error: String(e) })
        res.status(500).json({ error: 'upload_failed' })
    }
})

app.post('/api/web/process', authenticateToken, async (req, res) => {
    try {
        const { type, options = {} } = req.body
        const userId = req.user.id

        if (!type) return res.status(400).json({ error: 'invalid_payload' })

        const typeToSku = {
            'img2vid': 'C2-30',
            'faceswap': 'A1-IG',
            'avatar': 'A1-IG',
            'enhance': 'A1-IG',
            'bgremove': 'A1-IG'
        }

        const skuCode = typeToSku[type] || 'A1-IG'

        const pricingEngine = new PricingEngine(db)
        let quote
        try {
            quote = await pricingEngine.quote(userId, skuCode, 1, [])
        } catch (quoteError) {
            logger.error({ msg: 'quote_error', error: String(quoteError) })
            return res.status(500).json({ error: 'pricing_error', details: quoteError.message })
        }

        const upload = db.prepare('SELECT url FROM miniapp_creations WHERE user_id=? AND type=? ORDER BY id DESC LIMIT 1').get(userId, type)
        if (!upload || !upload.url) {
            return res.status(400).json({ error: 'no_media_uploaded' })
        }

        const a2eService = new A2EService(process.env.A2E_API_KEY, process.env.A2E_BASE_URL)
        
        let a2eResponse
        try {
            a2eResponse = await a2eService.startTask(type, upload.url, options)
        } catch (a2eError) {
            logger.error({ msg: 'a2e_api_error', error: String(a2eError) })
            return res.status(500).json({ error: 'a2e_api_error', details: a2eError.message })
        }
        
        if (!a2eResponse || !a2eResponse.data || !a2eResponse.data._id) {
            return res.status(500).json({ error: 'a2e_api_error', details: 'Invalid response from A2E API' })
        }

        const orderResult = db.prepare(`
            INSERT INTO orders (user_id, sku_code, quantity, customer_price_cents, internal_cost_cents, margin_percent, total_seconds, overage_seconds, status, created_at)
            VALUES (?, ?, 1, ?, ?, ?, ?, ?, 'processing', ?)
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

        const job = db.prepare(`
            INSERT INTO jobs (user_id, type, status, a2e_task_id, cost_credits, order_id, created_at, updated_at) 
            VALUES (?,?,?,?,?,?,?,?)
        `).run(
            userId,
            type,
            'processing',
            a2eResponse.data._id,
            a2eResponse.data.coins || quote.total_seconds,
            orderResult.lastInsertRowid,
            new Date().toISOString(),
            new Date().toISOString()
        )

        const userPlan = pricingEngine.getUserActivePlan(userId)
        if (userPlan) {
            pricingEngine.deductUsage(userId, userPlan.plan_id, quote.total_seconds)
        }

        startStatusPolling(job.lastInsertRowid, type, a2eResponse.data._id)

        res.json({ 
            job_id: job.lastInsertRowid, 
            status: 'processing',
            quote
        })
    } catch (e) {
        logger.error({ msg: 'process_error', error: String(e) })
        res.status(500).json({ error: 'process_failed', details: e.message })
    }
})

app.get('/api/web/status', (req, res) => {
    try {
        const id = req.query.id
        if (!id) {
            return res.status(400).json({ error: 'missing_id', message: 'Job ID is required' })
        }
        
        const jobId = Number(id)
        if (isNaN(jobId)) {
            return res.status(400).json({ error: 'invalid_id', message: 'Job ID must be a number' })
        }
        
        const job = db.prepare('SELECT * FROM jobs WHERE id=?').get(jobId)
        if (!job) {
            return res.status(404).json({ error: 'not_found', message: 'Job not found' })
        }
        
        res.json({
            job_id: job.id,
            status: job.status,
            result_url: job.result_url || null,
            cost_credits: job.cost_credits || 0,
            error_message: job.error_message || null,
            created_at: job.created_at,
            updated_at: job.updated_at
        })
    } catch (e) {
        logger.error({ msg: 'status_error', error: String(e) })
        res.status(500).json({ error: 'status_check_failed', message: 'Failed to retrieve job status' })
    }
})

const port = process.env.PORT || 3000

if (process.env.NODE_ENV === 'production') {
    const buildRoot = path.join(__dirname, 'frontend', 'build')
    if (fs.existsSync(path.join(buildRoot, 'index.html'))) {
        app.use(express.static(buildRoot))

        app.get('*', (req, res) => {
            if (req.path.startsWith('/api')) return res.status(404).json({ error: 'not_found' })
            res.sendFile(path.join(buildRoot, 'index.html'))
        })
    }
}

app.listen(port, () => {
    logger.info({ msg: 'server_started', port })
})
