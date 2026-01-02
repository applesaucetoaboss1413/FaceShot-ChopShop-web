import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { getCredits } from '../../lib/api';

export function Header() {
    const { user, logout } = useAuth();
    const [credits, setCredits] = React.useState(0);

    React.useEffect(() => {
        if (user) {
            getCredits().then(res => setCredits(res.data.balance)).catch(console.error);
        }
    }, [user]);

    return (
        <header className="border-b p-4 flex justify-between items-center bg-white">
            <Link to="/" className="text-xl font-bold">A2E Web</Link>
            <nav className="flex gap-4 items-center">
                <Link to="/pricing" className="hover:underline">Pricing</Link>
                <Link to="/faqs" className="hover:underline">FAQs</Link>
                {user ? (
                    <>
                        <Link to="/dashboard" className="hover:underline">Dashboard</Link>
                        <Link to="/create" className="hover:underline">Create</Link>
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                            {credits} pts
                        </span>
                        <button onClick={logout} className="text-red-500 hover:underline">Logout</button>
                    </>
                ) : (
                    <Link to="/" className="bg-blue-600 text-white px-4 py-2 rounded">Login</Link>
                )}
            </nav>
        </header>
    );
}
