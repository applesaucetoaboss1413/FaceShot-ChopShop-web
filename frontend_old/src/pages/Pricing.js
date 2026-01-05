import React, { useEffect, useState } from 'react';
import { getPacks, getPlans, createCheckoutSession, subscribe, getSKUs, getPricingQuote } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useNavigate } from 'react-router-dom';

export default function Pricing() {
    const [packs, setPacks] = useState([]);
    const [plans, setPlans] = useState([]);
    const [heroBundles, setHeroBundles] = useState([]);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        getPacks().then(res => setPacks(res.data)).catch(console.error);
        getPlans().then(res => {
            if (res.data && res.data.plans) {
                setPlans(res.data.plans);
            }
        }).catch(console.error);
        
        getSKUs().then(res => {
            if (res.data && res.data.skus) {
                const heroCodes = ['E1-ECOM25', 'E2-LAUNCHKIT', 'E3-AGENCY100'];
                const heroes = res.data.skus.filter(s => heroCodes.includes(s.code));
                setHeroBundles(heroes);
            }
        }).catch(console.error);
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
        if (!user) {
            alert('Please login first');
            return navigate('/auth');
        }
        try {
            const { data } = await subscribe(planId);
            if (data.session_url) {
                window.location.href = data.session_url;
            }
        } catch (e) {
            alert('Subscription failed: ' + (e.response?.data?.error || e.message));
        }
    };

    const handleBuyBundle = async (skuCode) => {
        if (!user) {
            alert('Please login first');
            return navigate('/auth');
        }
        
        navigate(`/create?sku=${skuCode}`);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold mb-4 text-center">Pricing & Plans</h1>
            <p className="text-center text-gray-600 mb-12">Choose the perfect plan for your AI generation needs</p>
            
            <section className="mb-16">
                <h2 className="text-2xl font-bold mb-8 text-center">Monthly Subscriptions</h2>
                <div className="grid md:grid-cols-3 gap-8">
                    {plans.map((plan, idx) => (
                        <div key={plan.id} className={`border ${idx === 1 ? 'border-blue-500 border-2' : 'border-gray-300'} p-8 rounded-xl shadow-lg relative bg-white hover:shadow-xl transition`}>
                            {idx === 1 && (
                                <div className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 rounded-bl-lg text-sm font-bold">
                                    MOST POPULAR
                                </div>
                            )}
                            <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                            <p className="text-gray-600 mb-6 min-h-[48px]">{plan.description}</p>
                            <div className="text-4xl font-bold mb-6">
                                ${plan.monthly_price_usd}
                                <span className="text-lg font-normal text-gray-500">/mo</span>
                            </div>
                            <ul className="mb-8 space-y-3">
                                <li className="flex items-center gap-2">
                                    <span className="text-green-500">✔</span> {plan.included_seconds.toLocaleString()} seconds/month
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-green-500">✔</span> ${plan.overage_rate_per_second_usd}/s overage
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-green-500">✔</span> ~{Math.floor(plan.included_seconds / 60)} short videos
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-green-500">✔</span> Priority support
                                </li>
                            </ul>
                            <button
                                onClick={() => handleSubscribe(plan.id)}
                                className={`w-full ${idx === 1 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-800 hover:bg-gray-900'} text-white py-3 rounded-lg font-bold transition`}
                            >
                                {user ? 'Subscribe Now' : 'Login to Subscribe'}
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {heroBundles.length > 0 && (
                <section className="mb-16">
                    <h2 className="text-2xl font-bold mb-4 text-center">Hero Bundles</h2>
                    <p className="text-center text-gray-600 mb-8">One-time comprehensive packages for specific needs</p>
                    <div className="grid md:grid-cols-3 gap-8">
                        {heroBundles.map(bundle => (
                            <div key={bundle.id} className="border border-purple-500 p-8 rounded-xl shadow-lg bg-gradient-to-br from-purple-50 to-white hover:shadow-xl transition">
                                <div className="bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-bold inline-block mb-4">
                                    {bundle.vector_name}
                                </div>
                                <h3 className="text-2xl font-bold mb-2">{bundle.name}</h3>
                                <p className="text-gray-600 mb-6 min-h-[48px]">{bundle.description}</p>
                                <div className="text-4xl font-bold mb-6 text-purple-600">
                                    ${bundle.base_price_usd}
                                    <span className="text-sm font-normal text-gray-500"> one-time</span>
                                </div>
                                <div className="mb-6 text-sm text-gray-600">
                                    ~{bundle.base_credits} credits included
                                </div>
                                <button
                                    onClick={() => handleBuyBundle(bundle.code)}
                                    className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 transition"
                                >
                                    {user ? 'Get Started' : 'Login to Buy'}
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {packs.length > 0 && (
                <section>
                    <h2 className="text-2xl font-bold mb-8 text-center">Credit Top-Up Packs</h2>
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
            )}
        </div>
    );
}
