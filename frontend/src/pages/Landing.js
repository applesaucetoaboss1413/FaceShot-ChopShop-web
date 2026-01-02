import React, { useEffect, useState } from 'react';
import { getStats } from '../lib/api';
import { TelegramLoginButton, useAuth } from '../lib/auth';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
    const [stats, setStats] = useState(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        getStats().then(res => setStats(res.data)).catch(console.error);
        if (user) navigate('/dashboard');
    }, [user, navigate]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-4">
            <h1 className="text-4xl font-bold mb-4">AI Media Studio</h1>
            <p className="text-xl text-gray-600 mb-8">
                Face Swap, Avatars, Image-to-Video and more directly from Telegram.
            </p>

            <div className="mb-12">
                <TelegramLoginButton botName="YourStagingBot" />
            </div>

            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center mt-8">
                    <div>
                        <div className="text-2xl font-bold">{stats.videos}</div>
                        <div className="text-gray-500">Creations</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold">{stats.total_users}</div>
                        <div className="text-gray-500">Users</div>
                    </div>
                </div>
            )}
        </div>
    );
}
