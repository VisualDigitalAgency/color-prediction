# Project Context — AuraWin

## One-liner
Convert the AuraWin (Wingo-style color-prediction) prototype into a pixel-perfect, production
Next.js web app. Phase 1 = frontend-only with localStorage behind a repository seam.

## Where things are
- Prototype (read-only source of truth): `/tmp/proto_extract` — `app/themes.js`, `app/store.jsx`,
  `app/icons.jsx`, `app/components.jsx`, `web/web-shell.jsx`, `web/web-game.jsx`,
  `web/web-pages.jsx`, `web/web-pages2.jsx`, `web/web-app.jsx`; `screenshots/`.
- App: this repo. Live tracker: `process.md`. Plan/architecture: `docs/`.

## Prototype mechanics (must stay faithful)
- Modes [30, 60, 180, 300]s. Payouts: color 2×, violet 4.5×, number 9×, big/small 2×.
- Result engine: FNV-1a hash of `mode|periodIdx` → number 0–9 → color
  (0 = red+violet, 5 = green+violet, 1/3/7/9 = green, else red); big = num ≥ 5.
- 4 sub-wallets: main / bonus / winning / referral. Seed: main 1284.5, bonus 36, winning 412.75,
  referral 88.2 (convert to minor-units on import).
- Wall-clock timer ticks ~250ms; settlement runs on tick; win → celebration + toast + win tx.
- 3 themes (neon/fintech/cyber) = pure CSS-variable maps; brand green #15e08a / red #ff3460 /
  violet #b14bff stable across themes. Base bg #06060d. Fonts Poppins/Manrope/Space Grotesk.

## Key decisions (see docs/adr)
Tailwind two-pass · Zustand · App Router routes · DataRepository seam · client-now/server-later
authority · fairness "demo" now / commit-reveal Phase 2 · preload 3 fonts. Money = minor-units.
No "provably fair" label. Color-blind cues + age-gate required.

## Status — Phase 1 COMPLETE ✓
All 15 steps done as of 2026-06-06. Branch: `claude/codebase-review-pending-hOW4x`.
PR #2: https://github.com/VisualDigitalAgency/color-prediction/pull/2

| Step | Work | Status |
|------|------|--------|
| 1 | Init: scaffold, globals.css, dirs | ☑ |
| 2 | types/* + money.ts + strings.ts | ☑ |
| 3 | Theme system (3 themes, ThemeProvider, no-flash) | ☑ |
| 4 | Fair engine + golden tests | ☑ |
| 5 | DataRepository + LocalStorageRepository | ☑ |
| 6 | Zustand store (hydrate, settle, timer, useApp) | ☑ |
| 7 | Primitives + Icon (Pass A) | ☑ |
| 8 | App shell + nav + auth gate + AgeGate | ☑ |
| 9 | Landing + AuthModal + disclaimer | ☑ |
| 10 | All 12 screens — Pass A (inline-parity) | ☑ |
| 11 | All 12 screens — Pass B (Tailwind refactor) | ☑ |
| 12 | Settings page (theme picker + a11y toggles) | ☑ |
| 13 | Responsive pass (mobile nav/drawer/sheet) | ☑ |
| 14 | Tests (198 passing) + Playwright CI + GitHub Actions | ☑ |
| 15 | Polish + finalize docs/memory/changelog | ☑ |

## What's left for Phase 2
- Backend seam: replace LocalStorageRepository with REST/WebSocket API
- Real auth (OTP provider, JWT session)
- Commit-reveal fairness (ADR 0006 Phase 2)
- Server-authoritative balances + reconciliation (ADR 0005)
- Playwright golden snapshots: run `npm run test:e2e:update` once to capture baselines
- Deep-research competitor analysis (was blocked on session limit — fold into docs/PRD.md §10)

## Environment notes
- Next.js 16, React 19, Tailwind v4 (CSS-first; tokens in `globals.css`).
- Branch: `claude/codebase-review-pending-hOW4x`. GitHub repo: `visualdigitalagency/color-prediction`.
- Test stack: Vitest v4 (unit/component) + @testing-library/react v16 (jsdom) + Playwright v1.60 (e2e).
