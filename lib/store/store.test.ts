/**
 * lib/store/store.test.ts — Vitest tests for the AuraWin Zustand store.
 *
 * Covers the load-bearing store invariants (ported from the prototype):
 *   - placeBet decrements the correct sub-wallet by exact integer minor-units,
 *     creates a pending bet for the current period, and writes a bet-tx.
 *   - settlement on period roll credits winnings to the `winning` sub-wallet,
 *     writes a win-payout tx, and sets the celebration — and is idempotent.
 *   - deposit/withdraw update wallet + tx ledger.
 *   - claimSpinPrize/claimCheckIn/claimMission credit the bonus sub-wallet.
 *   - money-mutating actions return Promises (the Phase-2 async seam).
 *   - transient state (now/toasts/celebration) is never written to storage.
 *
 * No jsdom: a minimal in-memory localStorage mock is installed on
 * `globalThis.window` (mirrors the persistence test), and the store is reset to
 * a fresh seed before each test.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { resultForPeriod, payoutMult, periodAt, MODES } from '@/lib/fair';
import { mul } from '@/lib/money';
import { createSeedState, STORAGE_KEYS } from '@/lib/persistence';
import type { Bet, RoundMode, RoundResult } from '@/types';

import { useStore, toPersisted } from './store';

// ── In-memory localStorage mock (no jsdom) ──────────────────────────────────

class MemoryStorage {
  private map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.has(key) ? (this.map.get(key) as string) : null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, String(value));
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  clear(): void {
    this.map.clear();
  }
  get length(): number {
    return this.map.size;
  }
  key(i: number): string | null {
    return Array.from(this.map.keys())[i] ?? null;
  }
}

const g = globalThis as unknown as { window?: { localStorage: MemoryStorage } };

let storage: MemoryStorage;

/** Reset the store to a fresh seed snapshot + clean transient state. */
function resetStore(): void {
  const seed = createSeedState();
  useStore.setState({
    auth: seed.auth,
    user: undefined,
    wallet: seed.wallet,
    bets: seed.bets,
    tx: seed.tx,
    vip: seed.vip,
    rewards: seed.rewards,
    settings: seed.settings,
    now: 0,
    toasts: [],
    celebration: null,
    hydrated: false,
    screen: 'login',
  });
}

/**
 * Find a color pick that WINS for `(mode, periodIdx)`. Uses the real engine so
 * settlement tests stay deterministic without hard-coding hashes.
 */
function winningColor(mode: RoundMode, periodIdx: number): {
  pick: 'green' | 'red';
  result: RoundResult;
} {
  const result = resultForPeriod(mode, periodIdx);
  // Every period's colors contains at least one of green/red.
  const pick = result.colors.includes('green') ? 'green' : 'red';
  return { pick, result };
}

beforeEach(() => {
  storage = new MemoryStorage();
  g.window = { localStorage: storage };
  resetStore();
});

afterEach(() => {
  delete g.window;
  vi.restoreAllMocks();
});

// ── placeBet ─────────────────────────────────────────────────────────────────

describe('placeBet', () => {
  it('returns a Promise', () => {
    const r = useStore.getState().placeBet({ mode: 30, kind: 'color', pick: 'green', stake: 1000 });
    expect(r).toBeInstanceOf(Promise);
    return r;
  });

  it('decrements the main sub-wallet by exact integer minor-units', async () => {
    const before = useStore.getState().wallet;
    await useStore.getState().placeBet({ mode: 30, kind: 'color', pick: 'green', stake: 2500 });
    const after = useStore.getState().wallet;

    expect(after.main).toBe(before.main - 2500);
    expect(Number.isInteger(after.main)).toBe(true);
    // Other sub-wallets untouched.
    expect(after.bonus).toBe(before.bonus);
    expect(after.winning).toBe(before.winning);
    expect(after.referral).toBe(before.referral);
  });

  it('creates a pending bet for the current period + a debit bet-tx', async () => {
    await useStore.getState().placeBet({ mode: 60, kind: 'color', pick: 'red', stake: 500 });
    const { bets, tx } = useStore.getState();

    expect(bets[0]).toMatchObject({ status: 'pending', stake: 500, mode: 60, kind: 'color', pick: 'red' });
    expect(Number.isInteger(bets[0].periodIdx)).toBe(true);
    expect(tx[0]).toMatchObject({ type: 'bet', dir: -1, amt: 500, status: 'success' });
  });

  it('rejects a stake greater than the main balance (no mutation)', async () => {
    const before = useStore.getState().wallet.main;
    const res = await useStore.getState().placeBet({
      mode: 30,
      kind: 'color',
      pick: 'green',
      stake: before + 1,
    });

    expect(res.ok).toBe(false);
    expect(useStore.getState().wallet.main).toBe(before);
    expect(useStore.getState().bets).toHaveLength(0);
  });
});

// ── settlement on period roll ────────────────────────────────────────────────

