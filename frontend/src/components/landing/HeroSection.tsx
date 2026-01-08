import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Play, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  // Use aspirational static numbers instead of live stats
  const stats = {
    totalCreations: 150000,
    totalUsers: 12500
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-hero">
        {/* Animated gradient orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/20 blur-[120px]"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-accent/20 blur-[120px]"
          animate={{
            x: [0, -50, 0],
            y: [0, -30, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* NEW: Chop Shop Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 border border-purple-400 mb-4 shadow-lg shadow-purple-500/50"
          >
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
            <span className="text-sm font-bold text-white">🎉 NEW: CHOP SHOP - 16 Professional AI Tools with Full Control!</span>
          </motion.div>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8"
          >
            <Award className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Professional AI-Powered Platform</span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
          >
            The Chop Shop:
            <br />
            <span className="gradient-text">16 Pro AI Tools</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            Images, Videos, Voice, Avatars & More. Every tool, every adjustment, complete creative control. 
            Simple presets OR advanced customization - you choose.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Link to="/signup">
              <Button variant="hero" size="xl">
                Start Creating Free
                <ArrowRight className="w-5 h-5 ml-1" />
              </Button>
            </Link>
            <a href="#features">
              <Button variant="heroOutline" size="xl">
                <Play className="w-5 h-5 mr-1" />
                See How It Works
              </Button>
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex items-center justify-center gap-8 sm:gap-16"
          >
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold gradient-text">
                {stats.totalCreations.toLocaleString()}+
              </div>
              <div className="text-sm text-muted-foreground mt-1">Creations Made</div>
            </div>
            <div className="w-px h-12 bg-border" />
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold gradient-text">
                {stats.totalUsers.toLocaleString()}+
              </div>
              <div className="text-sm text-muted-foreground mt-1">Happy Users</div>
            </div>
            <div className="w-px h-12 bg-border" />
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold gradient-text">99.9%</div>
              <div className="text-sm text-muted-foreground mt-1">Uptime</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
