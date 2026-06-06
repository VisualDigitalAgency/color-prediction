/**
 * lib/store/store.ts — the AuraWin Zustand store (single source of truth).
 *
 * Ported from the CDN React 18 prototype (`/tmp/proto_extract/app/store.jsx`)
 * whose components call `app.wallet`, `app.placeBet(...)`, `app.navigate(...)`
 * on one shared store object. Here that shared object is a Zustand store; the
 * `app.*` call shape is preserved by the `useApp()` selector hook (see useApp.ts).
 *
 * STATE SHAPE
 *   Durable (persisted via the repository, debounced):
 *     auth, user, wallet, bets, tx, vip, rewards, settings
 *   Transient (NEVER persisted — memory only):
 *     now, toasts, celebration, hydrated, screen
 *   Round results are NEVER persisted either — they recompute deterministically
 *   from `(mode, periodIdx)` via the fair engine.
 *
 * HARD RULES
 *   - Money is integer minor-units ONLY. Every balance mutation goes through
 *     `add`/`sub`/`mul` from lib/money. No float arithmetic, no raw +/- on balances.
 *   - All money/outcome-mutating actions return Promises (deposit, withdraw,
 *     placeBet, claim*) so the Phase-2 server-authoritative swap keeps signatures.
 *   - Settlement is idempotent: a bet is only settled while it is still `pending`
 *     AND its period has rolled over; settling flips it to `won`/`lost`, so a
 *     repeated `settle(now)` for the same tick is a no-op.
 *   - SSR-safe: no `Date.now()`/`window`/`localStorage` at module load. Timer +
 *     hydration run only in effects (see useNow.ts / hydration.ts).
 */

import { create } from 'zustand';

import { add, sub, mul } from '@/lib/money';
import {
  periodAt,
  resultForPeriod,
  betWins,
  payoutMult,
} from '@/lib/fair';
import { localStorageRepository } from '@/lib/persistence';
import { createSeedState } from '@/lib/persistence';
import { NETWORK_LABEL } from '@/lib/strings';
import STRINGS from '@/lib/strings';

import type {
  AuthState,
  User,
  Wallet,
  Bet,
  Transaction,
  Vip,
  RewardsState,
  Settings,
  ThemeId,
  PersistedState,
  PlaceBetInput,
  DepositInput,
  WithdrawInput,
  RoundMode,
  BetKind,
  BetPick,
} from '@/types';

// ── Transient value shapes ──────────────────────────────────────────────────

export type ToastKind = 'info' | 'success' | 'error';

export interface Toast {
  id: string;
  msg: string;
  kind: ToastKind;
}

/** Win celebration overlay payload. `amount` = net profit, `credit` = total paid. */
export interface Celebration {
  /** Net profit in minor-units (total payout minus the staked amount). */
  amount: number;
  /** Total credited to the winning wallet in minor-units. */
  credit: number;
  /** Timestamp (unix ms) the celebration was triggered. */
  at: number;
}

/** Outcome of a money-mutating action. Promise-returning per the async seam. */
export interface ActionResult {
  ok: boolean;
  /** Optional error message (already localized) when `ok` is false. */
  error?: string;
}

// ── Store state + actions ───────────────────────────────────────────────────

export interface AppState {
  // ── Durable ───────────────────────────────────────────────────────────────
  auth: AuthState;
  user?: User;
  wallet: Wallet;
  bets: Bet[];
  tx: Transaction[];
  vip: Vip;
  rewards: RewardsState;
  settings: Settings;

  // ── Transient (never persisted) ────────────────────────────────────────────
  /** Live wall-clock (unix ms). 0 until the client mounts and the tick starts. */
  now: number;
  toasts: Toast[];
  celebration: Celebration | null;
  hydrated: boolean;
  /** Intended screen/route key. The shell wires this to the Next router later. */
  screen: string;

  // ── Lifecycle ───────────────────────────────────────────────────────────────
  /** Load durable state from the repository; seed if empty. Idempotent. */
  hydrate(): Promise<void>;
  /** Replace the durable slice (used by hydration). */
  applyPersisted(state: PersistedState): void;

  // ── Timer / settlement ──────────────────────────────────────────────────────
  /** Advance the wall-clock and settle any rolled-over pending bets. */
  setNow(now: number): void;
  /** Settle all pending bets whose period has ended at `now`. Idempotent. */
  settle(now: number): void;

  // ── Money / outcomes (Promise-returning) ────────────────────────────────────
  placeBet(input: PlaceBetInput): Promise<ActionResult>;
  deposit(input: DepositInput): Promise<ActionResult>;
  withdraw(input: WithdrawInput): Promise<ActionResult>;
  claimSpinPrize(): Promise<ActionResult>;
  claimCheckIn(): Promise<ActionResult>;
  claimMission(missionId: string): Promise<ActionResult>;

  // ── Auth / navigation ───────────────────────────────────────────────────────
  setAuthed(authed: boolean, user?: User): void;
  navigate(screen: string): void;

  // ── Toasts / celebration (transient) ────────────────────────────────────────
  pushToast(msg: string, kind?: ToastKind): string;
  dismissToast(id: string): void;
  clearCelebration(): void;

