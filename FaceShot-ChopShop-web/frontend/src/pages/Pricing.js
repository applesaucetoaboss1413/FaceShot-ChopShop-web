import React, { useEffect, useState } from 'react';
import { getPacks, createCheckoutSession } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Button } from '../components/ui/button';
import { motion } from 'framer-motion';

export default function Pricing() {
    const [packs, setPacks] = useState([]);
    const { user } = useAuth();

    useEffect(() => {
        getPacks().then(res => setPacks(res.data)).catch(console.error);
    }, []);

    const handleBuy = async (type) => {
        if (!user) return alert('Please login first');
        try {
            const { data } = await createCheckoutSession(type);
            window.location.href = data.url;
        } catch (e) {
            alert('Checkout failed');
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center mb-10"
            >
                <span className="inline-block text-indigo-700 font-semibold text-sm uppercase tracking-wider mb-2">Pricing</span>
                <h1 className="text-3xl sm:text-4xl font-bold mb-3">Simple, Transparent Pricing</h1>
                <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                    Pay only for what you use. No subscriptions, no hidden fees. Credits never expire.
                </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {packs.map(pack => (
                    <motion.div
                        key={pack.type}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="relative border p-6 rounded-lg shadow-sm hover:shadow-md transition"
                    >
                        <h2 className="text-xl font-bold capitalize mb-2">{pack.type}</h2>
                        <div className="text-3xl font-bold mb-4">
                            ${(pack.price_cents / 100).toFixed(2)}
                        </div>
                        <div className="mb-6 text-gray-600">
                            {pack.points} credits
                        </div>
                        <Button
                            onClick={() => handleBuy(pack.type)}
                            className="w-full disabled:opacity-50"
                            variant="hero"
                            disabled={!user}
                        >
                            {user ? 'Buy Now' : 'Login to Buy'}
                        </Button>
                    </motion.div>
                ))}
            </div>
            <p className="text-center text-gray-500 text-sm mt-10">
                All packs include a 7-day money-back guarantee.
            </p>
        </div>
    );
}
