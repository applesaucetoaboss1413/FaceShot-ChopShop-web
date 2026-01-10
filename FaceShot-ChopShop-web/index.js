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
const { connectDB } = require('../db/mongoClient')
const db = require('../db/mongo')
const { ProcessedEvent } = require('./models.js')

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
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
    return await db.addCredits(userId, amount)
}

const deductCredits = async (userId, amount) => {
    return await db.deductCredits(userId, amount)
}

app.post('/webhook/stripe', async (req, res) => {
    const sig = req.headers['stripe-signature']
    let event

    try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)
    } catch (err) {
        logger.warn({ msg: 'webhook_signature_invalid', error: err.message })
        return res.status(400).send('Webhook signature verification failed')
    }

    // Check idempotency - skip if already processed
    const existingEvent = await ProcessedEvent.findOne({ event_id: event.id })
    if (existingEvent) {
        logger.info({ msg: 'webhook_duplicate_event', event_id: event.id, event_type: event.type })
        return res.status(200).json({ received: true })
    }

    // Validate supported event types
    const supportedEvents = ['checkout.session.completed']
    if (!supportedEvents.includes(event.type)) {
        logger.warn({ msg: 'webhook_unsupported_event_type', event_type: event.type, event_id: event.id })
        // Still mark as processed to avoid retries
        await ProcessedEvent.create({ event_id: event.id, event_type: event.type, status: 'ignored' })
        return res.status(200).json({ received: true })
    }

    try {
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object

            // Validate required metadata
            const { user_id, points, pack_type, source } = session.metadata || {}
            if (!user_id || !points || source !== 'web') {
                logger.warn({
                    msg: 'webhook_invalid_metadata',
                    event_id: event.id,
                    user_id: user_id || 'missing',
                    points: points || 'missing',
                    source: source || 'missing'
                })
                await ProcessedEvent.create({ event_id: event.id, event_type: event.type, status: 'invalid' })
                return res.status(200).json({ received: true }) // Invalid but not retryable
            }

            // Validate session data
            if (!session.id || !session.amount_total || isNaN(Number(points))) {
                logger.warn({
                    msg: 'webhook_invalid_session_data',
                    event_id: event.id,
                    session_id: session.id || 'missing',
                    amount_total: session.amount_total || 'missing',
                    points
                })
                await ProcessedEvent.create({ event_id: event.id, event_type: event.type, status: 'invalid' })
                return res.status(200).json({ received: true })
            }

            // Process the payment
            await db.createPurchase(user_id, session.id, session.amount_total, Number(points))
            await addCredits(user_id, Number(points))

            // Mark as processed
            await ProcessedEvent.create({ event_id: event.id, event_type: event.type, status: 'processed' })

            logger.info({
                msg: 'webhook_payment_processed',
                event_id: event.id,
                user_id,
                points: Number(points),
                amount_cents: session.amount_total
            })

            return res.status(200).json({ received: true })
        }
    } catch (dbError) {
        logger.error({
            msg: 'webhook_db_error',
            event_id: event.id,
            event_type: event.type,
            error: dbError.message
        })
        // Return 500 to trigger Stripe retry
        return res.status(500).send('Internal server error')
    }

    // Fallback - should not reach here
    logger.error({ msg: 'webhook_unhandled_event', event_id: event.id, event_type: event.type })
    await ProcessedEvent.create({ event_id: event.id, event_type: event.type, status: 'unhandled' })
    res.status(200).json({ received: true })
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

                await db.updateJob(jobId, {
                    status: 'completed',
                    result_url: resultUrl
                })

                clearInterval(pollInterval)
                pollingJobs.delete(jobId)
                logger.info({ msg: 'job_completed', jobId, resultUrl })
            } else if (currentStatus === 'failed' || currentStatus === 'error') {
                const errorMessage = status.data.failed_message || status.data.error_message || 'Unknown error'

                const job = await db.getJob(jobId)
                if (job && job.credits_used > 0) {
                    await db.addCredits(job.user_id, job.credits_used)
                }

                await db.updateJob(jobId, {
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
        const stats = await db.getStats()
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

        const existing = await db.getUserByEmail(email)
        if (existing) {
            return res.status(409).json({ error: 'email_exists' })
        }

        const passwordHash = await bcrypt.hash(password, 10)
        const user = await db.createUser(email, passwordHash)

        // Award free signup credits
        const freeCredits = parseInt(process.env.SIGNUP_FREE_CREDITS) || 5
        await db.addCredits(user.id, freeCredits)
        logger.info({ msg: 'signup_free_credited', userId: user.id, email, credits: freeCredits })

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

        const user = await db.getUserByEmail(email)
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
        const user = await db.getUserById(req.user.id)
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
    console.log('Catalog endpoint called');
    console.log('Catalog config:', catalogConfig);

    // Transform flat catalog array into categorized structure
    const categorized = {
        categories: {
            image: [],
            video: [],
            voice: [],
            content: [],
            bundle: []
        },
        user_plan: null // Will be populated based on user data if needed
    };

    if (!catalogConfig || !catalogConfig.catalog) {
        console.error('Catalog config not found');
        return res.status(500).json({ error: 'catalog_config_missing' });
    }

    catalogConfig.catalog.forEach(item => {
        if (categorized.categories[item.category]) {
            categorized.categories[item.category].push({
                sku_code: item.key,
                display_name: item.name,
                name: item.name,
                description: item.description,
                category: item.category,
                base_price_usd: item.basePrice / 100, // Convert cents to dollars
                base_credits: Math.ceil(item.basePrice / 100), // Rough credit conversion
                icon: item.icon,
                vector_name: item.key,
                inputs: ['image'], // Default input type, can be customized per item
                ...item // Include any other properties
            });
        }
    });

    console.log('Returning catalog:', categorized);
    res.json(categorized);
})

// Test endpoint
app.get('/api/web/test', (req, res) => {
    console.log('Test endpoint called');
    res.json({ message: 'API is working', timestamp: new Date().toISOString() });
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
        const credits = await db.getCredits(req.user.id)
        res.json({ balance: credits.balance })
    } catch (e) {
        logger.error({ msg: 'credits_error', error: String(e) })
        res.status(500).json({ error: 'credits_fetch_failed' })
    }
})

