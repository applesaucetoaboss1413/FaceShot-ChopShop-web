import { motion } from 'framer-motion';
import { UserPlus, Grid3x3, Upload, Download, ArrowRight } from 'lucide-react';

interface Step {
  number: number;
  icon: any;
  title: string;
  description: string;
  gradient: string;
}

const steps: Step[] = [
  {
    number: 1,
    icon: UserPlus,
    title: 'Sign Up',
    description: 'Create your free account in 30 seconds. No credit card required to start. Get $10 in free credits instantly.',
    gradient: 'from-cyan-500 to-blue-500',
  },
  {
    number: 2,
    icon: Grid3x3,
    title: 'Choose a Tool',
    description: 'Select from 21 powerful AI tools. Face Swap, AI Avatars, Image-to-Video, and more. All in one platform.',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    number: 3,
    icon: Upload,
    title: 'Upload Media',
    description: 'Drag and drop your images or videos. We support JPG, PNG, WebP, and more. Maximum 10MB per file.',
    gradient: 'from-orange-500 to-red-500',
  },
  {
    number: 4,
    icon: Download,
    title: 'Get Results',
    description: 'Download your transformed content in seconds. High-quality output ready for immediate use.',
    gradient: 'from-green-500 to-emerald-500',
  },
];

export function HowItWorksSection() {
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
            How It Works
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
          >
            Get Started in <span className="gradient-text">4 Simple Steps</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
          >
            From signup to download in minutes. No technical skills required.
          </motion.p>
        </div>

        {/* Desktop View - Horizontal Steps */}
        <div className="hidden lg:block max-w-7xl mx-auto">
          <div className="relative">
            {/* Connection Line */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20 -translate-y-1/2 z-0" />
            
            <div className="grid grid-cols-4 gap-8 relative z-10">
              {steps.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                  className="text-center"
                >
                  {/* Icon Circle */}
                  <div className="relative mb-6">
                    <div className={`w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-xl transform hover:scale-110 transition-transform duration-300`}>
                      <step.icon className="w-12 h-12 text-white" />
                    </div>
                    {/* Step Number Badge */}
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-lg">
                      {step.number}
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {step.description}
                  </p>

                  {/* Arrow (except last) */}
                  {index < steps.length - 1 && (
                    <div className="absolute top-12 -right-4 text-primary">
                      <ArrowRight className="w-6 h-6" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile/Tablet View - Vertical Steps */}
        <div className="lg:hidden max-w-2xl mx-auto">
          <div className="relative">
            {/* Vertical Connection Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/20 via-primary to-primary/20" />
            
            <div className="space-y-8 relative z-10">
              {steps.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-6"
                >
                  {/* Icon Circle */}
                  <div className="relative flex-shrink-0">
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-lg`}>
                      <step.icon className="w-8 h-8 text-white" />
                    </div>
                    {/* Step Number Badge */}
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shadow-lg">
                      {step.number}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-2">
                    <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="glass-card p-8 max-w-2xl mx-auto border-primary/30">
            <h3 className="text-2xl font-bold mb-4">
              Ready to Transform Your Content?
            </h3>
            <p className="text-muted-foreground mb-6">
              Join thousands of creators already using FaceShot-ChopShop. Start with $10 in free credits.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/signup" className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </a>
              <a href="#demo" className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-border hover:bg-muted transition-colors font-semibold">
                Watch Demo
              </a>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.7 }}
          className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto"
        >
          <div className="text-center p-4 glass-card">
            <div className="text-2xl font-bold gradient-text mb-1">30s</div>
            <div className="text-xs text-muted-foreground">Signup Time</div>
          </div>
          <div className="text-center p-4 glass-card">
            <div className="text-2xl font-bold gradient-text mb-1">21</div>
            <div className="text-xs text-muted-foreground">AI Tools</div>
          </div>
          <div className="text-center p-4 glass-card">
            <div className="text-2xl font-bold gradient-text mb-1">$10</div>
            <div className="text-xs text-muted-foreground">Free Credits</div>
          </div>
          <div className="text-center p-4 glass-card">
            <div className="text-2xl font-bold gradient-text mb-1">0</div>
            <div className="text-xs text-muted-foreground">Credit Card Needed</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
