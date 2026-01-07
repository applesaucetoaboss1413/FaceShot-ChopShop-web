import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingCart,
  Loader2,
  Check,
  Plus,
  Minus,
  AlertCircle,
  Zap,
  LogOut,
  Award,
  Clock,
  Palette,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { api, SKU, PricingQuote, Flag } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';

const vectorCategories = [
  { id: 'v1', name: 'Images', code: 'V1' },
  { id: 'v3', name: 'Videos', code: 'V3' },
  { id: 'v4', name: 'Voice Clone', code: 'V4' },
  { id: 'v5', name: 'Voiceover', code: 'V5' },
  { id: 'v6', name: 'SEO Content', code: 'V6' },
  { id: 'v7', name: 'Bundles', code: 'V7' },
];

export default function CreatePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [selectedCategory, setSelectedCategory] = useState('v1');
  const [skus, setSKUs] = useState<SKU[]>([]);
  const [selectedSKU, setSelectedSKU] = useState<SKU | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [quote, setQuote] = useState<PricingQuote | null>(null);
  const [isLoadingSKUs, setIsLoadingSKUs] = useState(true);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [flags, setFlags] = useState<Flag[]>([]);
  const [selectedFlags, setSelectedFlags] = useState<string[]>([]);
  const [isLoadingFlags, setIsLoadingFlags] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    loadFlags();
  }, []);

  useEffect(() => {
    loadSKUs(selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedSKU) {
      loadQuote(selectedSKU.code, quantity, selectedFlags);
    }
  }, [selectedSKU, quantity, selectedFlags]);

  const loadFlags = async () => {
    setIsLoadingFlags(true);
    const result = await api.getFlags();

    if (result.success && result.data) {
      setFlags(result.data);
    } else {
      toast({
        title: 'Unable to load pricing options',
        description: result.error || 'Please try again later.',
        variant: 'destructive',
      });
    }

    setIsLoadingFlags(false);
  };

  const loadSKUs = async (vectorId: string) => {
    setIsLoadingSKUs(true);
    const result = await api.getSKUs(vectorId);

    if (result.success && result.data) {
      setSKUs(result.data);
      if (result.data.length > 0) {
        setSelectedSKU(result.data[0]);
      }
    } else {
      toast({
        title: 'Unable to load products',
        description: result.error || 'Please try again later.',
        variant: 'destructive',
      });
    }

    setIsLoadingSKUs(false);
  };

  const loadQuote = async (skuCode: string, qty: number, appliedFlags: string[]) => {
    setIsLoadingQuote(true);
    setQuote(null);

    const result = await api.getPricingQuote(skuCode, qty, appliedFlags);

    if (result.success && result.data) {
      setQuote(result.data);
    } else {
      toast({
        title: 'Unable to calculate price',
        description: result.error || 'Please try again.',
        variant: 'destructive',
      });
    }

    setIsLoadingQuote(false);
  };

  const handleQuantityChange = (delta: number) => {
    const newQty = Math.max(1, Math.min(100, quantity + delta));
    setQuantity(newQty);
  };

  const toggleFlag = (flagCode: string) => {
    setSelectedFlags(prev => {
      if (prev.includes(flagCode)) {
        return prev.filter(f => f !== flagCode);
      } else {
        return [...prev, flagCode];
      }
    });
  };

  const getFlagIcon = (flagCode: string) => {
    if (flagCode === 'R') return <Clock className="w-4 h-4" />;
    if (flagCode === 'C') return <Palette className="w-4 h-4" />;
    if (flagCode.startsWith('L_')) return <Award className="w-4 h-4" />;
    return <Check className="w-4 h-4" />;
  };

  const handlePlaceOrder = async () => {
    if (!selectedSKU || !quote) return;

    setIsPlacingOrder(true);
    setOrderSuccess(false);

    try {
      const result = await api.createOrder({
        sku_code: selectedSKU.code,
        quantity,
        flags: selectedFlags,
      });

      if (result.success && result.data) {
        setOrderSuccess(true);
        toast({
          title: 'Order placed successfully!',
          description: `Order #${result.data.order_id} has been created. You will be contacted regarding delivery.`,
        });

        // Reset form after a delay
        setTimeout(() => {
          setOrderSuccess(false);
          setQuantity(1);
          setSelectedFlags([]);
        }, 3000);
      } else {
        toast({
          title: 'Order failed',
          description: result.error || 'Unable to place order. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Order failed',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
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
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                Dashboard
              </Button>
            </Link>

            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h1 className="text-3xl font-bold mb-2">Order Creation Services</h1>
              <p className="text-muted-foreground">
                Select a service category and configure your order to see real-time pricing
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Panel - Categories and SKUs */}
              <div className="lg:col-span-2 space-y-6">
                {/* Category Selection */}
                <div className="glass-card p-6">
                  <h2 className="text-lg font-semibold mb-4">Service Category</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {vectorCategories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`p-4 rounded-xl border-2 transition-all text-center ${selectedCategory === cat.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/30'
                          }`}
                      >
                        <div className="font-semibold">{cat.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{cat.code}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* SKU Selection */}
                <div className="glass-card p-6">
                  <h2 className="text-lg font-semibold mb-4">Select Service</h2>

                  {isLoadingSKUs ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : skus.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      No services available in this category
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {skus.map((sku) => (
                        <button
                          key={sku.id}
                          onClick={() => setSelectedSKU(sku)}
                          className={`p-4 rounded-xl border-2 transition-all text-left ${selectedSKU?.id === sku.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/30'
                            }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-semibold mb-1">{sku.name}</div>
                              <div className="text-sm text-muted-foreground mb-2">
                                {sku.description}
                              </div>
                              <div className="flex items-center gap-4 text-xs">
                                <span className="text-muted-foreground">
                                  {sku.baseCredits} credits (~{Math.floor(sku.baseCredits / 60)} min)
                                </span>
                                <span className="text-primary font-medium">
                                  ${sku.basePriceUsd}
                                </span>
                              </div>
                            </div>
                            {selectedSKU?.id === sku.id && (
                              <Check className="w-5 h-5 text-primary flex-shrink-0" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quantity Selection */}
                {selectedSKU && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-6"
                  >
                    <h2 className="text-lg font-semibold mb-4">Quantity</h2>
                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>

                      <div className="flex-1 text-center">
                        <div className="text-3xl font-bold">{quantity}</div>
                        <div className="text-sm text-muted-foreground">units</div>
                      </div>

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleQuantityChange(1)}
                        disabled={quantity >= 100}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    {quantity >= 50 && (
                      <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                        <p className="text-sm text-green-400 flex items-center gap-2">
                          <Check className="w-4 h-4" />
                          Bulk discount applied: 25% off
                        </p>
                      </div>
                    )}
                    {quantity >= 10 && quantity < 50 && (
                      <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <p className="text-sm text-blue-400 flex items-center gap-2">
                          <Check className="w-4 h-4" />
                          Batch discount applied: 15% off
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Customization Options */}
                {selectedSKU && !isLoadingFlags && flags.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-6"
                  >
                    <h2 className="text-lg font-semibold mb-4">Customization Options</h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      Enhance your order with these optional features. Pricing updates automatically.
                    </p>

                    <div className="space-y-3">
                      {flags
                        .filter(flag => {
                          // Filter out default flags and batch flag (auto-applied)
                          if (flag.code === 'B') return false;
                          if (selectedSKU.defaultFlags.includes(flag.code)) return false;
                          return true;
                        })
                        .map((flag) => (
                          <div
                            key={flag.id}
                            className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${selectedFlags.includes(flag.code)
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/30'
                              }`}
                            onClick={() => toggleFlag(flag.code)}
                          >
                            <div className="flex items-start gap-3">
                              <Checkbox
                                checked={selectedFlags.includes(flag.code)}
                                onCheckedChange={() => toggleFlag(flag.code)}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  {getFlagIcon(flag.code)}
                                  <span className="font-semibold">{flag.label}</span>
                                  {flag.priceMultiplier !== 1.0 && (
                                    <span className="text-xs text-primary font-medium">
                                      ×{flag.priceMultiplier}
                                    </span>
                                  )}
                                  {flag.priceAddFlatCents > 0 && (
                                    <span className="text-xs text-primary font-medium">
                                      +${flag.priceAddFlatUsd}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {flag.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>

                    {selectedSKU.defaultFlags.length > 0 && (
                      <div className="mt-4 p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">
                          <strong>Included:</strong> {selectedSKU.defaultFlags.map(code => {
                            const flag = flags.find(f => f.code === code);
                            return flag?.label || code;
                          }).join(', ')}
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Right Panel - Quote Summary */}
              <div className="space-y-6">
                <div className="glass-card p-6 sticky top-24">
                  <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

                  {!selectedSKU ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Select a service to see pricing
                    </div>
                  ) : isLoadingQuote ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : quote ? (
                    <div className="space-y-4">
                      <div>
                        <div className="font-medium mb-1">{quote.skuName}</div>
                        <div className="text-sm text-muted-foreground">
                          Quantity: {quote.quantity}
                        </div>
                        {quote.appliedFlags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {quote.appliedFlags.map(flagCode => {
                              const flag = flags.find(f => f.code === flagCode);
                              return flag ? (
                                <span key={flagCode} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs">
                                  {getFlagIcon(flagCode)}
                                  {flag.label}
                                </span>
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 pt-4 border-t border-border">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Base Price</span>
                          <span>${(quote.customerPriceCents / 100).toFixed(2)}</span>
                        </div>

                        {quote.overageSeconds > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Overage ({Math.floor(quote.overageSeconds / 60)} min)
                            </span>
                            <span className="text-orange-400">${quote.overageCostUsd}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Processing Time</span>
                          <span>{Math.floor(quote.totalSeconds / 60)} minutes</span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">Total Price</span>
                          <span className="text-2xl font-bold text-primary">
                            ${quote.customerPriceUsd}
                          </span>
                        </div>

                        {quote.secondsFromPlan > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {Math.floor(quote.secondsFromPlan / 60)} min from plan included
                          </div>
                        )}
                      </div>

                      {quote.overageSeconds > 0 && (
                        <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-orange-400">
                              This order exceeds your plan limits. Additional overage charges will apply.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="pt-4">
                        <div className="text-xs text-muted-foreground mb-1">
                          Margin: {quote.marginPercent}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Plan minutes remaining: {Math.floor(quote.remainingPlanSeconds / 60)}
                        </div>
                      </div>

                      {orderSuccess ? (
                        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                          <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                          <p className="text-sm text-green-400 font-medium">
                            Order placed successfully!
                          </p>
                        </div>
                      ) : (
                        <Button
                          variant="hero"
                          size="lg"
                          className="w-full"
                          onClick={handlePlaceOrder}
                          disabled={isPlacingOrder}
                        >
                          {isPlacingOrder ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Placing Order...
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-5 h-5 mr-2" />
                              Place Order
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-destructive text-sm">
                      Unable to calculate pricing
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
