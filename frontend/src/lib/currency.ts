/**
 * Currency Detection and Management
 * BUG #5 FIX: Frontend currency detection to work with backend multi-currency support
 */

// Map browser locales to currency codes
const LOCALE_TO_CURRENCY: Record<string, string> = {
  'en-US': 'usd',
  'en-GB': 'gbp',
  'en-CA': 'cad',
  'en-AU': 'aud',
  'en-NZ': 'nzd',
  'es-MX': 'mxn',
  'es-ES': 'eur',
  'es-AR': 'ars',
  'es-CL': 'clp',
  'es-CO': 'cop',
  'pt-BR': 'brl',
  'fr-FR': 'eur',
  'de-DE': 'eur',
  'it-IT': 'eur',
  'nl-NL': 'eur',
  'pl-PL': 'pln',
  'ja-JP': 'jpy',
  'ko-KR': 'krw',
  'zh-CN': 'cny',
  'zh-TW': 'twd',
  'hi-IN': 'inr',
  'th-TH': 'thb',
  'id-ID': 'idr',
  'vi-VN': 'vnd',
  'tr-TR': 'try',
  'ru-RU': 'rub',
  'sv-SE': 'sek',
  'no-NO': 'nok',
  'da-DK': 'dkk',
  'fi-FI': 'eur',
};

const DEFAULT_CURRENCY = 'mxn';
const CURRENCY_STORAGE_KEY = 'user_currency';

/**
 * Detect user's currency from browser locale
 */
export function detectCurrency(): string {
  // First, check if user has manually set a currency preference
  const storedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY);
  if (storedCurrency) {
    return storedCurrency.toLowerCase();
  }

  // Try to detect from navigator.language
  if (navigator.language) {
    const locale = navigator.language;
    
    // Try exact match first
    if (LOCALE_TO_CURRENCY[locale]) {
      return LOCALE_TO_CURRENCY[locale];
    }

    // Try language-only match (e.g., 'en' from 'en-US')
    const languageCode = locale.split('-')[0];
    const matchingLocale = Object.keys(LOCALE_TO_CURRENCY).find(
      (key) => key.startsWith(languageCode + '-')
    );
    
    if (matchingLocale) {
      return LOCALE_TO_CURRENCY[matchingLocale];
    }
  }

  // Try all available locales
  if (navigator.languages && navigator.languages.length > 0) {
    for (const lang of navigator.languages) {
      if (LOCALE_TO_CURRENCY[lang]) {
        return LOCALE_TO_CURRENCY[lang];
      }
    }
  }

  // Default fallback
  return DEFAULT_CURRENCY;
}

/**
 * Get current user currency (cached or detected)
 */
export function getUserCurrency(): string {
  const currency = detectCurrency();
  // Cache it for future use
  localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
  return currency;
}

/**
 * Manually set user's preferred currency
 */
export function setUserCurrency(currency: string): void {
  localStorage.setItem(CURRENCY_STORAGE_KEY, currency.toLowerCase());
}

/**
 * Get currency symbol for display
 */
export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    usd: '$', eur: '€', gbp: '£', mxn: '$', cad: 'C$', aud: 'A$', jpy: '¥',
    cny: '¥', inr: '₹', brl: 'R$', chf: 'CHF', sek: 'kr', nok: 'kr', dkk: 'kr',
    pln: 'zł', czk: 'Kč', huf: 'Ft', ron: 'lei', try: '₺', zar: 'R', sgd: 'S$',
    hkd: 'HK$', nzd: 'NZ$', krw: '₩', thb: '฿', myr: 'RM', php: '₱', idr: 'Rp',
    vnd: '₫', twd: 'NT$', ars: '$', clp: '$', cop: '$', pen: 'S/', uyu: '$'
  };
  return symbols[currency.toLowerCase()] || '$';
}
