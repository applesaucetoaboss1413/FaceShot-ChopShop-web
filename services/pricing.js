const { getMonthPeriod } = require('./date-utils');
const db = require('../db/mongo');

// Currency symbols mapping
const CURRENCY_SYMBOLS = {
  usd: '$', eur: '€', gbp: '£', mxn: '$', cad: 'C$', aud: 'A$', jpy: '¥',
  cny: '¥', inr: '₹', brl: 'R$', chf: 'CHF', sek: 'kr', nok: 'kr', dkk: 'kr',
  pln: 'zł', czk: 'Kč', huf: 'Ft', ron: 'lei', try: '₺', zar: 'R', sgd: 'S$',
  hkd: 'HK$', nzd: 'NZ$', krw: '₩', thb: '฿', myr: 'RM', php: '₱', idr: 'Rp',
  vnd: '₫', twd: 'NT$', ars: '$', clp: '$', cop: '$', pen: 'S/', uyu: '$'
};

class PricingEngine {
  constructor() {
    this.COST_PER_CREDIT = Number(process.env.COST_PER_CREDIT || 0.0111);
    this.MIN_MARGIN = Number(process.env.MIN_MARGIN || 0.40);
  }

  async quote(userId, skuCode, quantity = 1, appliedFlags = [], currency = 'usd') {
    const sku = await db.getSkuByCode(skuCode);
    if (!sku) throw new Error('sku_not_found');

    const userPlan = await db.getUserActivePlan(userId);

    let remainingSeconds = 0;
    if (userPlan) {
      const plan = await db.getPlanById(userPlan.plan_id);
      const usage = await this.getCurrentPeriodUsage(userId, userPlan.plan_id);
      remainingSeconds = plan.included_seconds - (usage ? usage.seconds_used : 0);
      remainingSeconds = Math.max(0, remainingSeconds);
    }

    const totalCredits = sku.base_credits * quantity;
    const totalSeconds = totalCredits;

    const defaultFlags = sku.default_flags || [];
    const allFlags = [...new Set([...defaultFlags, ...appliedFlags])];

    // BUG 6 FIX: Validate flag codes are alphanumeric before SQL execution
    const validFlagPattern = /^[A-Za-z0-9_]+$/;
    const validatedFlags = allFlags.filter(flag => {
      if (!validFlagPattern.test(flag)) {
        console.warn(`Invalid flag code rejected: ${flag}`);
        return false;
      }
      return true;
    });

    const flagRecords = validatedFlags.length > 0
      ? await db.getFlagsByCodes(validatedFlags)
      : [];

    let price = sku.base_price_cents * quantity;

    let totalMultiplier = 1.0;
    let totalFlatAdd = 0;

    for (const flag of flagRecords) {
      if (flag.price_multiplier !== 1.0) {
        totalMultiplier *= flag.price_multiplier;
      }
      if (flag.price_add_flat_cents > 0) {
        totalFlatAdd += flag.price_add_flat_cents;
      }
    }

    // Apply batch quantity discounts (B flag logic)
    if (quantity >= 50) {
      totalMultiplier *= 0.75;
    } else if (quantity >= 10) {
      totalMultiplier *= 0.85;
    }

    price = Math.round(price * totalMultiplier) + totalFlatAdd;

    let secondsFromPlan = 0;
    let overageSeconds = 0;
    let overageCost = 0;

    if (userPlan) {
      const plan = await db.getPlanById(userPlan.plan_id);
      secondsFromPlan = Math.min(totalSeconds, remainingSeconds);
      overageSeconds = Math.max(0, totalSeconds - remainingSeconds);
      overageCost = overageSeconds * plan.overage_rate_per_second_cents;
    }

    const customerPrice = price + overageCost;

    const internalCost = Math.round(totalCredits * this.COST_PER_CREDIT * 100);
    const margin = customerPrice > 0 ? (customerPrice - internalCost) / customerPrice : 0;

    if (margin < this.MIN_MARGIN) {
      throw new Error(`margin_too_low: ${(margin * 100).toFixed(1)}% < ${(this.MIN_MARGIN * 100)}%`);
    }

    return {
      sku_code: skuCode,
      sku_name: sku.name,
      quantity,
      applied_flags: allFlags,
      currency: currency.toLowerCase(),
      customer_price_cents: customerPrice,
      customer_price_display: `${CURRENCY_SYMBOLS[currency.toLowerCase()] || '$'}${(customerPrice / 100).toFixed(2)}`,
      internal_cost_cents: internalCost,
      internal_cost_usd: (internalCost / 100).toFixed(2),
      margin_percent: (margin * 100).toFixed(1),
      total_seconds: totalSeconds,
      seconds_from_plan: secondsFromPlan,
      overage_seconds: overageSeconds,
      overage_cost_cents: overageCost,
      overage_cost_usd: (overageCost / 100).toFixed(2),
      remaining_plan_seconds: remainingSeconds
    };
  }

  async getUserActivePlan(userId) {
    return await db.getUserActivePlan(userId);
  }

  // BUG #1 FIX: Use shared date helper for consistent period calculations
  async getCurrentPeriodUsage(userId, planId) {
    const now = new Date();
    const { periodStart, periodEnd } = getMonthPeriod(now);

    let usage = await db.getCurrentPeriodUsage(userId, planId, periodStart, periodEnd);

    if (!usage) {
      usage = await db.createOrUpdatePlanUsage(userId, planId, periodStart, periodEnd, 0);
    }

    return usage;
  }

  // BUG #1 FIX: Use shared date helper for consistent period calculations
  async deductUsage(userId, planId, seconds) {
    const now = new Date();
    const { periodStart, periodEnd } = getMonthPeriod(now);

    // Ensure usage record exists (this creates it if missing)
    await this.getCurrentPeriodUsage(userId, planId);

    // Now update the existing record
    await db.deductUsage(userId, planId, periodStart, periodEnd, seconds);
  }
}

module.exports = PricingEngine;
