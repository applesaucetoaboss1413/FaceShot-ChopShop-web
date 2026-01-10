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
  Download,
  Package,
  FileText
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
import { displayCredits } from '@/lib/priceConverter';

// Tool Categories - matches backend SKU catalog
const categories = [
  { id: 'image', name: 'Images', icon: ImageIcon, gradient: 'from-cyan-500 to-blue-500' },
  { id: 'video', name: 'Videos', icon: Video, gradient: 'from-purple-500 to-pink-500' },
  { id: 'voice', name: 'Voice & Audio', icon: Mic, gradient: 'from-green-500 to-emerald-500' },
  { id: 'content', name: 'SEO Content', icon: FileText, gradient: 'from-orange-500 to-red-500' },
  { id: 'bundle', name: 'Bundles', icon: Package, gradient: 'from-violet-500 to-fuchsia-500' }
];

// Category icons mapping
const categoryIcons: Record<string, any> = {
  image: ImageIcon,
  video: Video,
  voice: Mic,
  content: FileText,
  bundle: Package
};

// Adjustment definitions for tool customization
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
  format: {
    type: 'select',
    label: 'Format',
    options: [
      { value: 'jpg', label: 'JPG', multiplier: 1.0 },
      { value: 'png', label: 'PNG', multiplier: 1.1 },
      { value: 'mp4', label: 'MP4', multiplier: 1.0 },
      { value: 'mp3', label: 'MP3', multiplier: 1.0 }
    ],
    default: 'jpg'
  },
  prompt: {
    type: 'textarea',
    label: 'Prompt / Description',
    placeholder: 'Describe what you want...'
  },
  text: {
    type: 'textarea',
    label: 'Text Content',
    placeholder: 'Enter your text...'
  }
};

// Tool interface
interface Tool {
  sku_code: string;
  name: string;
  display_name: string;
  description: string;
  icon: string;
  vector_name: string;
  vector_code: string;
  base_price_usd: string;
  base_price_cents: number;
  base_credits: number;
  inputs: string[];
  a2e_tool: string;
}

interface CatalogResponse {
  categories: {
    image: Tool[];
    video: Tool[];
    voice: Tool[];
    content: Tool[];
    bundle: Tool[];
  };
  total_tools: number;
  category_names: Record<string, string>;
}

