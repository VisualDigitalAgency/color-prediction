import { describe, it, expect } from 'vitest';
import STRINGS, {
  PAYOUT_MULTIPLIERS,
  VIP_TIER_NAMES,
  VIP_TIER_COLORS,
  MODE_LABEL,
  MODE_NAME,
  CHECK_IN_REWARDS,
  NETWORK_LABEL,
} from './strings';

// ── Hard rule: no "provably fair" copy anywhere ──────────────────────────────

describe('provably-fair prohibition (ADR 0006)', () => {
  const flat = JSON.stringify(STRINGS).toLowerCase();

  it('contains no "provably fair" text', () => {
    expect(flat).not.toContain('provably fair');
  });

  it('uses "Fair Play (demo)" wording instead', () => {
    expect(flat).toContain('fair play (demo)');
  });

  it('disclaimer mentions "no real money"', () => {
    const disc = STRINGS.app.disclaimer.toLowerCase();
    expect(disc).toContain('no real money');
  });

  it('disclaimer mentions 18+', () => {
    expect(STRINGS.app.disclaimer).toContain('18+');
  });

  it('ageGate body mentions simulated demo', () => {
    expect(STRINGS.ageGate.body.toLowerCase()).toContain('simulated');
  });
});

// ── colorBlindShort has G, R, V only ─────────────────────────────────────────

describe('colorBlindShort', () => {
  it('has exactly three keys: green, red, violet', () => {
    expect(Object.keys(STRINGS.colorBlindShort).sort()).toEqual(['green', 'red', 'violet']);
  });

  it('green → G', () => expect(STRINGS.colorBlindShort.green).toBe('G'));
  it('red → R', () => expect(STRINGS.colorBlindShort.red).toBe('R'));
  it('violet → V', () => expect(STRINGS.colorBlindShort.violet).toBe('V'));
});

// ── PAYOUT_MULTIPLIERS match the prototype ────────────────────────────────────

describe('PAYOUT_MULTIPLIERS', () => {
  it('green and red pay 2×', () => {
    expect(PAYOUT_MULTIPLIERS.green).toBe(2);
    expect(PAYOUT_MULTIPLIERS.red).toBe(2);
  });

  it('violet pays 4.5×', () => {
    expect(PAYOUT_MULTIPLIERS.violet).toBe(4.5);
  });

  it('big and small pay 2×', () => {
    expect(PAYOUT_MULTIPLIERS.big).toBe(2);
    expect(PAYOUT_MULTIPLIERS.small).toBe(2);
  });

  it('number pays 9×', () => {
    expect(PAYOUT_MULTIPLIERS.number).toBe(9);
  });
});

// ── VIP tiers ─────────────────────────────────────────────────────────────────

describe('VIP_TIER_NAMES', () => {
  it('has exactly 5 tiers (1–5)', () => {
    expect(Object.keys(VIP_TIER_NAMES).map(Number).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
  });

  it('tier names match prototype', () => {
    expect(VIP_TIER_NAMES[1]).toBe('Bronze');
    expect(VIP_TIER_NAMES[2]).toBe('Silver');
    expect(VIP_TIER_NAMES[3]).toBe('Platinum');
    expect(VIP_TIER_NAMES[4]).toBe('Diamond');
    expect(VIP_TIER_NAMES[5]).toBe('Crown');
  });
});

describe('VIP_TIER_COLORS', () => {
  it('has 5 hex colors (tiers 1–5)', () => {
    expect(Object.keys(VIP_TIER_COLORS)).toHaveLength(5);
    for (const v of Object.values(VIP_TIER_COLORS)) {
      expect(v).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

// ── MODE_LABEL / MODE_NAME ────────────────────────────────────────────────────

describe('MODE_LABEL', () => {
  it('matches prototype MODE_LABEL exactly', () => {
    expect(MODE_LABEL[30]).toBe('30s');
    expect(MODE_LABEL[60]).toBe('1min');
    expect(MODE_LABEL[180]).toBe('3min');
    expect(MODE_LABEL[300]).toBe('5min');
  });
});

describe('MODE_NAME', () => {
  it('has human-readable labels for all 4 modes', () => {
    expect(MODE_NAME[30]).toBeTruthy();
    expect(MODE_NAME[60]).toBeTruthy();
    expect(MODE_NAME[180]).toBeTruthy();
    expect(MODE_NAME[300]).toBeTruthy();
  });
});

// ── CHECK_IN_REWARDS ─────────────────────────────────────────────────────────

describe('CHECK_IN_REWARDS', () => {
  it('has exactly 7 values', () => {
    expect(CHECK_IN_REWARDS).toHaveLength(7);
  });

  it('all values are positive integers (minor-units)', () => {
    for (const v of CHECK_IN_REWARDS) {
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThan(0);
    }
  });

  it('rewards increase across the week', () => {
    for (let i = 1; i < CHECK_IN_REWARDS.length; i++) {
      expect(CHECK_IN_REWARDS[i]).toBeGreaterThan(CHECK_IN_REWARDS[i - 1]);
    }
  });

  it('day-7 bonus is the largest (88.88 USDT = 8888 minor-units... prototype uses 8800)', () => {
    expect(CHECK_IN_REWARDS[6]).toBeGreaterThanOrEqual(5000);
  });
});

// ── NETWORK_LABEL ────────────────────────────────────────────────────────────

describe('NETWORK_LABEL', () => {
  it('covers the three supported networks', () => {
    expect(NETWORK_LABEL.trc20).toBeTruthy();
    expect(NETWORK_LABEL.bep20).toBeTruthy();
    expect(NETWORK_LABEL.erc20).toBeTruthy();
  });
});
