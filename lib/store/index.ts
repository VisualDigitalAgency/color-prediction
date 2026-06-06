/**
 * lib/store — barrel for the AuraWin Zustand store.
 *
 * Public surface:
 *   - `useStore`         the raw Zustand store (selector API) + `AppState` type.
 *   - `useApp` / `AppApi` prototype-compatible `app.*` hook (slice-subscribed).
 *   - `useAppNow`        opt-in live-clock slice (kept separate for perf).
 *   - `useNow`           SSR-safe 250ms wall-clock that also drives settlement.
 *   - `useHydration`     mount-time hydrate + debounced durable-state persist.
 *   - transient value types (`Toast`, `Celebration`, `ActionResult`, …).
 *
 * Import from `@/lib/store` rather than reaching into individual modules.
 */

export {
  useStore,
  toPersisted,
  periodAt,
} from './store';

export type {
  AppState,
  Toast,
  ToastKind,
  Celebration,
  ActionResult,
} from './store';

export { useApp, useAppNow } from './useApp';
export type { AppApi } from './useApp';

export { useNow } from './useNow';
export { useHydration } from './hydration';
