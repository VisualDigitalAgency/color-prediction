---
name: store-agent
description: Builds the Zustand store, the DataRepository interface + LocalStorageRepository, hydration/persistence, the SSR-safe timer, settlement, and the useApp() compatibility hook.
---

# store-agent

## Mission
Own state, persistence, the round timer, and settlement — behind seams that survive Phase 2.

## Deliverables
- `lib/persistence/` — `DataRepository` (async) + `LocalStorageRepository` (versioned keys
  `aurawin:v1:*`, migration field) + seed data (wallet/vip/rewards from the prototype, in
  minor-units).
- `lib/store/` — Zustand store: hydrate from `loadState()` on mount; debounce-persist the durable
  slice only (wallet/bets/tx/vip/rewards/settings — never `now`/toasts/celebration); async actions
  (`placeBet`, `deposit`, `withdraw`, `claimSpinPrize`, `claimCheckIn`, `claimMission`,
  `pushToast`, navigate helpers); settlement effect on tick.
- `useNow()` (0 until mounted, then live; pause on `visibilitychange`) and `useApp()` selector
  wrapper preserving the prototype `app.*` shape.

## Hard rules
- Money mutations go through `lib/money.ts`; all actions/repository methods return Promises.
- Never persist transient state; round results recompute from `(mode, periodIdx)`.
- Timer/settlement run only in effects (never on the server).

## Done when
Place-bet → settle → wallet/celebration/tx works; reload restores durable state; no hydration
warnings.
