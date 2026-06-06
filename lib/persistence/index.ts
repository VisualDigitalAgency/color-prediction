/**
 * lib/persistence — barrel for the storage seam (ADR 0004).
 *
 * Import the repository contract and the Phase-1 localStorage implementation from
 * here (`@/lib/persistence`) rather than reaching into individual modules. Phase 2
 * swaps `LocalStorageRepository` for a `RestRepository` implementing the same
 * `DataRepository` interface — callers depend only on the contract, never a concrete.
 */

// ── Contract (re-exported from the seam doc module) ─────────────────────────────
export type { Repository, DataRepository } from './repository';

// ── Phase-1 concrete implementation ─────────────────────────────────────────────
export {
  LocalStorageRepository,
  localStorageRepository,
  STORAGE_KEYS,
} from './LocalStorageRepository';

// ── Seed (initial demo snapshot) ────────────────────────────────────────────────
export {
  createSeedState,
  SCHEMA_VERSION,
  seedWallet,
  seedVip,
  seedRewards,
  seedUser,
  seedAuth,
  seedSettings,
} from './seed';
