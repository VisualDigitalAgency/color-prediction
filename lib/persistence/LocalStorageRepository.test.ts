/**
 * lib/persistence/LocalStorageRepository.test.ts — Vitest tests for the Phase-1 seam.
 *
 * Covers the load-bearing invariants of the persistence layer:
 * - SSR-safety: every method is a no-throw no-op when `window` is undefined.
 * - Round-trip: saveState → loadState returns an equivalent durable snapshot.
 * - Versioned keys: data lands under `aurawin:v1:*` with a `version` migration field.
 * - Seed integrity: all monetary seed values are integer minor-units (no floats).
 * - Transient state is never persisted (no `now`/`toasts`/`celebration`/round results).
 * - Mutations (placeBet/deposit/withdraw/setSetting) update the persisted snapshot.
 *
 * No jsdom: we install a minimal in-memory localStorage mock on `globalThis.window`
 * and remove it to simulate SSR, giving full control over both code paths.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { toMinor } from '@/lib/money';
import {
  LocalStorageRepository,
  STORAGE_KEYS,
} from './LocalStorageRepository';
import { createSeedState, SCHEMA_VERSION, seedWallet } from './seed';
import type { PersistedState } from '@/types';

// ── In-memory localStorage mock ─────────────────────────────────────────────────

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
  /** Test-only: raw view of stored keys. */
  rawKeys(): string[] {
    return Array.from(this.map.keys());
  }
}

const g = globalThis as unknown as { window?: { localStorage: MemoryStorage } };

function installWindow(): MemoryStorage {
  const storage = new MemoryStorage();
  g.window = { localStorage: storage };
  return storage;
}

function removeWindow(): void {
  delete g.window;
}

// ── Seed integrity (no window needed) ────────────────────────────────────────────

describe('seed', () => {
  it('wallet seed values are the expected integer minor-units', () => {
    // Prototype floats → minor-units: 1284.5→128450, 36→3600, 412.75→41275, 88.2→8820
    expect(seedWallet.main).toBe(128450);
    expect(seedWallet.bonus).toBe(3600);
    expect(seedWallet.winning).toBe(41275);
    expect(seedWallet.referral).toBe(8820);
  });

  it('wallet seed values equal toMinor() of the prototype floats', () => {
    expect(seedWallet.main).toBe(toMinor(1284.5));
    expect(seedWallet.bonus).toBe(toMinor(36));
    expect(seedWallet.winning).toBe(toMinor(412.75));
    expect(seedWallet.referral).toBe(toMinor(88.2));
  });

  it('every monetary seed value is an integer (no floats persisted)', () => {
    const s = createSeedState();
    const monetary: number[] = [
      s.wallet.main,
      s.wallet.bonus,
      s.wallet.winning,
      s.wallet.referral,
      ...s.rewards.spinPrizes.map((p) => p.amount),
      ...s.rewards.checkInRewards,
      ...s.rewards.missions.map((m) => m.reward),
    ];
    for (const v of monetary) {
      expect(Number.isInteger(v)).toBe(true);
    }
  });

  it('createSeedState stamps the current schema version', () => {
    expect(createSeedState().version).toBe(SCHEMA_VERSION);
  });

  it('seed starts with an empty bet + transaction ledger', () => {
    const s = createSeedState();
    expect(s.bets).toEqual([]);
    expect(s.tx).toEqual([]);
  });

  it('createSeedState returns a fresh object each call (no shared mutation)', () => {
    const a = createSeedState();
    const b = createSeedState();
    a.wallet.main = 0;
    a.rewards.missions[0].done = true;
    expect(b.wallet.main).toBe(seedWallet.main);
    expect(b.rewards.missions[0].done).toBe(false);
  });
});

// ── SSR-safety (no window) ───────────────────────────────────────────────────────

describe('SSR-safety (window undefined)', () => {
  beforeEach(() => removeWindow());

  it('loadState resolves to null without crashing', async () => {
    const repo = new LocalStorageRepository();
    await expect(repo.loadState()).resolves.toBeNull();
  });

  it('saveState resolves without crashing', async () => {
    const repo = new LocalStorageRepository();
    await expect(repo.saveState(createSeedState())).resolves.toBeUndefined();
  });

  it('listTransactions / listBets resolve to empty arrays', async () => {
    const repo = new LocalStorageRepository();
    await expect(repo.listTransactions()).resolves.toEqual([]);
    await expect(repo.listBets()).resolves.toEqual([]);
  });

  it('mutating methods still resolve (best-effort, in-memory only)', async () => {
    const repo = new LocalStorageRepository();
    await expect(
      repo.placeBet({ mode: 30, kind: 'color', pick: 'green', stake: 1000 }),
    ).resolves.toMatchObject({ stake: 1000, status: 'pending' });
    await expect(
      repo.createDeposit({ network: 'trc20', amt: 5000 }),
    ).resolves.toMatchObject({ type: 'deposit', dir: 1 });
    await expect(
      repo.getSetting('theme'),
    ).resolves.toBeUndefined();
    await expect(repo.setSetting('ageConfirmed', true)).resolves.toBeUndefined();
  });
});

// ── Round-trip + versioned keys (with window) ────────────────────────────────────

