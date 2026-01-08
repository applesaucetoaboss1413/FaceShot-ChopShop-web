import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image as ImageIcon,
  Video,
  Mic,
  Users,
  Sparkles,
  ChevronRight,
  Upload,
  Loader2,
  Settings,
  Zap,
  DollarSign,
  Clock,
  Check,
  X,
  LogOut,
  Coins,
  Plus,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

// Tool Categories
const categories = [
  { id: 'image', name: 'Images', icon: ImageIcon, gradient: 'from-cyan-500 to-blue-500' },
  { id: 'video', name: 'Videos', icon: Video, gradient: 'from-purple-500 to-pink-500' },
  { id: 'voice', name: 'Voice & Audio', icon: Mic, gradient: 'from-green-500 to-emerald-500' },
  { id: 'avatar', name: 'Avatars', icon: Users, gradient: 'from-orange-500 to-red-500' },
  { id: 'special', name: 'Special', icon: Sparkles, gradient: 'from-violet-500 to-fuchsia-500' }
];

// All available tools with detailed metadata
const allTools = [
  // IMAGE TOOLS
  {
    id: 'faceswap',
    category: 'image',
    name: 'Face Swap',
    description: 'Swap faces between images or videos',
    icon: '😊',
    basePrice: 299,
    inputs: ['source_image', 'target_image'],
    adjustments: []
  },
  {
    id: 'enhance',
    category: 'image',
    name: 'Image Enhancement',
    description: 'Upscale to 4K quality',
    icon: '✨',
    basePrice: 499,
    inputs: ['image'],
    adjustments: ['resolution', 'format']
  },
  {
    id: 'bgremove',
    category: 'image',
    name: 'Background Remove',
    description: 'Remove backgrounds instantly',
    icon: '🎨',
    basePrice: 199,
    inputs: ['image'],
    adjustments: []
  },
  {
    id: 'text2img',
    category: 'image',
    name: 'Text to Image',
    description: 'Generate images from text',
    icon: '🖼️',
    basePrice: 399,
    inputs: ['prompt'],
    adjustments: ['resolution', 'style', 'num_images', 'negative_prompt']
  },
  {
    id: 'nano_banana',
    category: 'image',
    name: 'Nano Banana (Gemini)',
    description: 'AI image generation powered by Gemini',
    icon: '🍌',
    basePrice: 599,
    inputs: ['prompt'],
    adjustments: ['aspect_ratio', 'operation']
  },

  // VIDEO TOOLS
  {
    id: 'img2vid',
    category: 'video',
    name: 'Image to Video',
    description: 'Animate static images',
    icon: '🎬',
    basePrice: 799,
    inputs: ['image'],
    adjustments: ['duration', 'prompt', 'fps']
  },
  {
    id: 'vid2vid',
    category: 'video',
    name: 'Video to Video',
    description: 'Transform videos with AI',
    icon: '🎥',
    basePrice: 1299,
    inputs: ['video'],
    adjustments: ['prompt', 'style', 'strength']
  },
  {
    id: 'avatar_video',
    category: 'video',
    name: 'AI Avatar Video',
    description: 'Realistic avatar videos with lip-sync',
    icon: '👤',
    basePrice: 1499,
    inputs: ['script'],
    adjustments: ['video_length', 'resolution', 'aspect_ratio', 'background_music']
  },
  {
    id: 'talking_photo',
    category: 'video',
    name: 'Talking Photo',
    description: 'Make photos talk',
    icon: '📸',
    basePrice: 899,
    inputs: ['image'],
    adjustments: ['voice_text', 'duration']
  },
  {
    id: 'talking_video',
    category: 'video',
    name: 'Talking Video',
    description: 'Add AI voiceover with lip-sync',
    icon: '🎞️',
    basePrice: 1099,
    inputs: ['video'],
    adjustments: ['voice_text']
  },
  {
    id: 'caption_removal',
    category: 'video',
    name: 'Caption Removal',
    description: 'Remove captions from videos',
    icon: '🚫',
    basePrice: 399,
    inputs: ['video'],
    adjustments: []
  },

  // VOICE TOOLS
  {
    id: 'tts',
    category: 'voice',
    name: 'Text-to-Speech',
    description: 'Natural-sounding speech',
    icon: '🗣️',
    basePrice: 299,
    inputs: ['text'],
    adjustments: ['voice_type', 'language', 'speed', 'pitch']
  },
  {
    id: 'voice_clone',
    category: 'voice',
    name: 'Voice Clone',
    description: 'Clone any voice',
    icon: '🎤',
    basePrice: 999,
    inputs: ['audio'],
    adjustments: ['quality', 'emotion_control']
  },
  {
    id: 'dubbing',
    category: 'voice',
    name: 'AI Dubbing',
    description: 'Translate and dub videos',
    icon: '🌍',
    basePrice: 1299,
    inputs: ['video'],
    adjustments: ['target_language', 'voice_type', 'preserve_timing']
  },

  // AVATAR TOOLS
  {
    id: 'create_avatar',
    category: 'avatar',
    name: 'Custom Avatar',
    description: 'Create custom avatars',
    icon: '👨‍🎨',
    basePrice: 699,
    inputs: ['media'],
    adjustments: ['type']
  },

  // SPECIAL TOOLS
  {
    id: 'virtual_tryon',
    category: 'special',
    name: 'Virtual Try-On',
    description: 'Try on clothes virtually',
    icon: '👔',
    basePrice: 799,
    inputs: ['person_image', 'garment_image'],
    adjustments: ['category']
  },
  {
    id: 'product_avatar',
    category: 'special',
    name: 'Product Avatar',
    description: 'AI presenters for products',
    icon: '🛍️',
    basePrice: 1099,
    inputs: ['product_image'],
    adjustments: ['avatar_style', 'background']
  }
];

