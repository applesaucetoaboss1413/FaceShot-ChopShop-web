import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import { Header } from './components/layout/Header';
import Landing from './pages/Landing';
import Pricing from './pages/Pricing';
import Dashboard from './pages/Dashboard';
import Create from './pages/Create';
import Status from './pages/Status';
import FAQs from './pages/FAQs';

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="min-h-screen bg-white text-black">
                    <Header />
                    <main>
                        <Routes>
                            <Route path="/" element={<Landing />} />
                            <Route path="/pricing" element={<Pricing />} />
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/create" element={<Create />} />
                            <Route path="/status" element={<Status />} />
                            <Route path="/faqs" element={<FAQs />} />
                        </Routes>
                    </main>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;
