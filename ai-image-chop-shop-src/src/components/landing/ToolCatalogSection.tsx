import { motion } from 'framer-motion';
import { Image, Video, Mic, FileText, Package, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

// Tool catalog organized by category (from sku-tool-catalog.js)
const toolCategories = {
  image: {
    name: 'Image Generation & Editing',
    icon: Image,
    gradient: 'from-cyan-500 to-blue-500',
    tools: [
      {
        code: 'A1-IG',
        name: 'Instagram Image 1080p',
        description: 'Create stunning social media images optimized for Instagram, Facebook, and TikTok',
        icon: '📸',
        credits: 'From 1 credit',
      },
      {
        code: 'A2-BH',
        name: 'Blog Hero 2K',
        description: 'Generate eye-catching 2K blog headers that boost reader engagement',
        icon: '🖼️',
        credits: 'From 2 credits',
      },
      {
        code: 'A3-4K',
        name: '4K Print-Ready',
        description: 'Transform images into ultra-high-resolution 4K quality for professional printing',
        icon: '🎨',
        credits: 'From 3 credits',
      },
      {
        code: 'A4-BR',
        name: 'Brand-Styled Image',
        description: 'Apply your unique brand identity to images with custom colors and styles',
        icon: '🏢',
        credits: 'From 2 credits',
      },
    ],
  },
  video: {
    name: 'Video Creation',
    icon: Video,
    gradient: 'from-orange-500 to-red-500',
    tools: [
      {
        code: 'C1-15',
        name: '15s Promo/Reel',
        description: 'Create viral-worthy 15-second reels and TikTok videos',
        icon: '🎬',
        credits: '~300 credits',
      },
      {
        code: 'C2-30',
        name: '30s Ad/UGC Clip',
        description: 'Produce authentic 30-second promotional videos',
        icon: '📹',
        credits: '~600 credits',
      },
      {
        code: 'C3-60',
        name: '60s Explainer/YouTube',
        description: 'Craft compelling 60-second explainer videos and YouTube shorts',
        icon: '🎥',
        credits: '~1,200 credits',
      },
    ],
  },
  voice: {
    name: 'Voice & Audio',
    icon: Mic,
    gradient: 'from-purple-500 to-pink-500',
    tools: [
      {
        code: 'D1-VO30',
        name: '30s Voiceover',
        description: 'Generate broadcast-quality 30-second voiceovers',
        icon: '🎙️',
        credits: '~150 credits',
      },
      {
        code: 'D2-CLONE',
        name: 'Standard Voice Clone',
        description: 'Clone any voice with standard quality',
        icon: '🗣️',
        credits: '~500 credits',
      },
      {
        code: 'D3-CLPRO',
        name: 'Advanced Voice Clone',
        description: 'Professional-grade voice cloning with emotion control',
        icon: '🎤',
        credits: '~1,000 credits',
      },
      {
        code: 'D4-5PK',
        name: '5x30s Voice Spots',
        description: 'Bulk create five 30-second voice spots',
        icon: '📻',
        credits: '~750 credits',
      },
    ],
  },
  content: {
    name: 'SEO Content',
    icon: FileText,
    gradient: 'from-green-500 to-emerald-500',
    tools: [
      {
        code: 'F1-STARTER',
        name: '10 SEO Articles + Images',
        description: 'Kickstart your content strategy with SEO-optimized articles',
        icon: '📝',
        credits: '~2,000 credits',
      },
      {
        code: 'F2-AUTH',
        name: '40 SEO Articles + Linking',
        description: 'Build topical authority with interconnected SEO articles',
        icon: '🔗',
        credits: '~8,000 credits',
      },
      {
        code: 'F3-DOMINATOR',
        name: '150 Articles + Strategy',
        description: 'Dominate your niche with premium SEO content',
        icon: '👑',
        credits: '~30,000 credits',
      },
    ],
  },
  bundle: {
    name: 'Multi-Modal Bundles',
    icon: Package,
    gradient: 'from-yellow-500 to-orange-500',
    tools: [
      {
        code: 'B1-30SOC',
        name: '30 Social Creatives',
        description: 'Supercharge your social media with 30 platform-optimized images',
        icon: '📱',
        credits: '~1,500 credits',
      },
      {
        code: 'B2-90SOC',
        name: '90 Creatives + Captions',
        description: 'Complete 3-month social media solution with AI-generated captions',
        icon: '💬',
        credits: '~4,500 credits',
      },
      {
        code: 'E1-ECOM25',
        name: 'E-commerce Pack (25 SKUs)',
        description: 'Launch your online store with 75 professional product images',
        icon: '🛒',
        credits: '~3,750 credits',
      },
      {
        code: 'E2-LAUNCHKIT',
        name: 'Brand Launch Kit',
        description: 'Complete brand assets: logo, banners, social graphics, video intro',
        icon: '🚀',
        credits: '~5,000 credits',
      },
      {
        code: 'E3-AGENCY100',
        name: 'Agency Asset Bank (100 assets)',
        description: 'Empower your agency with 100 premium mixed-media assets',
        icon: '💼',
        credits: '~10,000 credits',
      },
    ],
  },
};

export function ToolCatalogSection() {
  const totalTools = Object.values(toolCategories).reduce(
    (sum, category) => sum + category.tools.length,
    0
  );

  return (
    <section id="tools" className="py-24 relative">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-4"
          >
            Complete Tool Suite
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
          >
            <span className="gradient-text">{totalTools} Professional Tools</span>
            <br />
            All in One Platform
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg max-w-3xl mx-auto"
          >
            From image generation to video creation, voice cloning to SEO content - everything you need to create professional content at scale.
          </motion.p>
        </div>

        {/* Tool Categories */}
        <div className="space-y-16">
          {Object.entries(toolCategories).map(([categoryKey, category], categoryIndex) => (
            <motion.div
              key={categoryKey}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ delay: categoryIndex * 0.1 }}
            >
              {/* Category Header */}
              <div className="flex items-center gap-4 mb-8">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.gradient} flex items-center justify-center`}>
                  <category.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{category.name}</h3>
                  <p className="text-muted-foreground text-sm">
                    {category.tools.length} {category.tools.length === 1 ? 'tool' : 'tools'} available
                  </p>
                </div>
              </div>

              {/* Tools Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.tools.map((tool, toolIndex) => (
                  <motion.div
                    key={tool.code}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: toolIndex * 0.05 }}
                    className="group glass-card p-6 hover:border-primary/30 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-3xl">{tool.icon}</span>
                      <Badge variant="secondary" className="text-xs">
                        {tool.code}
                      </Badge>
                    </div>
                    <h4 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                      {tool.name}
                    </h4>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {tool.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-primary">{tool.credits}</span>
                      <Link to="/signup" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" className="h-8 text-xs">
                          Try Now
                          <ChevronRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="glass-card p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">
              Ready to Access All {totalTools} Tools?
            </h3>
            <p className="text-muted-foreground mb-6">
              Start with our free tier and get 100 credits to try any tool. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button variant="hero" size="lg">
                  Start Free Trial
                </Button>
              </Link>
              <Link to="#pricing">
                <Button variant="outline" size="lg">
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
