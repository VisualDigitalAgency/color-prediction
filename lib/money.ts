/**
 * lib/money.ts — Integer minor-unit money helpers.
 *
 * The entire app stores monetary values as integer minor-units (e.g. cents).
 * 1284.50 USDT → 128450. Format ONLY at the display edge using formatMoney().
 * NEVER do float arithmetic on balances — use these helpers exclusively.
 *
 * Minor-units are always non-negative integers. The deposit/withdrawal amounts
 * are always positive; direction is captured in Transaction.dir (+1/-1).
 */

/** Number of decimal places for USDT display (2 = cents) */
const DECIMALS = 2;
const SCALE = Math.pow(10, DECIMALS); // 100

/**
 * Convert a display float to integer minor-units.
 * 1284.5  → 128450
 * 0.01    → 1
 * Rounds to nearest integer to handle float imprecision (e.g. 0.1 + 0.2).
 */
export function toMinor(display: number): number {
  return Math.round(display * SCALE);
}

/**
 * Convert integer minor-units to a display float.
 * 128450 → 1284.5
 * 1      → 0.01
 * Use only for display/formatting — never in arithmetic.
 */
export function fromMinor(minor: number): number {
  return minor / SCALE;
}

/**
 * Add two minor-unit amounts. Both must already be in minor-units.
 * Returns an integer.
 */
export function add(a: number, b: number): number {
  return (a | 0) + (b | 0);
}

/**
 * Subtract b from a (minor-units). Both must already be in minor-units.
 * Returns 0 if the result would be negative — a balance can never go below zero.
 */
export function sub(a: number, b: number): number {
  const result = (a | 0) - (b | 0);
  return result > 0 ? result : 0;
}

/**
 * Multiply a minor-unit amount by a decimal multiplier (e.g. a payout ratio).
 * Result is floored to an integer minor-unit.
 *
 * Example: mul(10000, 2)   → 20000  (10000 minor-units × 2× payout = 20000)
 *          mul(10000, 4.5) → 45000  (violet payout)
 *          mul(10000, 9)   → 90000  (number payout)
 */
export function mul(minor: number, multiplier: number): number {
  return Math.floor((minor | 0) * multiplier);
}

/**
 * Format a minor-unit amount as a display string.
 * 128450          → "1,284.50"
 * 128450, {symbol:'USDT'} → "1,284.50 USDT"
 * 500, {decimals:0}       → "5"
 *
 * @param minor   - integer minor-unit value
 * @param opts    - optional symbol (appended after space) and decimal override
 */
export function formatMoney(
  minor: number,
  opts?: { symbol?: string; decimals?: number },
): string {
  const decimals = opts?.decimals ?? DECIMALS;
  const display = (minor | 0) / SCALE;
  const formatted = display.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return opts?.symbol ? `${formatted} ${opts.symbol}` : formatted;
}
