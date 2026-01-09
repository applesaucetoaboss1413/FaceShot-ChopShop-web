import { motion } from 'framer-motion';
import { Check, Calculator, Package, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { Link } from 'react-router-dom';

// Bundle specifications with detailed breakdowns
const bundles = [
  {
    id: 'ecommerce',
    name: 'E-commerce Pack',
    price: 225,
    credits: 45000,
    bestFor: 'Online Stores & Product Photography',
    icon: '🛒',
    gradient: 'from-blue-500 to-cyan-500',
    tools: [
      { name: 'Face Swap', operations: '~450 swaps', credits: 45000, costPer: 100 },
      { name: 'AI Avatars', operations: '~150 avatar sets', credits: 45000, costPer: 300 },
      { name: 'Image Enhancement', operations: '~225 enhancements', credits: 45000, costPer: 200 },
      { name: 'Image to Video', operations: '~9 videos (15s each)', credits: 45000, costPer: 5000 },
      { name: 'Product Photography', operations: '~75 product shots', credits: 45000, costPer: 600 },
    ],
    outputs: {
      quality: 'HD (1080p)',
      formats: 'JPG, PNG, MP4',
      resolution: 'Up to 2K',
      deliveryTime: '2-5 minutes per asset',
    },
    useCases: [
      'Create 75 product images (3 angles × 25 SKUs)',
      'Generate lifestyle photography for listings',
      'Batch process product backgrounds',
      'Create promotional video clips',
    ],
  },
  {
    id: 'brand-launch',
    name: 'Brand Launch Kit',
    price: 449,
    credits: 100000,
    bestFor: 'New Brands & Marketing Campaigns',
    icon: '🚀',
    gradient: 'from-purple-500 to-pink-500',
    tools: [
      { name: 'Face Swap', operations: '~1,000 swaps', credits: 100000, costPer: 100 },
      { name: 'AI Avatars', operations: '~333 avatar sets', credits: 100000, costPer: 300 },
      { name: 'Image to Video', operations: '~20 videos (15-30s)', credits: 100000, costPer: 5000 },
      { name: 'Voice Generation', operations: '~50 voiceovers', credits: 100000, costPer: 2000 },
      { name: 'Social Media Graphics', operations: '~500 graphics', credits: 100000, costPer: 200 },
      { name: 'Brand Assets', operations: 'Logo, banners, templates', credits: 100000, costPer: 1000 },
    ],
    outputs: {
      quality: 'HD/4K',
      formats: 'JPG, PNG, MP4, SVG',
      resolution: 'Up to 4K',
      deliveryTime: '2-10 minutes per asset',
    },
    useCases: [
      'Complete brand identity package',
      'Social media content for 3 months',
      'Marketing campaign materials',
      'Video ads and promotional content',
      'Website graphics and banners',
    ],
  },
  {
    id: 'agency',
    name: 'Agency Asset Bank',
    price: 599,
    credits: 150000,
    bestFor: 'Agencies & Heavy Content Creation',
    icon: '💼',
    gradient: 'from-orange-500 to-red-500',
    tools: [
      { name: 'Face Swap', operations: 'Unlimited', credits: 150000, costPer: 100 },
      { name: 'AI Avatars', operations: '~500 avatar sets', credits: 150000, costPer: 300 },
      { name: 'Image to Video', operations: '~30 videos (up to 60s)', credits: 150000, costPer: 5000 },
      { name: 'Voice Cloning', operations: '~15 voice clones', credits: 150000, costPer: 10000 },
      { name: 'SEO Content', operations: '~75 articles with images', credits: 150000, costPer: 2000 },
      { name: 'Mixed Media Assets', operations: '~100 premium assets', credits: 150000, costPer: 1500 },
    ],
    outputs: {
      quality: '4K/Studio Quality',
      formats: 'All formats supported',
      resolution: 'Up to 4K+',
      deliveryTime: 'Priority processing (1-5 minutes)',
    },
    useCases: [
      'Client campaigns across multiple industries',
      'White-label content creation',
      'Bulk content for multiple brands',
      'Long-form video content',
      'Enterprise-level asset library',
      'Commercial licensing included',
    ],
  },
];

export function BundleSpecificationSection() {
  const [selectedBundle, setSelectedBundle] = useState(bundles[1].id);
  const [calculatorTool, setCalculatorTool] = useState('face-swap');
  const [calculatorQuantity, setCalculatorQuantity] = useState(10);

  const currentBundle = bundles.find((b) => b.id === selectedBundle) || bundles[0];

  // Calculator logic
  const toolCosts: Record<string, number> = {
    'face-swap': 100,
    'avatar': 300,
    'image-to-video': 5000,
    'voice': 2000,
    'enhancement': 200,
  };

  const calculateResults = () => {
    const creditCost = toolCosts[calculatorTool] * calculatorQuantity;
    return bundles.map((bundle) => ({
      name: bundle.name,
      canCreate: Math.floor(bundle.credits / toolCosts[calculatorTool]),
      remainingCredits: bundle.credits - creditCost,
      percentUsed: ((creditCost / bundle.credits) * 100).toFixed(1),
    }));
  };

  const results = calculateResults();

  return (
    <section id="bundles" className="py-24 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/5" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-4"
          >
            Bundle Specifications
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
          >
            Know Exactly What <span className="gradient-text">You're Getting</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg max-w-3xl mx-auto"
          >
            Transparent breakdown of tools, credits, and outputs for each bundle. No hidden surprises.
          </motion.p>
        </div>

        {/* Bundle Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto mb-12"
        >
          <Tabs value={selectedBundle} onValueChange={setSelectedBundle} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              {bundles.map((bundle) => (
                <TabsTrigger key={bundle.id} value={bundle.id} className="flex flex-col py-4">
                  <span className="text-2xl mb-1">{bundle.icon}</span>
                  <span className="font-semibold">{bundle.name}</span>
                  <span className="text-xs text-muted-foreground">${bundle.price}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {bundles.map((bundle) => (
              <TabsContent key={bundle.id} value={bundle.id}>
                <Card className="glass-card p-8">
                  {/* Bundle Header */}
                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">{bundle.name}</h3>
                      <p className="text-muted-foreground mb-4">{bundle.bestFor}</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold">${bundle.price}</span>
                        <span className="text-muted-foreground">one-time</span>
                      </div>
                      <div className="text-primary font-semibold mt-2">
                        {bundle.credits.toLocaleString()} Credits
                      </div>
                    </div>
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${bundle.gradient} flex items-center justify-center text-4xl`}>
                      {bundle.icon}
                    </div>
                  </div>

                  {/* Tool Breakdown */}
                  <div className="mb-8">
                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Package className="w-5 h-5 text-primary" />
                      What You Can Create
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {bundle.tools.map((tool) => (
                        <div key={tool.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div>
                            <div className="font-medium">{tool.name}</div>
                            <div className="text-sm text-muted-foreground">{tool.operations}</div>
                          </div>
                          <div className="text-xs text-primary font-medium">
                            {tool.costPer} credits
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Output Specifications */}
                  <div className="mb-8">
                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      Output Specifications
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 rounded-lg bg-muted/50">
                        <div className="text-sm text-muted-foreground mb-1">Quality</div>
                        <div className="font-semibold">{bundle.outputs.quality}</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted/50">
                        <div className="text-sm text-muted-foreground mb-1">Formats</div>
                        <div className="font-semibold text-sm">{bundle.outputs.formats}</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted/50">
                        <div className="text-sm text-muted-foreground mb-1">Resolution</div>
                        <div className="font-semibold">{bundle.outputs.resolution}</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted/50">
                        <div className="text-sm text-muted-foreground mb-1">Delivery</div>
                        <div className="font-semibold text-sm">{bundle.outputs.deliveryTime}</div>
                      </div>
                    </div>
                  </div>

                  {/* Use Cases */}
                  <div className="mb-8">
                    <h4 className="text-lg font-semibold mb-4">Perfect For:</h4>
                    <ul className="space-y-2">
                      {bundle.useCases.map((useCase) => (
                        <li key={useCase} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{useCase}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA */}
                  <Link to="/signup">
                    <Button variant="hero" size="lg" className="w-full">
                      Get {bundle.name}
                    </Button>
                  </Link>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </motion.div>

        {/* Interactive Calculator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <Card className="glass-card p-8">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Calculator className="w-6 h-6 text-primary" />
              Bundle Calculator
            </h3>
            <p className="text-muted-foreground mb-6">
              Calculate how many operations you can perform with each bundle
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Select Tool</label>
                <select
                  value={calculatorTool}
                  onChange={(e) => setCalculatorTool(e.target.value)}
                  className="w-full p-3 rounded-lg bg-muted border border-border"
                >
                  <option value="face-swap">Face Swap (100 credits)</option>
                  <option value="avatar">AI Avatar (300 credits)</option>
                  <option value="image-to-video">Image to Video (5,000 credits)</option>
                  <option value="voice">Voice Generation (2,000 credits)</option>
                  <option value="enhancement">Image Enhancement (200 credits)</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Quantity Needed</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={calculatorQuantity}
                  onChange={(e) => setCalculatorQuantity(Number(e.target.value))}
                  className="w-full p-3 rounded-lg bg-muted border border-border"
                />
              </div>
            </div>

            {/* Results */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {results.map((result) => (
                <div
                  key={result.name}
                  className={`p-4 rounded-lg border-2 ${
                    result.remainingCredits >= 0
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-destructive/30 bg-destructive/5'
                  }`}
                >
                  <div className="font-semibold mb-2">{result.name}</div>
                  <div className="text-2xl font-bold mb-1">
                    {result.remainingCredits >= 0 ? (
                      <span className="text-primary">✓ Covered</span>
                    ) : (
                      <span className="text-destructive">✗ Need more</span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Can create: <span className="font-medium">{result.canCreate}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Uses {result.percentUsed}% of credits
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
