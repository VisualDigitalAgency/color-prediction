/**
 * lib/store/hydration.ts — client-side hydrate + debounced persist wiring.
 *
 * Phase 2: detects a Supabase session on mount and swaps to SupabaseRepository
 * before calling hydrate(). Falls back to LocalStorageRepository when no session
 * is present (dev / unauthenticated). The store and all callers are unchanged.
 */

'use client';

import { useEffect } from 'react';

import { SupabaseRepository } from '@/lib/persistence/SupabaseRepository';
import { localStorageRepository } from '@/lib/persistence';
import { createSupabaseClient } from '@/lib/supabase/client';

import { useStore, toPersisted, setRepository, getRepository, type AppState } from './store';

const PERSIST_DEBOUNCE_MS = 400;

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

function durableChanged(
  a: ReturnType<typeof durableSignature>,
  b: ReturnType<typeof durableSignature>,
): boolean {
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

export function useHydration(): boolean {
  const hydrated = useStore((s) => s.hydrated);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let prev = durableSignature(useStore.getState());

    // Detect Supabase session; swap repository before hydrating
    const supabase = createSupabaseClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (cancelled) return;
      if (user) {
        setRepository(new SupabaseRepository(supabase));
      }
      void useStore.getState().hydrate();
    }).catch(() => {
      if (!cancelled) void useStore.getState().hydrate();
    });

    const unsubscribe = useStore.subscribe((state) => {
      const next = durableSignature(state);
      if (!durableChanged(prev, next)) return;
      prev = next;
      if (timer != null) clearTimeout(timer);
      timer = setTimeout(() => {
        if (cancelled) return;
        void getRepository().saveState(toPersisted(useStore.getState()));
      }, PERSIST_DEBOUNCE_MS);
    });

    return () => {
      cancelled = true;
      if (timer != null) clearTimeout(timer);
      unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return hydrated;
}
