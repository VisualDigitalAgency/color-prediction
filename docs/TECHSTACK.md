# AuraWin — Tech Stack

| Concern | Choice | Why |
|---|---|---|
| Framework | **Next.js 16 (App Router)** | Phase-2 backend (API routes, RSC) drops in; good DX. Accepted cost: SSR is mostly idle for an auth-gated client-state app. |
| Language | **TypeScript 5** | Schema = the future DB/API contract; safety across the port. |
| UI runtime | **React 19** | Latest; `useLayoutEffect`/portals for theming + overlays. |
| Styling | **Tailwind CSS v4** | Layout/responsive utilities; brand/theme values via CSS variables. **Two-pass** adoption (port to inline parity → refactor to Tailwind behind pixel-QA). |
| State | **Zustand** | Slice subscriptions avoid whole-tree re-render from the 250ms tick; `useApp()` wrapper preserves prototype call sites. |
| Persistence | **localStorage** behind `DataRepository` | Phase-2 seam; swap to REST + DB without touching the store API. |
| Fonts | **next/font** (Poppins, Manrope, Space Grotesk) | One per theme; preload all 3 to avoid switch FOUT (ADR 0007). |
| Testing | **Vitest/RTL + Playwright** | Golden-value engine tests, settlement/wallet math, pixel-diff CI gate. |
| Lint | **ESLint (next config)** | Scaffold default. |

## Tailwind v4 specifics (important)
create-next-app provisioned **Tailwind v4**, which is **CSS-first**: there is **no
`tailwind.config.ts`**. Theme tokens are declared with `@theme` inside `app/globals.css` and bound
to runtime CSS variables, e.g. `--color-green: var(--green, #15e08a)`. The plan's references to
`tailwind.config.ts` are realized as `@theme` blocks (ADR 0001). The `data-theme` attribute on
`<html>` (set by `ThemeProvider`) drives per-theme variable values; utilities read them via
`var(--…)`.

## Browser baseline
The prototype uses `color-mix(in srgb, …)` (active-nav highlight, tints) and CSS custom
properties — both require a modern-evergreen baseline (Chrome/Edge/Safari/Firefox current). Noted
in `docs/FAILURES.md` as a compatibility constraint.

## Notable versions (lockfile)
next 16.2.7 · react/react-dom 19.2.4 · tailwindcss ^4 · typescript ^5. See `package.json`.
