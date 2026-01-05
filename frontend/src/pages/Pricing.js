import React, { useEffect, useState } from 'react';
import { getPacks, getPlans, createCheckoutSession, subscribe } from '../lib/api';
import { useAuth } from '../lib/auth';

export default function Pricing() {
    const [packs, setPacks] = useState([]);
    const [plans, setPlans] = useState([]);
    const { user } = useAuth();

    useEffect(() => {
        getPacks().then(res => setPacks(res.data)).catch(console.error);
        getPlans().then(res => setPlans(res.data)).catch(console.error);
    }, []);

    const handleBuy = async (type) => {
        if (!user) return alert('Please login first');
        try {
            const { data } = await createCheckoutSession(type);
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert('Payment session created but no URL returned');
            }
        } catch (e) {
            alert('Checkout failed');
        }
    };

    const handleSubscribe = async (planId) => {
        if (!user) return alert('Please login first');
        try {
            const { data } = await subscribe(planId);
            alert('Subscription successful! Status: ' + data.status);
            window.location.href = '/dashboard';
        } catch (e) {
            alert('Subscription failed: ' + (e.response?.data?.error || e.message));
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-12 text-center">Pricing & Plans</h1>
            
            <section className="mb-16">
                <h2 className="text-2xl font-bold mb-8">Monthly Subscriptions</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {plans.map(plan => (
                        <div key={plan.id} className="border-2 border-blue-500 p-8 rounded-xl shadow-lg relative bg-white">
                            <div className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 rounded-bl-lg text-sm font-bold">
                                RECOMMENDED
                            </div>
                            <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                            <p className="text-gray-600 mb-6">{plan.description}</p>
                            <div className="text-4xl font-bold mb-6">
                                ${(plan.monthly_price_cents / 100).toFixed(2)}
                                <span className="text-lg font-normal text-gray-500">/mo</span>
                            </div>
                            <ul className="mb-8 space-y-3">
                                <li className="flex items-center gap-2">
                                    <span className="text-green-500">✔</span> {plan.included_seconds} included seconds
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-green-500">✔</span> ${plan.overage_rate_per_second_cents / 100}/s overage rate
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-green-500">✔</span> Priority Processing
                                </li>
                            </ul>
                            <button
                                onClick={() => handleSubscribe(plan.id)}
                                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition"
                            >
                                {user ? 'Subscribe Now' : 'Login to Subscribe'}
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-bold mb-8">One-Time Credit Packs</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {packs.map(pack => (
                        <div key={pack.type} className="border p-6 rounded-lg shadow-sm hover:shadow-md transition bg-gray-50">
                            <h3 className="text-xl font-bold capitalize mb-2">{pack.type}</h3>
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
                                {user ? 'Buy Credits' : 'Login to Buy'}
                            </button>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
