import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface GalleryItem {
  id: number;
  title: string;
  tool: string;
  credits: number;
  before: string;
  after: string;
  description: string;
}

const galleryItems: GalleryItem[] = [
  {
    id: 1,
    title: 'Professional Portrait',
    tool: 'Face Swap',
    credits: 100,
    before: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    after: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
    description: 'Seamless face swap in 30 seconds',
  },
  {
    id: 2,
    title: 'AI Avatar Generation',
    tool: 'AI Avatars',
    credits: 150,
    before: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    after: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
    description: 'Transform into artistic avatar',
  },
  {
    id: 3,
    title: 'Product Photography',
    tool: 'Face Swap',
    credits: 100,
    before: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
    after: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=400&h=400&fit=crop',
    description: 'E-commerce ready in seconds',
  },
  {
    id: 4,
    title: 'Creative Expression',
    tool: 'AI Avatars',
    credits: 150,
    before: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop',
    after: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    description: 'Multiple artistic styles',
  },
  {
    id: 5,
    title: 'Social Media Content',
    tool: 'Face Swap',
    credits: 100,
    before: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop',
    after: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=400&fit=crop',
    description: 'Viral-worthy transformations',
  },
  {
    id: 6,
    title: 'Marketing Campaign',
    tool: 'AI Avatars',
    credits: 150,
    before: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop',
    after: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop',
    description: 'Professional brand assets',
  },
];

export function GallerySection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBefore, setShowBefore] = useState(true);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % galleryItems.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + galleryItems.length) % galleryItems.length);
  };

  const currentItem = galleryItems[currentIndex];

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
            Results Gallery
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
          >
            See The <span className="gradient-text">Transformation</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
          >
            Real examples from our community. Professional results in seconds, not hours.
          </motion.p>
        </div>

        {/* Main Gallery Display */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="max-w-5xl mx-auto"
        >
          {/* Large Before/After Display */}
          <div className="relative mb-8">
            <div className="glass-card p-4 sm:p-6 rounded-2xl">
              <div className="relative aspect-[16/10] sm:aspect-[16/9] overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 to-accent/10">
                {/* Image Display */}
                <motion.img
                  key={showBefore ? 'before' : 'after'}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  src={showBefore ? currentItem.before : currentItem.after}
                  alt={showBefore ? 'Before transformation' : 'After transformation'}
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Before/After Toggle */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                  <div className="flex items-center gap-2 bg-background/90 backdrop-blur-sm border border-border rounded-full p-1">
                    <button
                      onClick={() => setShowBefore(true)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        showBefore
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Before
                    </button>
                    <button
                      onClick={() => setShowBefore(false)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        !showBefore
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      After
                    </button>
                  </div>
                </div>

                {/* Tool Badge */}
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-background/90 backdrop-blur-sm border border-border">
                  <span className="text-xs font-semibold">{currentItem.tool}</span>
                </div>

                {/* Credits Badge */}
                <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-primary/90 backdrop-blur-sm">
                  <span className="text-xs font-semibold text-primary-foreground">
                    {currentItem.credits} credits
                  </span>
                </div>
              </div>

              {/* Item Info */}
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-1">{currentItem.title}</h3>
                  <p className="text-muted-foreground text-sm">{currentItem.description}</p>
                </div>
                <div className="hidden sm:flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={prevSlide}
                    className="rounded-full"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={nextSlide}
                    className="rounded-full"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Thumbnail Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-4 mb-8">
            {galleryItems.map((item, index) => (
              <motion.button
                key={item.id}
                onClick={() => setCurrentIndex(index)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`relative aspect-square rounded-lg overflow-hidden transition-all ${
                  index === currentIndex
                    ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                    : 'opacity-50 hover:opacity-100'
                }`}
              >
                <img
                  src={item.after}
                  alt={`${item.title} thumbnail`}
                  className="w-full h-full object-cover"
                />
              </motion.button>
            ))}
          </div>

          {/* Mobile Navigation */}
          <div className="flex sm:hidden justify-center gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={prevSlide}
              className="flex-1 max-w-[120px]"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={nextSlide}
              className="flex-1 max-w-[120px]"
            >
              Next
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4"
          >
            <div className="text-center p-4 glass-card">
              <div className="text-2xl font-bold gradient-text mb-1">HD</div>
              <div className="text-xs text-muted-foreground">Output Quality</div>
            </div>
            <div className="text-center p-4 glass-card">
              <div className="text-2xl font-bold gradient-text mb-1">30s</div>
              <div className="text-xs text-muted-foreground">Average Time</div>
            </div>
            <div className="text-center p-4 glass-card">
              <div className="text-2xl font-bold gradient-text mb-1">100+</div>
              <div className="text-xs text-muted-foreground">Styles Available</div>
            </div>
            <div className="text-center p-4 glass-card">
              <div className="text-2xl font-bold gradient-text mb-1">99.9%</div>
              <div className="text-xs text-muted-foreground">Success Rate</div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
