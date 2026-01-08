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
const path = require('path')
const fs = require('fs')

dotenv.config()

// MongoDB setup
const dbHelper = require('./db-helper')

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
})

// Log environment info on startup
logger.info('Starting server...', {
    node_version: process.version,
    env: process.env.NODE_ENV,
    cwd: process.cwd(),
    dir_name: __dirname
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

const addCredits = async (userId, amount) => {
    return await dbHelper.addCredits(userId, amount)
}

const deductCredits = async (userId, amount) => {
    return await dbHelper.deductCredits(userId, amount)
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
                // Create purchase record in MongoDB
                await dbHelper.createPurchase(
                    user_id, 
                    session.id, 
                    session.amount_total, 
                    Number(points)
                )
                
                // Add credits to user
                await addCredits(user_id, Number(points))
                
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

// MongoDB will be initialized on server start
// No need for CREATE TABLE statements

const packsConfig = require('./shared/config/packs')
const catalogConfig = require('./shared/config/catalog')
const A2EService = require('./services/a2e')

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
                
                await dbHelper.updateJob(jobId, {
                    status: 'completed',
                    result_url: resultUrl
                })
                
                clearInterval(pollInterval)
                pollingJobs.delete(jobId)
                logger.info({ msg: 'job_completed', jobId, resultUrl })
            } else if (currentStatus === 'failed' || currentStatus === 'error') {
                const errorMessage = status.data.failed_message || status.data.error_message || 'Unknown error'
                
                const job = await dbHelper.getJob(jobId)
                if (job && job.credits_used > 0) {
                    await dbHelper.addCredits(job.user_id, job.credits_used)
                }
                
                await dbHelper.updateJob(jobId, {
                    status: 'failed',
                    error: errorMessage
                })
                
                clearInterval(pollInterval)
                pollingJobs.delete(jobId)
                logger.error({ msg: 'job_failed', jobId, error: errorMessage })
            }
        } catch (err) {
            logger.error({ msg: 'polling_error', jobId, error: err.message })
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

app.get('/stats', async (req, res) => {
    try {
        const stats = await dbHelper.getStats()
        const totalUsers = stats.total_users || 0
        // Note: paying_users and revenue would need purchases to be aggregated
        res.json({ 
            videos: stats.videos || 0, 
            paying_users: 0, 
            total_users: totalUsers, 
            conversion_rate: 0, 
            revenue_cents: 0 
        })
    } catch (e) {
        logger.error({ msg: 'stats_error', error: String(e) })
        res.status(500).json({ error: 'stats_fetch_failed' })
    }
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
        
        const existing = await dbHelper.getUserByEmail(email)
        if (existing) {
            return res.status(409).json({ error: 'email_exists' })
        }
        
        const passwordHash = await bcrypt.hash(password, 10)
        const user = await dbHelper.createUser(email, passwordHash)
        
        const token = jwt.sign({ id: user.id }, process.env.SESSION_SECRET, { expiresIn: '30d' })
        
        res.status(201).json({
            token,
            user: {
                id: user.id,
                email: user.email,
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
        
        const user = await dbHelper.getUserByEmail(email)
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

app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const user = await dbHelper.getUserById(req.user.id)
        if (!user) {
            return res.status(401).json({ error: 'unauthorized' })
        }
        res.json(user)
    } catch (e) {
        logger.error({ msg: 'auth_me_error', error: String(e) })
        res.status(500).json({ error: 'auth_failed' })
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

app.get('/api/web/credits', authenticateToken, async (req, res) => {
    try {
        const credits = await dbHelper.getCredits(req.user.id)
        res.json({ balance: credits.balance })
    } catch (e) {
        logger.error({ msg: 'credits_error', error: String(e) })
        res.status(500).json({ error: 'credits_fetch_failed' })
    }
})

app.get('/api/web/creations', authenticateToken, async (req, res) => {
    try {
        const jobs = await dbHelper.getUserJobs(req.user.id, 20)
        res.json({ items: jobs })
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
        
        // Create job with source_url for the upload using MongoDB
        const job = await dbHelper.createJob(req.user.id, type, url, { uploaded: true })
        
        res.json({ status: 'uploaded', url, job_id: job.id })
    } catch (e) {
        logger.error({ msg: 'upload_error', error: String(e) })
        res.status(500).json({ error: 'upload_failed' })
    }
})

app.post('/api/web/process', authenticateToken, async (req, res) => {
    try {
        const { type, options = {} } = req.body
        if (!type) return res.status(400).json({ error: 'invalid_payload' })
        
        const creditRow = db.prepare('SELECT balance FROM user_credits WHERE user_id=?').get(req.user.id)
        if (!creditRow || creditRow.balance < 10) {
            return res.status(402).json({ error: 'insufficient_credits' })
        }
        
        const upload = db.prepare('SELECT url FROM miniapp_creations WHERE user_id=? AND type=? ORDER BY id DESC LIMIT 1').get(req.user.id, type)
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
        
        const taskId = a2eResponse.data._id
        const costCredits = a2eResponse.data.coins || 10
        
        const deductCredits = db.transaction((userId, amount) => {
            const current = db.prepare('SELECT balance FROM user_credits WHERE user_id=?').get(userId)
            if (!current || current.balance < amount) {
                throw new Error('insufficient_credits')
            }
            db.prepare('UPDATE user_credits SET balance = balance - ? WHERE user_id = ?').run(amount, userId)
        })
        
        try {
            deductCredits(req.user.id, costCredits)
        } catch (error) {
            return res.status(402).json({ error: 'insufficient_credits' })
        }
        
        const job = db.prepare('INSERT INTO jobs (user_id, type, status, a2e_task_id, cost_credits, created_at, updated_at) VALUES (?,?,?,?,?,?,?)').run(
            req.user.id, 
            type, 
            'processing', 
            taskId, 
            costCredits, 
            new Date().toISOString(), 
            new Date().toISOString()
        )
        
        startStatusPolling(job.lastInsertRowid, type, taskId)
        
        res.json({ job_id: job.lastInsertRowid, status: 'processing', estimated_credits: costCredits })
    } catch (e) {
        logger.error({ msg: 'process_error', error: String(e) })
        res.status(500).json({ error: 'process_failed' })
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
    const buildRoot = path.join(__dirname, '..', 'frontend', 'dist')
    const indexPath = path.join(buildRoot, 'index.html')
    
    if (fs.existsSync(indexPath)) {
        logger.info('Serving production build from: ' + buildRoot)
        app.use(express.static(buildRoot))

        app.get('*', (req, res) => {
            if (req.path.startsWith('/api')) return res.status(404).json({ error: 'not_found' })
            res.sendFile(indexPath)
        })
    } else {
        logger.error('CRITICAL: Frontend build missing at ' + indexPath)
        app.get('*', (req, res) => {
            if (req.path.startsWith('/api')) return res.status(404).json({ error: 'not_found' })
            res.status(500).send('Frontend build missing. Please check Render build logs.')
        })
    }
}

// Initialize MongoDB and start server
dbHelper.connect(process.env.MONGODB_URI)
    .then(() => {
        app.listen(port, () => {
            logger.info({ msg: 'server_started', port, database: 'MongoDB Atlas' })
        })
    })
    .catch((err) => {
        logger.error({ msg: 'server_start_failed', error: err.message })
        process.exit(1)
    })
