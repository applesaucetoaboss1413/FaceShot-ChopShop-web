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
const catalogFullConfig = require('../shared/config/catalog')
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
        const freeCredits = parseInt(process.env.SIGNUP_FREE_CREDITS) || 100
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

app.get('/api/web/catalog', async (req, res) => {
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
        total_tools: 0,
        category_names: {
            image: 'Image Generation',
            video: 'Video Creation',
            voice: 'Voice & Audio',
            content: 'Content & SEO',
            bundle: 'Bundles & Packs'
        },
        user_plan: null // Will be populated based on user data if needed
    };

    if (!catalogConfig || !catalogConfig.catalog) {
        console.error('Catalog config not found');
        return res.status(500).json({ error: 'catalog_config_missing' });
    }

    let skuByCode = {}
    try {
        const skus = await db.getSkus(true)
        skuByCode = (skus || []).reduce((acc, sku) => {
            acc[sku.code] = sku
            return acc
        }, {})
    } catch (e) {
        logger.warn({ msg: 'catalog_sku_lookup_failed', error: String(e) })
    }

    catalogConfig.catalog.forEach(item => {
        if (categorized.categories[item.category]) {
            const sku = skuByCode[item.key] || null
            const baseCredits = sku && sku.base_credits ? Number(sku.base_credits) : Math.ceil(item.basePrice / 100)

            // Determine inputs based on category
            let inputs = ['image'];
            if (item.category === 'video') inputs = ['video', 'image'];
            if (item.category === 'voice') inputs = ['audio'];
            if (item.category === 'content') inputs = ['text'];

            categorized.categories[item.category].push({
                sku_code: item.key,
                display_name: item.name,
                name: item.name,
                description: item.description,
                category: item.category,
                // Credits-first UI: base_price_cents is treated as credits by the frontend
                base_price_usd: sku && typeof sku.base_price_cents === 'number'
                    ? (sku.base_price_cents / 100).toFixed(2)
                    : (item.basePrice / 100).toFixed(2),
                base_price_cents: baseCredits,
                base_credits: baseCredits,
                icon: item.icon,
                vector_name: item.key,
                vector_code: item.key,
                inputs: inputs,
                a2e_tool: item.key,
                ...item
            });
            categorized.total_tools++;
        }
    });

    console.log('Returning catalog:', categorized);
    res.json(categorized);
})

app.post('/api/pricing/quote', authenticateToken, async (req, res) => {
    try {
        const { sku_code, quantity = 1, flags = [] } = req.body || {}
        if (!sku_code) {
            return res.status(400).json({ error: 'sku_code_required' })
        }

        const sku = await db.getSkuByCode(sku_code)
        if (!sku) {
            return res.status(404).json({ error: 'sku_not_found' })
        }

        const defaultFlags = Array.isArray(sku.default_flags) ? sku.default_flags : []
        const appliedFlags = Array.isArray(flags) ? flags : []
        const allFlags = [...new Set([...defaultFlags, ...appliedFlags])]
        const flagRecords = allFlags.length > 0 ? await db.getFlagsByCodes(allFlags) : []

        let multiplier = 1.0
        let flatAdd = 0

        for (const flag of flagRecords) {
            if (flag.price_multiplier && flag.price_multiplier !== 1.0) multiplier *= Number(flag.price_multiplier)
            if (flag.price_add_flat_cents && flag.price_add_flat_cents > 0) flatAdd += Number(flag.price_add_flat_cents)
        }

        const qty = Math.max(1, Number(quantity) || 1)
        if (qty >= 50) multiplier *= 0.8
        else if (qty >= 10) multiplier *= 0.9

        const baseCreditsTotal = (Number(sku.base_credits) || 0) * qty
        const totalCredits = Math.max(1, Math.round(baseCreditsTotal * multiplier) + flatAdd)

        res.json({
            quote: {
                sku_code,
                sku_name: sku.name,
                quantity: qty,
                applied_flags: allFlags,
                // Credits-first: treat customer_price_cents as credits for backwards compatibility
                customer_price_cents: totalCredits,
                customer_price_usd: '0.00',
                internal_cost_cents: 0,
                internal_cost_usd: '0.00',
                margin_percent: '0',
                total_seconds: totalCredits,
                seconds_from_plan: 0,
                overage_seconds: 0,
                overage_cost_cents: 0,
                overage_cost_usd: '0.00',
                remaining_plan_seconds: 0
            }
        })
    } catch (e) {
        logger.error({ msg: 'pricing_quote_error', error: String(e) })
        res.status(500).json({ error: 'quote_failed' })
    }
})

