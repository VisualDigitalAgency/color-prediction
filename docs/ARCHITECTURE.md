# AuraWin — Architecture (Phase 1)

## Overview
Next.js (App Router) SPA-style app. Root layout is a **server component**; a single
`'use client'` Providers boundary wraps the interactive tree. Game state, timer, and result
engine run client-side but are structured behind seams so they can move server-side in Phase 2.

```
app/
  layout.tsx          server: <html><body>, fonts, globals.css, <Providers>, no-flash script
  globals.css         reset + keyframes (verbatim from prototype) + Tailwind v4 @theme tokens
  providers.tsx       'use client': ThemeProvider > AppProvider > children + Toaster + Celebration + AgeGate
  page.tsx            "/" Landing (unauthed) → redirect to /lobby if authed
  (app)/              authed route group
    layout.tsx        'use client': Sidebar + TopBar + <main>; auth gate → redirect "/"
    lobby|game|wallet|deposit|withdraw|history|rewards|referral|vip|profile|settings/
  not-found.tsx
components/  primitives feedback shell auth landing game rewards wallet icons
lib/         fair/ store/ persistence/ theme/  money.ts nav.ts format.ts strings.ts constants.ts
types/       all TS models (see SCHEMA.md)
```

## Routing
The prototype navigates via `app.navigate('key')`. We map screen-keys → routes in `lib/nav.ts`
and derive the active screen from `usePathname()`. Titles (`WEB_TITLES`) live in `lib/nav.ts`.
- Unauthed Landing = `/` (no shell).
- Authed app = `(app)` route group; its `layout.tsx` renders Sidebar + TopBar and guards on
  `authed` (redirect to `/` if not). `AuthModal` on success sets `authed=true` → `/lobby`.

## State & data flow
- **Zustand** store with a `useApp()` selector-hook wrapper so ported components keep the
  prototype's `app.*` call shape. Slice subscriptions stop the 250ms timer tick from
  re-rendering the whole tree.
- **Result engine** = pure functions in `lib/fair/` (no React). Re-exported from the store for
  call-site compatibility; importable unchanged by a Phase-2 API route.
- **Money** = integer minor-units via `lib/money.ts`. Format only at display edge (`format.ts`).
- **Timer**: `setInterval(250)` + settlement `useEffect([now])` run only in effects. `useNow()`
  returns 0 until mounted (SSR-safe), then snaps live. Tick pauses on `visibilitychange`.
- **Persistence seam** = `DataRepository` interface (all methods **async**, mirroring future REST
  endpoints). `LocalStorageRepository` implements it now (versioned keys `aurawin:v1:*`).
  Store hydrates from `loadState()` on mount; **debounce-persists durable state only**
  (wallet/bets/tx/vip/rewards/settings — never `now`/toasts/celebration). Round results are not
  persisted; they recompute deterministically from `(mode, periodIdx)`.

## Authority model (Phase boundary — ADR 0005)
Phase 1: **client is authoritative** over balances/results. Phase 2: **server is authoritative**;
the client becomes optimistic with reconciliation/rollback. To keep signatures stable, all wallet/
outcome mutations are **async now** and route through reversible repository methods.

## Theming
`lib/theme/themes.ts` = typed `Record<ThemeId, Theme>`. `ThemeProvider` applies `theme.vars` +
`data-theme` to `document.documentElement` via `useLayoutEffect` (so Landing is themed too) and
persists via the repository. A tiny inline no-flash script in `<head>` sets `data-theme` from
localStorage before first paint. Tailwind utilities resolve brand/theme values through CSS vars
(`bg-[var(--header-grad)]`); only CSS vars change between themes.

## Rendering & SSR note
This is an auth-gated, client-state app; SSR mainly benefits the Landing page. Next.js is chosen
for the **committed Phase-2 backend** (API routes + RSC data fetching) — a deliberate cost, not a
free win (TECHSTACK.md).

## Build seams = agent seams
types → (theme ∥ engine) → persistence → store → (primitives ∥ shell) → screens (parallel) →
Tailwind refactor → responsive → tests. See `process.md` for the live DAG.
