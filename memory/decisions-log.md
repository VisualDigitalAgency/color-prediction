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

## 2026-06-06
- **Pass B (Step 11) inline-style policy:** Keep `style={{}}` only for values that are computed
  at render time: state-driven conditional expressions, `color-mix()` / `conic-gradient()` calls
  (Tailwind arbitrary values can't contain spaces without underscore mangling), per-datum color
  arrays, and `Card` / `SVG` style props that the component API forwards to the DOM. Everything
  else → Tailwind v4 utility class.
- **`color-mix()` stays inline:** Tailwind arbitrary values normalize underscore-separated spaces,
  which would corrupt the `color-mix(in srgb, ...)` syntax. All `color-mix()` calls remain as
  inline styles.
- **`WebkitBackgroundClip` / `WebkitTextFillColor` stay inline:** No Tailwind equivalent for the
  gradient-text clip effect used in the Landing hero. These are the only vendor-prefixed styles in
  the codebase.
- **Test environment split:** Vitest environment = `node` globally; component tests use
  `// @vitest-environment jsdom` docblock + `afterEach(cleanup)` via `tests/setup.ts`. This keeps
  the node-only persistence/engine/money tests free of jsdom overhead.
- **Playwright visual CI threshold:** `maxDiffPixelRatio: 0.02` (2%). Chosen to allow sub-pixel
  font rendering variation across OS/GPU while still catching meaningful visual regressions.
- **CI pipeline shape:** 3 jobs in sequence: `unit` (fast, no build) → `build` (artifact handoff
  to e2e) → `e2e` (Playwright Chromium only). Browser matrix deferred to Phase 2 (currently only
  Chrome is needed for the desktop-first app).
- **Playwright golden workflow:** First-run `npm run test:e2e:update` creates snapshot files;
  developers commit them alongside tests. CI treats missing snapshots as a failure, not a first-run
  create, to prevent silent regressions.
