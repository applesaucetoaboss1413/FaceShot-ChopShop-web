const packs = [
    {
        type: 'micro',
        points: 100,
        price_cents: 499,
        price_ids: {
            usd: 'price_micro_usd',
            mxn: 'price_micro_mxn',
            eur: 'price_micro_eur',
            gbp: 'price_micro_gbp'
        }
    },
    {
        type: 'starter',
        points: 300,
        price_cents: 1299,
        price_ids: {
            usd: 'price_starter_usd',
            mxn: 'price_starter_mxn',
            eur: 'price_starter_eur',
            gbp: 'price_starter_gbp'
        }
    },
    {
        type: 'plus',
        points: 800,
        price_cents: 2999,
        price_ids: {
            usd: 'price_plus_usd',
            mxn: 'price_plus_mxn',
            eur: 'price_plus_eur',
            gbp: 'price_plus_gbp'
        }
    },
    {
        type: 'pro',
        points: 2000,
        price_cents: 6999,
        price_ids: {
            usd: 'price_pro_usd',
            mxn: 'price_pro_mxn',
            eur: 'price_pro_eur',
            gbp: 'price_pro_gbp'
        }
    }
]

module.exports = { packs }

