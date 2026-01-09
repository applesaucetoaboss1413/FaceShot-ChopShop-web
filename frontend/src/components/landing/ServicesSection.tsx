import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Sparkles,
    Store,
    Briefcase,
    TrendingUp,
    Users,
    Zap,
    ArrowRight,
    Check,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { api, SKU } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Strategic service packages based on use case and target audience
const featuredPackages = [
    {
        id: 'launch-kit',
        name: 'Brand Launch Kit',
        icon: Sparkles,
        price: 449,
        skuCode: 'E2-LAUNCHKIT',
        gradient: 'from-purple-500 to-pink-500',
        target: 'New Brands & Startups',
        tagline: 'Everything you need to launch your brand',
        includes: [
            '30 professional brand images',
            '3× 30s promotional videos',
            '60s voiceover narration',
            'Social media templates',
            'Brand style guide'
        ],
        ideal: 'Perfect for launching a new brand, product, or service with a complete content foundation'
    },
    {
        id: 'ecommerce',
        name: 'E-commerce Catalog Pack',
        icon: Store,
        price: 225,
        skuCode: 'E1-ECOM25',
        gradient: 'from-blue-500 to-cyan-500',
        target: 'Online Stores & Product Sellers',
        tagline: 'Professional product photography at scale',
        includes: [
            '25 product SKUs',
            '3 images per product (75 total)',
            'Background removal included',
            '2 lifestyle shots per product',
            'Consistent brand styling'
        ],
        ideal: 'Transform your product catalog with professional AI-generated imagery that drives conversions'
    },
    {
        id: 'agency',
        name: 'Agency Asset Bank',
        icon: Briefcase,
        price: 599,
        skuCode: 'E3-AGENCY100',
        gradient: 'from-orange-500 to-red-500',
        target: 'Agencies & Creative Studios',
        tagline: 'Unlimited creativity for client work',
        includes: [
            '100 mixed assets (your choice)',
            'Images, videos, or voice',
            'White-label ready',
            'Priority processing',
            'Dedicated account manager'
        ],
        ideal: 'Scale your agency output with a flexible asset bank perfect for multiple clients and campaigns'
    }
];

const useCaseCategories = [
    {
        id: 'social-content',
        name: 'Social Media Content',
        icon: TrendingUp,
        description: 'High-volume content for social platforms',
        gradient: 'from-pink-500 to-rose-500',
        packages: [
            {
                name: '30 Social Creatives',
                skuCode: 'B1-30SOC',
                price: 79,
                credits: 1800,
                duration: '~30 min processing',
                features: ['30 Instagram/Facebook ready images', 'Multiple formats (1:1, 4:5, 9:16)', 'Consistent brand style'],
                bestFor: 'Content creators and influencers posting daily'
            },
            {
                name: '90 Creatives + Captions',
                skuCode: 'B2-90SOC',
                price: 199,
                credits: 5400,
                duration: '~90 min processing',
                features: ['90 social media images', 'AI-written captions for each', 'Hashtag recommendations', 'Content calendar included'],
                bestFor: 'Brands managing multiple social accounts'
            }
        ]
    },
    {
        id: 'video-marketing',
        name: 'Video Marketing',
        icon: Zap,
        description: 'Engaging video content for ads and promos',
        gradient: 'from-violet-500 to-purple-500',
        packages: [
            {
                name: '15s Promo/Reel',
                skuCode: 'C1-15',
                price: 29,
                credits: 90,
                duration: '~2 min',
                features: ['Perfect for Instagram Reels', 'TikTok ready', 'Attention-grabbing opener', 'Mobile-optimized'],
                bestFor: 'Quick social promos and teasers'
            },
            {
                name: '30s Ad/UGC Clip',
                skuCode: 'C2-30',
                price: 59,
                credits: 180,
                duration: '~3 min',
                features: ['Professional ad format', 'UGC-style authenticity', 'Story-driven content', 'Call-to-action ready'],
                bestFor: 'Facebook/Instagram ads and stories'
            },
            {
                name: '60s Explainer/YouTube',
                skuCode: 'C3-60',
                price: 119,
                credits: 360,
                duration: '~6 min',
                features: ['Full explainer video', 'YouTube optimized', 'Professional narration', 'Educational format'],
                bestFor: 'Product demos and how-to content'
            }
        ]
    },
    {
        id: 'seo-content',
        name: 'SEO & Content Marketing',
        icon: Users,
        description: 'Drive organic traffic and establish authority',
        gradient: 'from-emerald-500 to-teal-500',
        packages: [
            {
                name: 'Content Starter (10 Articles)',
                skuCode: 'F1-STARTER',
                price: 49,
                credits: 1000,
                duration: 'Delivered in 48h',
                features: ['10 SEO-optimized articles', '10 featured images', 'Keyword research included', 'Meta descriptions'],
                bestFor: 'New blogs getting started with SEO'
            },
            {
                name: 'Authority Builder (40 Articles)',
                skuCode: 'F2-AUTH',
                price: 149,
                credits: 4000,
                duration: 'Delivered in 7 days',
                features: ['40 in-depth articles', 'Internal linking strategy', 'Topic cluster approach', 'Content calendar'],
                bestFor: 'Growing sites building topical authority'
            },
            {
                name: 'SEO Dominator (150 Articles)',
                skuCode: 'F3-DOMINATOR',
                price: 399,
                credits: 15000,
                duration: 'Delivered in 14 days',
                features: ['150 SEO articles', 'Complete content strategy', 'Competitor analysis', 'Rank tracking setup'],
                bestFor: 'Enterprises dominating their niche'
            }
        ]
    }
];

