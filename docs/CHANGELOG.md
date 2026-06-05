# Changelog

All notable changes to AuraWin. Format loosely follows Keep a Changelog.

## [Unreleased]
### Added
- **Step 2 — Types, money helpers, i18n-lite strings:**
  - `types/index.ts`: full canonical TypeScript schema — `ThemeId`, `User`, `AuthState`,
    `Settings`, `Wallet` (all fields integer minor-units, JSDoc comment), `Bet`, `BetKind`,
    `BetPick`, `BetStatus`, `PlaceBetInput`, `RoundMode`, `RoundResult`, `Period`, `PeriodView`,
    `Transaction`, `TransactionType`, `TransactionStatus`, `DepositInput`, `WithdrawInput`,
    `NetworkId`, `VipTier`, `Vip`, `CommissionLevel`, `ReferralStats`, `SpinPrize`, `Mission`,
    `RewardsState`, `PersistedState`, `DataRepository` (all methods `Promise`-returning).
  - `lib/money.ts`: integer minor-unit helpers — `toMinor`, `fromMinor`, `add`, `sub`, `mul`,
    `formatMoney`. Zero float arithmetic on balances.
  - `lib/money.test.ts`: Vitest unit tests — round-trip, add/sub/mul, sub-never-negative,
    formatMoney output, 100-bet settlement produces exact integer balance.
  - `lib/strings.ts`: centralized i18n-lite string table — app identity, age gate, nav labels,
    auth copy, game labels (mode names, payouts, "Fair Play (demo)", "Simulated rounds"), wallet
    labels, transaction statuses/types, VIP tier names (Bronze/Silver/Platinum/Diamond/Crown),
    referral, rewards (spin/check-in/missions), toast/error messages, color and size names,
    color-blind cue labels (G/R/V short + full). No "provably fair" anywhere.
  - Added `vitest` as a dev dependency.

- Project initialization: Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 scaffold.
- `app/globals.css` with prototype-faithful reset + keyframes (fadeIn/sheetUp/toastIn/popIn/
  pulse/confetti) and Tailwind v4 `@theme` tokens bound to runtime CSS variables.
- Project directory skeleton (`app/(app)/*`, `components/*`, `lib/*`, `types/`).
- Knowledge scaffolding: `process.md` execution tracker; `docs/` (PRD, ARCHITECTURE, TECHSTACK,
  SCHEMA, A11Y, FAILURES, DECISIONS + ADRs 0001–0007); `memory/`; `.claude/agents` and
  `.claude/skills` (pixel-qa, round-verify, theme-audit).
- Critique-driven constraints folded into the plan: integer minor-unit money, async-ready
  repository/store, color-blind cues, age-gate + "simulated/no real money" disclaimer, and
  removal of "provably fair" claims (renamed to "Fair Play (demo)").

### Notes
- Tailwind is **v4** (CSS-first); no `tailwind.config.ts` — theme tokens live in `globals.css`.
