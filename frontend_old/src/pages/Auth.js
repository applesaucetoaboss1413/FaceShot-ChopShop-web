import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useNavigate, Link } from 'react-router-dom';

export default function Auth({ type }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, signup } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (type === 'login') {
                await login(email, password);
            } else {
                await signup(email, password);
            }
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Authentication failed');
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <div className="w-full max-w-md border p-8 rounded-lg shadow-sm">
                <h1 className="text-2xl font-bold mb-6 text-center capitalize">{type}</h1>
                
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 capitalize"
                    >
                        {type}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-600">
                    {type === 'login' ? (
                        <>
                            Don't have an account? <Link to="/signup" className="text-blue-600 underline">Sign up</Link>
                        </>
                    ) : (
                        <>
                            Already have an account? <Link to="/login" className="text-blue-600 underline">Login</Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
