import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { api, PricingPlan } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const planFeatures: Record<string, string[]> = {
  starter: [
    'Includes monthly minutes for image-to-video',
    'Fair usage limits',
    'Standard support',
  ],
  pro: [
    'More monthly minutes',
    'Priority processing',
    'Priority support',
  ],
  agency: [
    'Highest monthly minutes',
    'Best overage rates',
    'Dedicated support',
  ],
};

export function PricingSection() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;

    const loadPlans = async () => {
      const result = await api.getPricingPlans();

      if (!isMounted) return;

      if (result.success && result.data) {
        setPlans(result.data);
      } else {
        toast({
          title: 'Unable to load pricing',
          description: result.error || 'Please try again later.',
          variant: 'destructive',
        });
      }

      setIsLoading(false);
    };

    loadPlans();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  const handleCheckout = async (plan: PricingPlan) => {
    const codeKey = plan.code.toLowerCase();

    if (!isAuthenticated) {
      const planParam =
        codeKey === 'agency'
          ? 'enterprise'
          : codeKey;

      navigate(`/signup?plan=${encodeURIComponent(planParam)}`);
      return;
    }

    setActivePlanId(plan.id);

    const result = await api.createCheckoutSession(plan.id);

    if (result.success && result.data?.url) {
      window.location.href = result.data.url;
      return;
    }

    setActivePlanId(null);

    toast({
      title: 'Checkout failed',
      description: result.error || 'Unable to start subscription checkout.',
      variant: 'destructive',
    });
  };

  return (
    <section id="pricing" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-4"
          >
            Pricing
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
          >
            Simple, <span className="gradient-text">Transparent</span> Pricing
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
          >
            Pay only for what you use. No subscriptions, no hidden fees. Credits never expire.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {isLoading && (
            <div className="md:col-span-3 text-center text-muted-foreground">
              Loading pricing...
            </div>
          )}

          {!isLoading && plans.map((plan, index) => {
            const codeKey = plan.code.toLowerCase();
            const features = planFeatures[codeKey] || [
              'Includes monthly processing minutes',
              'Access to all tools',
              'Standard support',
            ];

            const isPopular = index === 1 || codeKey === 'pro';

            return (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative glass-card p-8 ${
                isPopular 
                  ? 'border-primary/50 shadow-glow scale-105 md:scale-110' 
                  : ''
              }`}
            >
              {isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                    <Zap className="w-3 h-3" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold">${plan.monthlyPriceUsd.toFixed(2)}</span>
                  <span className="text-muted-foreground">per month</span>
                </div>
                <div className="text-primary font-semibold mt-1">
                  Includes approximately {(plan.includedSeconds / 60).toFixed(0)} minutes
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
              </ul>

              <Button 
                variant={isPopular ? 'hero' : 'outline'} 
                className="w-full"
                onClick={() => handleCheckout(plan)}
                disabled={activePlanId === plan.id}
              >
                {activePlanId === plan.id ? 'Redirecting to checkout...' : isAuthenticated ? 'Subscribe' : 'Get Started'}
              </Button>
            </motion.div>
          )})}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-muted-foreground text-sm mt-12"
        >
          All plans include a 7-day money-back guarantee. No questions asked.
        </motion.p>
      </div>
    </section>
  );
}
