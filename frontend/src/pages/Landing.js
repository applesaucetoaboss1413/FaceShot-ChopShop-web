import React, { useEffect, useState } from 'react';
import { getStats } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useNavigate, Link } from 'react-router-dom';
import TelegramLoginButton from '../components/TelegramLoginButton';

export default function Landing() {
    const [stats, setStats] = useState(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        getStats().then(res => setStats(res.data)).catch(console.error);
        if (user) navigate('/dashboard');
    }, [user, navigate]);

    const handleTelegramAuth = (user) => {
        console.log('Telegram auth:', user);
        // TODO: Send to backend for verification and login
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-4">
            <h1 className="text-4xl font-bold mb-4">FaceShot-ChopShop</h1>
            <p className="text-xl text-gray-600 mb-8">
                Face Swap, Avatars, Image-to-Video and more.
            </p>

            <div className="mb-12 flex flex-col gap-4 justify-center items-center">
                <div className="flex gap-4">
                    <Link to="/signup" className="bg-black text-white px-8 py-3 rounded-lg text-lg font-bold hover:bg-gray-800">
                        Get Started
                    </Link>
                </div>
                <div className="mt-4">
                    <TelegramLoginButton 
                        botName={process.env.REACT_APP_TELEGRAM_BOT_NAME || "ImMoreThanJustSomeBot"} 
                        onAuth={handleTelegramAuth}
                    />
                </div>
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
