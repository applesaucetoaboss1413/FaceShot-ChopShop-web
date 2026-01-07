import { motion } from 'framer-motion';
import { Repeat, User, Video, Wand2, Zap, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
const features = [
  {
    id: 'face-swap',
    icon: Repeat,
    title: 'Face Swap',
    description: 'Seamlessly swap faces between photos with AI precision. Perfect for creative projects and fun experiments.',
    gradient: 'from-cyan-500 to-blue-500',
  },
  {
    id: 'ai-avatars',
    icon: User,
    title: 'AI Avatars',
    description: 'Generate stunning, unique avatars from your photos. Multiple styles from professional to artistic.',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    id: 'image-to-video',
    icon: Video,
    title: 'Image to Video',
    description: 'Bring your static images to life with AI-powered animation. Create engaging video content instantly.',
    gradient: 'from-orange-500 to-red-500',
  },
  {
    id: 'one-click-magic',
    icon: Wand2,
    title: 'One-Click Magic',
    description: 'No technical skills needed. Upload, select your transformation, and let AI do the heavy lifting.',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    id: 'lightning-fast',
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Get results in seconds, not minutes. Our optimized pipeline delivers professional quality at speed.',
    gradient: 'from-yellow-500 to-orange-500',
  },
  {
    id: 'secure-private',
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your images are encrypted and automatically deleted after processing. We never store or share your data.',
    gradient: 'from-indigo-500 to-purple-500',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export function FeaturesSection() {
  const navigate = useNavigate();

  const handleNavigate = (id: string) => {
    navigate(`/dashboard?feature=${id}`);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, id: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleNavigate(id);
    }
  };

  return (
    <section id="features" className="py-24 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-4"
          >
            Features
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
          >
            Everything You Need to
            <br />
            <span className="gradient-text">Create Amazing Content</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
          >
            Powerful AI tools designed for creators, marketers, and anyone who wants to transform their visual content.
          </motion.p>
        </div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              id={feature.id}
              variants={itemVariants}
              className="group glass-card p-6 hover:border-primary/30 hover:shadow-lg hover:-translate-y-1 cursor-pointer transition-all duration-300 scroll-mt-20"
              role="button"
              tabIndex={0}
              aria-label={`Navigate to ${feature.title} section`}
              onClick={() => handleNavigate(feature.id)}
              onKeyDown={(event) => handleKeyDown(event, feature.id)}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