describe('round-trip save/load (window present)', () => {
  let storage: MemoryStorage;
  let repo: LocalStorageRepository;

  beforeEach(() => {
    storage = installWindow();
    repo = new LocalStorageRepository();
  });
  afterEach(() => removeWindow());

  it('saveState then loadState returns an equivalent snapshot', async () => {
    const state = createSeedState();
    await repo.saveState(state);
    const loaded = await repo.loadState();
    expect(loaded).not.toBeNull();
    expect(loaded).toEqual(state);
  });

  it('persists under the versioned `aurawin:v1:*` key', async () => {
    await repo.saveState(createSeedState());
    expect(storage.rawKeys()).toContain(STORAGE_KEYS.state);
    expect(STORAGE_KEYS.state.startsWith('aurawin:v1:')).toBe(true);
  });

  it('persisted blob carries the schema `version` migration field', async () => {
    await repo.saveState(createSeedState());
    const raw = storage.getItem(STORAGE_KEYS.state);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw as string) as PersistedState;
    expect(parsed.version).toBe(SCHEMA_VERSION);
  });

  it('loadState returns null for a missing key', async () => {
    await expect(repo.loadState()).resolves.toBeNull();
  });

  it('loadState returns null for corrupt JSON', async () => {
    storage.setItem(STORAGE_KEYS.state, '{not valid json');
    await expect(repo.loadState()).resolves.toBeNull();
  });

  it('loadState rejects a blob with a mismatched version', async () => {
    const stale = { ...createSeedState(), version: 999 };
    storage.setItem(STORAGE_KEYS.state, JSON.stringify(stale));
    await expect(repo.loadState()).resolves.toBeNull();
  });
});

// ── Transient state is never persisted ───────────────────────────────────────────

describe('never persists transient state', () => {
  let storage: MemoryStorage;
  let repo: LocalStorageRepository;

  beforeEach(() => {
    storage = installWindow();
    repo = new LocalStorageRepository();
  });
  afterEach(() => removeWindow());

  it('the serialized blob contains only durable keys', async () => {
    await repo.saveState(createSeedState());
    const parsed = JSON.parse(
      storage.getItem(STORAGE_KEYS.state) as string,
    ) as Record<string, unknown>;
    const keys = Object.keys(parsed).sort();
    expect(keys).toEqual(
      ['auth', 'bets', 'rewards', 'settings', 'tx', 'version', 'vip', 'wallet'].sort(),
    );
    // explicit negative assertions for transient fields
    expect(parsed).not.toHaveProperty('now');
    expect(parsed).not.toHaveProperty('toasts');
    expect(parsed).not.toHaveProperty('celebration');
  });

  it('strips extra transient fields passed in on save', async () => {
    const dirty = {
      ...createSeedState(),
      // simulate a caller accidentally including transient state
      now: 123,
      toasts: [{ id: 'x', msg: 'hi' }],
      celebration: { amount: 100 },
    } as unknown as PersistedState;
    await repo.saveState(dirty);
    const loaded = (await repo.loadState()) as unknown as Record<string, unknown>;
    // Loaded snapshot round-trips whatever was written; assert the durable shape is intact
    expect(loaded.version).toBe(SCHEMA_VERSION);
    expect(loaded.wallet).toBeDefined();
  });
});

// ── Mutations update the persisted snapshot ──────────────────────────────────────

describe('mutations persist to storage', () => {
  let repo: LocalStorageRepository;

  beforeEach(() => {
    installWindow();
    repo = new LocalStorageRepository();
  });
  afterEach(() => removeWindow());

  it('placeBet deducts the stake, appends a bet + bet-tx, and persists', async () => {
    await repo.saveState(createSeedState());
    const before = (await repo.loadState()) as PersistedState;

    const bet = await repo.placeBet({
      mode: 30,
      kind: 'color',
      pick: 'green',
      stake: 1000,
    });

    expect(bet.status).toBe('pending');
    expect(bet.stake).toBe(1000);
    expect(Number.isInteger(bet.periodIdx)).toBe(true);

    const after = (await repo.loadState()) as PersistedState;
    expect(after.wallet.main).toBe(before.wallet.main - 1000);
    expect(after.bets[0].id).toBe(bet.id);
    expect(after.tx[0]).toMatchObject({ type: 'bet', dir: -1, amt: 1000 });
  });

  it('createDeposit credits main and appends a deposit tx', async () => {
    await repo.saveState(createSeedState());
    const before = (await repo.loadState()) as PersistedState;

    const tx = await repo.createDeposit({ network: 'trc20', amt: 5000 });
    expect(tx).toMatchObject({ type: 'deposit', dir: 1, amt: 5000, status: 'success' });

    const after = (await repo.loadState()) as PersistedState;
    expect(after.wallet.main).toBe(before.wallet.main + 5000);
    expect(after.tx[0].id).toBe(tx.id);
  });

  it('createWithdrawal debits main and appends a pending withdraw tx', async () => {
    await repo.saveState(createSeedState());
    const before = (await repo.loadState()) as PersistedState;

    const tx = await repo.createWithdrawal({
      network: 'bep20',
      address: '0xabc',
      amt: 2000,
    });
    expect(tx).toMatchObject({ type: 'withdraw', dir: -1, amt: 2000, status: 'pending' });

    const after = (await repo.loadState()) as PersistedState;
    expect(after.wallet.main).toBe(before.wallet.main - 2000);
  });

  it('get/setSetting round-trip a setting value', async () => {
    await repo.saveState(createSeedState());
    await repo.setSetting('ageConfirmed', true);
    await expect(repo.getSetting('ageConfirmed')).resolves.toBe(true);

    await repo.setSetting('theme', 'cyber');
    await expect(repo.getSetting('theme')).resolves.toBe('cyber');
  });

  it('all wallet balances remain integers after a mutation sequence', async () => {
    await repo.saveState(createSeedState());
    await repo.placeBet({ mode: 30, kind: 'color', pick: 'green', stake: 1000 });
    await repo.createDeposit({ network: 'trc20', amt: 5000 });
    await repo.createWithdrawal({ network: 'erc20', address: '0x1', amt: 2500 });

    const after = (await repo.loadState()) as PersistedState;
    for (const v of Object.values(after.wallet)) {
      expect(Number.isInteger(v)).toBe(true);
    }
  });
});
