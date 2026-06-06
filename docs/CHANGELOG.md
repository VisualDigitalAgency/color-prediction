# Changelog

All notable changes to AuraWin. Format loosely follows Keep a Changelog.

## [Unreleased]
### Added
- **Step 14 — Tests (unit/component + Playwright CI gate):**
  - **Component tests** (jsdom, `@testing-library/react` v16): 4 new test suites for
    `Button`, `Card`, `ResultBall`, and `SectionHead` primitives covering rendering,
    interaction (onClick, disabled), style props, a11y attributes (aria-label, aria-hidden),
    and color-blind cue correctness (G/R/V labels on all 10 digit variants).
  - **Strings tests** (`lib/strings.test.ts`): Enforces hard project rules in CI — no
    "provably fair" copy anywhere, `colorBlindShort` has exactly G/R/V, `PAYOUT_MULTIPLIERS`
    match prototype, CHECK_IN_REWARDS are 7 ascending positive integers.
  - **Test infrastructure**: `tests/setup.ts` with `@testing-library/jest-dom/vitest` +
    `afterEach(cleanup)`. Vitest config updated with `exclude: ['tests/e2e/**']` so Playwright
    specs aren't picked up by Vitest. `@vitest-environment jsdom` per-file docblock on all
    component tests.
  - **Playwright visual regression**: `playwright.config.ts` (Chromium, 1280×900 desktop,
    webServer: build + start); `tests/e2e/visual.spec.ts` (landing unauthenticated; all 11
    authed routes × 3 themes = 33 visual snapshots; age-gate overlay; disclaimer text check);
    `tests/e2e/helpers.ts` (`injectAuthState`, `waitForHydration`). Run
    `npm run test:e2e:update` to capture golden snapshots on first run.
  - **GitHub Actions CI** (`.github/workflows/ci.yml`): 3-job pipeline:
    `unit` (tsc + vitest) → `build` (next build + artifact upload) → `e2e` (Playwright,
    Chromium only, uploads report + diffs on failure). Runs on all `claude/**` pushes +
    PRs to main. Fail-fast via `cancel-in-progress`.
  - **package.json scripts**: `test`, `test:watch`, `test:e2e`, `test:e2e:update`.
  - Result: 198 unit/component tests pass (tsc clean). Playwright infra ready for first
    snapshot capture.

- **Step 11 — Screens Pass B (Tailwind v4 refactor):** All 12 app screens + shared
  sub-components (SpinWheel, CheckIn, TxTable, StatusBadge, QR) refactored from Pass A
  inline `style={{}}` objects to Tailwind v4 utility classes. Strategy: layout/spacing/
  typography converted to utilities (`flex`, `grid`, `gap-*`, `text-*`, `font-*`, `p-*`,
  `m-*`, `rounded-*`, `size-*`); CSS custom property references use arbitrary values
  (`text-[var(--text-mute)]`, `bg-[var(--glass)]`, `rounded-[var(--radius)]`, etc.);
  brand theme tokens in `@theme inline` use short names (`text-green`, `bg-surface`,
  `text-text`); only legitimately dynamic values (state-driven gradients, conditional
  CSS expressions, per-datum colors, Card/SVG style props) remain inline. Removed
  all `fontFamily: 'inherit'` from buttons (covered by globals.css reset).
  Result: ~280 inline `style={{}}` calls reduced to ~80 (all dynamic/complex); zero
  hardcoded hex in class values; tsc clean; 129/129 tests pass.

- **Step 13 — Responsive pass (mobile < 1100 px):** CSS-first approach:
  `app/globals.css` adds `drawerIn` keyframe + `@media (max-width: 1099px)` rules
  for `.app-sidebar` (hidden via `!important` override), `.app-topbar-hamburger`
  (shown), `.app-mobile-nav` (shown), `.app-main-content` (padding-bottom for tab
  bar clearance). Desktop ≥1100px branch byte-identical — all changes are additive.
  `MobileNav` fully implemented: fixed bottom tab bar (4 primary items + More button),
  slide-out left drawer (all nav items + Profile + Settings + VIP card + logout),
  `fadeIn` + `drawerIn` animations, `safe-area-inset-bottom` for notch clearance.
  `TopBar` gains optional `onMenu` prop + hamburger button. `layout.tsx` owns
  `drawerOpen` state. Also: `Lobby.tsx` — `recentResults()` now `useMemo`-d on
  `periodIdx` (not raw `now`) to cut 4×/sec recomputation to once per period;
  `StatusBadge.tsx` — type narrowed from `| string` to `BetStatus | TransactionStatus`.
  tsc clean; 129/129 tests pass.

