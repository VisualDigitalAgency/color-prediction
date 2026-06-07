/**
 * lib/persistence/SupabaseRepository.ts — Phase-2 DataRepository backed by Supabase.
 *
 * Two-tier pattern (ADR 0005):
 *   Simple reads  → direct Supabase client (anon key, RLS enforced)
 *   Write mutations → Next.js API routes (service role, atomic transactions)
 *
 * The DataRepository interface is unchanged — zero store modifications needed.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { periodAt } from '@/lib/fair';
import { createSeedState } from './seed';
import { ApiError } from './ApiError';
import type {
  DataRepository,
  PersistedState,
  PlaceBetInput,
  DepositInput,
  WithdrawInput,
  Bet,
  BetPick,
  BetStatus,
  Transaction,
  TransactionType,
  TransactionStatus,
  Settings,
  ThemeId,
  Wallet,
  Vip,
} from '@/types';

// ── DB row → domain type mappers ──────────────────────────────────────────────

function rowToBet(row: Record<string, unknown>): Bet {
  return {
    id: row.id as string,
    mode: row.mode as Bet['mode'],
    kind: row.kind as Bet['kind'],
    pick: (typeof row.pick === 'string' && /^\d$/.test(row.pick)
      ? parseInt(row.pick, 10)
      : row.pick) as BetPick,
    stake: row.stake as number,
    periodIdx: row.period_idx as number,
    periodId: row.period_id as string,
    status: row.status as BetStatus,
    payout: row.payout as number | undefined,
    createdAt: row.created_at as number,
  };
}

function rowToTx(row: Record<string, unknown>): Transaction {
  return {
    id: row.id as string,
    type: row.type as TransactionType,
    method: (row.method ?? 'system') as Transaction['method'],
    amt: row.amt as number,
    dir: row.dir as 1 | -1,
    status: row.status as TransactionStatus,
    createdAt: row.created_at as number,
  };
}

function rowToWallet(row: Record<string, unknown>): Wallet {
  return {
    main: row.main as number,
    bonus: row.bonus as number,
    winning: row.winning as number,
    referral: row.referral as number,
  };
}

function rowToSettings(row: Record<string, unknown>): Settings {
  return {
    theme: (row.theme ?? 'neon') as ThemeId,
    reducedMotion: (row.reduced_motion ?? false) as boolean,
    colorBlindCue: (row.color_blind_cue ?? false) as boolean,
    ageConfirmed: (row.age_confirmed ?? false) as boolean,
  };
}

function rowToVip(row: Record<string, unknown>): Vip {
  return {
    level: (row.vip_level ?? 0) as number,
    name: vipName((row.vip_level ?? 0) as number),
    points: (row.xp ?? 0) as number,
    next: vipNextThreshold((row.vip_level ?? 0) as number),
  };
}

function vipName(level: number): string {
  return ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'][level] ?? 'Bronze';
}

function vipNextThreshold(level: number): number {
  return [1000, 3000, 6000, 10000, 20000][level] ?? 1000;
}

// ── Repository ────────────────────────────────────────────────────────────────

export class SupabaseRepository implements DataRepository {
  constructor(private supabase: SupabaseClient) {}

  private async userId(): Promise<string> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return user.id;
  }

  async loadState(): Promise<PersistedState | null> {
    let uid: string;
    try {
      uid = await this.userId();
    } catch {
      return null;
    }

    const [walletRes, betsRes, txRes, settingsRes, vipRes] = await Promise.all([
      this.supabase.from('wallets').select('*').eq('user_id', uid).single(),
      this.supabase.from('bets').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(100),
      this.supabase.from('transactions').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(200),
      this.supabase.from('settings').select('*').eq('user_id', uid).single(),
      this.supabase.from('vip').select('*').eq('user_id', uid).single(),
    ]);

    if (walletRes.error && walletRes.error.code !== 'PGRST116') return null;

    const seed = createSeedState();
    const wallet = walletRes.data ? rowToWallet(walletRes.data) : seed.wallet;
    const bets = (betsRes.data ?? []).map(rowToBet);
    const tx = (txRes.data ?? []).map(rowToTx);
    const settings = settingsRes.data ? rowToSettings(settingsRes.data) : seed.settings;
    const vip = vipRes.data ? rowToVip(vipRes.data) : seed.vip;

    return {
      version: 1,
      auth: { authed: true },
      wallet,
      bets,
      tx,
      vip,
      rewards: seed.rewards, // rewards remain local until M4
      settings,
    };
  }

  // saveState is a no-op — Supabase is updated per-mutation, not via snapshot
  saveState(_s: PersistedState): Promise<void> {
    return Promise.resolve();
  }

  async placeBet(input: PlaceBetInput): Promise<Bet> {
    const res = await fetch('/api/bets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: input.mode,
        kind: input.kind,
        pick: String(input.pick),
        stake: input.stake,
      }),
      credentials: 'include',
    });
    if (!res.ok) throw new ApiError(res.status, await res.text());
    const row = await res.json();
    return rowToBet(row);
  }

  async createDeposit(input: DepositInput): Promise<Transaction> {
    const res = await fetch('/api/transactions/deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ network: input.network, amt: input.amt }),
      credentials: 'include',
    });
    if (!res.ok) throw new ApiError(res.status, await res.text());
    const row = await res.json();
    return rowToTx(row);
  }

  async createWithdrawal(input: WithdrawInput): Promise<Transaction> {
    const res = await fetch('/api/transactions/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ network: input.network, address: input.address, amt: input.amt }),
      credentials: 'include',
    });
    if (!res.ok) throw new ApiError(res.status, await res.text());
    const row = await res.json();
    return rowToTx(row);
  }

  async listTransactions(): Promise<Transaction[]> {
    const uid = await this.userId();
    const { data } = await this.supabase
      .from('transactions')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(200);
    return (data ?? []).map(rowToTx);
  }

  async listBets(): Promise<Bet[]> {
    const uid = await this.userId();
    const { data } = await this.supabase
      .from('bets')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(100);
    return (data ?? []).map(rowToBet);
  }

  async getSetting<K extends keyof Settings>(k: K): Promise<Settings[K] | undefined> {
    const uid = await this.userId();
    const { data } = await this.supabase
      .from('settings')
      .select('*')
      .eq('user_id', uid)
      .single();
    if (!data) return undefined;
    return rowToSettings(data)[k];
  }

  async setSetting<K extends keyof Settings>(k: K, v: Settings[K]): Promise<void> {
    const uid = await this.userId();
    // Map camelCase settings key to snake_case DB column
    const colMap: Record<keyof Settings, string> = {
      theme: 'theme',
      reducedMotion: 'reduced_motion',
      colorBlindCue: 'color_blind_cue',
      ageConfirmed: 'age_confirmed',
    };
    await this.supabase
      .from('settings')
      .upsert({ user_id: uid, [colMap[k]]: v });
  }
}

// Settle a bet locally (used by store before server confirms)
export { periodAt };
