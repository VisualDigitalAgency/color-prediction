/**
 * lib/store/useApp.ts — `app.*` compatibility hook.
 *
 * The CDN React 18 prototype shared one context object whose call shape was
 * `app.wallet`, `app.placeBet(...)`, `app.navigate(...)`, `app.pushToast(...)`,
 * plus pure game helpers (`app.periodAt`, `app.secondsLeft`, …). Ported screens
 * keep calling that shape; this hook reconstructs it on top of the Zustand store
 * so those components compile and run unchanged.
 *
 * SLICE SUBSCRIPTIONS (perf):
 *   The 250ms `now` tick must NOT re-render the whole tree. `useApp()` therefore
 *   subscribes ONLY to the durable/UI slices a typical screen reads — it does NOT
 *   select `now`. Components that need the live clock call `useNow()` directly
 *   (its own slice), so the tick re-renders only those components. Game helpers
 *   are pure functions and stable action references (Zustand actions never change
 *   identity), so they live in a module-stable object and never trigger renders.
 *
 * If a component truly needs `app.now`, it should migrate to `useNow()`. For
 * source-compatibility we expose `now` via a SEPARATE opt-in hook (`useAppNow`)
 * rather than folding it into `useApp()`, to preserve slice isolation.
 */

'use client';

import { useShallow } from 'zustand/react/shallow';

import {
  periodAt,
  secondsLeft,
  recentResults,
  resultForPeriod,
  MODES,
  MODE_LABEL,
} from '@/lib/fair';
import { add } from '@/lib/money';

import { useStore, type AppState } from './store';

/**
 * The prototype `app` object shape, typed against the real store. Money-mutating
 * actions are Promise-returning (the async seam); transient helpers are sync.
 */
export interface AppApi {
  // ── Auth / nav ─────────────────────────────────────────────────────────────
  authed: boolean;
  setAuthed: AppState['setAuthed'];
  screen: string;
  navigate: AppState['navigate'];

  // ── Wallet / ledger ────────────────────────────────────────────────────────
  wallet: AppState['wallet'];
  /** Sum of every sub-wallet in minor-units (via `add`, never raw `+`). */
  totalBalance(): number;
  tx: AppState['tx'];
  bets: AppState['bets'];
  vip: AppState['vip'];
  rewards: AppState['rewards'];
  settings: AppState['settings'];

  // ── Celebration / toasts (transient) ───────────────────────────────────────
  celebration: AppState['celebration'];
  clearCelebration: AppState['clearCelebration'];
  toasts: AppState['toasts'];
  pushToast: AppState['pushToast'];
  dismissToast: AppState['dismissToast'];

  // ── Money / outcomes (Promise-returning) ───────────────────────────────────
  placeBet: AppState['placeBet'];
  deposit: AppState['deposit'];
  withdraw: AppState['withdraw'];
  claimSpinPrize: AppState['claimSpinPrize'];
  claimCheckIn: AppState['claimCheckIn'];
  claimMission: AppState['claimMission'];

  // ── Settings ───────────────────────────────────────────────────────────────
  setSetting: AppState['setSetting'];
  setTheme: AppState['setTheme'];

  // ── Pure game helpers (stable; never cause re-renders) ─────────────────────
  MODES: typeof MODES;
  MODE_LABEL: typeof MODE_LABEL;
  periodAt: typeof periodAt;
  secondsLeft: typeof secondsLeft;
  recentResults: typeof recentResults;
  resultForPeriod: typeof resultForPeriod;
}

/** Module-stable bundle of pure helpers — identity never changes. */
const HELPERS = {
  MODES,
  MODE_LABEL,
  periodAt,
  secondsLeft,
  recentResults,
  resultForPeriod,
} as const;

/**
 * Reconstruct the prototype `app.*` object from the store.
 *
 * Subscribes (shallow) to the durable + UI slices a screen reads. It deliberately
 * does NOT subscribe to `now`, so the 250ms tick never re-renders `useApp()`
 * consumers — use `useNow()` for the live clock.
 */
export function useApp(): AppApi {
  const slice = useStore(
    useShallow((s) => ({
      authed: s.auth.authed,
      setAuthed: s.setAuthed,
      screen: s.screen,
      navigate: s.navigate,

      wallet: s.wallet,
      tx: s.tx,
      bets: s.bets,
      vip: s.vip,
      rewards: s.rewards,
      settings: s.settings,

      celebration: s.celebration,
      clearCelebration: s.clearCelebration,
      toasts: s.toasts,
      pushToast: s.pushToast,
      dismissToast: s.dismissToast,

      placeBet: s.placeBet,
      deposit: s.deposit,
      withdraw: s.withdraw,
      claimSpinPrize: s.claimSpinPrize,
      claimCheckIn: s.claimCheckIn,
      claimMission: s.claimMission,

      setSetting: s.setSetting,
      setTheme: s.setTheme,
    })),
  );

  const wallet = slice.wallet;
  const totalBalance = () =>
    add(add(wallet.main, wallet.winning), add(wallet.bonus, wallet.referral));

  return {
    ...slice,
    totalBalance,
    ...HELPERS,
  };
}

/**
 * Opt-in live-clock slice, kept separate from `useApp()` so the 250ms tick only
 * re-renders components that actually read `now`. Prefer `useNow()` (which also
 * drives settlement); this exists for prototype `app.now` source-compatibility.
 */
export function useAppNow(): number {
  return useStore((s) => s.now);
}
