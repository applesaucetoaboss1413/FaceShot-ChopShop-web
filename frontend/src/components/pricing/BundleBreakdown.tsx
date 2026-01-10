import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, ChevronUp, Package, Image, Video, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { displayCredits } from '@/lib/priceConverter';

interface Tool {
  name: string;
  credits: number;
  quantity: number;
  description: string;
}

interface BundleSpec {
  id: string;
  name: string;
  credits: number;
  totalCredits: number;
  tools: Tool[];
  outputs: {
    images?: number;
    videos?: number;
    articles?: number;
  };
  specifications: string[];
  examples: string[];
}

const bundleSpecs: BundleSpec[] = [
  {
    id: 'ecommerce',
    name: 'E-commerce Pack',
    credits: 22500,
    totalCredits: 22500,
    tools: [
      { name: 'Product Images (1080p)', credits: 100, quantity: 75, description: '3 angles per SKU for 25 products' },
      { name: 'Brand-Styled Images', credits: 150, quantity: 25, description: 'Custom branded visuals' },
      { name: 'Instagram Images', credits: 50, quantity: 50, description: 'Social media ready posts' }
    ],
    outputs: {
      images: 150
    },
    specifications: [
      '75 product photos (3 per SKU)',
      '25 branded marketing images',
      '50 social media posts',
      'White background standard',
      'Multi-angle coverage',
      'E-commerce optimized'
    ],
    examples: [
      'Shopify product galleries',
      'Amazon listing images',
      'Instagram shop posts',
      'Facebook marketplace listings'
    ]
  },
  {
    id: 'brand-launch',
    name: 'Brand Launch Kit',
    credits: 44900,
    totalCredits: 44900,
    tools: [
      { name: 'Logo & Banner Design', credits: 500, quantity: 5, description: 'Complete brand identity' },
      { name: 'Social Post Bundle', credits: 150, quantity: 90, description: '3 months of content' },
      { name: 'Video Intro (30s)', credits: 300, quantity: 3, description: 'Brand intro videos' },
      { name: 'Blog Headers (2K)', credits: 100, quantity: 20, description: 'Website graphics' }
    ],
    outputs: {
      images: 115,
      videos: 3
    },
    specifications: [
      '5 logo variations & banners',
      '90 social media posts (30/month)',
      '3 brand intro videos (30s each)',
      '20 blog hero images',
      'Cohesive brand styling',
      'Multi-platform formats'
    ],
    examples: [
      'Startup brand identity',
      'Social media presence',
      'Website visual assets',
      'Marketing campaign materials'
    ]
  },
  {
    id: 'agency',
    name: 'Agency Asset Bank',
    credits: 59900,
    totalCredits: 59900,
    tools: [
      { name: 'Mixed Image Assets', credits: 150, quantity: 100, description: 'Various image types' },
      { name: 'Video Content (15-60s)', credits: 400, quantity: 20, description: 'Promotional videos' },
      { name: 'SEO Articles', credits: 200, quantity: 40, description: 'Blog content with images' },
      { name: 'Voice Spots (30s)', credits: 100, quantity: 10, description: 'Audio content' }
    ],
    outputs: {
      images: 100,
      videos: 20,
      articles: 40
    },
    specifications: [
      '100 premium image assets',
      '20 video clips (15-60s)',
      '40 SEO-optimized articles',
      '10 voiceover spots (30s)',
      'Commercial licensing',
      'White-label ready'
    ],
    examples: [
      'Client campaign materials',
      'Content marketing packages',
      'Multi-channel campaigns',
      'Agency portfolio assets'
    ]
  }
];

export function BundleBreakdown() {
  const [expandedBundle, setExpandedBundle] = useState<string | null>(null);

  const toggleBundle = (id: string) => {
    setExpandedBundle(expandedBundle === id ? null : id);
  };

  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-4"
          >
            Bundle Breakdown
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-bold mb-4"
          >
            What's Included in Each <span className="gradient-text">Bundle</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
          >
            Detailed breakdown of tools, credits, and outputs per bundle
          </motion.p>
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
          {bundleSpecs.map((bundle, index) => (
            <motion.div
              key={bundle.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="overflow-hidden hover:border-primary/30 transition-colors">
                <CardHeader
                  className="cursor-pointer"
                  onClick={() => toggleBundle(bundle.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                        <Package className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-xl mb-1">{bundle.name}</CardTitle>
                        <CardDescription className="text-base">
                          {displayCredits(bundle.credits)} • {bundle.totalCredits.toLocaleString()} Credits
                        </CardDescription>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      {expandedBundle === bundle.id ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </Button>
                  </div>

                  {/* Summary Stats */}
                  <div className="flex gap-4 mt-4 flex-wrap">
                    {bundle.outputs.images && (
                      <div className="flex items-center gap-2 text-sm">
                        <Image className="w-4 h-4 text-primary" />
                        <span className="font-medium">{bundle.outputs.images} Images</span>
                      </div>
                    )}
                    {bundle.outputs.videos && (
                      <div className="flex items-center gap-2 text-sm">
                        <Video className="w-4 h-4 text-primary" />
                        <span className="font-medium">{bundle.outputs.videos} Videos</span>
                      </div>
                    )}
                    {bundle.outputs.articles && (
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4 text-primary" />
                        <span className="font-medium">{bundle.outputs.articles} Articles</span>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <AnimatePresence>
                  {expandedBundle === bundle.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <CardContent className="pt-0 space-y-6">
                        {/* Tools Breakdown */}
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <span className="w-1 h-4 bg-primary rounded" />
                            Tools & Credits Allocation
                          </h4>
                          <div className="space-y-2">
                            {bundle.tools.map((tool, idx) => (
                              <div
                                key={idx}
                                className="flex items-start justify-between p-3 rounded-lg bg-muted/50"
                              >
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{tool.name}</div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {tool.description}
                                  </div>
                                </div>
                                <div className="text-right ml-4">
                                  <div className="font-semibold text-sm">{tool.quantity}x</div>
                                  <div className="text-xs text-muted-foreground">
                                    {tool.credits} credits each
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Specifications */}
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <span className="w-1 h-4 bg-primary rounded" />
                            What You Get
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {bundle.specifications.map((spec, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-sm">
                                <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                <span>{spec}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Use Case Examples */}
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <span className="w-1 h-4 bg-primary rounded" />
                            Perfect For
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {bundle.examples.map((example, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium"
                              >
                                {example}
                              </span>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Interactive Calculator Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-muted-foreground mb-4">
            Need help choosing the right bundle?
          </p>
          <Button variant="outline" size="lg">
            Use Bundle Calculator
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