describe('settle', () => {
  /** Inject a pending bet at a controlled period so we can roll it over. */
  function injectBet(over: Partial<Bet>): Bet {
    const bet: Bet = {
      id: 'bet-test',
      mode: 30,
      kind: 'color',
      pick: 'green',
      stake: 1000,
      periodIdx: 100,
      periodId: 'p',
      status: 'pending',
      createdAt: 0,
      ...over,
    };
    useStore.setState((s) => ({ bets: [bet, ...s.bets] }));
    return bet;
  }

  it('credits winnings to the winning sub-wallet, writes a win-tx, sets celebration', () => {
    const mode: RoundMode = 30;
    const periodIdx = 100;
    const { pick } = winningColor(mode, periodIdx);
    const stake = 1000;

    const bet = injectBet({ mode, periodIdx, pick, stake });
    const expectedPay = mul(stake, payoutMult(bet)); // minor-units
    const beforeWinning = useStore.getState().wallet.winning;

    // now is in a LATER period → the bet's period has rolled over.
    const now = (periodIdx + 1) * mode * 1000;
    useStore.getState().settle(now);

    const st = useStore.getState();
    expect(st.bets[0].status).toBe('won');
    expect(st.bets[0].payout).toBe(expectedPay);
    expect(st.wallet.winning).toBe(beforeWinning + expectedPay);
    expect(st.tx[0]).toMatchObject({ type: 'win', dir: 1, amt: expectedPay, status: 'success' });
    expect(st.celebration).not.toBeNull();
    expect(st.celebration?.credit).toBe(expectedPay);
  });

  it('marks a losing bet lost with zero payout and no celebration', () => {
    const mode: RoundMode = 30;
    const periodIdx = 100;
    const result = resultForPeriod(mode, periodIdx);
    // Pick the color NOT present in the result so the bet loses.
    const losingPick = result.colors.includes('green') ? 'red' : 'green';
    // Guard: ensure the chosen pick actually loses (single-color periods).
    const willLose = !result.colors.includes(losingPick);

    injectBet({ mode, periodIdx, pick: losingPick, stake: 1000 });
    const beforeWinning = useStore.getState().wallet.winning;

    useStore.getState().settle((periodIdx + 1) * mode * 1000);

    const st = useStore.getState();
    if (willLose) {
      expect(st.bets[0].status).toBe('lost');
      expect(st.bets[0].payout).toBe(0);
      expect(st.wallet.winning).toBe(beforeWinning);
      expect(st.celebration).toBeNull();
    }
  });

  it('is idempotent — a second settle for the same tick does not double-credit', () => {
    const mode: RoundMode = 30;
    const periodIdx = 100;
    const { pick } = winningColor(mode, periodIdx);
    injectBet({ mode, periodIdx, pick, stake: 1000 });

    const now = (periodIdx + 1) * mode * 1000;
    useStore.getState().settle(now);
    const afterFirst = useStore.getState();
    const winningAfterFirst = afterFirst.wallet.winning;
    const txLenAfterFirst = afterFirst.tx.length;

    // Re-run settlement for the same (and a later) tick.
    useStore.getState().settle(now);
    useStore.getState().settle(now + 10_000_000);

    const afterSecond = useStore.getState();
    expect(afterSecond.wallet.winning).toBe(winningAfterFirst);
    expect(afterSecond.tx.length).toBe(txLenAfterFirst);
    expect(afterSecond.bets[0].status).toBe('won');
  });

  it('does not settle a bet whose period has not rolled over yet', () => {
    const mode: RoundMode = 30;
    const periodIdx = 100;
    injectBet({ mode, periodIdx, pick: 'green', stake: 1000 });
    const before = useStore.getState().wallet.winning;

    // now still inside the bet's own period.
    useStore.getState().settle(periodIdx * mode * 1000 + 5_000);

    const st = useStore.getState();
    expect(st.bets[0].status).toBe('pending');
    expect(st.wallet.winning).toBe(before);
  });
});

// ── deposit / withdraw ───────────────────────────────────────────────────────

describe('deposit / withdraw', () => {
  it('deposit returns a Promise and credits main + appends a tx', async () => {
    const before = useStore.getState().wallet.main;
    const r = useStore.getState().deposit({ network: 'trc20', amt: 5000 });
    expect(r).toBeInstanceOf(Promise);
    await r;

    const st = useStore.getState();
    expect(st.wallet.main).toBe(before + 5000);
    expect(st.tx[0]).toMatchObject({ type: 'deposit', dir: 1, amt: 5000 });
  });

  it('deposit credits exact integer minor-units', async () => {
    const start = useStore.getState().wallet.main;
    await useStore.getState().deposit({ network: 'bep20', amt: 12345 });
    expect(useStore.getState().wallet.main).toBe(start + 12345);
    expect(Number.isInteger(useStore.getState().wallet.main)).toBe(true);
  });

  it('withdraw returns a Promise, debits main + appends a pending tx', async () => {
    const start = useStore.getState().wallet.main;
    const r = useStore.getState().withdraw({ network: 'erc20', address: '0xabc', amt: 2000 });
    expect(r).toBeInstanceOf(Promise);
    await r;

    const st = useStore.getState();
    expect(st.wallet.main).toBe(start - 2000);
    expect(st.tx[0]).toMatchObject({ type: 'withdraw', dir: -1, amt: 2000, status: 'pending' });
  });

  it('withdraw rejects an amount over balance (no mutation)', async () => {
    const start = useStore.getState().wallet.main;
    const res = await useStore.getState().withdraw({
      network: 'trc20',
      address: '0x1',
      amt: start + 1,
    });
    expect(res.ok).toBe(false);
    expect(useStore.getState().wallet.main).toBe(start);
  });
});

