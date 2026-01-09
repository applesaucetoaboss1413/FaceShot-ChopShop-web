import { motion } from 'framer-motion';
import { Repeat, User, Video, Wand2, Image, Sparkles, Zap, Clock } from 'lucide-react';

interface CreditCost {
  tool: string;
  icon: any;
  credits: number;
  time: string;
  costEquivalent: string;
  description: string;
  gradient: string;
}

const creditCosts: CreditCost[] = [
  {
    tool: 'Face Swap',
    icon: Repeat,
    credits: 100,
    time: '20-30 seconds',
    costEquivalent: '$0.50',
    description: 'Seamlessly swap faces between photos',
    gradient: 'from-cyan-500 to-blue-500',
  },
  {
    tool: 'AI Avatar',
    icon: User,
    credits: 150,
    time: '45-60 seconds',
    costEquivalent: '$0.75',
    description: 'Generate unique AI avatars in multiple styles',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    tool: 'Image to Video',
    icon: Video,
    credits: 500,
    time: '2-5 minutes',
    costEquivalent: '$2.50',
    description: 'Convert static images into animated videos',
    gradient: 'from-orange-500 to-red-500',
  },
  {
    tool: 'Image Enhancement',
    icon: Sparkles,
    credits: 75,
    time: '15-20 seconds',
    costEquivalent: '$0.38',
    description: 'AI-powered upscaling and enhancement',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    tool: 'Background Remove',
    icon: Image,
    credits: 50,
    time: '10-15 seconds',
    costEquivalent: '$0.25',
    description: 'Remove backgrounds with precision',
    gradient: 'from-yellow-500 to-orange-500',
  },
  {
    tool: 'Style Transfer',
    icon: Wand2,
    credits: 200,
    time: '30-45 seconds',
    costEquivalent: '$1.00',
    description: 'Apply artistic styles to your images',
    gradient: 'from-indigo-500 to-purple-500',
  },
];

export function CreditExplainerSection() {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-4"
          >
            Pricing Transparency
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
          >
            How <span className="gradient-text">Credits Work</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg max-w-3xl mx-auto"
          >
            Simple, transparent pricing. Each tool costs a different amount based on processing complexity. 
            Credits never expire and work across all 21 tools.
          </motion.p>
        </div>

        {/* Desktop Table View */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="hidden lg:block max-w-6xl mx-auto mb-12"
        >
          <div className="glass-card overflow-hidden rounded-2xl">
            {/* Table Header */}
            <div className="bg-primary/5 border-b border-border px-6 py-4">
              <div className="grid grid-cols-5 gap-4 text-sm font-semibold">
                <div>Tool</div>
                <div className="text-center">Credits Required</div>
                <div className="text-center">Processing Time</div>
                <div className="text-center">Cost Equivalent</div>
                <div>Description</div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-border">
              {creditCosts.map((item, index) => (
                <motion.div
                  key={item.tool}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="px-6 py-4 hover:bg-primary/5 transition-colors"
                >
                  <div className="grid grid-cols-5 gap-4 items-center">
                    {/* Tool Name */}
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center flex-shrink-0`}>
                        <item.icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-semibold">{item.tool}</span>
                    </div>

                    {/* Credits */}
                    <div className="text-center">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                        <Zap className="w-4 h-4 text-primary" />
                        <span className="font-bold text-primary">{item.credits}</span>
                      </div>
                    </div>

                    {/* Time */}
                    <div className="text-center">
                      <div className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{item.time}</span>
                      </div>
                    </div>

                    {/* Cost */}
                    <div className="text-center">
                      <span className="text-lg font-bold gradient-text">{item.costEquivalent}</span>
                    </div>

                    {/* Description */}
                    <div className="text-sm text-muted-foreground">
                      {item.description}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Mobile Card View */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12"
        >
          {creditCosts.map((item, index) => (
            <motion.div
              key={item.tool}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="glass-card p-5"
            >
              {/* Icon and Tool Name */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center flex-shrink-0`}>
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-lg">{item.tool}</div>
                  <div className="text-sm text-muted-foreground">{item.description}</div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Zap className="w-3 h-3 text-primary" />
                    <span className="text-lg font-bold text-primary">{item.credits}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">Credits</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold gradient-text mb-1">{item.costEquivalent}</div>
                  <div className="text-xs text-muted-foreground">Cost</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Clock className="w-3 h-3" />
                    <span className="text-sm font-semibold">{item.time.split(' ')[0]}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">Time</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Key Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Credits Never Expire</h3>
              <p className="text-sm text-muted-foreground">
                Use your credits anytime. No pressure, no rush. They're yours forever.
              </p>
            </div>

            <div className="glass-card p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">All 21 Tools Included</h3>
              <p className="text-sm text-muted-foreground">
                One credit system works across every tool. Maximum flexibility.
              </p>
            </div>

            <div className="glass-card p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Wand2 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Volume Discounts</h3>
              <p className="text-sm text-muted-foreground">
                Buy more credits, pay less per credit. Up to 40% savings on bundles.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Value Proposition */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center"
        >
          <div className="glass-card p-8 max-w-3xl mx-auto border-primary/30">
            <h3 className="text-2xl font-bold mb-4">
              Why Credits? <span className="gradient-text">It's Simple</span>
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Unlike subscriptions that limit you to specific tools or force monthly payments, 
              our credit system gives you complete freedom. Buy once, use forever. Mix and match 
              any tools you want. Scale up or down as needed. No wasted money on unused subscriptions.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <span className="px-4 py-2 rounded-full bg-primary/10 text-primary font-medium">
                ✓ Pay-as-you-go
              </span>
              <span className="px-4 py-2 rounded-full bg-primary/10 text-primary font-medium">
                ✓ No subscriptions
              </span>
              <span className="px-4 py-2 rounded-full bg-primary/10 text-primary font-medium">
                ✓ No hidden fees
              </span>
              <span className="px-4 py-2 rounded-full bg-primary/10 text-primary font-medium">
                ✓ 100% transparent
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
