import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import {
  getUserCurrency,
  setUserCurrency,
  getAllCurrencies,
  type CurrencyCode,
} from '@/lib/currency';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface CurrencySelectorProps {
  onCurrencyChange?: (currency: CurrencyCode) => void;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg';
}

export function CurrencySelector({
  onCurrencyChange,
  variant = 'ghost',
  size = 'sm',
}: CurrencySelectorProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('USD');
  const currencies = getAllCurrencies();

  useEffect(() => {
    // Load user's currency preference on mount
    const userCurrency = getUserCurrency();
    setSelectedCurrency(userCurrency);
  }, []);

  const handleCurrencyChange = (currency: CurrencyCode) => {
    setSelectedCurrency(currency);
    setUserCurrency(currency);
    onCurrencyChange?.(currency);
  };

  const currentCurrency = currencies.find((c) => c.code === selectedCurrency);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className="gap-2">
          <Globe className="w-4 h-4" />
          <span className="hidden sm:inline">
            {currentCurrency?.symbol} {currentCurrency?.code}
          </span>
          <span className="sm:hidden">{currentCurrency?.symbol}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {currencies.map((currency) => (
          <DropdownMenuItem
            key={currency.code}
            onClick={() => handleCurrencyChange(currency.code)}
            className={`flex items-center justify-between cursor-pointer ${
              currency.code === selectedCurrency ? 'bg-primary/10' : ''
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="text-lg">{currency.symbol}</span>
              <span className="font-medium">{currency.code}</span>
            </span>
            <span className="text-sm text-muted-foreground">{currency.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
