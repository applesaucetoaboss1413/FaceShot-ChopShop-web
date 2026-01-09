import { useState, useEffect } from 'react';
import { Coins, Plus, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

interface CreditBalanceProps {
  variant?: 'default' | 'compact' | 'detailed';
  showBuyButton?: boolean;
  className?: string;
}

export function CreditBalance({
  variant = 'default',
  showBuyButton = true,
  className = '',
}: CreditBalanceProps) {
  const { user } = useAuth();
  const [credits, setCredits] = useState(user?.credits || 0);
  const [loading, setLoading] = useState(false);

  // Fetch latest credit balance
  useEffect(() => {
    if (user) {
      fetchCredits();
    }
  }, [user]);

  const fetchCredits = async () => {
    setLoading(true);
    try {
      const result = await api.getCredits();
      if (result.success && result.data) {
        setCredits(result.data.credits);
      }
    } catch (error) {
      console.error('Failed to fetch credits:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  // Compact variant - just the number and icon
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Coins className="w-4 h-4 text-primary" />
        <span className="font-semibold">{loading ? '...' : credits.toLocaleString()}</span>
      </div>
    );
  }

  // Detailed variant - with more stats
  if (variant === 'detailed') {
    return (
      <div className={`glass-card p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Coins className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Available Credits</div>
              <div className="text-2xl font-bold">
                {loading ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  credits.toLocaleString()
                )}
              </div>
            </div>
          </div>
          {showBuyButton && (
            <Link to="/pricing">
              <Button size="sm" variant="glow">
                <Plus className="w-4 h-4 mr-1" />
                Buy
              </Button>
            </Link>
          )}
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link 
            to="/points-history" 
            className="flex items-center gap-1 hover:text-primary transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            View History
          </Link>
        </div>
      </div>
    );
  }

  // Default variant - inline with button
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted">
        <Coins className="w-4 h-4 text-primary" />
        <span className="font-semibold">{loading ? '...' : credits.toLocaleString()}</span>
        <span className="text-muted-foreground text-sm hidden sm:inline">credits</span>
      </div>

      {showBuyButton && (
        <Link to="/pricing">
          <Button variant="glow" size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Buy Credits
          </Button>
        </Link>
      )}
    </div>
  );
}
