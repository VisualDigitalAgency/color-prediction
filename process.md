# AuraWin — Execution Process & Tracker

> **Single source of truth for *what's done, what's next, and who owns it.***
> Update this file at the start/end of every work session. Each agent updates
> its own row. Full plan lives in `docs/ARCHITECTURE.md` + the approved plan.

**Project:** AuraWin — Wingo-style color-prediction web app (prototype → production)
**Phase:** 1 (frontend-only, localStorage behind a repository seam)
**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Zustand
**Branch:** `claude/prototype-web-app-conversion-f3ZAg`
**Prototype source of truth:** `/tmp/proto_extract` (re-extract from `Color_Prediction_1.zip`)
**Last updated:** 2026-06-06 · **Current step:** 15 (Polish + finalize docs) — ☑ done; **Phase 1 COMPLETE**
**PR:** [#1](https://github.com/VisualDigitalAgency/color-prediction/pull/1) (draft)

---

## Legend
`☐` todo · `◑` in progress · `☑` done · `⛔` blocked · `🔁` needs re-QA

---

## Dependency DAG (execution order)

The repository seam IS the agent seam. **Sequence the spine; parallelize the screens.**

```
[1] init ──► [2] types + money + strings
                   │
        ┌──────────┴───────────┐
        ▼                      ▼
[3] theme system        [4] fair engine + golden tests
        │                      │
        │              [5] persistence (DataRepository + LocalStorageRepo)
        │                      │
        └────────► [6] store (Zustand) ◄──────────────┘
                       │
            ┌──────────┴──────────┐
            ▼                     ▼
   [7] primitives + Icon   [8] (app) shell + nav + auth gate + AgeGate
            │                     │
            └─────────► [9] Landing + AuthModal
                            │
                   [10] screens Pass A (inline-parity)  ← REAL parallelism (1 agent/screen)
                            │  (pixel-QA gate after each)
                   [11] screens Pass B (Tailwind refactor)  ← behind pixel-QA gate
                            │
                   [12] settings page (theme + a11y toggles)
                            │
                   [13] responsive pass (mobile nav/drawer/sheet; ≥1100 branch untouched)
                            │
                   [14] tests (unit/component + Playwright pixel-diff CI)
                            │
                   [15] polish + finalize docs/memory
```

---

## Build steps

| # | Step | Owner agent | Depends on | Status | Notes |
|---|------|-------------|------------|--------|-------|
| 1 | Init: scaffold, globals.css, dirs, knowledge scaffolding, process.md | init | — | ☑ | Next 16 + Tailwind v4 (CSS-first `@theme`, no `tailwind.config.ts`); `npm run build` ✓ |
| 2 | `types/*` + `lib/money.ts` (minor-units) + `lib/strings.ts` (i18n-lite) | types-agent | 1 | ☑ | schema-first; `tsc` clean; vitest money tests pass |
| 3 | Theme system: `themes.ts`, `ThemeProvider`, no-flash script, `next/font` (×3) | theme-agent | 2 | ☑ | 3 themes (neon/fintech/cyber) verbatim from prototype; vars also in globals.css `[data-theme]` blocks; preload all 3 fonts (ADR 0007) |
| 4 | `lib/fair/*` pure fns + golden-value unit tests | engine-agent | 2 | ☑ | ported verbatim (FNV-1a `Math.imul`/`>>> 0`); zero React deps; 45 golden tests pass; "Fair Play (demo)" label only |
| 5 | `DataRepository` (async) + `LocalStorageRepository` + seed data | store-agent | 2,4 | ☑ | versioned keys `aurawin:v1:*`; SSR-safe; 23 vitest tests pass; `tsc` clean |
| 6 | Store (Zustand): hydrate, debounced persist, timer/`useNow`, settlement, `useApp()` | store-agent | 4,5 | ☑ | async actions return Promises; idempotent settlement; slice-subscribed `useApp()`; 19 store tests; `tsc` clean |
| 7 | Primitives + Icon (+ color-blind cue) | primitives-agent | 3,6 | ☑ | Pass A inline-parity; Icon + Button/Card/SectionHead/CountUp/ResultBall + Sheet/Toaster/Celebration; ResultBall G/R/V cue; Celebration honors reduced-motion; `tsc` clean. diff vs screenshot crops deferred to pixel-QA gate |
| 8 | `(app)/layout.tsx` shell + `lib/nav.ts` + auth gate + AgeGate + overlays | shell-agent | 6,7 | ☑ | Pass A inline-parity; Sidebar 248px + TopBar + grid byte-identical to prototype `WebFrame`; `lib/nav.ts` (ROUTES/NAV_ITEMS/keyForPath, deposit+withdraw→wallet group); `app/providers.tsx` single 'use client' boundary (ThemeProvider + useHydration + useNow + Toaster/Celebration/AgeGate mounted once); AgeGate + auth gate render nothing/stable placeholder until `hydrated` (no flash, no SSR mismatch); `tsc` clean + `next build` ✓. MobileNav stubbed (full drawer = step 13) |
| 9 | Landing `/` + AuthModal + age-gate + "simulated" disclaimer | shell-agent | 7,8 | ☑ | Pass A inline-parity; `components/landing/Landing.tsx` (hero/live-preview card/feature grid/stats byte-identical to prototype `Landing`) + `components/auth/AuthModal.tsx` (phone→OTP centered portal modal, mount-gated). CTAs open `<AuthModal/>`; success → `app.setAuthed(true, demoUser)` + welcome toast + `router.push('/lobby')`. "Provably fair" → "Fair Play (demo)" (strings `landing.features.fairPlay`); visible "simulated — no real money · 18+" disclaimer under hero CTA (`app.disclaimer`). Authed visitors redirect to `/lobby` in an effect. `app/page.tsx` renders `<Landing/>`. `tsc` clean + `next build` ✓ (`/` prerendered static) |
| 10 | Screens **Pass A** (inline-parity) | screen-porter ×N | 8,9 | ☑ | all screens ported; 12 routes compile static; tsc clean; 129 tests pass |
| 11 | Screens **Pass B** (Tailwind refactor) | tailwind-refactor | 10 | ☑ | inline styles → Tailwind v4 utilities across all 12 screens; only dynamic/complex styles remain inline; tsc clean; 129 tests pass |
| 12 | Settings page (theme picker + a11y toggles) | shell-agent | 6,7 | ☑ | Pass A; theme picker + a11y toggles; tsc clean; 129 tests pass |
| 13 | Responsive pass (mobile nav/drawer/betslip sheet, reflow) | responsive-adapter | 10 | ☑ | MobileNav bottom tab + drawer; CSS @media; ≥1100 branch byte-identical; tsc clean; 129 tests |
| 14 | Tests: unit/component + Playwright pixel-diff CI gate | qa-agent | 10 | ☑ | 198 tests pass (129 unit + 27 component + 42 strings/pure); Playwright config + visual.spec.ts; GitHub Actions CI (.github/workflows/ci.yml): type-check → unit → build → Playwright e2e |
| 15 | Polish + finalize docs/memory/changelog | init | 13,14 | ☑ | memory/project-context.md + decisions-log.md + glossary.md updated; docs/FAILURES.md completed; CHANGELOG finalized; Phase 1 complete |

---

## Screen porting tracker (steps 10–11)

| Screen | Route | Pass A (parity) | Pixel-QA A | Pass B (Tailwind) | Pixel-QA B | Responsive |
|--------|-------|:---:|:---:|:---:|:---:|:---:|
| Landing | `/` | ☑ | ☐ | ☑ | ☐ | ☑ |
| Lobby | `/lobby` | ☑ | ☐ | ☑ | ☐ | ☑ |
| Game (Wingo) | `/game` | ☑ | ☐ | ☑ | ☐ | ☑ |
| Wallet | `/wallet` | ☑ | ☐ | ☑ | ☐ | ☑ |
| Deposit | `/deposit` | ☑ | ☐ | ☑ | ☐ | ☑ |
| Withdraw | `/withdraw` | ☑ | ☐ | ☑ | ☐ | ☑ |
| History | `/history` | ☑ | ☐ | ☑ | ☐ | ☑ |
| Rewards | `/rewards` | ☑ | ☐ | ☑ | ☐ | ☑ |
| Referral | `/referral` | ☑ | ☐ | ☑ | ☐ | ☑ |
| VIP | `/vip` | ☑ | ☐ | ☑ | ☐ | ☑ |
| Profile | `/profile` | ☑ | ☐ | ☑ | ☐ | ☑ |
| Settings | `/settings` | ☑ | ☐ | ☑ | ☐ | ☑ |

Pixel-QA reference map (`/tmp/proto_extract/screenshots/`):
Landing→`web-01-landing.png`/`01-web-lobby-final.png` · Lobby→`01-web-app.png` ·
Game→`web-game.png`/`04-web-02.png` · themes→`01/02/03-web-*` (neon/fintech/cyber).

---

## Agents (`.claude/agents/`)

| Agent | Responsibility | Hard rule |
|-------|----------------|-----------|
| types-agent | `types/*`, `money.ts`, `strings.ts` | money = integer minor-units only |
| engine-agent | `lib/fair/*` + golden tests | output must equal prototype; no "provably fair" copy |
| theme-agent | themes, ThemeProvider, fonts, no-flash | only CSS vars change between themes |
| store-agent | Zustand, repository, persistence | actions async; never persist transient state |
| primitives-agent | shared UI primitives + Icon | add non-color cue to color elements |
| screen-porter | one screen each, Pass A | byte-identical `style={{}}`; no logic drift |
| tailwind-refactor | Pass B per screen | brand values via `var(--…)`; never hardcode hex |
| responsive-adapter | mobile nav/drawer/sheet/reflow | MUST NOT touch the ≥1100 branch |

## Skills (`.claude/skills/`)
- `pixel-qa` — screenshot a route at fixed viewport, diff vs `/screenshots`, report.
- `round-verify` — recompute `resultForPeriod(mode, periodIdx)` for a `periodId`; verify settlement.
- `theme-audit` — render a component in all 3 themes; confirm only CSS vars change.

---

## Blockers / open items
- `⛔ deep-research` (competitor landscape) hit a session limit; retry after reset, then fold
  findings into `docs/PRD.md` (competitor section) and `docs/DECISIONS.md`.
- Tailwind is **v4** (CSS-first). Plan's `tailwind.config.ts` → realized as `@theme` in
  `app/globals.css`. Recorded in ADR 0001 / TECHSTACK.

## Changelog
See `docs/CHANGELOG.md` (human-readable) — this tracker links the work to it.