- **Step 12 — Settings page Pass A (`/settings`):** `components/settings/Settings.tsx`.
  Theme picker (3 cards — Neon/Fintech/Cyber) with per-theme preview gradients, palette
  swatches, and active-state glow border; calls `useTheme().setTheme()` for immediate
  CSS var update + `app.setTheme()` for store/persistence sync. Accessibility section:
  `colorBlindCue` and `reducedMotion` ARIA `role="switch"` toggles wired to
  `app.setSetting()`. Account section: `ageConfirmed` read-only status badge.
  tsc clean; 129/129 tests pass.
- **Step 10 — All remaining screens Pass A (game/wallet/rewards/profile cluster):**
  27 files, 3054 lines. All 12 app routes compile as static; tsc clean; 129 tests pass.
  - `/game` (`components/game/Game.tsx`): ModeTabs (4 round modes), Board (live timer
    with digit tiles + last-10 ResultBalls + color/number/size pick grid + betting-closed
    overlay), BetSlip (amount+multiplier chips, stake/payout preview, `placeBet()` call
    with minor-unit conversion), MyBets (current-period bets from store), Records (SVG
    trend chart + recent draws). Timer uses `useNow()`; `locked` = `secondsLeft ≤ 5`.
    "Provably fair" → `STRINGS.game.fairPlay` (ADR 0006).
  - `/wallet` (`Wallet.tsx`): total balance `CountUp` + deposit/withdraw CTAs + 4 wallet
    stat cards + recent tx via `TxTable`.
  - `/deposit` (`Deposit.tsx`): 3-network selector (TRC20/BEP20/ERC20), quick-simulate
    amount chips (50/100/500/1000), `app.deposit({ network, amt: toMinor(v) })`, pseudo-QR
    + clipboard copy.
  - `/withdraw` (`Withdraw.tsx`): amount input + MAX, address field, 1% fee summary,
    `app.withdraw({ network:'trc20', address, amt: toMinor(n) })`.
  - `/history` (`History.tsx`): tx/bets tab switcher; tx via `TxTable`; bets table with
    `ResultBall` for settled bets, `StatusBadge`, mode label, payout/stake amounts.
  - Shared: `StatusBadge` (color-coded pill), `QR` (deterministic pseudo-QR), `TxTable`
    (createdAt formatted from unix ms, not prototype `.t` string).
  - `/rewards` (`Rewards.tsx` + `SpinWheel.tsx` + `CheckIn.tsx`): `SpinWheel` — visual
    CSS conic-gradient wheel with 4.1s cubic-bezier spin animation, `claimSpinPrize()`;
    `CheckIn` — 7-day grid from `app.rewards.checkInRewards`, claimed state from
    `app.rewards.checkInClaimed`, `claimCheckIn()`; missions from `app.rewards.missions`
    with progress bar + `claimMission(id)`.
  - `/referral` (`Referral.tsx`): commission balance card + invite link copy + team/active/
    turnover stat chips + 3-tier commission breakdown (30%/15%/5%).
  - `/vip` (`Vip.tsx`): VIP level + XP progress bar + 4 perk cards + 5-tier grid (Bronze
    → Crown) with current-tier highlight.
  - `/profile` (`Profile.tsx`): avatar card + VIP badge + 5-row settings menu.
  - Money discipline: all `formatMoney()` calls on minor-unit store values;
    `toMinor()` at placeBet/deposit/withdraw call sites; display floats (`CountUp`) via
    `fromMinor()`.

- **Step 10 — Lobby `/lobby` screen (Pass A, inline parity):** ported `Lobby`
  from `web-pages.jsx` verbatim (promo + total-balance card, 4 sub-wallet stat
  cards, games grid, live-winners feed, recent Wingo results). Money in minor-units
  (`formatMoney`; `CountUp` via `fromMinor`); navigation via `useRouter`/`ROUTES`
  (ADR 0003); live clock via SSR-safe `useNow()`. The prototype's "provably fair"
  recent-round footnote replaced with demo-safe `STRINGS.game.lobbyRoundNote`.
  Added `STRINGS.lobby` copy section. `/lobby` prerenders; tsc clean; 129 tests pass.
