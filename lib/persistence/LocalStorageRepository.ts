/**
 * lib/persistence/LocalStorageRepository.ts — Phase-1 concrete `DataRepository`.
 *
 * Persists the durable slice of state to `localStorage` under versioned keys
 * (`aurawin:v1:*`). Implements the async `DataRepository` contract: every method
 * returns a Promise even though localStorage is synchronous — the Promise resolves
 * synchronously, but the signatures match the Phase-2 REST seam (ADR 0004/0005).
 *
 * SSR-SAFE: every `localStorage` access is guarded by `typeof window !== 'undefined'`
 * AND wrapped in try/catch (private mode / quota / serialization failures are
 * non-fatal — reads fall back to the seed, writes are best-effort). Nothing touches
 * `localStorage` at module load.
 *
 * NEVER persists transient state (`now`, `toasts`, `celebration`) or round results —
 * results recompute deterministically from the fair engine via (mode, periodIdx).
 */

import { periodAt, betWins, payoutMult, resultForPeriod } from '@/lib/fair';
import { add, sub, mul } from '@/lib/money';
import { createSeedState, SCHEMA_VERSION } from './seed';
import type {
  DataRepository,
  PersistedState,
  PlaceBetInput,
  DepositInput,
  WithdrawInput,
  Bet,
  Transaction,
  Settings,
} from '@/types';

// ── Versioned storage keys ────────────────────────────────────────────────────

/** Key namespace. Bumping the version segment isolates incompatible schemas. */
const KEY_PREFIX = 'aurawin:v1';

export const STORAGE_KEYS = {
  /** The full persisted snapshot (single JSON blob). */
  state: `${KEY_PREFIX}:state`,
} as const;

/** Network → withdrawal transaction method, kept narrow for the Transaction type. */
const WITHDRAW_FEE_RATE = 0.01; // 1% fee applied by the repository (per WithdrawInput docs)

// ── Helpers ────────────────────────────────────────────────────────────────────

/** True only in a browser context with a usable localStorage. */
function hasStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