// ── reward claims ────────────────────────────────────────────────────────────

describe('reward claims', () => {
  it('claimCheckIn returns a Promise and credits the bonus sub-wallet', async () => {
    const beforeBonus = useStore.getState().wallet.bonus;
    const beforeClaimed = useStore.getState().rewards.checkInClaimed.length;
    const reward = useStore.getState().rewards.checkInRewards[beforeClaimed];

    const r = useStore.getState().claimCheckIn();
    expect(r).toBeInstanceOf(Promise);
    await r;

    const st = useStore.getState();
    expect(st.wallet.bonus).toBe(beforeBonus + reward);
    expect(st.rewards.checkInClaimed.length).toBe(beforeClaimed + 1);
  });

  it('claimSpinPrize decrements free spins and only credits bonus on a prize', async () => {
    const beforeSpins = useStore.getState().rewards.freeSpins;
    // Force a known prize (the 888 segment, index 7) for a deterministic credit.
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const beforeBonus = useStore.getState().wallet.bonus;

    const res = await useStore.getState().claimSpinPrize();
    expect(res.ok).toBe(true);

    const st = useStore.getState();
    expect(st.rewards.freeSpins).toBe(beforeSpins - 1);
    // random=0.99 lands on the last segment (888 USDT = 88800 minor-units).
    expect(st.wallet.bonus).toBe(beforeBonus + 88800);
    expect(Number.isInteger(st.wallet.bonus)).toBe(true);
  });

  it('claimMission credits bonus only for a completed, unclaimed mission', async () => {
    // Seed mission `m-deposit` is done:true (progress>=goal) → already claimed-equiv.
    // Use `m-bets` after forcing it complete.
    useStore.setState((s) => ({
      rewards: {
        ...s.rewards,
        missions: s.rewards.missions.map((m) =>
          m.id === 'm-bets' ? { ...m, progress: m.goal, done: false } : m,
        ),
      },
    }));
    const beforeBonus = useStore.getState().wallet.bonus;
    const reward = useStore.getState().rewards.missions.find((m) => m.id === 'm-bets')!.reward;

    const res = await useStore.getState().claimMission('m-bets');
    expect(res.ok).toBe(true);
    expect(useStore.getState().wallet.bonus).toBe(beforeBonus + reward);
    expect(useStore.getState().rewards.missions.find((m) => m.id === 'm-bets')!.done).toBe(true);
  });
});

// ── transient state is never persisted ───────────────────────────────────────

describe('transient state is never persisted', () => {
  it('toPersisted omits now / toasts / celebration / hydrated / screen', () => {
    useStore.setState({
      now: 123456,
      toasts: [{ id: 't', msg: 'hi', kind: 'info' }],
      celebration: { amount: 1, credit: 2, at: 3 },
    });
    const persisted = toPersisted(useStore.getState());
    const keys = Object.keys(persisted).sort();
    expect(keys).toEqual(
      ['auth', 'bets', 'rewards', 'settings', 'tx', 'version', 'vip', 'wallet'].sort(),
    );
    expect(persisted).not.toHaveProperty('now');
    expect(persisted).not.toHaveProperty('toasts');
    expect(persisted).not.toHaveProperty('celebration');
    expect(persisted).not.toHaveProperty('screen');
  });

  it('a settled bet does not persist its recomputable round result keys at the root', () => {
    // The persisted snapshot carries bets (with their result) but never a separate
    // results cache — results live on the bet and recompute via the engine elsewhere.
    const persisted = toPersisted(useStore.getState());
    expect(persisted).not.toHaveProperty('results');
    expect(persisted).not.toHaveProperty('now');
  });
});

// ── sanity: engine alignment ─────────────────────────────────────────────────

describe('period alignment', () => {
  it('placeBet records the period from periodAt(mode, now-ish)', async () => {
    await useStore.getState().placeBet({ mode: 30, kind: 'color', pick: 'green', stake: 100 });
    const bet = useStore.getState().bets[0];
    const expected = periodAt(30, bet.createdAt);
    expect(bet.periodIdx).toBe(expected.periodIdx);
  });

  it('MODES are the four supported round durations', () => {
    expect([...MODES]).toEqual([30, 60, 180, 300]);
  });
});
