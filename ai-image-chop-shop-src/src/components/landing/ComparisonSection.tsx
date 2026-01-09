import { motion } from 'framer-motion';
import { Check, X, Crown } from 'lucide-react';

interface ComparisonFeature {
  feature: string;
  faceshot: boolean | string;
  competitor: boolean | string;
  highlight?: boolean;
}

const comparisonFeatures: ComparisonFeature[] = [
  {
    feature: 'Number of AI Tools',
    faceshot: '21 Tools',
    competitor: '3-5 Tools',
    highlight: true,
  },
  {
    feature: 'Uncensored Content',
    faceshot: true,
    competitor: false,
    highlight: true,
  },
  {
    feature: 'Private & Secure',
    faceshot: 'Auto-delete 24h',
    competitor: 'Data stored',
  },
  {
    feature: 'Pricing Model',
    faceshot: 'Pay-as-you-go',
    competitor: 'Subscription only',
    highlight: true,
  },
  {
    feature: 'Credits Expire',
    faceshot: false,
    competitor: true,
  },
  {
    feature: 'API Access',
    faceshot: 'Pro & Enterprise',
    competitor: 'Enterprise only',
  },
  {
    feature: 'Processing Speed',
    faceshot: '20-30 seconds',
    competitor: '1-3 minutes',
  },
  {
    feature: 'Multi-Platform',
    faceshot: 'Web, Mobile, Telegram',
    competitor: 'Web only',
  },
  {
    feature: 'Output Quality',
    faceshot: 'Up to 4K',
    competitor: 'HD only',
  },
  {
    feature: 'Batch Processing',
    faceshot: true,
    competitor: false,
  },
  {
    feature: 'Commercial License',
    faceshot: 'All plans',
    competitor: 'Pro+ only',
  },
  {
    feature: 'Money-Back Guarantee',
    faceshot: '7 days',
    competitor: 'None',
  },
];

export function ComparisonSection() {
  const renderValue = (value: boolean | string) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="w-6 h-6 text-green-500 mx-auto" />
      ) : (
        <X className="w-6 h-6 text-red-500 mx-auto" />
      );
    }
    return <span className="text-sm font-medium">{value}</span>;
  };

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
            Comparison
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
          >
            Why Choose <span className="gradient-text">FaceShot-ChopShop?</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
          >
            See how we stack up against generic AI tools. More features, better pricing, complete privacy.
          </motion.p>
        </div>

        {/* Comparison Table - Desktop */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="hidden md:block max-w-4xl mx-auto"
        >
          <div className="glass-card overflow-hidden rounded-2xl">
            {/* Table Header */}
            <div className="grid grid-cols-3 gap-4 bg-primary/5 border-b border-border p-6">
              <div className="text-left">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase">Feature</h3>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground">
                  <Crown className="w-4 h-4" />
                  <span className="text-sm font-bold">FaceShot-ChopShop</span>
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-sm font-semibold text-muted-foreground">Generic AI Tool</h3>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-border">
              {comparisonFeatures.map((item, index) => (
                <motion.div
                  key={item.feature}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.03 }}
                  className={`grid grid-cols-3 gap-4 p-6 hover:bg-primary/5 transition-colors ${
                    item.highlight ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="text-left flex items-center">
                    <span className={`text-sm ${item.highlight ? 'font-semibold' : ''}`}>
                      {item.feature}
                    </span>
                  </div>
                  <div className="text-center flex items-center justify-center">
                    {renderValue(item.faceshot)}
                  </div>
                  <div className="text-center flex items-center justify-center text-muted-foreground">
                    {renderValue(item.competitor)}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Comparison Cards - Mobile */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="md:hidden space-y-4"
        >
          {comparisonFeatures.map((item, index) => (
            <motion.div
              key={item.feature}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className={`glass-card p-5 ${item.highlight ? 'border-primary/30' : ''}`}
            >
              <h4 className="font-semibold mb-3">{item.feature}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-2">FaceShot-ChopShop</div>
                  <div className="flex items-center justify-start">
                    {renderValue(item.faceshot)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-2">Generic AI Tool</div>
                  <div className="flex items-center justify-start text-muted-foreground">
                    {renderValue(item.competitor)}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Key Advantages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <div className="glass-card p-8 border-primary/30">
            <h3 className="text-2xl font-bold text-center mb-6">
              Our <span className="gradient-text">Competitive Edge</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Check className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">21 AI Tools, One Platform</h4>
                  <p className="text-sm text-muted-foreground">
                    Most competitors offer 3-5 tools. We provide a complete AI content creation suite.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Check className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">True Privacy First</h4>
                  <p className="text-sm text-muted-foreground">
                    Auto-delete within 24 hours. No data storage, no training on your images.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Check className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Flexible Pricing</h4>
                  <p className="text-sm text-muted-foreground">
                    Choose monthly subscriptions or one-time bundles. Credits never expire.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Check className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Lightning Fast</h4>
                  <p className="text-sm text-muted-foreground">
                    2-3x faster processing than competitors. Get results in seconds, not minutes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto"
        >
          <div className="text-center p-4 glass-card">
            <div className="text-2xl font-bold gradient-text mb-1">3x</div>
            <div className="text-xs text-muted-foreground">More Tools</div>
          </div>
          <div className="text-center p-4 glass-card">
            <div className="text-2xl font-bold gradient-text mb-1">2x</div>
            <div className="text-xs text-muted-foreground">Faster Speed</div>
          </div>
          <div className="text-center p-4 glass-card">
            <div className="text-2xl font-bold gradient-text mb-1">40%</div>
            <div className="text-xs text-muted-foreground">Cost Savings</div>
          </div>
          <div className="text-center p-4 glass-card">
            <div className="text-2xl font-bold gradient-text mb-1">100%</div>
            <div className="text-xs text-muted-foreground">Privacy</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
