/**
 * lib/strings.ts — Centralized i18n-lite string table.
 *
 * ALL user-facing copy is defined here. No hardcoded strings in JSX.
 * This enables Phase-2 localization as a pure data change — swap this
 * object for a locale-keyed version without touching components.
 *
 * Structure: nested `const` object so TypeScript infers the literal types,
 * giving autocomplete at every call site.
 *
 * Hard rules:
 * - No "provably fair" anywhere. Use "Fair Play (demo)" / "simulated rounds".
 * - Disclaimer must mention "no real money" and "18+".
 */

// ── Payout multipliers (from prototype PAYOUT object) ─────────────────────
/** Indexed by pick/kind key — green:2, red:2, violet:4.5, big:2, small:2, number:9 */
export const PAYOUT_MULTIPLIERS: Record<string, number> = {
  green: 2,
  red: 2,
  violet: 4.5,
  big: 2,
  small: 2,
  number: 9,
} as const;

// ── VIP tier map ──────────────────────────────────────────────────────────
/** Tier names matching the prototype exactly (web-pages2.jsx tiers array) */
export const VIP_TIER_NAMES: Record<number, string> = {
  1: 'Bronze',
  2: 'Silver',
  3: 'Platinum',
  4: 'Diamond',
  5: 'Crown',
} as const;

/** Tier brand colors matching the prototype */
export const VIP_TIER_COLORS: Record<number, string> = {
  1: '#cd7f4a',
  2: '#b8c0cc',
  3: '#1fe0ff',
  4: '#8b5cff',
  5: '#ffc63d',
} as const;

// ── Mode labels (from prototype MODE_LABEL — exact values) ───────────────
/** Short mode labels matching prototype MODE_LABEL: { 30:'30s', 60:'1min', … } */
export const MODE_LABEL: Record<30 | 60 | 180 | 300, string> = {
  30: '30s',
  60: '1min',
  180: '3min',
  300: '5min',
} as const;

/** Human-friendly mode display names for tab labels */
export const MODE_NAME: Record<30 | 60 | 180 | 300, string> = {
  30: '30 Sec',
  60: '1 Min',
  180: '3 Min',
  300: '5 Min',
} as const;

// ── Network display labels ─────────────────────────────────────────────────
export const NETWORK_LABEL: Record<string, string> = {
  trc20: 'USDT · TRC20',
  bep20: 'USDT · BEP20',
  erc20: 'USDT · ERC20',
} as const;

// ── Commission levels ─────────────────────────────────────────────────────
export const COMMISSION_LEVELS: Record<
  1 | 2 | 3,
  { label: string; desc: string; rate: string }
> = {
  1: { label: 'Level 1', desc: 'Direct invites', rate: '30%' },
  2: { label: 'Level 2', desc: 'Their invites', rate: '15%' },
  3: { label: 'Level 3', desc: 'Extended team', rate: '5%' },
} as const;

// ── Check-in rewards per day (minor-units, matching prototype days array) ─
/** [Day1, Day2, … Day7] in minor-units: [200, 500, 1000, 1500, 2000, 3000, 8800] */
export const CHECK_IN_REWARDS: readonly number[] = [
  200, 500, 1000, 1500, 2000, 3000, 8800,
] as const;

// ── Main string table ─────────────────────────────────────────────────────

