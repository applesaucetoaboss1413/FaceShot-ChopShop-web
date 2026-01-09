/**
 * Date Utility Functions for Consistent Period Calculations
 * Fixes Bug #1 and Bug #6: Ensures period_end represents the last millisecond of the month
 */

/**
 * Get the start and end dates for the current billing period (month)
 * @param {Date} date - Optional date to calculate period for (defaults to now)
 * @returns {Object} Object containing periodStart and periodEnd as ISO strings
 */
function getMonthPeriod(date = new Date()) {
    // Start of the month at 00:00:00.000
    const start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
    
    // Last day of the month at 23:59:59.999
    // Setting day to 0 of next month gets the last day of current month
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
    
    return {
        periodStart: start.toISOString(),
        periodEnd: end.toISOString()
    };
}

/**
 * Check if a date falls within a period
 * @param {string} dateStr - ISO date string to check
 * @param {string} periodStart - ISO date string for period start
 * @param {string} periodEnd - ISO date string for period end
 * @returns {boolean} True if date is within period
 */
function isDateInPeriod(dateStr, periodStart, periodEnd) {
    const date = new Date(dateStr);
    const start = new Date(periodStart);
    const end = new Date(periodEnd);
    
    return date >= start && date <= end;
}

module.exports = {
    getMonthPeriod,
    isDateInPeriod
};
