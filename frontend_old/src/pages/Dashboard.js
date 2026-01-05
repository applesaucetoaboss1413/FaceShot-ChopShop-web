import React, { useEffect, useState } from 'react';
import { getCreations, getCredits, getAccountPlan } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Link } from 'react-router-dom';

export default function Dashboard() {
    const [creations, setCreations] = useState([]);
    const [credits, setCredits] = useState(0);
    const [planData, setPlanData] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            getCredits().then(res => setCredits(res.data.balance)).catch(console.error);
            getCreations().then(res => setCreations(res.data.items)).catch(console.error);
            getAccountPlan().then(res => {
                if (res.data && res.data.has_plan) {
                    setPlanData(res.data);
                }
            }).catch(console.error);
        }
    }, [user]);

    if (!user) return <div className="p-8">Please login.</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="text-gray-600">Welcome, {user.email}</p>
                </div>
                <Link to="/create" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700">
                    + New Creation
                </Link>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
                {planData ? (
                    <div className="border-2 border-blue-500 p-6 rounded-lg bg-gradient-to-br from-blue-50 to-white">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold">{planData.plan.name} Plan</h3>
                                <p className="text-gray-600 text-sm">${planData.plan.monthly_price_usd}/month</p>
                            </div>
                            <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-0.5 rounded uppercase">
                                Active
                            </span>
                        </div>
                        
                        <div className="mb-4">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium">Usage This Period</span>
                                <span className="text-gray-600">{planData.usage.usage_percent}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div 
                                    className={`h-2.5 rounded-full ${planData.usage.usage_percent > 80 ? 'bg-orange-500' : 'bg-blue-600'}`}
                                    style={{ width: `${Math.min(planData.usage.usage_percent, 100)}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>{planData.usage.seconds_used.toLocaleString()}s used</span>
                                <span>{planData.usage.remaining_seconds.toLocaleString()}s remaining</span>
                            </div>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Monthly Quota:</span>
                                <span className="font-medium">{planData.plan.included_seconds.toLocaleString()}s</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Overage Rate:</span>
                                <span className="font-medium">${planData.plan.overage_rate_per_second_usd}/s</span>
                            </div>
                            {planData.subscription.end_date && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Next Billing:</span>
                                    <span className="font-medium">{new Date(planData.subscription.end_date).toLocaleDateString()}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg text-center">
                        <h3 className="text-xl font-bold mb-2">No Active Subscription</h3>
                        <p className="text-gray-600 mb-4">Subscribe to a plan for better rates and monthly quotas</p>
                        <Link to="/pricing" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700">
                            View Plans
                        </Link>
                    </div>
                )}

                <div className="border p-6 rounded-lg">
                    <h3 className="text-xl font-bold mb-4">Credit Balance</h3>
                    <div className="text-4xl font-mono font-bold mb-4 text-blue-600">{credits.toLocaleString()}</div>
                    <p className="text-gray-600 text-sm mb-4">Use credits for additional capacity beyond your plan quota</p>
                    <Link to="/pricing" className="text-blue-600 hover:underline text-sm font-medium">
                        Buy More Credits →
                    </Link>
                </div>
            </div>

            <h2 className="text-xl font-bold mb-4">Recent Creations</h2>
            {creations.length === 0 ? (
                <div className="text-gray-500 py-12 text-center border rounded">
                    No creations yet. <Link to="/create" className="text-blue-600 underline">Start creating</Link>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {creations.map(item => (
                        <div key={item.id} className="border rounded overflow-hidden">
                            {item.url ? (
                                item.type === 'img2vid' || item.url.endsWith('.mp4') ? (
                                    <video src={item.url} controls className="w-full h-48 object-cover" />
                                ) : (
                                    <img src={item.url} alt={item.type} className="w-full h-48 object-cover" />
                                )
                            ) : (
                                <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400">
                                    {item.status}
                                </div>
                            )}
                            <div className="p-2 text-sm bg-gray-50 flex justify-between">
                                <span className="capitalize">{item.type}</span>
                                <span className={item.status === 'completed' ? 'text-green-600' : 'text-orange-500'}>
                                    {item.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
