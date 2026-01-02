import React, { useEffect, useState } from 'react';
import { getPacks, createCheckoutSession } from '../lib/api';
import { useAuth } from '../lib/auth';

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
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-center">Pricing Packs</h1>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {packs.map(pack => (
                    <div key={pack.type} className="border p-6 rounded-lg shadow-sm hover:shadow-md transition">
                        <h2 className="text-xl font-bold capitalize mb-2">{pack.type}</h2>
                        <div className="text-3xl font-bold mb-4">
                            ${(pack.price_cents / 100).toFixed(2)}
                        </div>
                        <div className="mb-6 text-gray-600">
                            {pack.points} credits
                        </div>
                        <button
                            onClick={() => handleBuy(pack.type)}
                            className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 disabled:opacity-50"
                            disabled={!user}
                        >
                            {user ? 'Buy Now' : 'Login to Buy'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
