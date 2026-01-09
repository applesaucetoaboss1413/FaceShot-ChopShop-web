import { motion } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  avatar: string;
  quote: string;
  rating: number;
  useCase: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Sarah Chen',
    role: 'E-commerce Owner',
    company: 'StyleHub Boutique',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    quote: 'I created 500 product images for my Shopify store in 2 hours instead of 20 hours. FaceShot-ChopShop saved me thousands in photography costs and weeks of work. The face swap quality is incredible!',
    rating: 5,
    useCase: 'E-commerce',
  },
  {
    id: 2,
    name: 'Marcus Rodriguez',
    role: 'Content Creator',
    company: 'YouTube Creator',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    quote: 'The Image-to-Video feature is a game-changer for my thumbnails and shorts. I can create engaging content 10x faster. My engagement rate increased by 45% since using FaceShot-ChopShop!',
    rating: 5,
    useCase: 'Content Creation',
  },
  {
    id: 3,
    name: 'Jennifer Park',
    role: 'Social Media Manager',
    company: 'TechStart Inc.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    quote: 'Managing social media for 5 clients is exhausting, but FaceShot-ChopShop makes it easy. The AI avatars help me create diverse, professional content quickly. Best tool investment this year!',
    rating: 5,
    useCase: 'Social Media',
  },
  {
    id: 4,
    name: 'David Thompson',
    role: 'Marketing Director',
    company: 'GrowthLabs',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    quote: 'We used to spend $5,000+ per campaign on stock photos. Now we create custom visuals in-house for pennies. ROI is incredible. The Enterprise plan pays for itself in the first week.',
    rating: 5,
    useCase: 'Marketing',
  },
  {
    id: 5,
    name: 'Emily Watson',
    role: 'Freelance Designer',
    company: 'Watson Creative',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    quote: 'My clients love the quick turnaround times. What used to take days of Photoshop work now takes minutes. FaceShot-ChopShop is my secret weapon for delivering wow-factor results fast.',
    rating: 5,
    useCase: 'Design',
  },
];

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  // Auto-rotate testimonials every 5 seconds
  useEffect(() => {
    if (!autoPlay) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [autoPlay]);

  const nextTestimonial = () => {
    setAutoPlay(false);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setAutoPlay(false);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToTestimonial = (index: number) => {
    setAutoPlay(false);
    setCurrentIndex(index);
  };

  // Get three testimonials for desktop view
  const getVisibleTestimonials = () => {
    const result = [];
    for (let i = 0; i < 3; i++) {
      const index = (currentIndex + i) % testimonials.length;
      result.push(testimonials[index]);
    }
    return result;
  };

  const currentTestimonial = testimonials[currentIndex];
  const visibleTestimonials = getVisibleTestimonials();

  return (
    <section className="py-24 relative overflow-hidden">
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
            Testimonials
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
          >
            Loved by <span className="gradient-text">Creators Worldwide</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
          >
            Join thousands of satisfied users transforming their creative workflows
          </motion.p>
        </div>

        {/* Desktop View - 3 Testimonials */}
        <div className="hidden lg:block max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-3 gap-6"
          >
            {visibleTestimonials.map((testimonial, idx) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`glass-card p-6 ${idx === 0 ? 'border-primary/30 scale-105' : ''}`}
              >
                {/* Quote Icon */}
                <Quote className="w-8 h-8 text-primary/20 mb-4" />
                
                {/* Rating */}
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-muted-foreground mb-6 line-clamp-4 leading-relaxed">
                  "{testimonial.quote}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {testimonial.role}
                    </div>
                    <div className="text-xs text-primary font-medium">
                      {testimonial.useCase}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={prevTestimonial}
              className="rounded-full"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToTestimonial(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? 'w-8 bg-primary'
                      : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={nextTestimonial}
              className="rounded-full"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Mobile/Tablet View - 1 Testimonial */}
        <div className="lg:hidden max-w-2xl mx-auto">
          <motion.div
            key={currentTestimonial.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass-card p-8 border-primary/30"
          >
            {/* Quote Icon */}
            <Quote className="w-10 h-10 text-primary/20 mb-6" />
            
            {/* Rating */}
            <div className="flex items-center gap-1 mb-6">
              {Array.from({ length: currentTestimonial.rating }).map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
              ))}
            </div>

            {/* Quote */}
            <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
              "{currentTestimonial.quote}"
            </p>

            {/* Author */}
            <div className="flex items-center gap-4 pt-6 border-t border-border">
              <img
                src={currentTestimonial.avatar}
                alt={currentTestimonial.name}
                className="w-16 h-16 rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="font-semibold text-lg">{currentTestimonial.name}</div>
                <div className="text-muted-foreground">
                  {currentTestimonial.role}
                </div>
                <div className="text-sm text-primary font-medium mt-1">
                  {currentTestimonial.useCase}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <Button
              variant="outline"
              size="lg"
              onClick={prevTestimonial}
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Previous
            </Button>

            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToTestimonial(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? 'w-8 bg-primary'
                      : 'w-2 bg-muted-foreground/30'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="lg"
              onClick={nextTestimonial}
            >
              Next
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </div>
        </div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-8 text-center"
        >
          <div>
            <div className="text-3xl font-bold gradient-text">4.9/5</div>
            <div className="text-sm text-muted-foreground">Average Rating</div>
          </div>
          <div className="w-px h-12 bg-border hidden sm:block" />
          <div>
            <div className="text-3xl font-bold gradient-text">2,500+</div>
            <div className="text-sm text-muted-foreground">Happy Customers</div>
          </div>
          <div className="w-px h-12 bg-border hidden sm:block" />
          <div>
            <div className="text-3xl font-bold gradient-text">150K+</div>
            <div className="text-sm text-muted-foreground">Creations Made</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
