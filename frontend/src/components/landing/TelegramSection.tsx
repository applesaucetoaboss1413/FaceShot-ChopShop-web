import { motion } from 'framer-motion';
import { Send, Smartphone, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function TelegramSection() {
  return (
    <section className="py-24 relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Send className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Also on Telegram</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Try Our <span className="gradient-text">Telegram Mini Bot</span>
            </h2>
            
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
              Access our AI services on-the-go with our Telegram bot. Perfect for quick face swaps and video generation directly in your favorite messaging app.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12"
          >
            {/* Telegram Channel Card */}
            <div className="glass-card p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0088cc] to-[#229ED9] flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Join Our Channel</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Get updates, tips, and exclusive content from our community
              </p>
              <a
                href="https://t.me/FaceSwapVideoAi"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="w-full group">
                  <Send className="w-4 h-4 mr-2" />
                  Join Channel
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </a>
            </div>

            {/* Mini Bot Card */}
            <div className="glass-card p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">Use Mini Bot</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Quick AI services directly in Telegram - compact and convenient
              </p>
              <a
                href="https://telegramalam.onrender.com/miniapp/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="hero" className="w-full group">
                  <Zap className="w-4 h-4 mr-2" />
                  Try Mini Bot
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="glass-card p-6"
          >
            <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Why Use Telegram?</h4>
                <p className="text-sm text-muted-foreground">
                  Perfect for quick edits on mobile, ideal for creators who want fast access without opening a browser. Lighter interface, same powerful AI.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