  // ── Settings ────────────────────────────────────────────────────────────────
  setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void;
  setTheme(theme: ThemeId): void;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Reasonably-unique id with a prefix (matches the prototype/repository style). */
function genId(prefix: string): string {
  return `${prefix}${Date.now()}${Math.random().toString(36).slice(2, 7)}`;
}

/** The durable slice extracted from full state, ready to persist. */
export function toPersisted(s: AppState): PersistedState {
  return {
    version: 1,
    auth: s.auth,
    wallet: s.wallet,
    bets: s.bets,
    tx: s.tx,
    vip: s.vip,
    rewards: s.rewards,
    settings: s.settings,
  };
}

/** Network method label for a transaction (e.g. 'USDT · TRC20'). */
function networkMethod(network: WithdrawInput['network'] | DepositInput['network']) {
  return network;
}

// ── Store ───────────────────────────────────────────────────────────────────

const initial = createSeedState();

export const useStore = create<AppState>()((set, get) => ({
  // ── Durable (seeded; replaced on hydrate) ─────────────────────────────────
  auth: initial.auth,
  user: undefined,
  wallet: initial.wallet,
  bets: initial.bets,
  tx: initial.tx,
  vip: initial.vip,
  rewards: initial.rewards,
  settings: initial.settings,

  // ── Transient ─────────────────────────────────────────────────────────────
  now: 0,
  toasts: [],
  celebration: null,
  hydrated: false,
  screen: 'login',

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  async hydrate() {
    if (get().hydrated) return;
    try {
      const loaded = await localStorageRepository.loadState();
      const state = loaded ?? createSeedState();
      if (!loaded) {
        await localStorageRepository.saveState(state);
      }
      get().applyPersisted(state);
    } catch {
      // localStorage unavailable or corrupt; operate on seed state already in store.
    } finally {
      set({ hydrated: true });
    }
  },

  applyPersisted(state) {
    set({
      auth: state.auth,
      wallet: state.wallet,
      bets: state.bets,
      tx: state.tx,
      vip: state.vip,
      rewards: state.rewards,
      settings: state.settings,
    });
  },

  // ── Timer / settlement ────────────────────────────────────────────────────
  setNow(now) {
    set({ now });
    get().settle(now);
  },

  settle(now) {
    const { bets } = get();
    if (bets.length === 0) return;

    let changed = false;
    let netWin = 0; // minor-units net profit across winning bets
    let credit = 0; // minor-units total credited to the winning wallet

    const nextBets = bets.map((b) => {
      if (b.status !== 'pending') return b;
      // Period has not rolled over yet — not settleable.
      const curIdx = Math.floor(now / (b.mode * 1000));
      if (curIdx <= b.periodIdx) return b;

      const result = resultForPeriod(b.mode, b.periodIdx);
      changed = true;
      if (betWins(b, result)) {
        const pay = mul(b.stake, payoutMult(b)); // minor-units
        credit = add(credit, pay);
        netWin = add(netWin, sub(pay, b.stake));
        return { ...b, status: 'won' as const, payout: pay, result };
      }
      return { ...b, status: 'lost' as const, payout: 0, result };
    });

    if (!changed) return;

    if (credit > 0) {
      const winTx: Transaction = {
        id: genId('w'),
        type: 'win',
        method: 'system',
        amt: credit,
        dir: 1,
        status: 'success',
        createdAt: Date.now(),
      };
      set((s) => ({
        bets: nextBets,
        wallet: { ...s.wallet, winning: add(s.wallet.winning, credit) },
        tx: [winTx, ...s.tx],
        celebration: { amount: netWin, credit, at: Date.now() },
      }));
    } else {
      set({ bets: nextBets });
      get().pushToast(STRINGS.game.noWin, 'info');
    }
  },

  // ── Money / outcomes ──────────────────────────────────────────────────────
  async placeBet(input) {
    const { wallet } = get();
    // Reject zero or negative stakes before touching the wallet.
    if (input.stake <= 0) {
      return { ok: false, error: STRINGS.game.insufficientBalance };
    }
    // Validate stake against the available main balance (minor-units).
    if (input.stake > wallet.main) {
      const msg = STRINGS.game.insufficientBalance;
      get().pushToast(msg, 'error');
      return { ok: false, error: msg };
    }

    const bet = await localStorageRepository.placeBet(input);

    set((s) => ({
      // Deduct stake from main wallet via sub() (clamps at 0).
      wallet: { ...s.wallet, main: sub(s.wallet.main, input.stake) },
      bets: [bet, ...s.bets],
      tx: [
        {
          id: genId('tb'),
          type: 'bet',
          method: 'system',
          amt: input.stake,
          dir: -1,
          status: 'success',
          createdAt: Date.now(),
        } as Transaction,
        ...s.tx,
      ],
    }));

    get().pushToast(STRINGS.game.betPlaced, 'success');
    return { ok: true };
  },

  async deposit(input) {
    const txn = await localStorageRepository.createDeposit(input);
    set((s) => ({
      wallet: { ...s.wallet, main: add(s.wallet.main, input.amt) },
      tx: [txn, ...s.tx],
    }));
    get().pushToast(STRINGS.wallet.depositSubmitted, 'success');
    return { ok: true };
  },

  async withdraw(input) {
    const { wallet } = get();
    if (input.amt > wallet.main) {
      const msg = STRINGS.wallet.amountExceedsBalance;
      get().pushToast(msg, 'error');
      return { ok: false, error: msg };
    }
    const txn = await localStorageRepository.createWithdrawal(input);
    set((s) => ({
      wallet: { ...s.wallet, main: sub(s.wallet.main, input.amt) },
      tx: [txn, ...s.tx],
    }));
    get().pushToast(STRINGS.wallet.withdrawalSubmitted, 'success');
    return { ok: true };
  },

  // ── Rewards (inline mutations from web-pages2.jsx, moved into the store) ───
  async claimSpinPrize() {
    const { rewards } = get();
    if (rewards.freeSpins <= 0) {
      return { ok: false, error: STRINGS.rewards.spinComeback };
    }
    // Weighted random pick across spin prizes (prototype used uniform weights).
    const total = rewards.spinPrizes.reduce((sum, p) => sum + p.weight, 0);
    let roll = Math.random() * total;
    let prize = rewards.spinPrizes[0];
    for (const p of rewards.spinPrizes) {
      roll -= p.weight;
      if (roll <= 0) {
        prize = p;
        break;
      }
    }

    set((s) => ({
      rewards: { ...s.rewards, freeSpins: Math.max(0, s.rewards.freeSpins - 1) },
      // Spin prizes credit the BONUS sub-wallet (prototype: w.bonus + p.v).
      wallet:
        prize.amount > 0
          ? { ...s.wallet, bonus: add(s.wallet.bonus, prize.amount) }
          : s.wallet,
    }));

    if (prize.amount > 0) {
      get().pushToast(
        `${STRINGS.rewards.spinWon} ${prize.label} ${STRINGS.rewards.spinWonSuffix}`,
        'success',
      );
      return { ok: true };
    }
    get().pushToast(STRINGS.rewards.spinNoPrize, 'info');
    return { ok: true };
  },

  async claimCheckIn() {
    const { rewards } = get();
    // Next unclaimed day index (prototype: claimed count → next day).
    const day = rewards.checkInClaimed.length;
    if (day >= rewards.checkInRewards.length) {
      return { ok: false };
    }
    const reward = rewards.checkInRewards[day];
    set((s) => ({
      // Check-in credits the BONUS sub-wallet (prototype: w.bonus + days[claimed]).
      wallet: { ...s.wallet, bonus: add(s.wallet.bonus, reward) },
      rewards: {
        ...s.rewards,
        checkInClaimed: [...s.rewards.checkInClaimed, day],
      },
    }));
    get().pushToast(
      `${STRINGS.rewards.claim} ${STRINGS.rewards.checkInUsdtSuffix}`,
      'success',
    );
    return { ok: true };
  },

  async claimMission(missionId) {
    const { rewards } = get();
    const mission = rewards.missions.find((m) => m.id === missionId);
    if (!mission) return { ok: false };
    // Only completed, not-yet-claimed missions are claimable.
    if (mission.progress < mission.goal || mission.done) {
      return { ok: false };
    }
    set((s) => ({
      // Mission rewards credit the BONUS sub-wallet.
      wallet: { ...s.wallet, bonus: add(s.wallet.bonus, mission.reward) },
      rewards: {
        ...s.rewards,
        missions: s.rewards.missions.map((m) =>
          m.id === missionId ? { ...m, done: true } : m,
        ),
      },
    }));
    get().pushToast(STRINGS.rewards.claim, 'success');
    return { ok: true };
  },

  // ── Auth / navigation ─────────────────────────────────────────────────────
  setAuthed(authed, user) {
    set((s) => ({
      auth: { authed, user: user ?? s.auth.user },
      user: user ?? s.user,
    }));
  },

  navigate(screen) {
    set({ screen });
  },

  // ── Toasts / celebration ──────────────────────────────────────────────────
  pushToast(msg, kind = 'info') {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { id, msg, kind }] }));
    if (typeof setTimeout !== 'undefined') {
      setTimeout(() => get().dismissToast(id), 2600);
    }
    return id;
  },

  dismissToast(id) {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },

  clearCelebration() {
    set({ celebration: null });
  },

  // ── Settings ──────────────────────────────────────────────────────────────
  setSetting(key, value) {
    set((s) => ({ settings: { ...s.settings, [key]: value } }));
    // Fire-and-forget persist of the single setting (repository is async).
    void localStorageRepository.setSetting(key, value);
  },

  setTheme(theme) {
    get().setSetting('theme', theme);
  },
}));

// Keep referenced helpers from being flagged as unused (network label map is
// used by screens via strings; networkMethod documents the mapping intent).
void NETWORK_LABEL;
void networkMethod;

// ── Re-exports for convenience ──────────────────────────────────────────────
export type {
  RoundMode,
  BetKind,
  BetPick,
  PlaceBetInput,
  DepositInput,
  WithdrawInput,
} from '@/types';
export { periodAt };
