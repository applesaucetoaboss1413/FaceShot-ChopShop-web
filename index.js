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
                // Add purchase record
                db.prepare('INSERT INTO purchases (user_id, pack_type, points, amount_cents, created_at) VALUES (?, ?, ?, ?, ?)').run(
                    user_id, 
                    pack_type, 
                    Number(points), 
                    session.amount_total, 
                    new Date().toISOString()
                )
                
                // Update user credits
                const current = db.prepare('SELECT balance FROM user_credits WHERE user_id = ?').get(user_id)
                const newBalance = (current ? current.balance : 0) + Number(points)
                
                if (current) {
                    db.prepare('UPDATE user_credits SET balance = ? WHERE user_id = ?').run(newBalance, user_id)
                } else {
                    db.prepare('INSERT INTO user_credits (user_id, balance) VALUES (?, ?)').run(user_id, newBalance)
                }
                
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
    `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, telegram_user_id TEXT UNIQUE);
   CREATE TABLE IF NOT EXISTS user_credits (user_id INTEGER, balance INTEGER DEFAULT 0);
   CREATE TABLE IF NOT EXISTS purchases (id INTEGER PRIMARY KEY, user_id INTEGER, pack_type TEXT, points INTEGER, amount_cents INTEGER, created_at TEXT);
   CREATE TABLE IF NOT EXISTS jobs (id INTEGER PRIMARY KEY, user_id INTEGER, type TEXT, status TEXT, created_at TEXT, updated_at TEXT);
   CREATE TABLE IF NOT EXISTS analytics_events (id INTEGER PRIMARY KEY, type TEXT, user_id INTEGER, data TEXT, created_at TEXT);
   CREATE TABLE IF NOT EXISTS miniapp_creations (id INTEGER PRIMARY KEY, user_id INTEGER, type TEXT, status TEXT, url TEXT, created_at TEXT);`
)

const packsConfig = require('./shared/config/packs')
const catalogConfig = require('./shared/config/catalog')

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
    const items = db.prepare('SELECT * FROM miniapp_creations WHERE user_id=? ORDER BY id DESC LIMIT 20').all(req.user.id)
    res.json({ items })
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
        const type = req.body.type
        if (!type) return res.status(400).json({ error: 'invalid_payload' })
        const job = db.prepare('INSERT INTO jobs (user_id, type, status, created_at, updated_at) VALUES (?,?,?,?,?)').run(req.user.id, type, 'processing', new Date().toISOString(), new Date().toISOString())
        res.json({ job_id: job.lastInsertRowid, status: 'processing' })
    } catch (e) {
        logger.error({ msg: 'process_error', error: String(e) })
        res.status(500).json({ error: 'process_failed' })
    }
})

app.get('/api/web/status', (req, res) => {
    const id = req.query.id
    if (!id) return res.status(400).json({ error: 'missing_id' })
    const row = db.prepare('SELECT * FROM jobs WHERE id=?').get(Number(id))
    if (!row) return res.status(404).json({ error: 'not_found' })
    if (row.status !== 'completed') {
        db.prepare("UPDATE jobs SET status='completed', updated_at=? WHERE id=?").run(new Date().toISOString(), row.id)
    }
    const current = db.prepare('SELECT * FROM jobs WHERE id=?').get(row.id)
    res.json({ job_id: current.id, status: current.status })
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