// Pricing Plans endpoint
app.get('/api/plans', async (req, res) => {
    try {
        const plans = await db.getPlans(true);
        const formattedPlans = plans.map(plan => ({
            id: plan.id,
            code: plan.code,
            name: plan.name,
            description: plan.description || '',
            monthly_price_usd: plan.monthly_price_cents / 100,
            monthly_price_cents: plan.monthly_price_cents,
            included_seconds: plan.included_seconds || 0,
            overage_rate_per_second_cents: plan.overage_rate_per_second_cents || 0,
            active: plan.active
        }));
        res.json({ plans: formattedPlans });
    } catch (e) {
        logger.error({ msg: 'plans_fetch_error', error: String(e) });
        res.status(500).json({ error: 'failed_to_load_plans' });
    }
});

// SKUs endpoint
app.get('/api/skus', async (req, res) => {
    try {
        const vectorId = req.query.vector_id;
        let skus = await db.getSkus(true);

        // Filter by vector_id if provided
        if (vectorId) {
            skus = skus.filter(sku => sku.vector_id === vectorId);
        }

        const formattedSkus = skus.map(sku => ({
            id: sku.id,
            code: sku.code,
            name: sku.name,
            description: sku.description || '',
            vector_id: sku.vector_id || '',
            vector_name: sku.vector_name || '',
            vector_code: sku.vector_code || '',
            base_price_usd: (sku.base_price_cents / 100).toFixed(2),
            base_price_cents: sku.base_price_cents,
            base_credits: sku.base_credits || 0,
            default_flags: sku.default_flags || [],
            price: sku.base_price_cents / 100,
            currency: 'USD',
            active: sku.active
        }));

        res.json({ skus: formattedSkus });
    } catch (e) {
        logger.error({ msg: 'skus_fetch_error', error: String(e) });
        res.status(500).json({ error: 'failed_to_load_skus' });
    }
});

