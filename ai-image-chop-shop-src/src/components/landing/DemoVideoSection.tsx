import { motion } from 'framer-motion';
import { Play, Volume2, VolumeX } from 'lucide-react';
import { useState } from 'react';

export function DemoVideoSection() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Placeholder for demo video - replace with actual video URL
  const demoVideoUrl = 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0';

  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-4"
          >
            See It In Action
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
          >
            Watch How <span className="gradient-text">Simple It Is</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
          >
            60 seconds to see the magic. Upload, transform, download - it's that easy.
          </motion.p>
        </div>

        {/* Video Container */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="max-w-4xl mx-auto"
        >
          <div className="relative rounded-2xl overflow-hidden glass-card border-2 border-primary/20 shadow-glow">
            {/* Video iframe or placeholder */}
            <div className="relative pb-[56.25%] bg-gradient-to-br from-primary/10 to-accent/10">
              {isPlaying ? (
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={demoVideoUrl}
                  title="FaceShot-ChopShop Demo"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <>
                  {/* Fallback/Thumbnail */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <motion.button
                        onClick={() => setIsPlaying(true)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center shadow-xl transition-all duration-300 mb-4"
                      >
                        <Play className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground ml-1" fill="currentColor" />
                      </motion.button>
                      <p className="text-sm text-muted-foreground">Watch 60-second demo</p>
                    </div>
                  </div>
                  
                  {/* Decorative elements */}
                  <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-border">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-medium">DEMO</span>
                  </div>
                </>
              )}
            </div>

            {/* Video controls overlay (when playing) */}
            {isPlaying && (
              <div className="absolute bottom-4 right-4">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-background/90 transition-colors"
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Key highlights below video */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            <div className="text-center p-4 glass-card">
              <div className="text-2xl font-bold gradient-text mb-1">30s</div>
              <div className="text-sm text-muted-foreground">Average Processing Time</div>
            </div>
            <div className="text-center p-4 glass-card">
              <div className="text-2xl font-bold gradient-text mb-1">21</div>
              <div className="text-sm text-muted-foreground">AI-Powered Tools</div>
            </div>
            <div className="text-center p-4 glass-card">
              <div className="text-2xl font-bold gradient-text mb-1">3 Steps</div>
              <div className="text-sm text-muted-foreground">Upload, Transform, Download</div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
