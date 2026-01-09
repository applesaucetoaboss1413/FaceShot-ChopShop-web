import { motion } from 'framer-motion';
import { Monitor, Smartphone, MessageSquare, Zap, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Platform {
  name: string;
  icon: any;
  description: string;
  features: string[];
  gradient: string;
  link?: string;
}

const platforms: Platform[] = [
  {
    name: 'Web Platform',
    icon: Monitor,
    description: 'Full-featured desktop experience',
    features: [
      'Fastest processing',
      'All 21 tools available',
      'Bulk upload support',
      'Advanced settings',
      'Team collaboration',
    ],
    gradient: 'from-cyan-500 to-blue-500',
    link: '/dashboard',
  },
  {
    name: 'Mobile Web',
    icon: Smartphone,
    description: 'Responsive on any device',
    features: [
      'Works on any phone',
      'Touch-optimized UI',
      'Upload from gallery',
      'Quick results',
      'Save to device',
    ],
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    name: 'Telegram Bot',
    icon: MessageSquare,
    description: 'Transform on-the-go',
    features: [
      'No app install needed',
      'Works in Telegram',
      'Instant processing',
      'Share directly',
      'Perfect for mobile',
    ],
    gradient: 'from-blue-500 to-indigo-500',
    link: 'https://t.me/your_bot',
  },
];

export function PlatformAccessSection() {
  return (
    <section className="py-24 relative bg-gradient-to-b from-transparent via-primary/5 to-transparent">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-4"
          >
            Multi-Platform Access
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
          >
            Access FaceShot-ChopShop <span className="gradient-text">Anywhere</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
          >
            Choose the platform that fits your workflow. Desktop power, mobile convenience, or Telegram simplicity.
          </motion.p>
        </div>

        {/* Platform Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
          {platforms.map((platform, index) => (
            <motion.div
              key={platform.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-6 hover:border-primary/30 transition-all duration-300 group"
            >
              {/* Icon */}
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${platform.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <platform.icon className="w-8 h-8 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-2xl font-bold mb-2">{platform.name}</h3>
              <p className="text-muted-foreground mb-6">{platform.description}</p>

              {/* Features List */}
              <ul className="space-y-2 mb-6">
                {platform.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Zap className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              {platform.link && (
                <a href={platform.link} target={platform.link.startsWith('http') ? '_blank' : undefined} rel={platform.link.startsWith('http') ? 'noopener noreferrer' : undefined}>
                  <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {platform.name === 'Telegram Bot' ? 'Open Bot' : 'Get Started'}
                  </Button>
                </a>
              )}
            </motion.div>
          ))}
        </div>

        {/* When to Use Each Platform */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <div className="glass-card p-8 border-primary/30">
            <h3 className="text-xl font-bold text-center mb-6 flex items-center justify-center gap-2">
              <Globe className="w-6 h-6 text-primary" />
              Choose the Right Platform for Your Needs
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-primary" />
                  Web Platform
                </h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Professional work</li>
                  <li>• Batch processing</li>
                  <li>• Team projects</li>
                  <li>• Advanced features</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-primary" />
                  Mobile Web
                </h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• On-the-go edits</li>
                  <li>• Quick uploads</li>
                  <li>• Social media posts</li>
                  <li>• Travel work</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  Telegram Bot
                </h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Instant results</li>
                  <li>• No login needed</li>
                  <li>• Group sharing</li>
                  <li>• Chat integration</li>
                </ul>
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
            <div className="text-2xl font-bold gradient-text mb-1">3</div>
            <div className="text-xs text-muted-foreground">Platforms</div>
          </div>
          <div className="text-center p-4 glass-card">
            <div className="text-2xl font-bold gradient-text mb-1">1</div>
            <div className="text-xs text-muted-foreground">Account</div>
          </div>
          <div className="text-center p-4 glass-card">
            <div className="text-2xl font-bold gradient-text mb-1">∞</div>
            <div className="text-xs text-muted-foreground">Devices</div>
          </div>
          <div className="text-center p-4 glass-card">
            <div className="text-2xl font-bold gradient-text mb-1">24/7</div>
            <div className="text-xs text-muted-foreground">Access</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
