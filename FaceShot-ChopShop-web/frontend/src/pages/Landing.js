import React, { useEffect, useState } from 'react';
import { getStats } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Play, Repeat, User, Video, Wand2, Zap, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';

export default function Landing() {
    const [stats, setStats] = useState(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        getStats().then(res => setStats(res.data)).catch(console.error);
        if (user) navigate('/dashboard');
    }, [user, navigate]);

    return (
        <div className="flex flex-col">
            <section className="min-h-[80vh] flex items-center justify-center text-center p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50" />
                <div className="relative z-10 max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 font-medium mb-6"
                    >
                        <Sparkles className="w-4 h-4" />
                        <span>Powered by A2E AI Technology</span>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-4"
                    >
                        Transform Your Images Like Magic
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-8"
                    >
                        Face swap, generate stunning avatars, and convert images to videos in seconds.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
                    >
                        <Link to="/signup">
                            <Button variant="hero" size="xl">
                                Start Creating Free
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </Link>
                        <a href="#features">
                            <Button variant="heroOutline" size="xl">
                                <Play className="w-5 h-5 mr-2" />
                                See How It Works
                            </Button>
                        </a>
                    </motion.div>
                    {stats && (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="flex items-center justify-center gap-8"
                        >
                            <div className="text-center">
                                <div className="text-3xl sm:text-4xl font-bold">
                                    {(stats.videos || 0).toLocaleString()}+
                                </div>
                                <div className="text-sm text-gray-500 mt-1">Creations Made</div>
                            </div>
                            <div className="w-px h-10 bg-gray-200" />
                            <div className="text-center">
                                <div className="text-3xl sm:text-4xl font-bold">
                                    {(stats.total_users || 0).toLocaleString()}+
                                </div>
                                <div className="text-sm text-gray-500 mt-1">Happy Users</div>
                            </div>
                            <div className="w-px h-10 bg-gray-200" />
                            <div className="text-center">
                                <div className="text-3xl sm:text-4xl font-bold">99.9%</div>
                                <div className="text-sm text-gray-500 mt-1">Uptime</div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </section>

            <section id="features" className="py-16 px-6">
                <div className="text-center mb-10">
                    <span className="inline-block text-indigo-700 font-semibold text-sm uppercase tracking-wider mb-2">Features</span>
                    <h2 className="text-3xl sm:text-4xl font-bold mb-3">Everything You Need to Create Amazing Content</h2>
                    <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                        Powerful AI tools designed for creators, marketers, and anyone who wants to transform their visual content.
                    </p>
                </div>
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
                >
                    {[
                        { Icon: Repeat, title: 'Face Swap', desc: 'Seamlessly swap faces between photos with AI precision.' },
                        { Icon: User, title: 'AI Avatars', desc: 'Generate stunning, unique avatars from your photos.' },
                        { Icon: Video, title: 'Image to Video', desc: 'Bring static images to life with AI-powered animation.' },
                        { Icon: Wand2, title: 'One-Click Magic', desc: 'Upload, select your transformation, and let AI work.' },
                        { Icon: Zap, title: 'Lightning Fast', desc: 'Get results in seconds with an optimized pipeline.' },
                        { Icon: Shield, title: 'Secure & Private', desc: 'Encrypted uploads, auto-deletion, and private processing.' },
                    ].map(({ Icon, title, desc }) => (
                        <motion.div
                            key={title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="border rounded-lg p-6 hover:shadow-md transition"
                        >
                            <div className="w-12 h-12 rounded-lg bg-black text-white flex items-center justify-center mb-4">
                                <Icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">{title}</h3>
                            <p className="text-gray-600">{desc}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            <section className="py-16 px-6">
                <div className="max-w-4xl mx-auto text-center border rounded-2xl p-10 bg-gradient-to-br from-indigo-50 to-purple-50">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 font-medium mb-4">
                        <Sparkles className="w-4 h-4" />
                        <span>Start Free Today</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold mb-3">Ready to Transform Your Images?</h2>
                    <p className="text-gray-600 text-lg max-w-xl mx-auto mb-6">
                        Join thousands of creators using FaceShot-ChopShop to create stunning visual content.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/signup">
                            <Button variant="hero" size="xl">
                                Get Started Free
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </Link>
                        <Link to="/pricing">
                            <Button variant="heroOutline" size="xl">
                                View Pricing
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
