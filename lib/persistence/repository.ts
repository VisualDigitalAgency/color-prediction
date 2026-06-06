/**
 * lib/persistence/repository.ts — the storage seam (ADR 0004).
 *
 * This file documents and re-exports the `DataRepository` contract. Every method
 * is async (Promise-returning) so the Phase-2 REST swap (RestRepository) is a pure
 * adapter change — the store and all callers depend ONLY on this interface, never
 * on a concrete implementation.
 *
 * Phase 1: `LocalStorageRepository` (versioned `aurawin:v1:*` keys, SSR-safe).
 * Phase 2: `RestRepository` implementing the same interface, signatures unchanged.
 *
 * Import the interface from here (or from `@/lib/persistence`) rather than reaching
 * into a concrete implementation.
 */

import type {
  DataRepository,
  PersistedState,
  PlaceBetInput,
  DepositInput,
  WithdrawInput,
  Bet,
  Transaction,
  Settings,
} from '@/types';

export type {
  DataRepository,
  PersistedState,
  PlaceBetInput,
  DepositInput,
  WithdrawInput,
  Bet,
  Transaction,
  Settings,
};

/**
 * Convenience alias. `Repository` reads naturally at call sites
 * (`const repo: Repository = new LocalStorageRepository()`).
 */
export type Repository = DataRepository;
