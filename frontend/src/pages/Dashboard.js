import React, { useEffect, useState } from 'react';
import { getCreations, getCredits } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Link } from 'react-router-dom';

export default function Dashboard() {
    const [creations, setCreations] = useState([]);
    const [credits, setCredits] = useState(0);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            getCredits().then(res => setCredits(res.data.balance));
            getCreations().then(res => setCreations(res.data.items));
        }
    }, [user]);

    if (!user) return <div className="p-8">Please login.</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="text-gray-600">Welcome, {user.email}</p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-mono font-bold">{credits} pts</div>
                    <Link to="/create" className="text-blue-600 hover:underline">New Creation</Link>
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
