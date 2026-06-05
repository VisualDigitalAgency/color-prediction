# Changelog

All notable changes to AuraWin. Format loosely follows Keep a Changelog.

## [Unreleased]
### Added
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
