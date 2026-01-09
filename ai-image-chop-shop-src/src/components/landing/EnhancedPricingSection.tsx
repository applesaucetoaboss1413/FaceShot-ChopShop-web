import { motion } from 'framer-motion';
import { Check, Zap, Package, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useState } from 'react';

const subscriptionPlans = [
  {
    name: 'Starter',
    price: 19.99,
    credits: 4000,
    description: 'Perfect for occasional creators',
    videoMinutes: '~10 minutes',
    features: [
      '4,000 credits/month',
      '~40 face swaps',
      '~8 image-to-video',
      'All AI tools included',
      'Standard quality',
      'Email support',
    ],
    popular: false,
    bestFor: 'Hobbyists & Side Projects',
  },
  {
    name: 'Pro',
    price: 79.99,
    credits: 20000,
    description: 'Best for regular creators',
    videoMinutes: '~50 minutes',
    features: [
      '20,000 credits/month',
      '~200 face swaps',
      '~40 image-to-video',
      'Priority processing',
      'HD quality output',
      'Priority support',
      'API access',
    ],
    popular: true,
    bestFor: 'Content Creators & Freelancers',
  },
  {
    name: 'Agency',
    price: 199,
    credits: 60000,
    description: 'For teams and agencies',
    videoMinutes: '~150 minutes',
    features: [
      '60,000 credits/month',
      'Unlimited face swaps',
      'Unlimited videos',
      'Fastest processing',
      '4K quality output',
      'Dedicated support',
      'Custom integrations',
      'Team collaboration',
    ],
    popular: false,
    bestFor: 'Agencies & Heavy Users',
  },
];

const oneTimeBundles = [
  {
    name: 'E-commerce Pack',
    price: 225,
    credits: 45000,
    description: 'One-time purchase',
    savings: '50% OFF',
    features: [
      '45,000 credits (one-time)',
      '~450 face swaps',
      '~90 image-to-video',
      'Credits never expire',
      'All tools included',
      'Perfect for product shoots',
    ],
    popular: false,
    bestFor: 'Online Stores',
  },
  {
    name: 'Brand Launch',
    price: 449,
    credits: 100000,
    description: 'One-time purchase',
    savings: 'BEST VALUE',
    features: [
      '100,000 credits (one-time)',
      '~1,000 face swaps',
      '~200 image-to-video',
      'Credits never expire',
      'Priority support',
      'Perfect for campaigns',
    ],
    popular: true,
    bestFor: 'Marketing Campaigns',
  },
  {
    name: 'Agency Asset Bank',
    price: 599,
    credits: 150000,
    description: 'One-time purchase',
    savings: '60% OFF',
    features: [
      '150,000 credits (one-time)',
      'Unlimited possibilities',
      'Bulk content creation',
      'Credits never expire',
      'Dedicated account manager',
      'Custom workflow setup',
    ],
    popular: false,
    bestFor: 'Large Teams',
  },
];

export function EnhancedPricingSection() {
  const [pricingType, setPricingType] = useState<'subscription' | 'bundle'>('subscription');

  const currentPlans = pricingType === 'subscription' ? subscriptionPlans : oneTimeBundles;

  return (
    <section id="pricing" className="py-24 relative">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-4"
          >
            Pricing
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
          >
            Choose Your <span className="gradient-text">Perfect Plan</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
          >
            Flexible pricing that grows with you. Choose monthly subscriptions or one-time bundles.
          </motion.p>
        </div>

        {/* Pricing Type Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="flex justify-center mb-12"
        >
          <div className="glass-card p-1 inline-flex rounded-full">
            <button
              onClick={() => setPricingType('subscription')}
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all ${
                pricingType === 'subscription'
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              Monthly Subscriptions
            </button>
            <button
              onClick={() => setPricingType('bundle')}
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all ${
                pricingType === 'bundle'
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Package className="w-4 h-4" />
              One-Time Bundles
            </button>
          </div>
        </motion.div>

        {/* Best For Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <span className="text-sm font-medium text-primary">
              {pricingType === 'subscription' 
                ? '💼 Best for: Ongoing content creation & regular use' 
                : '🎯 Best for: One-time projects & bulk content needs'}
            </span>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
          {currentPlans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative glass-card p-8 ${
                plan.popular 
                  ? 'border-primary/50 shadow-glow scale-105 md:scale-110' 
                  : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                    <Zap className="w-3 h-3" />
                    Most Popular
                  </span>
                </div>
              )}

              {/* Savings Badge */}
              {'savings' in plan && plan.savings && (
                <div className="absolute -top-4 right-4">
                  <span className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-semibold">
                    {plan.savings}
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">
                    {pricingType === 'subscription' ? '/month' : 'one-time'}
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-primary font-semibold">
                    {plan.credits.toLocaleString()} Credits
                  </div>
                  {'videoMinutes' in plan && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {plan.videoMinutes} of video
                    </div>
                  )}
                </div>
                <div className="mt-3 text-xs font-medium text-primary/80">
                  {plan.bestFor}
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link to="/signup">
                <Button 
                  variant={plan.popular ? 'hero' : 'outline'} 
                  className="w-full"
                >
                  Get Started
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Comparison Helper */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="glass-card p-6 border-primary/30">
            <h3 className="text-lg font-semibold text-center mb-4">
              💡 Which option is right for you?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-primary" />
                  Choose Subscriptions if:
                </h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• You create content regularly</li>
                  <li>• You need ongoing access to tools</li>
                  <li>• You prefer predictable monthly costs</li>
                  <li>• You want priority processing & support</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  Choose Bundles if:
                </h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• You have a specific project or campaign</li>
                  <li>• You want credits that never expire</li>
                  <li>• You prefer one-time payment (no recurring)</li>
                  <li>• You need bulk content creation</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-muted-foreground text-sm mt-12"
        >
          All plans include a 7-day money-back guarantee. No questions asked. Cancel anytime.
        </motion.p>
      </div>
    </section>
  );
}
