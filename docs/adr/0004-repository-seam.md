# ADR 0004 — Persistence: DataRepository seam over localStorage

## Status
Accepted

## Context
Phase 1 is frontend-only but Phase 2 adds a real backend + DB. We want that swap to be a change
of adapter, not a rewrite of the store.

## Decision
Define a storage-agnostic **`DataRepository`** interface whose methods mirror future REST
endpoints (`loadState/saveState`, `placeBet`, `createDeposit/Withdrawal`, `listTransactions/Bets`,
`get/setSetting`). All methods are **async**. `LocalStorageRepository` implements it now with
versioned keys (`aurawin:v1:*`) and a migration `version` field. The store hydrates from
`loadState()` and debounce-persists the durable slice only.

## Consequences
- Phase 2 = implement a `RestRepository`; store API unchanged.
- Async-by-default keeps signatures stable across the Phase boundary (see ADR 0005).
- Must guard against persisting transient state and against storage quota/serialization issues.
