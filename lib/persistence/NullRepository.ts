/**
 * NullRepository — SSR stub. All reads return null/[]; writes are no-ops.
 * Used server-side where no storage is available and the client will hydrate
 * from SupabaseRepository once the session is established.
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

export class NullRepository implements DataRepository {
  loadState(): Promise<PersistedState | null> { return Promise.resolve(null); }
  saveState(): Promise<void> { return Promise.resolve(); }
  placeBet(_: PlaceBetInput): Promise<Bet> { return Promise.reject(new Error('SSR')); }
  createDeposit(_: DepositInput): Promise<Transaction> { return Promise.reject(new Error('SSR')); }
  createWithdrawal(_: WithdrawInput): Promise<Transaction> { return Promise.reject(new Error('SSR')); }
  listTransactions(): Promise<Transaction[]> { return Promise.resolve([]); }
  listBets(): Promise<Bet[]> { return Promise.resolve([]); }
  getSetting<K extends keyof Settings>(_k: K): Promise<Settings[K] | undefined> { return Promise.resolve(undefined); }
  setSetting<K extends keyof Settings>(_k: K, _v: Settings[K]): Promise<void> { return Promise.resolve(); }
}
