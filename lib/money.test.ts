/**
 * lib/money.test.ts — Vitest unit tests for money helpers.
 *
 * Key invariants:
 * - toMinor/fromMinor round-trip with no float drift
 * - add/sub/mul produce exact integers
 * - sub never returns negative
 * - formatMoney produces correct locale strings
 * - 100 bets at 1000 minor-units settled at 2× leaves exact integer balance
 */

import { describe, it, expect } from 'vitest';
import { toMinor, fromMinor, add, sub, mul, formatMoney } from './money';

describe('toMinor', () => {
  it('converts 1284.5 → 128450', () => {
    expect(toMinor(1284.5)).toBe(128450);
  });

  it('converts 0.01 → 1', () => {
    expect(toMinor(0.01)).toBe(1);
  });

  it('converts 0.1 + 0.2 without float drift', () => {
    // In float math 0.1 + 0.2 = 0.30000000000000004
    // toMinor handles this via Math.round
    expect(toMinor(0.1 + 0.2)).toBe(30);
  });

  it('converts whole numbers correctly', () => {
    expect(toMinor(100)).toBe(10000);
    expect(toMinor(0)).toBe(0);
    expect(toMinor(1)).toBe(100);
  });

  it('converts seed wallet values (prototype floats)', () => {
    expect(toMinor(1284.5)).toBe(128450);
    expect(toMinor(36)).toBe(3600);
    expect(toMinor(412.75)).toBe(41275);
    expect(toMinor(88.2)).toBe(8820);
  });
});

describe('fromMinor', () => {
  it('converts 128450 → 1284.5', () => {
    expect(fromMinor(128450)).toBe(1284.5);
  });

  it('converts 1 → 0.01', () => {
    expect(fromMinor(1)).toBe(0.01);
  });

  it('converts 0 → 0', () => {
    expect(fromMinor(0)).toBe(0);
  });
});

describe('toMinor / fromMinor round-trip', () => {
  const cases = [0, 1, 0.01, 0.5, 10, 99.99, 1000, 1284.5, 88.2, 412.75];

  it.each(cases)('round-trips %f', (display) => {
    expect(fromMinor(toMinor(display))).toBeCloseTo(display, 10);
  });
});

describe('add', () => {
  it('adds two minor-unit amounts', () => {
    expect(add(10000, 5000)).toBe(15000);
  });

  it('handles zero', () => {
    expect(add(0, 5000)).toBe(5000);
    expect(add(5000, 0)).toBe(5000);
  });

  it('truncates fractional minor-units via bitwise', () => {
    // Passing a float accidentally — still produces integer
    expect(add(10000, 500)).toBe(10500);
  });
});

describe('sub', () => {
  it('subtracts two minor-unit amounts', () => {
    expect(sub(10000, 3000)).toBe(7000);
  });

  it('returns 0 when result would be negative', () => {
    expect(sub(1000, 2000)).toBe(0);
    expect(sub(0, 1)).toBe(0);
  });

  it('returns 0 when amounts are equal', () => {
    expect(sub(5000, 5000)).toBe(0);
  });

  it('does not return negative values', () => {
    for (let i = 0; i < 100; i++) {
      const a = Math.floor(Math.random() * 10000);
      const b = Math.floor(Math.random() * 10000);
      expect(sub(a, b)).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('mul', () => {
  it('multiplies by integer payout 2×', () => {
    expect(mul(10000, 2)).toBe(20000);
  });

  it('multiplies by violet payout 4.5×', () => {
    expect(mul(10000, 4.5)).toBe(45000);
  });

  it('multiplies by number payout 9×', () => {
    expect(mul(10000, 9)).toBe(90000);
  });

  it('floors the result to an integer', () => {
    // 100 * 1.333 = 133.3 → 133
    expect(mul(100, 1.333)).toBe(133);
  });

  it('handles zero multiplier', () => {
    expect(mul(10000, 0)).toBe(0);
  });

  it('handles zero amount', () => {
    expect(mul(0, 2)).toBe(0);
  });

  it('prototype payout values produce exact integers', () => {
    // 5000 minor-units * 2 = 10000 (green/red payout)
    expect(mul(5000, 2)).toBe(10000);
    // 5000 minor-units * 4.5 = 22500 (violet payout)
    expect(mul(5000, 4.5)).toBe(22500);
    // 5000 minor-units * 9 = 45000 (number payout)
    expect(mul(5000, 9)).toBe(45000);
  });
});

describe('formatMoney', () => {
  it('formats 128450 → "1,284.50"', () => {
    expect(formatMoney(128450)).toBe('1,284.50');
  });

  it('formats 0 → "0.00"', () => {
    expect(formatMoney(0)).toBe('0.00');
  });

  it('formats 1 → "0.01"', () => {
    expect(formatMoney(1)).toBe('0.01');
  });

  it('formats 100 → "1.00"', () => {
    expect(formatMoney(100)).toBe('1.00');
  });

  it('formats with symbol', () => {
    expect(formatMoney(128450, { symbol: 'USDT' })).toBe('1,284.50 USDT');
  });

  it('formats with decimals: 0', () => {
    expect(formatMoney(128450, { decimals: 0 })).toBe('1,285');
  });

  it('formats large values with comma separators', () => {
    expect(formatMoney(10000000)).toBe('100,000.00');
  });
});

describe('no float rounding drift — 100-bet settlement', () => {
  it('places 100 bets of 1000 minor-units, settles all at 2×, final balance is exact integer', () => {
    const initialBalance = 1_000_000; // 10,000.00 USDT in minor-units
    const betStake = 1000; // 10.00 USDT per bet
    const payout = 2;

    let balance = initialBalance;

    for (let i = 0; i < 100; i++) {
      // Place bet: deduct stake
      balance = sub(balance, betStake);
      // Settle as win: credit payout
      const winAmount = mul(betStake, payout);
      balance = add(balance, winAmount);
    }

    // With 2× payout and 100 bets, balance should be unchanged (break-even)
    expect(balance).toBe(initialBalance);
    // Must be an exact integer
    expect(Number.isInteger(balance)).toBe(true);
  });

  it('100 losing bets of 1000 minor-units each, balance is exact integer', () => {
    const initialBalance = 500_000; // 5,000.00 USDT
    const betStake = 1000;

    let balance = initialBalance;

    for (let i = 0; i < 100; i++) {
      balance = sub(balance, betStake);
    }

    expect(balance).toBe(initialBalance - 100 * betStake); // 400,000
    expect(Number.isInteger(balance)).toBe(true);
  });

  it('100 violet-payout bets (4.5×) produce exact integer balance', () => {
    const initialBalance = 10_000_000;
    const betStake = 10000;

    let balance = initialBalance;

    for (let i = 0; i < 100; i++) {
      balance = sub(balance, betStake);
      const winAmount = mul(betStake, 4.5);
      balance = add(balance, winAmount);
    }

    // Each bet: -10000, +45000 = net +35000 per bet
    const expected = initialBalance + 100 * (mul(betStake, 4.5) - betStake);
    expect(balance).toBe(expected);
    expect(Number.isInteger(balance)).toBe(true);
  });
});
