// Currency utility for multi-currency support

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY' | 'INR';

export interface Currency {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rate: number; // Exchange rate relative to USD
}

// Fixed exchange rates (update quarterly)
export const currencies: Record<CurrencyCode, Currency> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1.0 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.79 },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rate: 1.36 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 1.53 },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 149.50 },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 83.12 },
};

/**
 * Detect user's currency from browser locale
 */
export function detectUserCurrency(): CurrencyCode {
  try {
    const locale = navigator.language || 'en-US';
    const region = locale.split('-')[1]?.toUpperCase();

    // Map regions to currency codes
    const regionToCurrency: Record<string, CurrencyCode> = {
      US: 'USD',
      GB: 'GBP',
      UK: 'GBP',
      EU: 'EUR',
      DE: 'EUR',
      FR: 'EUR',
      ES: 'EUR',
      IT: 'EUR',
      CA: 'CAD',
      AU: 'AUD',
      JP: 'JPY',
      IN: 'INR',
    };

    const detected = region && regionToCurrency[region];
    if (detected) {
      return detected;
    }

    // Try to detect from timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone.includes('London')) return 'GBP';
    if (timezone.includes('Europe')) return 'EUR';

    return 'USD'; // Default to USD
  } catch (error) {
    console.error('Currency detection failed:', error);
    return 'USD';
  }
}

/**
 * Get currency from localStorage or detect
 */
export function getUserCurrency(): CurrencyCode {
  try {
    const stored = localStorage.getItem('preferred_currency') as CurrencyCode | null;
    if (stored && currencies[stored]) {
      return stored;
    }
  } catch (error) {
    console.error('Failed to get stored currency:', error);
  }
  return detectUserCurrency();
}

/**
 * Save user's currency preference
 */
export function setUserCurrency(currency: CurrencyCode): void {
  try {
    localStorage.setItem('preferred_currency', currency);
  } catch (error) {
    console.error('Failed to save currency preference:', error);
  }
}

/**
 * Convert USD price to target currency
 */
export function convertPrice(usdPrice: number, targetCurrency: CurrencyCode): number {
  const currency = currencies[targetCurrency];
  if (!currency) return usdPrice;
  
  return usdPrice * currency.rate;
}

/**
 * Format price with currency symbol
 */
export function formatPrice(
  usdPrice: number,
  targetCurrency: CurrencyCode,
  options?: {
    showCode?: boolean;
    decimals?: number;
  }
): string {
  const { showCode = true, decimals = 2 } = options || {};
  
  const currency = currencies[targetCurrency];
  if (!currency) return `$${usdPrice.toFixed(decimals)}`;
  
  const convertedPrice = convertPrice(usdPrice, targetCurrency);
  
  // Special formatting for JPY (no decimals)
  const formattedAmount = targetCurrency === 'JPY'
    ? Math.round(convertedPrice).toLocaleString()
    : convertedPrice.toFixed(decimals);
  
  const priceString = `${currency.symbol}${formattedAmount}`;
  
  return showCode ? `${priceString} ${currency.code}` : priceString;
}

/**
 * Get all available currencies for selector
 */
export function getAllCurrencies(): Currency[] {
  return Object.values(currencies);
}

/**
 * Format currency for display in selector
 */
export function formatCurrencyOption(currency: Currency): string {
  return `${currency.symbol} ${currency.code} - ${currency.name}`;
}
