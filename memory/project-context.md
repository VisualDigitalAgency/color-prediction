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

## Status
Step 1 (Init) — scaffold + knowledge scaffolding done; see `process.md` for the rest.

## Environment notes
- Next.js 16, React 19, Tailwind v4 (CSS-first; tokens in `globals.css`).
- Branch: `claude/prototype-web-app-conversion-f3ZAg`. GitHub repo:
  `visualdigitalagency/color-prediction`.
- Deep-research (competitors) blocked on session limit; retry later and fold into PRD §10.