export default function ChopShop() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [selectedCategory, setSelectedCategory] = useState('image');
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [mode, setMode] = useState<'simple' | 'advanced'>('simple');
  const [adjustments, setAdjustments] = useState<Record<string, any>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [credits, setCredits] = useState(0);
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);

  // Fetch catalog from backend API
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setIsLoadingCatalog(true);
        const response = await api.getCatalog();
        if (response.success && response.data) {
          setCatalog(response.data as CatalogResponse);
        }
      } catch (error) {
        console.error('Failed to fetch catalog:', error);
        toast({
          title: 'Error loading tools',
          description: 'Please refresh the page',
          variant: 'destructive'
        });
      } finally {
        setIsLoadingCatalog(false);
      }
    };
    fetchCatalog();
  }, []);

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

  // Get tools for selected category from catalog
  const filteredTools = catalog?.categories[selectedCategory as keyof typeof catalog.categories] || [];

  useEffect(() => {
    if (selectedTool) {
      // Initialize default adjustments based on tool inputs
      const defaults: Record<string, any> = {};
      selectedTool.inputs.forEach((input: string) => {
        if (adjustmentDefs[input]) {
          defaults[input] = adjustmentDefs[input].default;
        }
      });
      setAdjustments(defaults);
      setEstimatedPrice(selectedTool.base_price_cents);
    }
  }, [selectedTool]);

  useEffect(() => {
    calculatePrice();
  }, [adjustments, selectedTool]);

  const calculatePrice = () => {
    if (!selectedTool) return;

    let price = selectedTool.base_price_cents;

    // Apply adjustment multipliers and additions
    Object.keys(adjustments).forEach(key => {
      const def = adjustmentDefs[key];
      const value = adjustments[key];

      if (!def) return;

      if (def.type === 'select' && def.options) {
        const option = def.options.find((o: any) => o.value === value);
        if (option && option.multiplier) {
          price *= option.multiplier;
        }
      } else if (def.type === 'slider' && def.pricePerUnit) {
        price += value * def.pricePerUnit;
      } else if (def.type === 'checkbox' && value && def.priceAdd) {
        price += def.priceAdd;
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
      const result = await api.processJob({
        sku_code: selectedTool.sku_code,
        media_url: uploadedFiles.image || uploadedFiles.source_image || uploadedFiles.video || uploadedFiles.audio,
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
              {catalog ? `${catalog.total_tools} Professional UNCENSORED AI Tools` : 'Loading tools...'}
            </p>
          </motion.div>

          {isLoadingCatalog ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Loading tools...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Category Sidebar */}
              <div className="space-y-4">
                <div className="glass-card p-4">
                  <h3 className="font-semibold mb-3">Categories</h3>
                  <div className="space-y-2">
                    {categories.map((cat) => {
                      const toolCount = catalog?.categories[cat.id as keyof typeof catalog.categories]?.length || 0;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => {
                            setSelectedCategory(cat.id);
                            setSelectedTool(null);
                          }}
                          className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${selectedCategory === cat.id
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-gradient-to-br ${cat.gradient}`}>
                              <cat.icon className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-medium">{cat.name}</span>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${selectedCategory === cat.id
                            ? 'bg-primary-foreground/20'
                            : 'bg-muted'
                            }`}>
                            {toolCount}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Mode Toggle */}
                <div className="glass-card p-4">
                  <h3 className="font-semibold mb-3">Mode</h3>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setMode('simple')}
                      className={`p-3 rounded-lg text-sm font-medium transition-all ${mode === 'simple'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/70'
                        }`}
                    >
                      🎯 Simple Mode
                      <div className="text-xs opacity-80 mt-1">Quick presets</div>
                    </button>
                    <button
                      onClick={() => setMode('advanced')}
                      className={`p-3 rounded-lg text-sm font-medium transition-all ${mode === 'advanced'
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
                    {catalog?.category_names[selectedCategory] || categories.find(c => c.id === selectedCategory)?.name}
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredTools.map((tool) => (
                      <button
                        key={tool.sku_code}
                        onClick={() => setSelectedTool(tool)}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${selectedTool?.sku_code === tool.sku_code
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/30'
                          }`}
                      >
                        <div className="text-3xl mb-2">{tool.icon}</div>
                        <div className="font-semibold mb-1">{tool.display_name || tool.name}</div>
                        <div className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {tool.description}
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1">
                            <Coins className="w-3 h-3 text-primary" />
                            <span className="text-primary font-medium">
                              {displayCredits(tool.base_credits || Math.round(parseFloat(tool.base_price_usd) * 100))}
                            </span>
                          </div>
                          <span className="text-muted-foreground">{tool.sku_code}</span>
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
                      <div className="flex items-start gap-3 mb-4">
                        <span className="text-3xl">{selectedTool.icon}</span>
                        <div>
                          <h3 className="font-semibold">{selectedTool.display_name || selectedTool.name}</h3>
                          <p className="text-xs text-muted-foreground">{selectedTool.sku_code}</p>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mb-4">{selectedTool.description}</p>

                      {/* File Uploads based on tool inputs */}
                      {selectedTool.inputs.map((input: string) => {
                        if (input === 'image' || input === 'audio' || input === 'video') {
                          return (
                            <div key={input} className="mb-4">
                              <label className="block text-sm font-medium mb-2">
                                Upload {input.charAt(0).toUpperCase() + input.slice(1)}
                              </label>
                              <input
                                type="file"
                                accept={input === 'video' ? 'video/*' : input === 'audio' ? 'audio/*' : 'image/*'}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFileUpload(input, file);
                                }}
                                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                              />
                              {uploadedFiles[input] && (
                                <p className="text-xs text-green-500 mt-1">✓ File uploaded</p>
                              )}
                            </div>
                          );
                        }
                        return null;
                      })}

                      {/* Text inputs */}
                      {selectedTool.inputs.includes('prompt') && (
                        <div className="mb-4">
                          <label className="block text-sm font-medium mb-2">Prompt</label>
                          <Textarea
                            value={adjustments.prompt || ''}
                            onChange={(e) => setAdjustments(prev => ({ ...prev, prompt: e.target.value }))}
                            placeholder="Describe what you want..."
                            rows={3}
                          />
                        </div>
                      )}

                      {selectedTool.inputs.includes('text') && (
                        <div className="mb-4">
                          <label className="block text-sm font-medium mb-2">Text</label>
                          <Textarea
                            value={adjustments.text || ''}
                            onChange={(e) => setAdjustments(prev => ({ ...prev, text: e.target.value }))}
                            placeholder="Enter your text..."
                            rows={3}
                          />
                        </div>
                      )}

                      {/* Advanced Adjustments */}
                      {mode === 'advanced' && (
                        <div className="space-y-4 mt-6 pt-4 border-t border-border">
                          <div className="flex items-center gap-2 mb-4">
                            <Settings className="w-4 h-4" />
                            <h4 className="font-semibold">Advanced Options</h4>
                          </div>
                          {['resolution', 'duration', 'format', 'quality', 'style', 'fps', 'voice_type', 'language'].map(key => {
                            if (adjustmentDefs[key]) {
                              return renderAdjustment(key);
                            }
                            return null;
                          })}
                        </div>
                      )}

                      {mode === 'simple' && (
                        <div className="mt-4 p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                          ✨ Using optimized preset settings for best results
                        </div>
                      )}
                    </div>

                    {/* Price & Action */}
                    <div className="glass-card p-6">
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Estimated Price</span>
                          <span className="text-2xl font-bold text-primary">
                            {displayCredits(estimatedPrice)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Base: ${selectedTool.base_price_usd} • Credits: {selectedTool.base_credits}
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
          )}
        </div>
      </main>
    </div>
  );
}