// Adjustment definitions
const adjustmentDefs: Record<string, any> = {
  resolution: {
    type: 'select',
    label: 'Resolution',
    options: [
      { value: '1080p', label: '1080p (Full HD)', multiplier: 1.0 },
      { value: '2k', label: '2K', multiplier: 1.3 },
      { value: '4k', label: '4K', multiplier: 1.8 }
    ],
    default: '1080p'
  },
  duration: {
    type: 'slider',
    label: 'Duration (seconds)',
    min: 5,
    max: 120,
    step: 5,
    default: 15,
    pricePerUnit: 2
  },
  video_length: {
    type: 'slider',
    label: 'Video Length (seconds)',
    min: 10,
    max: 180,
    step: 10,
    default: 30,
    pricePerUnit: 3
  },
  aspect_ratio: {
    type: 'select',
    label: 'Aspect Ratio',
    options: [
      { value: '1:1', label: '1:1 (Square)', multiplier: 1.0 },
      { value: '16:9', label: '16:9 (Widescreen)', multiplier: 1.0 },
      { value: '9:16', label: '9:16 (Vertical)', multiplier: 1.0 }
    ],
    default: '16:9'
  },
  style: {
    type: 'select',
    label: 'Style',
    options: [
      { value: 'realistic', label: 'Realistic', multiplier: 1.0 },
      { value: 'artistic', label: 'Artistic', multiplier: 1.2 },
      { value: 'anime', label: 'Anime', multiplier: 1.2 }
    ],
    default: 'realistic'
  },
  fps: {
    type: 'select',
    label: 'Frame Rate',
    options: [
      { value: '24', label: '24 FPS', multiplier: 1.0 },
      { value: '30', label: '30 FPS', multiplier: 1.1 },
      { value: '60', label: '60 FPS', multiplier: 1.4 }
    ],
    default: '30'
  },
  voice_type: {
    type: 'select',
    label: 'Voice Type',
    options: [
      { value: 'professional', label: 'Professional', multiplier: 1.0 },
      { value: 'casual', label: 'Casual', multiplier: 1.0 },
      { value: 'energetic', label: 'Energetic', multiplier: 1.1 }
    ],
    default: 'professional'
  },
  language: {
    type: 'select',
    label: 'Language',
    options: [
      { value: 'en-US', label: 'English', multiplier: 1.0 },
      { value: 'es-ES', label: 'Spanish', multiplier: 1.1 },
      { value: 'fr-FR', label: 'French', multiplier: 1.1 },
      { value: 'zh-CN', label: 'Chinese', multiplier: 1.2 }
    ],
    default: 'en-US'
  },
  quality: {
    type: 'select',
    label: 'Quality',
    options: [
      { value: 'standard', label: 'Standard', multiplier: 1.0 },
      { value: 'high', label: 'High', multiplier: 1.3 },
      { value: 'professional', label: 'Professional', multiplier: 1.6 }
    ],
    default: 'standard'
  },
  emotion_control: {
    type: 'checkbox',
    label: 'Emotion Control',
    default: false,
    priceAdd: 500
  },
  background_music: {
    type: 'checkbox',
    label: 'Background Music',
    default: false,
    priceAdd: 300
  },
  format: {
    type: 'select',
    label: 'Format',
    options: [
      { value: 'jpg', label: 'JPG', multiplier: 1.0 },
      { value: 'png', label: 'PNG', multiplier: 1.1 }
    ],
    default: 'jpg'
  },
  num_images: {
    type: 'number',
    label: 'Number of Images',
    min: 1,
    max: 10,
    default: 1,
    pricePerUnit: 299
  },
  operation: {
    type: 'select',
    label: 'Operation',
    options: [
      { value: 'generate', label: 'Generate New', multiplier: 1.0 },
      { value: 'edit', label: 'Edit Existing', multiplier: 1.2 }
    ],
    default: 'generate'
  },
  strength: {
    type: 'slider',
    label: 'Strength',
    min: 0.1,
    max: 1.0,
    step: 0.1,
    default: 0.7
  },
  speed: {
    type: 'slider',
    label: 'Speed',
    min: 0.5,
    max: 2.0,
    step: 0.1,
    default: 1.0
  },
  pitch: {
    type: 'slider',
    label: 'Pitch',
    min: 0.5,
    max: 2.0,
    step: 0.1,
    default: 1.0
  },
  prompt: {
    type: 'textarea',
    label: 'Prompt',
    placeholder: 'Describe what you want...'
  },
  negative_prompt: {
    type: 'textarea',
    label: 'Negative Prompt',
    placeholder: 'What to avoid...'
  },
  text: {
    type: 'textarea',
    label: 'Text',
    placeholder: 'Enter text...'
  },
  voice_text: {
    type: 'textarea',
    label: 'Voice Text',
    placeholder: 'Enter text for voice...'
  },
  script: {
    type: 'textarea',
    label: 'Script',
    placeholder: 'Enter script...'
  },
  target_language: {
    type: 'select',
    label: 'Target Language',
    options: [
      { value: 'es', label: 'Spanish', multiplier: 1.0 },
      { value: 'fr', label: 'French', multiplier: 1.0 },
      { value: 'de', label: 'German', multiplier: 1.0 },
      { value: 'zh', label: 'Chinese', multiplier: 1.2 }
    ],
    default: 'es'
  },
  category: {
    type: 'select',
    label: 'Category',
    options: [
      { value: 'upper_body', label: 'Upper Body', multiplier: 1.0 },
      { value: 'lower_body', label: 'Lower Body', multiplier: 1.0 },
      { value: 'full_body', label: 'Full Body', multiplier: 1.3 }
    ],
    default: 'upper_body'
  },
  avatar_style: {
    type: 'select',
    label: 'Avatar Style',
    options: [
      { value: 'professional', label: 'Professional', multiplier: 1.0 },
      { value: 'casual', label: 'Casual', multiplier: 1.0 },
      { value: 'animated', label: 'Animated', multiplier: 1.2 }
    ],
    default: 'professional'
  },
  background: {
    type: 'select',
    label: 'Background',
    options: [
      { value: 'studio', label: 'Studio', multiplier: 1.0 },
      { value: 'office', label: 'Office', multiplier: 1.0 },
      { value: 'custom', label: 'Custom', multiplier: 1.3 }
    ],
    default: 'studio'
  },
  type: {
    type: 'select',
    label: 'Type',
    options: [
      { value: 'image', label: 'From Image', multiplier: 1.0 },
      { value: 'video', label: 'From Video', multiplier: 1.5 }
    ],
    default: 'image'
  },
  preserve_timing: {
    type: 'checkbox',
    label: 'Preserve Timing',
    default: true
  }
};

