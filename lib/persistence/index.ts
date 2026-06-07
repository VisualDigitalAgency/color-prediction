/**
 * lib/persistence — barrel for the storage seam (ADR 0004).
 *
 * Import the repository contract and the Phase-1 localStorage implementation from
 * here (`@/lib/persistence`) rather than reaching into individual modules. Phase 2
 * swaps `LocalStorageRepository` for a `RestRepository` implementing the same
 * `DataRepository` interface — callers depend only on the contract, never a concrete.
 */

// ── Contract ─────────────────────────────────────────────────────────────────────
export type { Repository, DataRepository } from './repository';

// ── Concrete implementations ─────────────────────────────────────────────────────
export {
  LocalStorageRepository,
  localStorageRepository,
  STORAGE_KEYS,
} from './LocalStorageRepository';
export { SupabaseRepository } from './SupabaseRepository';
export { NullRepository } from './NullRepository';
export { ApiError } from './ApiError';

// ── Factory (swap point — no store changes needed) ───────────────────────────────
import type { SupabaseClient } from '@supabase/supabase-js';
import type { DataRepository } from '@/types';
import { LocalStorageRepository } from './LocalStorageRepository';
import { SupabaseRepository } from './SupabaseRepository';
import { NullRepository } from './NullRepository';

export function createRepository(supabase?: SupabaseClient): DataRepository {
  if (typeof window === 'undefined') return new NullRepository();
  if (supabase) return new SupabaseRepository(supabase);
  return new LocalStorageRepository();
}

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