app.get('/api/web/creations', authenticateToken, async (req, res) => {
    try {
        const jobs = await db.getUserJobs(req.user.id, 20)
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
        const job = await db.createJob(req.user.id, type, url, { uploaded: true })

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

        // Check credits using MongoDB
        const creditData = await db.getCredits(req.user.id)
        if (!creditData || creditData.balance < 10) {
            return res.status(402).json({ error: 'insufficient_credits' })
        }

        // Get the most recent uploaded job/creation for this type using MongoDB
        const { Job } = require('./models')
        const upload = await Job.findOne({
            user_id: req.user.id,
            type: type,
            source_url: { $exists: true, $ne: null }
        }).sort({ created_at: -1 })

        if (!upload || !upload.source_url) {
            return res.status(400).json({ error: 'no_media_uploaded' })
        }

        const a2eService = new A2EService(process.env.A2E_API_KEY, process.env.A2E_BASE_URL)

        let a2eResponse
        try {
            a2eResponse = await a2eService.startTask(type, upload.source_url, options)
        } catch (a2eError) {
            logger.error({ msg: 'a2e_api_error', error: String(a2eError) })
            return res.status(500).json({ error: 'a2e_api_error', details: a2eError.message })
        }

        if (!a2eResponse || !a2eResponse.data || !a2eResponse.data._id) {
            return res.status(500).json({ error: 'a2e_api_error', details: 'Invalid response from A2E API' })
        }

        const taskId = a2eResponse.data._id
        const costCredits = a2eResponse.data.coins || 10

        // Deduct credits using MongoDB
        try {
            await db.deductCredits(req.user.id, costCredits)
        } catch (error) {
            return res.status(402).json({ error: 'insufficient_credits' })
        }

        // Update the job with a2e task info using MongoDB
        await db.updateJob(upload._id.toString(), {
            status: 'processing',
            a2e_task_id: taskId,
            credits_used: costCredits
        })

        // Start polling for this job
        startStatusPolling(upload._id.toString(), type, taskId)

        res.json({ job_id: upload._id.toString(), status: 'processing', estimated_credits: costCredits })
    } catch (e) {
        logger.error({ msg: 'process_error', error: String(e) })
        res.status(500).json({ error: 'process_failed' })
    }
})

app.get('/api/web/status', async (req, res) => {
    try {
        const id = req.query.id
        if (!id) {
            return res.status(400).json({ error: 'missing_id', message: 'Job ID is required' })
        }

        // MongoDB uses string IDs (ObjectId)
        const job = await db.getJob(id)
        if (!job) {
            return res.status(404).json({ error: 'not_found', message: 'Job not found' })
        }

        res.json({
            job_id: job.id,
            status: job.status,
            result_url: job.result_url || null,
            cost_credits: job.credits_used || 0,
            error_message: job.error || null,
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
connectDB()
    .then(() => {
        app.listen(port, () => {
            logger.info({ msg: 'server_started', port, database: 'MongoDB Atlas' })
        })
    })
    .catch((err) => {
        logger.error({ msg: 'server_start_failed', error: err.message })
        process.exit(1)
    })
