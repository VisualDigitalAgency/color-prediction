/**
 * lib/store/hydration.ts — client-side hydrate + debounced persist wiring.
 *
 * `useHydration()` runs once on mount:
 *   1. Hydrates durable state from `repository.loadState()` (seeds if empty).
 *   2. Subscribes to the store and debounce-persists the DURABLE slice whenever
 *      it changes (auth, user→via auth, wallet, bets, tx, vip, rewards, settings).
 *
 * NEVER persisted: `now`, `toasts`, `celebration`, `hydrated`, `screen`, and
 * round results (those recompute from `(mode, periodIdx)` via the fair engine).
 * The persist subscription IGNORES changes to transient fields entirely — a
 * 250ms `now` tick or a toast push does not schedule a write.
 *
 * SSR-SAFE: all of this lives in an effect; nothing touches storage at module
 * load or during render.
 */

'use client';

import { useEffect } from 'react';

import { localStorageRepository } from '@/lib/persistence';

import { useStore, toPersisted, type AppState } from './store';

/** Debounce window for persistence writes (ms). */
const PERSIST_DEBOUNCE_MS = 400;

/** The durable slice as a stable shallow signature for change detection. */
function durableSignature(s: AppState) {
  return {
    auth: s.auth,
    user: s.user,
    wallet: s.wallet,
    bets: s.bets,
    tx: s.tx,
    vip: s.vip,
    rewards: s.rewards,
    settings: s.settings,
  };
}

function durableChanged(a: ReturnType<typeof durableSignature>, b: ReturnType<typeof durableSignature>): boolean {
  return (
    a.auth !== b.auth ||
    a.user !== b.user ||
    a.wallet !== b.wallet ||
    a.bets !== b.bets ||
    a.tx !== b.tx ||
    a.vip !== b.vip ||
    a.rewards !== b.rewards ||
    a.settings !== b.settings
  );
}

/**
 * Mount-time hook: hydrates the store from the repository and installs a
 * debounced persist subscription on the durable slice. Returns the `hydrated`
 * flag so callers can gate first paint if desired.
 */
export function useHydration(): boolean {
  const hydrated = useStore((s) => s.hydrated);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let prev = durableSignature(useStore.getState());

    void useStore.getState().hydrate();

    const unsubscribe = useStore.subscribe((state) => {
      const next = durableSignature(state);
      // Only schedule a write when a DURABLE field actually changed.
      if (!durableChanged(prev, next)) return;
      prev = next;
      if (timer != null) clearTimeout(timer);
      timer = setTimeout(() => {
        if (cancelled) return;
        // Persist the durable slice only — transient state is excluded by toPersisted.
        void localStorageRepository.saveState(toPersisted(useStore.getState()));
      }, PERSIST_DEBOUNCE_MS);
    });

    return () => {
      cancelled = true;
      if (timer != null) clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  return hydrated;
}
