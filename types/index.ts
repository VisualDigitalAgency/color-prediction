/**
 * AuraWin — canonical TypeScript schema.
 *
 * MONEY RULE: every monetary field is an integer minor-unit (i.e. cents).
 * 1284.50 USDT is stored as 128450. Seed floats must be converted on import
 * via `toMinor()` from lib/money.ts. Format only at the display edge.
 *
 * All DataRepository methods return Promises — this is the Phase-2 async seam
 * even in Phase 1 (localStorage implementation).
 */

// ── Identity & settings ──────────────────────────────────────────────────────

export type ThemeId = 'neon' | 'fintech' | 'cyber';

export interface User {
  id: string;
  handle: string;
  contact: string; // phone or email
  joinedAt: number; // unix ms
  kycLevel: 0 | 1 | 2;
  vipLevel: number;
}

export interface AuthState {
  authed: boolean;
  user?: User;
}

export interface Settings {
  theme: ThemeId;
  reducedMotion?: boolean;
  /** Force non-color cues on. Default derives from OS `prefers-reduced-motion` where possible. */
  colorBlindCue?: boolean;
  /** 18+ age-gate confirmation */
  ageConfirmed: boolean;
}

// ── Wallet & money ───────────────────────────────────────────────────────────

/**
 * All fields are integer minor-units (e.g. 128450 = 1284.50 USDT).
 * NEVER store display floats. Convert with toMinor() / fromMinor() from lib/money.ts.
 */
export interface Wallet {
  main: number;     // minor-units
  bonus: number;    // minor-units
  winning: number;  // minor-units
  referral: number; // minor-units
}

export type NetworkId = 'trc20' | 'bep20' | 'erc20';

// ── Game & rounds ────────────────────────────────────────────────────────────

/** Round duration in seconds */
export type RoundMode = 30 | 60 | 180 | 300;

export type BetKind = 'color' | 'size' | 'number';

/** A bet pick: one of the named colors, a size, or a digit 0–9 */
export type BetPick = 'green' | 'red' | 'violet' | 'big' | 'small' | number;

/** Outcome of a settled round */
export interface RoundResult {
  num: number; // 0–9
  colors: ('green' | 'red' | 'violet')[];
  big: boolean;
}

export interface Period {
  mode: RoundMode;
  periodIdx: number;
  periodId: string; // e.g. "202603011000012345"
}

export interface PeriodView extends Period {
  secondsLeft: number;
  locked: boolean; // no new bets accepted in last ~5s
}

export type BetStatus = 'pending' | 'won' | 'lost';

export interface Bet {
  id: string;
  mode: RoundMode;
  kind: BetKind;
  pick: BetPick;
  stake: number;      // minor-units
  periodIdx: number;
  periodId: string;
  status: BetStatus;
  payout?: number;    // minor-units; set on settlement
  result?: RoundResult;
  createdAt: number;  // unix ms
}

export interface PlaceBetInput {
  mode: RoundMode;
  kind: BetKind;
  pick: BetPick;
  stake: number; // minor-units
}

// ── Transactions ─────────────────────────────────────────────────────────────

export type TransactionType =
  | 'deposit'
  | 'withdraw'
  | 'bet'
  | 'win'
  | 'bonus'
  | 'referral';

export type TransactionStatus = 'pending' | 'success' | 'failed';

export interface Transaction {
  id: string;
  type: TransactionType;
  method?: NetworkId | 'system';
  amt: number;   // minor-units, always positive
  dir: 1 | -1;   // 1 = credit, -1 = debit
  status: TransactionStatus;
  createdAt: number; // unix ms
}

export interface DepositInput {
  network: NetworkId;
  amt: number; // minor-units
}

export interface WithdrawInput {
  network: NetworkId;
  address: string;
  amt: number; // minor-units; 1% fee applied by the repository
}

// ── VIP / referral / rewards ─────────────────────────────────────────────────

export interface VipTier {
  level: number;
  name: string;
  threshold: number; // XP required to reach this tier (minor-units not applicable here)
  perks: string[];
}

export interface Vip {
  level: number;
  name: string;
  points: number; // XP
  next: number;   // XP threshold for next tier
}

export interface CommissionLevel {
  level: 1 | 2 | 3;
  rate: number;   // e.g. 0.30 for 30%
  count: number;  // number of referrals at this level
  earned: number; // minor-units earned from this level
}

export interface ReferralStats {
  code: string;
  levels: CommissionLevel[];
  totalEarned: number; // minor-units
}

export interface SpinPrize {
  id: string;
  label: string;
  amount: number; // minor-units (0 = no prize / re-spin)
  weight: number; // relative probability weight
}

export interface Mission {
  id: string;
  label: string;
  reward: number;   // minor-units
  progress: number;
  goal: number;
  done: boolean;
}

export interface RewardsState {
  freeSpins: number;
  spinPrizes: SpinPrize[];
  checkInClaimed: number[];  // day indices (0-based) already claimed
  checkInRewards: number[];  // minor-units reward per day, e.g. [200, 500, 1000, 1500, 2000, 3000, 8800]
  missions: Mission[];
}

// ── Persisted root ───────────────────────────────────────────────────────────

/**
 * The full persisted snapshot. Transient state (`now`, `toasts`, `celebration`)
 * is NEVER stored here — it lives only in memory. Round results are recomputed
 * from (mode, periodIdx) on demand.
 */
export interface PersistedState {
  version: number; // schema migration field; bump when shape changes
  auth: AuthState;
  wallet: Wallet;
  bets: Bet[];
  tx: Transaction[];
  vip: Vip;
  rewards: RewardsState;
  settings: Settings;
}

// ── Repository interface ─────────────────────────────────────────────────────

/**
 * ALL methods are async — this is the Phase-2 seam. Phase-1 uses LocalStorageRepository,
 * Phase-2 swaps it for a real API client without touching callers.
 */
export interface DataRepository {
  loadState(): Promise<PersistedState | null>;
  saveState(s: PersistedState): Promise<void>;
  placeBet(input: PlaceBetInput): Promise<Bet>;
  createDeposit(input: DepositInput): Promise<Transaction>;
  createWithdrawal(input: WithdrawInput): Promise<Transaction>;
  listTransactions(): Promise<Transaction[]>;
  listBets(): Promise<Bet[]>;
  getSetting<K extends keyof Settings>(k: K): Promise<Settings[K] | undefined>;
  setSetting<K extends keyof Settings>(k: K, v: Settings[K]): Promise<void>;
}
