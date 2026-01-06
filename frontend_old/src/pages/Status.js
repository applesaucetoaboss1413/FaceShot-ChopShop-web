import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getJobStatus } from '../lib/api';

export default function Status() {
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');
    const [status, setStatus] = useState('pending');
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!id) return;
        const poll = setInterval(() => {
            getJobStatus(id)
                .then(res => {
                    setStatus(res.data.status);
                    if (res.data.status === 'completed') clearInterval(poll);
                })
                .catch(err => {
                    setError(err.message);
                    clearInterval(poll);
                });
        }, 2000);

        return () => clearInterval(poll);
    }, [id]);

    if (!id) return <div className="p-8">No job ID provided.</div>;

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
            <h1 className="text-2xl font-bold mb-4">Job Status</h1>

            {error ? (
                <div className="text-red-500">{error}</div>
            ) : (
                <div className="text-center">
                    <div className={`text-4xl font-bold mb-4 capitalize ${status === 'completed' ? 'text-green-600' : 'text-blue-600'
                        }`}>
                        {status}
                    </div>
                    {status === 'completed' ? (
                        <div className="mt-8">
                            <p className="mb-4">Your creation is ready!</p>
                            <Link to="/dashboard" className="bg-black text-white px-6 py-2 rounded">
                                Go to Dashboard
                            </Link>
                        </div>
                    ) : (
                        <div className="animate-pulse text-gray-500">
                            Processing your request...
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
