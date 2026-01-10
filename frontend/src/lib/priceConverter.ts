// Pattern 1: Convert string "4.99" to credits
export function stringUSDToCredits(usdString: string): number {
    const dollars = parseFloat(usdString); // "4.99" → 4.99
    return Math.round(dollars * 100); // 4.99 → 499
}

// Pattern 2: Cents are already credits (pass through)
export function centsToCredits(cents: number): number {
    return cents; // 499 → 499 (no change needed!)
}

// Pattern 3: Hardcoded dollar numbers to credits
export function dollarNumberToCredits(dollars: number): number {
    return Math.round(dollars * 100); // 4.99 → 499
}

// Universal display formatter
export function displayCredits(credits: number): string {
    if (credits === 0) return 'Free ⚡';
    return `${Math.round(credits)} ⚡`;
}

// Convenience: Accept anything, return display string
export function anyPriceToCreditsDisplay(value: string | number | undefined): string {
    if (!value && value !== 0) return 'N/A';

    if (typeof value === 'string') {
        return displayCredits(stringUSDToCredits(value));
    }

    // Assume it's already in cents or credits
    return displayCredits(value);
}