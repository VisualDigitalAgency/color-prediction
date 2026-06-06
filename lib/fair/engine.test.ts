/**
 * lib/fair/engine.test.ts — golden-value tests for the deterministic engine.
 *
 * Every pinned value below was produced by running the PROTOTYPE logic
 * (app/store.jsx) verbatim in Node. If any of these change, determinism has
 * been broken and prototype parity is lost — DO NOT update the goldens to make
 * a failing test pass; fix the engine instead.
 *
 * Conventions follow lib/money.test.ts (Vitest, relative import from './').
 */

import { describe, it, expect } from 'vitest';
import {
  hashNum,
  resultForPeriod,
  periodAt,
  secondsLeft,
  recentResults,
  betWins,
  payoutMult,
  MODES,
  MODE_LABEL,
  PAYOUT,
} from './engine';

// ── hashNum — pinned FNV-1a outputs ─────────────────────────────────────────

describe('hashNum', () => {
  // Pinned unsigned-32-bit outputs from the prototype FNV-1a.
  it('matches prototype golden outputs', () => {
    expect(hashNum('0')).toBe(890022063);
    expect(hashNum('abc')).toBe(440920331);
    expect(hashNum('30|0')).toBe(910407050);
    expect(hashNum('30|1')).toBe(927184669);
    expect(hashNum('60|0')).toBe(1994977455);
    expect(hashNum('180|0')).toBe(3868041112);
    expect(hashNum('300|0')).toBe(761622670);
  });

  it('is deterministic (same input → same output)', () => {
    expect(hashNum('30|42')).toBe(hashNum('30|42'));
  });

  it('returns an unsigned 32-bit integer', () => {
    const h = hashNum('180|0'); // > 2^31, exercises the >>> 0 fold
    expect(Number.isInteger(h)).toBe(true);
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThanOrEqual(0xffffffff);
  });

  it('empty string hashes to the FNV offset basis', () => {
    expect(hashNum('')).toBe(2166136261);
  });
});

// ── resultForPeriod — pinned outcomes ───────────────────────────────────────

describe('resultForPeriod', () => {
  // Pinned from the prototype: traced via the real hash, NOT guessed.
  it('(30, 0) → num 0, red+violet, small', () => {
    expect(resultForPeriod(30, 0)).toEqual({
      num: 0,
      colors: ['red', 'violet'],
      big: false,
    });
  });

  it('(30, 1) → num 9, green, big', () => {
    expect(resultForPeriod(30, 1)).toEqual({
      num: 9,
      colors: ['green'],
      big: true,
    });
  });

  it('(30, 5) → num 3, green, small', () => {
    expect(resultForPeriod(30, 5)).toEqual({
      num: 3,
      colors: ['green'],
      big: false,
    });
  });

  it('(60, 0) → num 5, green+violet, big', () => {
    expect(resultForPeriod(60, 0)).toEqual({
      num: 5,
      colors: ['green', 'violet'],
      big: true,
    });
  });

  it('(180, 0) → num 2, red, small', () => {
    expect(resultForPeriod(180, 0)).toEqual({
      num: 2,
      colors: ['red'],
      big: false,
    });
  });

  it('(300, 0) → num 0, red+violet, small', () => {
    expect(resultForPeriod(300, 0)).toEqual({
      num: 0,
      colors: ['red', 'violet'],
      big: false,
    });
  });

  it('num is always 0–9', () => {
    for (let i = 0; i < 200; i++) {
      const { num } = resultForPeriod(30, i);
      expect(num).toBeGreaterThanOrEqual(0);
      expect(num).toBeLessThanOrEqual(9);
    }
  });
});

// ── Color rule coverage (all ten digits) ────────────────────────────────────

describe('color rules (digit → colors)', () => {
  // mode-30 period indices that produce each digit (computed from the hash).
  const idxForNum: Record<number, number> = {
    0: 0,
    1: 3,
    2: 2,
    3: 5,
    4: 4,
    5: 7,
    6: 6,
    7: 9,
    8: 8,
    9: 1,
  };

  const expectedColors: Record<number, string[]> = {
    0: ['red', 'violet'],
    1: ['green'],
    2: ['red'],
    3: ['green'],
    4: ['red'],
    5: ['green', 'violet'],
    6: ['red'],
    7: ['green'],
    8: ['red'],
    9: ['green'],
  };

  for (let d = 0; d <= 9; d++) {
    it(`num ${d} → ${expectedColors[d].join('+')}`, () => {
      const r = resultForPeriod(30, idxForNum[d]);
      expect(r.num).toBe(d); // confirm the index really yields digit d
      expect(r.colors).toEqual(expectedColors[d]);
      expect(r.big).toBe(d >= 5);
    });
  }

  it('0 and 5 are the only violet outcomes', () => {
    for (let d = 0; d <= 9; d++) {
      const hasViolet = expectedColors[d].includes('violet');
      expect(hasViolet).toBe(d === 0 || d === 5);
    }
  });
});

// ── periodAt / secondsLeft consistency ──────────────────────────────────────

