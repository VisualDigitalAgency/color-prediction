# Changelog

All notable changes to AuraWin. Format loosely follows Keep a Changelog.

## [Unreleased]
### Added
- **Step 5 — Persistence layer (DataRepository seam + LocalStorageRepository):**
  - `lib/persistence/repository.ts`: documents the storage seam (ADR 0004) and re-exports the
    async `DataRepository` contract from `@/types`, plus a `Repository` type alias. Callers depend
    only on this interface so the Phase-2 `RestRepository` swap is a pure adapter change.
  - `lib/persistence/LocalStorageRepository.ts`: concrete Phase-1 `DataRepository`. Every method is
    async (Promise-returning) though localStorage is synchronous. SSR-safe — all storage access is
    guarded by `typeof window !== 'undefined'` AND wrapped in try/catch (private-mode/quota/parse
    failures are non-fatal; reads fall back to seed, writes are best-effort); nothing touches
    storage at module load. Persists the durable slice only under the single versioned key
    `aurawin:v1:state` with a `version` migration field (a `migrate()` guard rejects corrupt or
    version-mismatched blobs → caller falls back to seed). Implements `loadState`/`saveState`,
    `placeBet` (deducts stake, appends bet + bet-tx), `createDeposit` (credits main), `createWithdrawal`
    (debits main, pending, 1% fee), `listTransactions`/`listBets`, `get`/`setSetting`. NEVER persists
    transient state (`now`/`toasts`/`celebration`) or round results (those recompute from the fair
    engine). Exposes a `localStorageRepository` singleton and `STORAGE_KEYS`.
  - `lib/persistence/seed.ts`: initial demo snapshot ported from the prototype with all monetary
    values converted to integer minor-units via `toMinor()` — wallet `{1284.5, 36, 412.75, 88.2}` →
    `{128450, 3600, 41275, 8820}`; VIP `{level:3, Platinum, points:6420, next:10000}`; rewards
    (8 spin prizes, check-in days `[2,5,10,15,20,30,88]→minor`, claimed `[0,1]`, 3 missions, 3 free
    spins); demo user (`player_ace`/`88204417`/KYC 1/VIP 3). `createSeedState()` returns a fresh deep
    copy each call; clean install starts with empty bet/tx ledgers. `SCHEMA_VERSION = 1`.
  - `lib/persistence/index.ts`: barrel exporting the contract, the `LocalStorageRepository` +
    singleton + `STORAGE_KEYS`, and the seed helpers.
  - `lib/persistence/LocalStorageRepository.test.ts`: 23 Vitest tests — SSR-safety (no crash when
    `window` undefined), round-trip save/load equivalence, versioned `aurawin:v1:*` key + `version`
    field, seed values are integer minor-units, transient state never serialized, and
    placeBet/deposit/withdraw/setSetting mutations persisting with integer balances. Uses an
    in-memory localStorage mock (no jsdom).
  - `vitest.config.ts`: maps the `@/` path alias (mirrors tsconfig) so test files import source
    modules the same way the app does; default `node` environment.
  - `tsc --noEmit` clean; full suite 110 tests pass (money + fair + persistence).

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