export function ServicesSection() {
    const [allSKUs, setAllSKUs] = useState<SKU[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        let isMounted = true;

        const loadServices = async () => {
            const result = await api.getSKUs();

            if (!isMounted) return;

            if (result.success && result.data) {
                setAllSKUs(result.data);
            } else {
                toast({
                    title: 'Unable to load services',
                    description: result.error || 'Please try again later.',
                    variant: 'destructive',
                });
            }

            setIsLoading(false);
        };

        loadServices();

        return () => {
            isMounted = false;
        };
    }, [toast]);

    const handleOrderNow = (skuCode?: string) => {
        if (!isAuthenticated) {
            navigate('/signup');
            return;
        }
        navigate('/create');
    };

    if (isLoading) {
        return (
            <section id="services" className="py-24 relative bg-muted/30">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section id="services" className="py-24 relative bg-muted/30">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />

            <div className="container mx-auto px-4 relative z-10">
                {/* Section Header */}
                <div className="text-center mb-20">
                    <motion.span
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-4"
                    >
                        Strategic Packages
                    </motion.span>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
                    >
                        Built for <span className="gradient-text">Your Success</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-muted-foreground text-lg max-w-3xl mx-auto"
                    >
                        From launching your brand to scaling your agency, we've packaged our AI services into strategic solutions for every business goal
                    </motion.p>
                </div>

                {/* Featured Flagship Packages */}
                <div className="mb-32">
                    <motion.h3
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-2xl font-bold text-center mb-12"
                    >
                        🔥 Flagship Bundles
                    </motion.h3>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                        {featuredPackages.map((pkg, index) => {
                            const Icon = pkg.icon;
                            return (
                                <motion.div
                                    key={pkg.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="glass-card p-8 hover:border-primary/50 transition-all group relative overflow-hidden"
                                >
                                    {/* Gradient background */}
                                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${pkg.gradient} opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-opacity`} />

                                    <div className="relative">
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${pkg.gradient} flex items-center justify-center`}>
                                                <Icon className="w-7 h-7 text-white" />
                                            </div>
                                            <div className="text-right">
                                                <div className="text-3xl font-bold text-primary">${pkg.price}</div>
                                                <div className="text-xs text-muted-foreground">one-time</div>
                                            </div>
                                        </div>

                                        {/* Title & Tagline */}
                                        <h4 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                                            {pkg.name}
                                        </h4>
                                        <p className="text-sm text-primary/80 font-medium mb-1">{pkg.target}</p>
                                        <p className="text-sm text-muted-foreground mb-6">{pkg.tagline}</p>

                                        {/* Includes */}
                                        <div className="space-y-2 mb-6">
                                            {pkg.includes.map((item, i) => (
                                                <div key={i} className="flex items-start gap-2 text-sm">
                                                    <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                                    <span className="text-muted-foreground">{item}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Ideal for */}
                                        <div className="p-3 rounded-lg bg-muted/50 mb-6">
                                            <p className="text-xs text-muted-foreground">
                                                <strong>Ideal for:</strong> {pkg.ideal}
                                            </p>
                                        </div>

                                        {/* CTA */}
                                        <Button
                                            variant="hero"
                                            className="w-full group-hover:shadow-glow transition-all"
                                            onClick={() => handleOrderNow(pkg.skuCode)}
                                        >
                                            Get Started
                                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Use Case Categories */}
                <div className="space-y-24">
                    {useCaseCategories.map((category, catIndex) => {
                        const Icon = category.icon;
                        return (
                            <motion.div
                                key={category.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: catIndex * 0.1 }}
                            >
                                {/* Category Header */}
                                <div className="flex items-center gap-4 mb-8">
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.gradient} flex items-center justify-center`}>
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-bold mb-1">{category.name}</h3>
                                        <p className="text-muted-foreground">{category.description}</p>
                                    </div>
                                </div>

                                {/* Packages Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {category.packages.map((pkg, pkgIndex) => (
                                        <motion.div
                                            key={pkg.skuCode}
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: pkgIndex * 0.05 }}
                                            className="glass-card p-6 hover:border-primary/50 transition-all group"
                                        >
                                            {/* Price & Name */}
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                                                        {pkg.name}
                                                    </h4>
                                                    <p className="text-xs text-muted-foreground font-mono">{pkg.skuCode}</p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-2xl font-bold text-primary">${pkg.price}</div>
                                                </div>
                                            </div>

                                            {/* Stats */}
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4 pb-4 border-b border-border">
                                                <span>{pkg.credits.toLocaleString()} credits</span>
                                                <span>•</span>
                                                <span>{pkg.duration}</span>
                                            </div>

                                            {/* Features */}
                                            <div className="space-y-2 mb-4">
                                                {pkg.features.map((feature, i) => (
                                                    <div key={i} className="flex items-start gap-2 text-xs">
                                                        <Check className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                                                        <span className="text-muted-foreground">{feature}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Best For */}
                                            <div className="p-2 rounded-md bg-primary/10 mb-4">
                                                <p className="text-xs text-primary font-medium">
                                                    ✨ {pkg.bestFor}
                                                </p>
                                            </div>

                                            {/* CTA */}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                                                onClick={() => handleOrderNow(pkg.skuCode)}
                                            >
                                                Order Now
                                                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                            </Button>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* CTA Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mt-20 p-12 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20"
                >
                    <h3 className="text-2xl font-bold mb-4">Need a Custom Solution?</h3>
                    <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                        We can create custom packages tailored to your specific needs. Whether you're an enterprise, agency, or have unique requirements, let's build the perfect solution together.
                    </p>
                    <Button
                        variant="hero"
                        size="lg"
                        onClick={() => handleOrderNow()}
                    >
                        {isAuthenticated ? 'Create Custom Order' : 'Get Started Free'}
                    </Button>
                </motion.div>
            </div>
        </section>
    );
}