describe('periodAt', () => {
  it('periodIdx = floor(ts / (mode*1000))', () => {
    expect(periodAt(30, 0).periodIdx).toBe(0);
    expect(periodAt(30, 29_999).periodIdx).toBe(0);
    expect(periodAt(30, 30_000).periodIdx).toBe(1);
    expect(periodAt(60, 1700000000000).periodIdx).toBe(28333333);
    expect(periodAt(30, 1700000000000).periodIdx).toBe(56666666);
  });

  it('periodId format: YYYYMMDD + "1000" + 5-digit within-counter', () => {
    const p = periodAt(30, 0); // epoch start
    expect(p.periodId).toBe('19700101100000000');
    expect(p.periodId).toMatch(/^\d{8}1000\d{5}$/);
  });

  it('carries the mode through', () => {
    expect(periodAt(180, 1700000000000).mode).toBe(180);
  });

  it('within-counter wraps at 100000', () => {
    // periodIdx 100000 → within "00000"
    const p = periodAt(30, 100000 * 30 * 1000);
    expect(p.periodId.endsWith('00000')).toBe(true);
  });
});

describe('secondsLeft', () => {
  it('returns the full mode at a period boundary', () => {
    expect(secondsLeft(30, 0)).toBe(30);
    expect(secondsLeft(30, 30_000)).toBe(30);
    expect(secondsLeft(60, 0)).toBe(60);
  });

  it('counts down within a period', () => {
    expect(secondsLeft(30, 1_000)).toBe(29);
    expect(secondsLeft(30, 29_000)).toBe(1);
    expect(secondsLeft(30, 29_999)).toBe(1);
  });

  it('matches pinned prototype values', () => {
    expect(secondsLeft(30, 1700000000000)).toBe(10);
    expect(secondsLeft(60, 1700000000000)).toBe(40);
  });

  it('is consistent with periodAt across a boundary', () => {
    const ts = 30_000 * 5 - 1; // last ms of period 4
    expect(periodAt(30, ts).periodIdx).toBe(4);
    expect(secondsLeft(30, ts)).toBe(1);
    expect(periodAt(30, ts + 1).periodIdx).toBe(5);
    expect(secondsLeft(30, ts + 1)).toBe(30);
  });
});

// ── recentResults ───────────────────────────────────────────────────────────

describe('recentResults', () => {
  it('returns `count` settled rounds, newest first, excluding the current', () => {
    const ts = 100 * 30 * 1000 + 5_000; // mid period 100
    const out = recentResults(30, 3, ts);
    expect(out).toHaveLength(3);
    expect(out.map((r) => r.periodIdx)).toEqual([99, 98, 97]);
  });

  it('each entry merges the period descriptor with its deterministic result', () => {
    const ts = 100 * 30 * 1000 + 5_000;
    const [first] = recentResults(30, 1, ts);
    expect(first).toMatchObject(periodAt(30, 99 * 30 * 1000));
    expect(first).toMatchObject(resultForPeriod(30, 99));
  });
});

// ── betWins ─────────────────────────────────────────────────────────────────

describe('betWins', () => {
  // resultForPeriod(60, 0) = { num: 5, colors: ['green','violet'], big: true }
  const result = resultForPeriod(60, 0);

  it('color win — picked color is present', () => {
    expect(betWins({ kind: 'color', pick: 'green' }, result)).toBe(true);
    expect(betWins({ kind: 'color', pick: 'violet' }, result)).toBe(true);
  });

  it('color loss — picked color is absent', () => {
    expect(betWins({ kind: 'color', pick: 'red' }, result)).toBe(false);
  });

  it('size win — big matches big', () => {
    expect(betWins({ kind: 'size', pick: 'big' }, result)).toBe(true);
  });

  it('size loss — small against a big result', () => {
    expect(betWins({ kind: 'size', pick: 'small' }, result)).toBe(false);
  });

  it('size win — small matches a small result', () => {
    const small = resultForPeriod(30, 0); // num 0, big false
    expect(betWins({ kind: 'size', pick: 'small' }, small)).toBe(true);
    expect(betWins({ kind: 'size', pick: 'big' }, small)).toBe(false);
  });

  it('number win — exact digit match', () => {
    expect(betWins({ kind: 'number', pick: 5 }, result)).toBe(true);
  });

  it('number loss — wrong digit', () => {
    expect(betWins({ kind: 'number', pick: 4 }, result)).toBe(false);
  });
});

// ── payoutMult ──────────────────────────────────────────────────────────────

describe('payoutMult', () => {
  it('color: green/red = 2, violet = 4.5', () => {
    expect(payoutMult({ kind: 'color', pick: 'green' })).toBe(2);
    expect(payoutMult({ kind: 'color', pick: 'red' })).toBe(2);
    expect(payoutMult({ kind: 'color', pick: 'violet' })).toBe(4.5);
  });

  it('size: big/small = 2', () => {
    expect(payoutMult({ kind: 'size', pick: 'big' })).toBe(2);
    expect(payoutMult({ kind: 'size', pick: 'small' })).toBe(2);
  });

  it('number = 9', () => {
    expect(payoutMult({ kind: 'number', pick: 7 })).toBe(9);
  });
});

// ── constants ───────────────────────────────────────────────────────────────

describe('constants', () => {
  it('MODES = [30, 60, 180, 300]', () => {
    expect(MODES).toEqual([30, 60, 180, 300]);
  });

  it('MODE_LABEL matches prototype', () => {
    expect(MODE_LABEL).toEqual({ 30: '30s', 60: '1min', 180: '3min', 300: '5min' });
  });

  it('PAYOUT matches prototype', () => {
    expect(PAYOUT).toEqual({
      green: 2,
      red: 2,
      violet: 4.5,
      big: 2,
      small: 2,
      number: 9,
    });
  });
});
