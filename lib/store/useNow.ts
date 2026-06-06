/**
 * lib/store/useNow.ts — SSR-safe live wall-clock hook.
 *
 * Returns `0` until the component mounts on the client, then a live tick that
 * advances every 250ms. The tick also drives the store's `setNow(now)` so the
 * round timer and bet settlement stay in lockstep across every screen.
 *
 * SSR-SAFETY: no `Date.now()` / `window` / `document` access at module load or
 * during render. The interval + visibility listener are wired in an effect only.
 *
 * VISIBILITY: the tick pauses while the tab is hidden (`document.hidden`) to
 * avoid wasted work; on becoming visible it immediately catches up to real time.
 * Cleanup clears the interval and removes the listener on unmount.
 *
 * SLICE SUBSCRIPTION: the 250ms tick writes only `now` (+ any settlement) into
 * the store. Components that don't select `now` never re-render from the tick.
 */

'use client';

import { useEffect, useState } from 'react';

import { useStore } from './store';

const TICK_MS = 250;

/**
 * Live wall-clock in unix ms. `0` until mounted (stable SSR/first-paint value),
 * then ticks every 250ms while the tab is visible. Also pushes `now` into the
 * store via `setNow` so settlement runs on the same cadence.
 */
export function useNow(): number {
  const [now, setLocalNow] = useState(0);

  useEffect(() => {
    const setNow = useStore.getState().setNow;

    let interval: ReturnType<typeof setInterval> | null = null;

    const tick = () => {
      const t = Date.now();
      setLocalNow(t);
      setNow(t);
    };

    const start = () => {
      if (interval != null) return;
      tick(); // immediate catch-up
      interval = setInterval(tick, TICK_MS);
    };

    const stop = () => {
      if (interval != null) {
        clearInterval(interval);
        interval = null;
      }
    };

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    // Kick off (unless the tab loads hidden).
    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return now;
}