/** Generate a reasonably-unique id with a prefix (matches the prototype style). */
function genId(prefix: string): string {
  return `${prefix}${Date.now()}${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Migrate a raw persisted blob to the current schema version. Phase 1 has a single
 * version, so this only guards the shape; future versions add real transforms here.
 * Returns null if the blob is unusable (caller falls back to seed).
 */
function migrate(raw: unknown): PersistedState | null {
  if (!raw || typeof raw !== 'object') return null;
  const candidate = raw as Partial<PersistedState>;
  if (typeof candidate.version !== 'number') return null;
  // Future: `if (candidate.version < SCHEMA_VERSION) { ...transform... }`
  if (candidate.version !== SCHEMA_VERSION) return null;
  // Required durable slices must be present.
  if (!candidate.wallet || !candidate.settings || !candidate.auth) return null;
  // Wallet fields must all be integer minor-units (numbers). Catches stringified
  // values, NaN, or partial writes from an older schema shape.
  const w = candidate.wallet;
  if (
    typeof w.main !== 'number' ||
    typeof w.bonus !== 'number' ||
    typeof w.winning !== 'number' ||
    typeof w.referral !== 'number'
  ) return null;
  return candidate as PersistedState;
}

// ── Repository ─────────────────────────────────────────────────────────────────

export class LocalStorageRepository implements DataRepository {
  /**
   * Read + parse the persisted snapshot. SSR-safe: returns null when there is no
   * window (server render hydrates from seed in the store). Corrupt/incompatible
   * data also returns null rather than throwing.
   */
  private read(): PersistedState | null {
    if (!hasStorage()) return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.state);
      if (!raw) return null;
      return migrate(JSON.parse(raw));
    } catch {
      return null;
    }
  }

  /** Best-effort write of the full snapshot. Failures are swallowed (non-fatal). */
  private write(state: PersistedState): void {
    if (!hasStorage()) return;
    try {
      window.localStorage.setItem(STORAGE_KEYS.state, JSON.stringify(state));
    } catch {
      // quota / serialization / private-mode — ignore; in-memory state is source of truth.
    }
  }

  /**
   * Read the snapshot or fall back to a fresh seed. Used by mutating methods so
   * they always have a coherent base to update even on first run.
   */
  private readOrSeed(): PersistedState {
    return this.read() ?? createSeedState();
  }

  // ── DataRepository contract ──────────────────────────────────────────────────

  loadState(): Promise<PersistedState | null> {
    return Promise.resolve(this.read());
  }

  saveState(s: PersistedState): Promise<void> {
    // Defensive: only the durable slice is ever serialized. The PersistedState
    // type already excludes transient fields, but pin the version on the way out.
    this.write({ ...s, version: SCHEMA_VERSION });
    return Promise.resolve();
  }

  placeBet(input: PlaceBetInput): Promise<Bet> {
    const state = this.readOrSeed();
    const period = periodAt(input.mode, Date.now());
    const bet: Bet = {
      id: genId('b'),
      mode: input.mode,
      kind: input.kind,
      pick: input.pick,
      stake: input.stake,
      periodIdx: period.periodIdx,
      periodId: period.periodId,
      status: 'pending',
      createdAt: Date.now(),
    };

    // Deduct stake from the main wallet (minor-units; sub() clamps at 0).
    const wallet = { ...state.wallet, main: sub(state.wallet.main, input.stake) };

    // Bet ledger entry: a debit of the stake from main balance.
    const txn: Transaction = {
      id: genId('tb'),
      type: 'bet',
      method: 'system',
      amt: input.stake,
      dir: -1,
      status: 'success',
      createdAt: Date.now(),
    };

    this.write({
      ...state,
      wallet,
      bets: [bet, ...state.bets],
      tx: [txn, ...state.tx],
    });

    return Promise.resolve(bet);
  }

  createDeposit(input: DepositInput): Promise<Transaction> {
    const state = this.readOrSeed();
    const txn: Transaction = {
      id: genId('d'),
      type: 'deposit',
      method: input.network,
      amt: input.amt,
      dir: 1,
      status: 'success',
      createdAt: Date.now(),
    };

    this.write({
      ...state,
      wallet: { ...state.wallet, main: add(state.wallet.main, input.amt) },
      tx: [txn, ...state.tx],
    });

    return Promise.resolve(txn);
  }

  createWithdrawal(input: WithdrawInput): Promise<Transaction> {
    const state = this.readOrSeed();
    // 1% fee applied by the repository; the gross amount leaves the main balance.
    const fee = mul(input.amt, WITHDRAW_FEE_RATE);
    void fee; // fee is informational here; net settlement happens off-platform (Phase 2).

    const txn: Transaction = {
      id: genId('wd'),
      type: 'withdraw',
      method: input.network,
      amt: input.amt,
      dir: -1,
      status: 'pending', // withdrawals start pending (mirrors prototype)
      createdAt: Date.now(),
    };

    this.write({
      ...state,
      wallet: { ...state.wallet, main: sub(state.wallet.main, input.amt) },
      tx: [txn, ...state.tx],
    });

    return Promise.resolve(txn);
  }

  listTransactions(): Promise<Transaction[]> {
    return Promise.resolve(this.read()?.tx ?? []);
  }

  listBets(): Promise<Bet[]> {
    return Promise.resolve(this.read()?.bets ?? []);
  }

  getSetting<K extends keyof Settings>(k: K): Promise<Settings[K] | undefined> {
    const settings = this.read()?.settings;
    return Promise.resolve(settings ? settings[k] : undefined);
  }

  setSetting<K extends keyof Settings>(k: K, v: Settings[K]): Promise<void> {
    const state = this.readOrSeed();
    this.write({ ...state, settings: { ...state.settings, [k]: v } });
    return Promise.resolve();
  }
}

// Re-export engine helpers used at the seam so a Phase-2 settlement path can be
// wired here without new imports. (betWins/payoutMult/resultForPeriod are how the
// store settles bets; the repository persists the result, never invents it.)
export { betWins, payoutMult, resultForPeriod };

/** A ready-to-use singleton for the store to depend on. */
export const localStorageRepository = new LocalStorageRepository();
