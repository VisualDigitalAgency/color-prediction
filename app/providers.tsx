/**
 * app/providers.tsx — the single `'use client'` boundary for the app.
 *
 * The root `app/layout.tsx` stays a server component (fonts + no-flash script).
 * It wraps `{children}` in `<Providers>`, which is the ONE client boundary that:
 *   1. Provides theme context (`<ThemeProvider>`), so every descendant can read
 *      the active theme and `var(--…)` values are applied pre-paint.
 *   2. Triggers store hydration on mount (`useHydration()` — hydrates durable
 *      state from the repository and installs the debounced persist subscription)
 *      and starts the live wall-clock (`useNow()`, which also drives settlement).
 *   3. Mounts the global overlays exactly ONCE, above all routes:
 *      `<Toaster/>`, `<Celebration/>`, `<AgeGate/>`. Mounting them here (not per
 *      route) means a route change never unmounts/remounts a toast stack or the
 *      age gate.
 *
 * SSR-safe: hydration + the clock run only in effects (see lib/store/*). Nothing
 * here touches `window`/`localStorage`/`Date.now()` during render.
 */

'use client';

import type { ReactNode } from 'react';

import { AgeGate } from '@/components/shell/AgeGate';
import { Celebration } from '@/components/feedback/Celebration';
import { Toaster } from '@/components/feedback/Toaster';
import { ThemeProvider } from '@/lib/theme';
import { useHydration, useNow } from '@/lib/store';

/**
 * Inner client component that runs the mount-time store wiring and renders the
 * global overlays. Kept separate from `Providers` only for readability — both
 * live inside the same `'use client'` boundary.
 */
function AppRuntime({ children }: { children: ReactNode }) {
  // Hydrate durable state + install debounced persist (mount-time, in effects).
  useHydration();
  // Start the 250ms wall-clock that also drives bet settlement.
  useNow();

  return (
    <>
      {children}
      {/* Global overlays — mounted once, above every route. */}
      <Toaster />
      <Celebration />
      <AgeGate />
    </>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AppRuntime>{children}</AppRuntime>
    </ThemeProvider>
  );
}

export default Providers;
