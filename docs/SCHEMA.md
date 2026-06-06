# AuraWin — Schema (TypeScript models = future DB/API contract)

> **Money rule:** every monetary field is an **integer minor-unit** (e.g. cents). Convert seed
> floats on import (`1284.5` → `128450`). Format only at the display edge (`lib/format.ts`).

## Identity & settings
```ts
type ThemeId = 'neon' | 'fintech' | 'cyber';

interface User {
  id: string; handle: string; contact: string;     // phone
  joinedAt: number; kycLevel: 0 | 1 | 2; vipLevel: number;
}
interface AuthState { authed: boolean; user?: User; }
interface Settings {
  theme: ThemeId;
  reducedMotion?: boolean;
  colorBlindCue?: boolean;     // force non-color cues on (default derives from OS where possible)
  ageConfirmed: boolean;       // 18+ gate
}
```

## Wallet & money
```ts
interface Wallet { main: number; bonus: number; winning: number; referral: number; } // minor-units
type NetworkId = 'trc20' | 'bep20' | 'erc20';
```

## Game & rounds
```ts
type RoundMode = 30 | 60 | 180 | 300;            // seconds
type BetKind = 'color' | 'size' | 'number';
type BetPick = 'green' | 'red' | 'violet' | 'big' | 'small' | number; // number 0–9

interface RoundResult { num: number; colors: ('green'|'red'|'violet')[]; big: boolean; }
interface Period { mode: RoundMode; periodIdx: number; periodId: string; }
interface PeriodView extends Period { secondsLeft: number; locked: boolean; }

interface Bet {
  id: string; mode: RoundMode; kind: BetKind; pick: BetPick;
  stake: number;                 // minor-units
  periodIdx: number; periodId: string;
  status: 'pending' | 'won' | 'lost';
  payout?: number;               // minor-units
  result?: RoundResult;
  createdAt: number;
}
interface PlaceBetInput { mode: RoundMode; kind: BetKind; pick: BetPick; stake: number; }
```

## Transactions
```ts
interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'bet' | 'win' | 'bonus' | 'referral';
  method?: NetworkId | 'system';
  amt: number;                   // minor-units, always positive
  dir: 1 | -1;                   // credit / debit
  status: 'pending' | 'success' | 'failed';
  createdAt: number;
}
interface DepositInput { network: NetworkId; amt: number; }
interface WithdrawInput { network: NetworkId; address: string; amt: number; } // 1% fee applied
```

## VIP / referral / rewards
```ts
interface VipTier { level: number; name: string; threshold: number; perks: string[]; }
interface Vip { level: number; name: string; points: number; next: number; }

interface CommissionLevel { level: 1|2|3; rate: number; count: number; earned: number; }
interface ReferralStats { code: string; levels: CommissionLevel[]; totalEarned: number; }

interface SpinPrize { id: string; label: string; amount: number; weight: number; }
interface Mission { id: string; label: string; reward: number; progress: number; goal: number; done: boolean; }
interface RewardsState {
  freeSpins: number;
  spinPrizes: SpinPrize[];
  checkInClaimed: number[];      // day indices claimed
  checkInRewards: number[];      // reward per day [2,5,10,15,20,30,88]
  missions: Mission[];
}
```

## Persisted root
```ts
interface PersistedState {
  version: number;               // migration field
  auth: AuthState;
  wallet: Wallet;
  bets: Bet[];
  tx: Transaction[];
  vip: Vip;
  rewards: RewardsState;
  settings: Settings;
}
```
Transient state (`now`, `toasts`, `celebration`) is **never persisted**. Round results are
recomputed from `(mode, periodIdx)`, never stored.

## Repository interface (all async — Phase-2 seam)
```ts
interface DataRepository {
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
```
