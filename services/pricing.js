class PricingEngine {
  constructor(db) {
    this.db = db;
    this.COST_PER_CREDIT = Number(process.env.COST_PER_CREDIT || 0.0111);
    this.MIN_MARGIN = Number(process.env.MIN_MARGIN || 0.40);
  }

  async quote(userId, skuCode, quantity = 1, appliedFlags = []) {
    const sku = this.db.prepare('SELECT * FROM skus WHERE code = ? AND active = 1').get(skuCode);
    if (!sku) throw new Error('sku_not_found');

    const userPlan = this.getUserActivePlan(userId);
    
    let remainingSeconds = 0;
    if (userPlan) {
      const plan = this.db.prepare('SELECT * FROM plans WHERE id = ?').get(userPlan.plan_id);
      const usage = this.getCurrentPeriodUsage(userId, userPlan.plan_id);
      remainingSeconds = plan.included_seconds - (usage ? usage.seconds_used : 0);
      remainingSeconds = Math.max(0, remainingSeconds);
    }

    const totalCredits = sku.base_credits * quantity;
    const totalSeconds = totalCredits;

    const defaultFlags = JSON.parse(sku.default_flags || '[]');
    const allFlags = [...new Set([...defaultFlags, ...appliedFlags])];

    const flagRecords = allFlags.length > 0 
      ? this.db.prepare(`SELECT * FROM flags WHERE code IN (${allFlags.map(() => '?').join(',')}) AND active = 1`).all(...allFlags)
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
      const plan = this.db.prepare('SELECT * FROM plans WHERE id = ?').get(userPlan.plan_id);
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
      customer_price_cents: customerPrice,
      customer_price_usd: (customerPrice / 100).toFixed(2),
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

  getUserActivePlan(userId) {
    const now = new Date().toISOString();
    return this.db.prepare(`
      SELECT * FROM user_plans 
      WHERE user_id = ? 
        AND status = 'active' 
        AND start_date <= ? 
        AND (end_date IS NULL OR end_date > ?)
      ORDER BY start_date DESC 
      LIMIT 1
    `).get(userId, now, now);
  }

  getCurrentPeriodUsage(userId, planId) {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    let usage = this.db.prepare(`
      SELECT * FROM plan_usage 
      WHERE user_id = ? 
        AND plan_id = ? 
        AND period_start = ? 
        AND period_end = ?
    `).get(userId, planId, periodStart, periodEnd);

    if (!usage) {
      this.db.prepare(`
        INSERT INTO plan_usage (user_id, plan_id, period_start, period_end, seconds_used, created_at, updated_at)
        VALUES (?, ?, ?, ?, 0, ?, ?)
      `).run(userId, planId, periodStart, periodEnd, now.toISOString(), now.toISOString());

      usage = { user_id: userId, plan_id: planId, seconds_used: 0, period_start: periodStart, period_end: periodEnd };
    }

    return usage;
  }

  // BUG 3 FIX: Properly handle getCurrentPeriodUsage - ensure period exists before update
  deductUsage(userId, planId, seconds) {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    // Ensure usage record exists (this creates it if missing)
    const usage = this.getCurrentPeriodUsage(userId, planId);
    
    // Now update the existing record
    this.db.prepare(`
      UPDATE plan_usage 
      SET seconds_used = seconds_used + ?, updated_at = ?
      WHERE user_id = ? AND plan_id = ? AND period_start = ? AND period_end = ?
    `).run(seconds, now.toISOString(), userId, planId, periodStart, periodEnd);
  }
}

module.exports = PricingEngine;
