# Decisions Log — AuraWin

Chronological, lightweight log of decisions as they're made. Formal ones graduate to `docs/adr/`.

## 2026-06-05
- **Stack locked:** Next.js 16 (App Router) + TypeScript + Tailwind v4 + Zustand; frontend-only
  with localStorage behind `DataRepository`. (ADRs 0001–0007.)
- **Tailwind is v4** (CSS-first) — theme tokens in `app/globals.css` `@theme`; no
  `tailwind.config.ts`. Plan references to the config file are realized as `@theme`.
- **Critique folded in:** integer minor-unit money; async-ready mutations; color-blind cues;
  age-gate + "simulated/no real money" disclaimer; dropped all "provably fair" wording
  ("Fair Play (demo)"); two-pass styling; i18n-lite string centralization; tests beyond golden
  values.
- **Execution model:** microtasks mapped to specialized agents along the build seams; live DAG +
  checklist in `process.md`.
- **Dropped from prototype:** mock Chrome frame, Tweaks panel, `Stage`/`WebFrame`/`WebApp`,
  native mobile flavor.