export default function ChopShop() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [selectedCategory, setSelectedCategory] = useState('image');
  const [selectedTool, setSelectedTool] = useState<any>(null);
  const [mode, setMode] = useState<'simple' | 'advanced'>('simple');
  const [adjustments, setAdjustments] = useState<Record<string, any>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    if (user) {
      setCredits(user.credits || 0);
      loadCredits();
    }
  }, [user]);

  const loadCredits = async () => {
    const result = await api.getCredits();
    if (result.success && result.data) {
      setCredits(result.data.balance);
    }
  };

  const filteredTools = allTools.filter(t => t.category === selectedCategory);

  useEffect(() => {
    if (selectedTool) {
      // Initialize default adjustments
      const defaults: Record<string, any> = {};
      selectedTool.adjustments.forEach((adj: string) => {
        const def = adjustmentDefs[adj];
        if (def) {
          defaults[adj] = def.default;
        }
      });
      setAdjustments(defaults);
      calculatePrice();
    }
  }, [selectedTool]);

  useEffect(() => {
    calculatePrice();
  }, [adjustments, selectedTool]);

  const calculatePrice = () => {
    if (!selectedTool) return;
    
    let price = selectedTool.basePrice;
    
    // Apply adjustment multipliers and additions
    Object.keys(adjustments).forEach(key => {
      const def = adjustmentDefs[key];
      const value = adjustments[key];
      
      if (def.type === 'select' && def.options) {
        const option = def.options.find((o: any) => o.value === value);
        if (option && option.multiplier) {
          price *= option.multiplier;
        }
      } else if (def.type === 'slider' && def.pricePerUnit) {
        price += value * def.pricePerUnit;
      } else if (def.type === 'checkbox' && value && def.priceAdd) {
        price += def.priceAdd;
      } else if (def.type === 'number' && def.pricePerUnit) {
        price += (value - 1) * def.pricePerUnit;
      }
    });
    
    setEstimatedPrice(Math.round(price));
  };

  const handleFileUpload = (inputKey: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedFiles(prev => ({
        ...prev,
        [inputKey]: e.target?.result as string
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleProcess = async () => {
    if (!selectedTool) return;
    
    setIsProcessing(true);
    
    try {
      // Process the job
      const result = await api.processJob({
        type: selectedTool.id,
        sourceImage: uploadedFiles.image || uploadedFiles.source_image,
        targetImage: uploadedFiles.target_image,
        options: adjustments
      });
      
      if (result.success) {
        toast({
          title: 'Processing started!',
          description: 'Your job is being processed. Check your dashboard for results.'
        });
        setCredits(prev => prev - estimatedPrice);
      } else {
        toast({
          title: 'Processing failed',
          description: result.error || 'Please try again',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderAdjustment = (key: string) => {
    const def = adjustmentDefs[key];
    if (!def) return null;
    
    const value = adjustments[key] ?? def.default;

    switch (def.type) {
      case 'select':
        return (
          <div key={key} className="space-y-2">
            <label className="text-sm font-medium">{def.label}</label>
            <Select 
              value={value} 
              onValueChange={(v) => setAdjustments(prev => ({ ...prev, [key]: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {def.options.map((opt: any) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      
      case 'slider':
        return (
          <div key={key} className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">{def.label}</label>
              <span className="text-sm text-muted-foreground">{value}</span>
            </div>
            <Slider
              value={[value]}
              onValueChange={(v) => setAdjustments(prev => ({ ...prev, [key]: v[0] }))}
              min={def.min}
              max={def.max}
              step={def.step}
            />
          </div>
        );
      
      case 'checkbox':
        return (
          <div key={key} className="flex items-center space-x-2">
            <Checkbox
              checked={value}
              onCheckedChange={(checked) => setAdjustments(prev => ({ ...prev, [key]: checked }))}
            />
            <label className="text-sm font-medium">{def.label}</label>
          </div>
        );
      
      case 'textarea':
        return (
          <div key={key} className="space-y-2">
            <label className="text-sm font-medium">{def.label}</label>
            <Textarea
              value={value || ''}
              onChange={(e) => setAdjustments(prev => ({ ...prev, [key]: e.target.value }))}
              placeholder={def.placeholder}
              rows={3}
            />
          </div>
        );
      
      case 'number':
        return (
          <div key={key} className="space-y-2">
            <label className="text-sm font-medium">{def.label}</label>
            <Input
              type="number"
              value={value || def.default}
              onChange={(e) => setAdjustments(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
              min={def.min}
              max={def.max}
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold font-display">
              <span className="gradient-text">Chop</span>Shop
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted">
              <Coins className="w-4 h-4 text-primary" />
              <span className="font-semibold">{credits}</span>
            </div>
            
            <Link to="/pricing">
              <Button variant="glow" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Buy Credits
              </Button>
            </Link>

            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold mb-2">The Chop Shop</h1>
            <p className="text-muted-foreground text-lg">
              Professional AI tools with complete creative control
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Category Sidebar */}
            <div className="space-y-4">
              <div className="glass-card p-4">
                <h3 className="font-semibold mb-3">Categories</h3>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setSelectedTool(null);
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                        selectedCategory === cat.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${cat.gradient}`}>
                        <cat.icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode Toggle */}
              <div className="glass-card p-4">
                <h3 className="font-semibold mb-3">Mode</h3>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setMode('simple')}
                    className={`p-3 rounded-lg text-sm font-medium transition-all ${
                      mode === 'simple'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/70'
                    }`}
                  >
                    🎯 Simple Mode
                    <div className="text-xs opacity-80 mt-1">Quick presets</div>
                  </button>
                  <button
                    onClick={() => setMode('advanced')}
                    className={`p-3 rounded-lg text-sm font-medium transition-all ${
                      mode === 'advanced'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/70'
                    }`}
                  >
                    ⚙️ Advanced Mode
                    <div className="text-xs opacity-80 mt-1">Full control</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Tools Grid */}
            <div className="lg:col-span-2">
              <div className="glass-card p-6">
                <h2 className="text-xl font-bold mb-4">
                  {categories.find(c => c.id === selectedCategory)?.name}
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredTools.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => setSelectedTool(tool)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        selectedTool?.id === tool.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <div className="text-3xl mb-2">{tool.icon}</div>
                      <div className="font-semibold mb-1">{tool.name}</div>
                      <div className="text-xs text-muted-foreground mb-2">
                        {tool.description}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <DollarSign className="w-3 h-3 text-primary" />
                        <span className="text-primary font-medium">
                          ${(tool.basePrice / 100).toFixed(2)}+
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {filteredTools.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No tools available in this category
                  </div>
                )}
              </div>
            </div>

            {/* Configuration Panel */}
            <div className="space-y-4">
              {selectedTool ? (
                <>
                  <div className="glass-card p-6">
                    <h3 className="font-semibold mb-4">{selectedTool.name}</h3>
                    
                    {/* File Uploads */}
                    {selectedTool.inputs.map((input: string) => {
                      if (input.includes('image') || input.includes('video') || input.includes('audio') || input === 'media') {
                        return (
                          <div key={input} className="mb-4">
                            <label className="block text-sm font-medium mb-2">
                              {input.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                            </label>
                            <input
                              type="file"
                              accept={input.includes('video') ? 'video/*' : input.includes('audio') ? 'audio/*' : 'image/*'}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(input, file);
                              }}
                              className="w-full text-sm"
                            />
                          </div>
                        );
                      }
                      return null;
                    })}

                    {/* Adjustments */}
                    {mode === 'advanced' && selectedTool.adjustments.length > 0 && (
                      <div className="space-y-4 mt-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Settings className="w-4 h-4" />
                          <h4 className="font-semibold">Adjustments</h4>
                        </div>
                        {selectedTool.adjustments.map(renderAdjustment)}
                      </div>
                    )}

                    {mode === 'simple' && (
                      <div className="mt-4 p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                        Using optimized preset settings
                      </div>
                    )}
                  </div>

                  {/* Price & Action */}
                  <div className="glass-card p-6">
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Estimated Price</span>
                        <span className="text-2xl font-bold text-primary">
                          ${(estimatedPrice / 100).toFixed(2)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Credits required: {estimatedPrice}
                      </div>
                    </div>

                    <Button
                      variant="hero"
                      size="lg"
                      className="w-full"
                      onClick={handleProcess}
                      disabled={isProcessing || credits < estimatedPrice}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : credits < estimatedPrice ? (
                        <>
                          <X className="w-5 h-5 mr-2" />
                          Insufficient Credits
                        </>
                      ) : (
                        <>
                          <Zap className="w-5 h-5 mr-2" />
                          Generate Now
                        </>
                      )}
                    </Button>

                    {credits < estimatedPrice && (
                      <Link to="/pricing">
                        <Button variant="outline" size="sm" className="w-full mt-2">
                          Buy More Credits
                        </Button>
                      </Link>
                    )}
                  </div>
                </>
              ) : (
                <div className="glass-card p-6">
                  <div className="text-center py-12">
                    <Sparkles className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">Select a tool to get started</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
