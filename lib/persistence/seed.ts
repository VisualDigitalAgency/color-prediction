/**
 * lib/persistence/seed.ts — initial demo state, ported from the prototype
 * (`/tmp/proto_extract/app/store.jsx` + `screen-rewards.jsx` + `screen-account.jsx`).
 *
 * MONEY RULE: every monetary seed value is converted to integer minor-units via
 * `toMinor()` at import. Prototype floats (e.g. wallet.main `1284.5`) become
 * minor-units (`128450`). NEVER store display floats here.
 *
 * This is the snapshot a brand-new (or storage-cleared) client hydrates from.
 * Transient state (`now`, `toasts`, `celebration`) is NOT part of the seed —
 * it lives only in memory. Round results recompute from the fair engine.
 */

import { toMinor } from '@/lib/money';
import { DEFAULT_THEME } from '@/lib/theme';
import type {
  PersistedState,
  Wallet,
  Vip,
  RewardsState,
  Settings,
  AuthState,
  User,
} from '@/types';

/**
 * Schema/migration version. Bump when the persisted shape changes and add a
 * migration in LocalStorageRepository. Keys are also namespaced by version
 * (`aurawin:v1:*`), so a bump can either migrate or start fresh.
 */
export const SCHEMA_VERSION = 1 as const;

// ── Wallet (prototype floats → minor-units) ──────────────────────────────────
// Prototype: { main: 1284.5, bonus: 36, winning: 412.75, referral: 88.2 }
export const seedWallet: Wallet = {
  main: toMinor(1284.5), // 128450
  bonus: toMinor(36), // 3600
  winning: toMinor(412.75), // 41275
  referral: toMinor(88.2), // 8820
};

// ── VIP ───────────────────────────────────────────────────────────────────────
// Prototype: { level: 3, name: 'Platinum', points: 6420, next: 10000 }
// points/next are XP, not money — left as-is.
export const seedVip: Vip = {
  level: 3,
  name: 'Platinum',
  points: 6420,
  next: 10000,
};

// ── Rewards ────────────────────────────────────────────────────────────────────
// Spin wheel prizes (screen-rewards.jsx PRIZES) — `v` (USDT bonus) → minor-units.
// `weight` is equal across segments in the prototype (uniform random pick).
const seedSpinPrizes: RewardsState['spinPrizes'] = [
  { id: 'sp-5', label: '5', amount: toMinor(5), weight: 1 },
  { id: 'sp-x2', label: 'x2', amount: toMinor(0), weight: 1 },
  { id: 'sp-20', label: '20', amount: toMinor(20), weight: 1 },
  { id: 'sp-again', label: 'Again', amount: toMinor(0), weight: 1 },
  { id: 'sp-50', label: '50', amount: toMinor(50), weight: 1 },
  { id: 'sp-x5', label: 'x5', amount: toMinor(0), weight: 1 },
  { id: 'sp-100', label: '100', amount: toMinor(100), weight: 1 },
  { id: 'sp-888', label: '888', amount: toMinor(888), weight: 1 },
];

// Daily check-in: prototype `days = [2, 5, 10, 15, 20, 30, 88]` (USDT) → minor-units.
// Prototype seeds `claimed = 2` (days 1 & 2 done, day 3 today) → claimed indices [0, 1].
const seedCheckInRewards: number[] = [2, 5, 10, 15, 20, 30, 88].map(toMinor);

// Daily missions (screen-rewards.jsx) — `r` reward (USDT) → minor-units.
const seedMissions: RewardsState['missions'] = [
  { id: 'm-bets', label: 'Place 5 bets today', reward: toMinor(10), progress: 3, goal: 5, done: false },
  { id: 'm-deposit', label: 'Deposit 100 USDT', reward: toMinor(20), progress: 1, goal: 1, done: true },
  { id: 'm-invite', label: 'Invite 1 friend', reward: toMinor(50), progress: 0, goal: 1, done: false },
];

export const seedRewards: RewardsState = {
  freeSpins: 3, // "3 free spins left today"
  spinPrizes: seedSpinPrizes,
  checkInClaimed: [0, 1], // days 1 & 2 claimed
  checkInRewards: seedCheckInRewards,
  missions: seedMissions,
};

// ── Auth / user ────────────────────────────────────────────────────────────────
// Prototype starts unauthenticated (login screen). The demo user identity comes
// from screen-account.jsx: handle `player_ace`, UID 88204417, KYC Level 1, VIP 3.
export const seedUser: User = {
  id: '88204417',
  handle: 'player_ace',
  contact: '+1 ••• 1234',
  joinedAt: 0, // unset until a real auth flow stamps it; demo placeholder
  kycLevel: 1,
  vipLevel: seedVip.level,
};

export const seedAuth: AuthState = {
  authed: false,
};

// ── Settings ────────────────────────────────────────────────────────────────────
export const seedSettings: Settings = {
  theme: DEFAULT_THEME,
  ageConfirmed: false,
};

/**
 * Build a fresh persisted snapshot. Returns a new object each call so callers
 * can mutate their copy without touching the module-level seed singletons.
 *
 * No seed bets or transactions are persisted: the prototype starts `bets: []`,
 * and its `seedTx` array is demo-only display chrome (string timestamps like
 * `'-2h'`, title-cased types) that does not match the canonical `Transaction`
 * shape. A clean install starts with an empty ledger.
 */
export function createSeedState(): PersistedState {
  return {
    version: SCHEMA_VERSION,
    auth: { ...seedAuth },
    wallet: { ...seedWallet },
    bets: [],
    tx: [],
    vip: { ...seedVip },
    rewards: {
      ...seedRewards,
      spinPrizes: seedRewards.spinPrizes.map((p) => ({ ...p })),
      checkInClaimed: [...seedRewards.checkInClaimed],
      checkInRewards: [...seedRewards.checkInRewards],
      missions: seedRewards.missions.map((m) => ({ ...m })),
    },
    settings: { ...seedSettings },
  };
}