const STRINGS = {
  // ── App identity ───────────────────────────────────────────────────────
  app: {
    name: 'AuraWin',
    tagline: 'Predict the color. Win crypto.',
    subtitle: 'CRYPTO GAMING',
    /** Rendered as AuraWIN with brand accent on WIN */
    namePrefix: 'AURA',
    nameSuffix: 'WIN',
    disclaimer:
      'Simulated demo — no real money. 18+. Play responsibly.',
    disclaimerShort: 'Simulated demo · No real money · 18+',
  },

  // ── Age gate ─────────────────────────────────────────────────────────
  ageGate: {
    heading: 'Age verification required',
    body: 'You must be 18 or older to play. This is a simulated demo — no real money is involved.',
    cta: 'I am 18 or older — Continue',
    deny: 'I am under 18',
  },

  // ── Navigation ───────────────────────────────────────────────────────
  nav: {
    lobby: 'Lobby',
    wingo: 'Wingo',
    wallet: 'Wallet',
    rewards: 'Rewards',
    inviteEarn: 'Invite & Earn',
    vipClub: 'VIP Club',
    history: 'History',
    settings: 'Settings',
    profile: 'My Account',
    logOut: 'Log out',
    liveBadge: 'LIVE',
  },

  // ── Page / TopBar titles ─────────────────────────────────────────────
  titles: {
    home: 'Lobby',
    game: 'Wingo · Color Prediction',
    wallet: 'Wallet',
    deposit: 'Deposit',
    withdraw: 'Withdraw',
    rewards: 'Rewards',
    referral: 'Invite & Earn',
    vip: 'VIP Club',
    history: 'History',
    profile: 'My Account',
    settings: 'Settings',
  },

  // ── Auth ─────────────────────────────────────────────────────────────
  auth: {
    welcomeBack: 'Welcome back',
    verifyCode: 'Verify your code',
    signInPrompt: 'Sign in or create an account to play.',
    otpPrompt: 'Enter the 6-digit code sent to your number.',
    phoneLabel: 'Phone or email',
    phonePlaceholder: 'Phone or email',
    otpPlaceholder: '••••••',
    sendOtp: 'Continue',
    verify: 'Verify & enter',
    back: 'Back',
    signIn: 'Sign in',
    register: 'Register',
    legalFooter: '18+ only · Play responsibly',
    welcome: 'Welcome to AuraWin!',
  },

  // ── Game / Wingo ─────────────────────────────────────────────────────
  game: {
    bet: 'Bet',
    placeBet: 'Place Bet',
    confirm: 'Confirm',
    cancel: 'Cancel',
    nextDraw: 'Next draw',
    recentResults: 'RECENT RESULTS',
    fairPlay: 'Fair Play (demo)',
    simulatedRounds: 'Simulated rounds',
    fairPlayDesc:
      'Results are generated by a deterministic algorithm seeded per period. This is a demo simulation — no real money changes hands.',
    roundSettled: 'Round settled',
    noWin: 'Round settled · no win this time',
    youWon: 'You won',
    insufficientBalance: 'Insufficient main balance',
    betPlaced: 'Bet placed',
  },

  // ── Colors & sizes (bet UI) ──────────────────────────────────────────
  colors: {
    green: 'Green',
    red: 'Red',
    violet: 'Violet',
  },

  sizes: {
    big: 'Big',
    small: 'Small',
  },

  /** Single-character labels for color-blind cue mode */
  colorBlindShort: {
    green: 'G',
    red: 'R',
    violet: 'V',
  },

  /** Full labels for color-blind cue mode */
  colorBlindFull: {
    green: 'Green',
    red: 'Red',
    violet: 'Violet',
  },

  // ── Wallet ───────────────────────────────────────────────────────────
  wallet: {
    deposit: 'Deposit',
    withdraw: 'Withdraw',
    balance: 'Balance',
    totalBalance: 'Total Balance',
    main: 'Main',
    bonus: 'Bonus',
    winning: 'Winning',
    referral: 'Referral',
    network: 'Network',
    address: 'Address',
    amount: 'Amount',
    fee: 'Fee',
    feeNote: '1% network fee applied',
    currency: 'USDT',
    depositSubmitted: 'Deposit submitted',
    withdrawalSubmitted: 'Withdrawal requested',
    amountExceedsBalance: 'Amount exceeds balance',
    minDeposit: 'Minimum deposit: 10 USDT',
    minWithdraw: 'Minimum withdrawal: 20 USDT',
  },

  // ── Transaction statuses ─────────────────────────────────────────────
  txStatus: {
    pending: 'Pending',
    success: 'Success',
    failed: 'Failed',
  },

  // ── Transaction types ────────────────────────────────────────────────
  txType: {
    deposit: 'Deposit',
    withdraw: 'Withdraw',
    bet: 'Bet',
    win: 'Win payout',
    bonus: 'Bonus',
    referral: 'Referral bonus',
  },

  // ── VIP ──────────────────────────────────────────────────────────────
  vip: {
    heading: 'VIP Club',
    levelPrefix: 'VIP',
    xpToNextTier: 'XP to next tier',
    xpToDiamond: 'XP to Diamond',
    currentBadge: 'CURRENT',
    allTiers: 'All tiers',
    perks: {
      dailyCashback: 'Daily cashback',
      weeklyBonus: 'Weekly bonus',
      lossRebate: 'Loss rebate',
      withdrawLimit: 'Withdraw limit',
    },
  },

  // ── Referral ─────────────────────────────────────────────────────────
  referral: {
    heading: 'Invite & Earn',
    lifetimeCommission: 'LIFETIME COMMISSION',
    inviteLink: 'INVITE LINK',
    copy: 'Copy',
    linkCopied: 'Invite link copied',
    commissionLevels: 'Commission levels',
    stats: {
      team: 'Team',
      active: 'Active',
      turnover: 'Turnover',
    },
    domain: 'aurawin.gg/r/',
  },

  // ── Rewards ──────────────────────────────────────────────────────────
  rewards: {
    heading: 'Rewards',
    spinTitle: 'Lucky Spin',
    spinFreeLeft: 'free spins left today',
    spinCta: 'Spin now · FREE',
    spinCtaBusy: 'Spinning…',
    spinComeback: 'Come back tomorrow',
    spinWon: 'You won',
    spinWonSuffix: 'USDT bonus!',
    spinNoPrize: 'No prize — spin again!',
    checkInTitle: 'Daily check-in',
    checkInStreak: 'day streak',
    checkInProgress: 'Day',
    checkInOf: 'of 7 · keep your streak',
    checkInClaimCta: 'Claim Day',
    checkInUsdtSuffix: 'USDT bonus',
    missionsTitle: 'Daily missions',
    claim: 'Claim',
    claimed: 'Claimed',
    go: 'Go',
    days: 'Days',
  },

  // ── Toast / notifications ─────────────────────────────────────────────
  toast: {
    betPlaced: 'Bet placed',
    insufficientBalance: 'Insufficient main balance',
    amountExceedsBalance: 'Amount exceeds balance',
    withdrawalSubmitted: 'Withdrawal requested',
    depositSuccess: 'Deposited',
    depositSuffix: 'USDT',
    roundSettledNoWin: 'Round settled · no win this time',
    notifications: 'Notifications',
    linkCopied: 'Invite link copied',
    editProfile: 'Edit profile',
  },

  // ── Profile ──────────────────────────────────────────────────────────
  profile: {
    heading: 'My Account',
    edit: 'Edit',
    rows: {
      kyc: 'KYC verification',
      kycDesc: 'Level 1 · partially verified',
      security: 'Security & 2FA',
      securityDesc: 'Password, 2FA, sessions',
      notifications: 'Notification settings',
      notificationsDesc: 'Email, push, in-app',
      devices: 'Linked devices',
      devicesDesc: '2 active sessions',
      support: 'Help & support',
      supportDesc: '24/7 live chat',
    },
  },

  // ── Settings ─────────────────────────────────────────────────────────
  settings: {
    heading: 'Settings',
    themes: {
      neon: 'Neon',
      fintech: 'Fintech',
      cyber: 'Cyber',
    },
    themeLabel: 'Theme',
    colorBlindLabel: 'Color-blind cues',
    colorBlindDesc:
      'Show letter labels (G / R / V) on all color-coded elements.',
    reducedMotionLabel: 'Reduced motion',
    reducedMotionDesc: 'Minimise animations and transitions.',
    ageConfirmedLabel: 'Age confirmed (18+)',
  },

  // ── Generic actions ──────────────────────────────────────────────────
  actions: {
    confirm: 'Confirm',
    cancel: 'Cancel',
    close: 'Close',
    back: 'Back',
    submit: 'Submit',
    save: 'Save',
    copy: 'Copy',
    edit: 'Edit',
    delete: 'Delete',
    startPlaying: 'Start playing',
    watchLive: 'Watch live rounds',
  },

  // ── Landing page ─────────────────────────────────────────────────────
  landing: {
    heroTitle: 'Predict the color.',
    heroTitleAccent: 'Win crypto.',
    heroBody:
      'Fast, fair, on-chain prediction gaming. New rounds every 30 seconds. Deposit USDT, predict red, green or violet, and cash out instantly.',
    playersOnline: 'players online now',
    nextDraw: 'Next draw',
    recentResults: 'RECENT RESULTS',
    stats: {
      paidOut: 'Paid out',
      players: 'Players',
      avgPayout: 'Avg payout',
    },
    features: {
      fairPlay: 'Fair Play (demo)',
      fairPlayDesc:
        'Every round computed from a deterministic seed — fully auditable.',
      instantPayouts: 'Instant payouts',
      instantPayoutsDesc: 'Crypto in & out in minutes, 24/7',
      security: 'Bank-grade security',
      securityDesc: '2FA, cold storage, anti-fraud engine',
      referrals: '3-level referrals',
      referralsDesc: 'Earn up to 30% commission forever',
    },
  },

  // ── History ──────────────────────────────────────────────────────────
  history: {
    heading: 'History',
    tabs: {
      bets: 'Bets',
      transactions: 'Transactions',
    },
    empty: 'No records yet',
    betId: 'Bet ID',
    period: 'Period',
    pick: 'Pick',
    stake: 'Stake',
    result: 'Result',
    payout: 'Payout',
    betStatus: {
      pending: 'Pending',
      won: 'Won',
      lost: 'Lost',
    },
  },
} as const;

export default STRINGS;
export { STRINGS };

/** Convenience type for the full strings object */
export type StringTable = typeof STRINGS;