- **Step 9 — Landing `/` + AuthModal + "simulated" disclaimer (Pass A, inline parity):**
  ported VERBATIM from the prototype `Landing` + `AuthModal` (`/tmp/proto_extract/web/web-shell.jsx`);
  every `style={{…}}` object byte-identical, all colors `var(--…)`, no hardcoded hex.
  - `components/landing/Landing.tsx` (`'use client'`): full landing — top nav (brand + Sign in/Register),
    hero (online-players pill, `h1` at `fontSize:58`/`letterSpacing:-1px`, gradient-clip accent line,
    subcopy, Start playing/Watch live CTAs, `$48M+`/`180K+`/`99.2%` stats row), live-preview `<Card glow>`
    (WINGO 30s header with live countdown via `useNow()` + `app.secondsLeft`, recent `ResultBall`s,
    green/violet/red pick tiles), and the 4-up feature grid. Every CTA opens `<AuthModal/>`. Already-authed
    visitors redirect to `/lobby` (`ROUTES.home`) in an effect (SSR-safe; never during render).
  - `components/auth/AuthModal.tsx` (`'use client'`): simulated/demo phone→OTP centered portal modal
    (`createPortal` into `document.body`, mount-gated so there's no SSR markup to mismatch). Any input
    ≥3 chars advances to the 6-digit code step; any code confirms. **Success flow:** `app.setAuthed(true,
    demoUser)` writes the authed flag + a demo `User` into the store, a `STRINGS.auth.welcome` success toast
    fires, the modal closes, then the App Router `router.push('/lobby')` (ROUTES.home) — replacing the
    prototype's in-memory `app.navigate('home')` per ADR 0003.
  - `app/page.tsx`: thin server wrapper rendering `<Landing/>` (the `'use client'` component owns router +
    modal + live clock).
  - `components/landing/index.ts` + `components/auth/index.ts`: barrels.
  - **"Provably fair" → "Fair Play (demo)":** the prototype's first feature card said "Provably fair /
    Every round seeded & verifiable on-chain". Per the hard rule it now uses `STRINGS.landing.features.fairPlay`
    = "Fair Play (demo)" + `fairPlayDesc` ("Every round computed from a deterministic seed — fully auditable").
    No "provably fair" string anywhere.
  - **Disclaimer placement:** a visible "Simulated demo — no real money. 18+. Play responsibly."
    (`STRINGS.app.disclaimer`) line renders directly under the hero CTA buttons (`fontSize:12`,
    `var(--text-mute)`), separate from the global blocking `<AgeGate/>` mounted in providers.
  - All copy from `lib/strings.ts`; state via `useApp()`/`useNow()`. `tsc` clean + `next build` ✓
    (`/` prerendered as static content with the real Landing).
- **Step 8 — App shell `(app)` + nav map + auth/age gates + global overlays (Pass A, inline parity):**
  ported VERBATIM from the prototype `WebFrame` authed branch and `Sidebar`/`TopBar`
  (`/tmp/proto_extract/web/{web-app,web-shell}.jsx`); every `style={{…}}` object byte-identical,
  all colors `var(--…)`, the `color-mix(in srgb, var(--accent) 16%, transparent)` active highlight
  preserved. Routing moved from the in-memory `app.navigate(key)` to real App Router URLs (ADR 0003).
  - `lib/nav.ts`: single source of truth for screen-key ↔ route. `ROUTES` (home→`/lobby`, game→`/game`,
    wallet/deposit/withdraw/history/rewards/referral/vip/profile/settings→`/<key>`), `TITLES` (from
    `lib/strings`), `NAV_ITEMS` (ordered Sidebar list — key/route/label/icon/badge, mirrors the
    prototype `NAV` order + "LIVE" badge on game), and helpers `routeForKey(key)` + `keyForPath(pathname)`
    (longest-prefix match for nested routes; `/deposit` + `/withdraw` collapse into the `wallet` group to
    match the prototype's active-highlight rule).
  - `components/shell/Sidebar.tsx` (`'use client'`): 248px rail — brand mark, nav with active highlight
    derived from `usePathname()` via `keyForPath`, VIP progress card, log-out (clears auth →
    `router.replace('/')`). `router.push(route)` replaces `app.navigate`.
  - `components/shell/TopBar.tsx` (`'use client'`): sticky blur header — title (passed by the layout),
    balance pill via `formatMoney(app.totalBalance())` (integer minor-units across the 4 sub-wallets, not
    the prototype's single `wallet.main` float), Deposit button → `/deposit`, bell + avatar.
  - `components/shell/AgeGate.tsx` (`'use client'`): blocking 18+ modal shown until `settings.ageConfirmed`.
    Copy from `lib/strings.ts` (`ageGate` + `app.disclaimer` — includes "simulated", "no real money", "18+").
    Confirm calls `setSetting('ageConfirmed', true)` (persisted durably). **No flash / SSR-safe:** renders
    NOTHING until `hydrated` is true, then shows the gate only when `!ageConfirmed`, so first paint (server +
    pre-hydration client) is always empty — no mismatch, no flash-then-hide for confirmed users. Overlay
    chrome mirrors the prototype AuthModal (`fadeIn`/`popIn`, `var(--…)`).
  - `app/providers.tsx`: the ONE `'use client'` boundary — `<ThemeProvider>` wrapping an `AppRuntime` that
    runs `useHydration()` (hydrate + debounced persist) and `useNow()` (250ms clock + settlement) on mount,
    and mounts the global overlays once above all routes: `<Toaster/>`, `<Celebration/>`, `<AgeGate/>`.
  - `app/(app)/layout.tsx` (`'use client'`): the authed route-group shell — outer `display:flex;
    alignItems:stretch` with `<Sidebar/>` + a flex column (`<TopBar/>` + scrollable `<main>`), byte-identical
    to the prototype grid (root sized to `100vh` for a full-page app vs the prototype's framed `100%`). Title
    from the route via `keyForPath`→`TITLES`. **Auth gate:** after `hydrated`, unauthed users are bounced to
    `/` via `router.replace` in an effect; a stable `var(--bg)` placeholder renders until `hydrated && authed`
    (no hydration mismatch, no flash of authed chrome for logged-out visitors).
  - `app/layout.tsx`: now wraps `{children}` in `<Providers>` while STAYING a server component (fonts +
    no-flash script untouched).
  - `components/shell/index.ts` barrel; `components/shell/MobileNav.tsx` is a minimal placeholder (renders
    `null`) — the full responsive drawer/bottom-nav is step 13 and must not touch the ≥1100 branch.
  - `tsc --noEmit` clean; `next build` ✓ (only `/` + `/_not-found` emitted — the `(app)` route group has no
    pages yet; lobby/game/etc arrive in step 10). No "provably fair" strings.
- **Step 7 — Shared UI primitives (Pass A, inline-style parity):** ported VERBATIM from
  the CDN prototype (`/tmp/proto_extract/app/{components,icons}.jsx`); `createElement(...)`
  → JSX with `style={{…}}` objects kept byte-identical (all brand/theme values stay as
  `var(--…)`, zero hardcoded hex). Tailwind refactor deferred to Pass B (behind the pixel-QA gate).
  - `components/icons/Icon.tsx`: inline stroke icon set (port of the `S`/`P`/`C` helpers) with
    typed `IconProps` + `IconName` union (`satisfies Record<string, IconRenderer>`).
  - `components/primitives/`: `Button` (5 variants × 3 sizes, press-scale handlers),
    `Card`, `SectionHead` (server components), `CountUp` (rAF cubic-ease tween; SSR-safe —
    `disp` seeds from the `value` prop so first render matches server, animation runs only in
    `useEffect`), `ResultBall` (incl. `numColorStyle` color rules: 0=red/violet split,
    5=green/violet split, 1/3/7/9=green, else red).
  - **A11Y color-blind cue (hard Phase-1 req, docs/A11Y.md):** `ResultBall` adds a small
    non-color glyph badge using `lib/strings.ts colorBlindShort` (G / R / V), so red vs green
    is distinguishable without hue; split numbers (0, 5) show both letters. Visual otherwise
    identical to the prototype.
  - `components/feedback/`: `Sheet` (bottom-sheet, `sheetUp`/`fadeIn` keyframes),
    `Toaster` (store-subscribed via `useApp()`, rendered through a `createPortal` to
    `document.body` — SSR-safe, mounts client-only; `toastIn` keyframe, per-kind border tint),
    `Celebration` (store-subscribed; trophy + `CountUp` payout via `fromMinor`; profit line via
    `formatMoney`; `confetti`/`popIn`/`fadeIn` keyframes).
  - **Reduced-motion (hard req):** `Celebration` skips the confetti layer entirely when reduced
    motion is requested — either `settings.reducedMotion` (in-app toggle) OR the OS
    `prefers-reduced-motion: reduce` media query (read client-side via `matchMedia`); the
    celebration stays comprehensible without animation (the global CSS rule near-instants the
    entrance too).
  - Barrels: `components/icons/index.ts`, `components/primitives/index.ts`,
    `components/feedback/index.ts`. `'use client'` on every hook/effect/portal/store-connected
    component; pure markup primitives (`Card`, `SectionHead`, `Icon`) stay server components.
  - `tsc --noEmit` clean. No "provably fair" strings. Pixel diff-vs-screenshot deferred to the QA gate.
- **Step 6 — Zustand store (state + actions + hydration + timer + `useApp()`):**
  - `lib/store/store.ts`: `create<AppState>()` single source of truth. Durable slice
    (`auth`, `user`, `wallet`, `bets`, `tx`, `vip`, `rewards`, `settings`) + transient slice
    (`now`, `toasts`, `celebration`, `hydrated`, `screen`). Seeds from `createSeedState()` at
    construction (`now: 0` — SSR-safe, no `Date.now()` at module load). Actions:
    `hydrate()`/`applyPersisted()`, `setNow()`/`settle(now)`, `placeBet`/`deposit`/`withdraw`/
    `claimSpinPrize`/`claimCheckIn`/`claimMission` (all Promise-returning per the async seam),
    `setAuthed`/`navigate`, `pushToast`/`dismissToast`/`clearCelebration`, `setSetting`/`setTheme`.
    All money math goes through `add`/`sub`/`mul` (integer minor-units; zero float arithmetic).
    Settlement ports the prototype faithfully: on period roll it computes `resultForPeriod`,
    flips each pending bet won/lost via `betWins`, credits `mul(stake, payoutMult)` to the
    `winning` sub-wallet, writes a win-payout tx, and sets the celebration. **Idempotent** — a bet
    is only touched while `status === 'pending'` AND its period has rolled (`curIdx > periodIdx`),
    so repeat `settle()` calls for the same/later tick are no-ops. placeBet credits the `bet`-tx +
    deducts main; spin/check-in/mission claims credit the `bonus` sub-wallet (moved inline from
    `web-pages2.jsx`). `toPersisted()` extracts the durable slice only.
  - `lib/store/useApp.ts`: `useApp()` reconstructs the prototype `app.*` shape on top of the store
    (wallet/tx/bets/vip/rewards/settings, `totalBalance()`, `navigate`, `pushToast`, `placeBet`,
    pure game helpers `MODES`/`MODE_LABEL`/`periodAt`/`secondsLeft`/`recentResults`/`resultForPeriod`).
    Shallow slice subscription (`zustand/react/shallow`) that deliberately EXCLUDES `now`, so the
    250ms tick never re-renders `useApp()` consumers. Live clock is a separate opt-in (`useAppNow()`
    / prefer `useNow()`), keeping slice isolation.
  - `lib/store/useNow.ts`: SSR-safe live wall-clock — returns `0` until mounted, then ticks every
    250ms via `setInterval` in an effect, also driving `setNow()` (and thus settlement). Pauses on
    `document visibilitychange` (hidden) and catches up on visible; cleans up on unmount.
  - `lib/store/hydration.ts`: `useHydration()` mount hook — hydrates from `repository.loadState()`
    (seeds + persists if empty) and installs a debounced (400ms) persist subscription that fires
    ONLY when a durable field changes (a `now` tick or toast never schedules a write); persists the
    durable slice via `toPersisted()`.
  - `lib/store/index.ts`: barrel exporting `useStore`/`AppState`, `useApp`/`AppApi`/`useAppNow`,
    `useNow`, `useHydration`, `toPersisted`, and transient value types.
  - `lib/store/store.test.ts`: 19 Vitest tests — placeBet decrements main by exact integer
    minor-units + writes a bet-tx + rejects over-balance; settlement credits the `winning` wallet,
    writes a win-tx, sets celebration, and is idempotent (no double-credit on repeat `settle`);
    deposit/withdraw update wallet + tx and reject over-balance; claim* credit the bonus wallet;
    every money-mutating action returns a Promise; transient state is excluded by `toPersisted`.
    In-memory localStorage mock + store reset (no jsdom).
  - `tsc --noEmit` clean; full suite 129 tests pass (money + fair + persistence + store).

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
