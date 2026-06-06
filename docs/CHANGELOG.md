# Changelog

All notable changes to AuraWin. Format loosely follows Keep a Changelog.

## [Unreleased]
### Added
- **Step 4 — Deterministic round engine + golden tests:**
  - `lib/fair/engine.ts`: pure-TypeScript round engine ported verbatim from the prototype
    (`app/store.jsx`), with ZERO React/store/DOM dependencies so a Phase-2 API route can import
    it unchanged. Exports `hashNum` (FNV-1a, offset basis 2166136261, prime 16777619, `Math.imul`
    + final `>>> 0`), `resultForPeriod` (digit→Wingo color/size rules), `periodAt`, `secondsLeft`,
    `recentResults`, `betWins`, `payoutMult`, plus constants `MODES`, `MODE_LABEL`, `PAYOUT`.
    Hash math preserved byte-for-byte; no "provably fair" language ("Fair Play (demo)").
  - `lib/fair/engine.test.ts`: 45 golden-value Vitest tests pinning hash outputs, per-digit color
    rules, `resultForPeriod`/`periodAt`/`secondsLeft` consistency, `recentResults`, and
    `betWins`/`payoutMult` win+loss cases. Goldens traced from the real hash (e.g. `(30,1)`→num 9,
    `(30,5)`→num 3, `(60,0)`→num 5 green+violet), not guessed.
  - `lib/fair/index.ts`: barrel re-export of the engine.

- **Step 3 — Theme system (neon / fintech / cyber):**
  - `lib/theme/themes.ts`: typed `THEMES` registry (`Theme` / `ThemeVars` types) with all 3
    themes' CSS-variable maps, `screen` background and `font` stack ported VERBATIM from the
    prototype (`app/themes.js`); `DEFAULT_THEME = 'neon'`.
  - `lib/theme/ThemeProvider.tsx`: `'use client'` provider that applies `data-theme` + every CSS
    var (plus `--screen` / `--app-font`) to `document.documentElement` synchronously pre-paint via
    `useLayoutEffect`; exposes `setTheme(id)` and `useTheme()`; persists to localStorage key
    `aurawin:v1:settings:theme` (SSR-safe, storage failures non-fatal).
  - `lib/theme/index.ts`: barrel exporting `ThemeProvider`, `useTheme`, `THEMES`, `DEFAULT_THEME`,
    `THEME_STORAGE_KEY`, and types `Theme` / `ThemeVars`.
  - `app/globals.css`: appended `[data-theme="neon"|"fintech"|"cyber"]` blocks (verbatim var
    values) for correct first paint / CSS-only contexts; `@theme inline`, reset and keyframes kept.
  - `app/layout.tsx`: 3 fonts (Poppins / Manrope / Space Grotesk) via `next/font/google` exposed as
    `--font-poppins` / `--font-manrope` / `--font-space-grotesk`; no-flash inline script reads
    `aurawin:v1:settings:theme` and sets `data-theme` before paint; default `data-theme="neon"`.
  - Only CSS variable VALUES change between themes — layout never branches per theme. `tsc` clean.

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