// Flags endpoint
app.get('/api/flags', async (req, res) => {
    try {
        const flags = await db.getFlags(true);
        const formattedFlags = flags.map(flag => ({
            id: flag.id,
            code: flag.code,
            label: flag.label,
            description: flag.description || '',
            price_multiplier: flag.price_multiplier || 1.0,
            price_add_flat_cents: flag.price_add_flat_cents || 0,
            active: flag.active
        }));
        res.json({ flags: formattedFlags });
    } catch (e) {
        logger.error({ msg: 'flags_fetch_error', error: String(e) });
        res.status(500).json({ error: 'failed_to_load_flags' });
    }
});

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
        const body = req.body || {}
        const { sku_code, type, options = {}, flags = [], quantity = 1 } = body

        const legacyTypeToSku = {
            'face-swap': 'A1-IG',
            'avatar': 'A1-IG',
            'image-to-video': 'C2-30',
            'enhance': 'A3-4K',
            'bgremove': 'A4-BR'
        }

        const skuCode = sku_code || legacyTypeToSku[type] || null
        if (!skuCode) return res.status(400).json({ error: 'invalid_payload' })

        const tool = Array.isArray(catalogFullConfig.catalog)
            ? catalogFullConfig.catalog.find(t => t.sku_code === skuCode)
            : null

        const normalizeA2EType = (raw) => {
            if (!raw) return null
            const t = String(raw).toLowerCase()
            if (t === 'face-swap') return 'faceswap'
            if (t === 'image-to-video') return 'img2vid'
            if (t.startsWith('img2vid')) return 'img2vid'
            if (t.startsWith('faceswap')) return 'faceswap'
            if (t.startsWith('enhance')) return 'enhance'
            if (t.startsWith('bgremove')) return 'bgremove'
            if (t.startsWith('avatar')) return 'avatar'
            if (t === 'faceswap' || t === 'img2vid' || t === 'enhance' || t === 'bgremove' || t === 'avatar') return t
            return null
        }

        const a2eType = normalizeA2EType(tool && tool.key ? tool.key : type)
        if (!a2eType) return res.status(400).json({ error: 'unsupported_tool' })

        // Prepare input media URL
        let mediaInput = body.media_url || body.mediaUrl || body.sourceImage || body.source_image || null

        if (!mediaInput) {
            // Backwards compatibility: fall back to last uploaded job
            const { Job } = require('./models')
            const upload = await Job.findOne({
                user_id: req.user.id,
                type: a2eType,
                source_url: { $exists: true, $ne: null }
            }).sort({ created_at: -1 })
            if (!upload || !upload.source_url) {
                return res.status(400).json({ error: 'no_media_uploaded' })
            }
            mediaInput = upload.source_url
        }

        // If we got a data URL, upload it to Cloudinary
        let mediaUrl = mediaInput
        if (typeof mediaInput === 'string' && mediaInput.startsWith('data:') && cloudinary.config().cloud_name) {
            const uploaded = await cloudinary.uploader.upload(mediaInput)
            mediaUrl = uploaded.secure_url
        }

        // Compute credits to charge (credits-first)
        const sku = await db.getSkuByCode(skuCode)
        if (!sku) return res.status(404).json({ error: 'sku_not_found' })

        const defaultFlags = Array.isArray(sku.default_flags) ? sku.default_flags : []
        const appliedFlags = Array.isArray(flags) ? flags : []
        const allFlags = [...new Set([...defaultFlags, ...appliedFlags])]
        const flagRecords = allFlags.length > 0 ? await db.getFlagsByCodes(allFlags) : []

        let multiplier = 1.0
        let flatAdd = 0
        for (const flag of flagRecords) {
            if (flag.price_multiplier && flag.price_multiplier !== 1.0) multiplier *= Number(flag.price_multiplier)
            if (flag.price_add_flat_cents && flag.price_add_flat_cents > 0) flatAdd += Number(flag.price_add_flat_cents)
        }

        const qty = Math.max(1, Number(quantity) || 1)
        if (qty >= 50) multiplier *= 0.8
        else if (qty >= 10) multiplier *= 0.9

        const baseCreditsTotal = (Number(sku.base_credits) || 0) * qty
        const costCredits = Math.max(1, Math.round(baseCreditsTotal * multiplier) + flatAdd)

        // Check credits
        const creditData = await db.getCredits(req.user.id)
        if (!creditData || creditData.balance < costCredits) {
            return res.status(402).json({ error: 'insufficient_credits' })
        }

        // Deduct credits before starting job
        try {
            await db.deductCredits(req.user.id, costCredits)
        } catch (error) {
            return res.status(402).json({ error: 'insufficient_credits' })
        }

        // Create a new job record tied to this request
        const job = await db.createJob(req.user.id, a2eType, mediaUrl, {
            sku_code: skuCode,
            quantity: qty,
            flags: allFlags,
            ...options
        })

        const a2eService = new A2EService(process.env.A2E_API_KEY, process.env.A2E_BASE_URL)

        let a2eResponse
        try {
            a2eResponse = await a2eService.startTask(a2eType, mediaUrl, options)
        } catch (a2eError) {
            // Refund credits if we couldn't start the task
            await db.addCredits(req.user.id, costCredits)
            await db.updateJob(job.id, { status: 'failed', error: a2eError.message, credits_used: 0 })
            logger.error({ msg: 'a2e_api_error', error: String(a2eError) })
            return res.status(500).json({ error: 'a2e_api_error', details: a2eError.message })
        }

        const taskId = a2eResponse?.data?._id || a2eResponse?.data?.data?._id
        if (!taskId) {
            await db.addCredits(req.user.id, costCredits)
            await db.updateJob(job.id, { status: 'failed', error: 'Invalid response from A2E API', credits_used: 0 })
            return res.status(500).json({ error: 'a2e_api_error', details: 'Invalid response from A2E API' })
        }

        await db.updateJob(job.id, {
            status: 'processing',
            a2e_task_id: taskId,
            credits_used: costCredits
        })

        startStatusPolling(job.id, a2eType, taskId)
        res.json({ job_id: job.id, status: 'processing', estimated_credits: costCredits })
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
const { initializeDatabase } = require('../db-init.js');

connectDB()
    .then(async () => {
        // Initialize database with seed data (Plans, SKUs, Flags)
        try {
            await initializeDatabase();
            logger.info({ msg: 'database_initialized' });
        } catch (err) {
            logger.warn({ msg: 'database_init_warning', error: err.message });
        }

        app.listen(port, () => {
            logger.info({ msg: 'server_started', port, database: 'MongoDB Atlas' })
        })
    })
    .catch((err) => {
        logger.error({ msg: 'server_start_failed', error: err.message })
        process.exit(1)
    })
