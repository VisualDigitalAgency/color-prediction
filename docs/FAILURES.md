# AuraWin — Failure Log & Known Pitfalls

Living list of failure modes — anticipated and encountered. Add an entry whenever something
bites; link the fix.

## Anticipated (seeded from planning + critique)
1. **SSR hydration mismatch on `Date.now()`** — countdown/period/result differ server vs client.
   *Mitigation:* `useNow()` returns 0 until mounted; timer-dependent UI renders a stable
   placeholder pre-hydration, then snaps live. Never read `Date.now()` during render on the server.
2. **Theme flash on load (FOUC)** — wrong theme paints before JS hydrates.
   *Mitigation:* inline no-flash script in `<head>` sets `data-theme` from localStorage before
   first paint; `ThemeProvider` uses `useLayoutEffect`.
3. **Font FOUT on theme switch** — each theme uses a different family.
   *Mitigation:* preload all 3 via `next/font` (ADR 0007).
4. **Persisting transient state** — accidentally saving `now`/toasts/celebration bloats storage
   and causes stale UI on reload. *Mitigation:* persist durable slice only; debounce writes.
5. **Float-money rounding drift** — repeated bet/settle on floats accumulates error.
   *Mitigation:* integer minor-units everywhere (`lib/money.ts`); format only at display.
6. **Tailwind arbitrary-value drift** — Pass B refactor silently changes a px/shadow value.
   *Mitigation:* two-pass + pixel-QA gate after both A and B; brand values via `var(--…)` only.
7. **`color-mix()` / CSS-var support** — needs modern-evergreen browsers; document baseline.
8. **`(app)` route-group auth race** — flashing the shell before the auth gate resolves.
   *Mitigation:* gate in `(app)/layout.tsx`; render nothing/redirect until `authed` known.

## Encountered
- **2026-06-06 · Vitest globals=false breaks @testing-library/jest-dom auto-setup:**
  `@testing-library/jest-dom` calls `expect.extend()` at import time, but `expect` isn't global
  when `globals: false`. *Fix:* import `@testing-library/jest-dom/vitest` (the package's
  Vitest-specific entry point that uses `import { expect } from 'vitest'` internally).
  Also: `@testing-library/react` auto-cleanup hooks into global `afterEach`, which doesn't exist
  with `globals: false`. *Fix:* explicitly call `afterEach(cleanup)` in `tests/setup.ts`, importing
  `afterEach` from `vitest`. Commit: `feat(step-14)`.

- **2026-06-06 · Playwright tests picked up by Vitest:** `tests/e2e/visual.spec.ts` imports from
  `@playwright/test` which exports its own `test()` / `expect()`. Vitest tried to run it and threw
  "Playwright Test did not expect test() to be called here." *Fix:* Add
  `exclude: ['tests/e2e/**', 'node_modules/**']` to the Vitest config `test` block. Commit:
  `feat(step-14)`.

- **2026-06-06 · `environmentMatchGlobs` not applied in Vitest v4:** The `environmentMatchGlobs`
  option in `vitest.config.ts` was not switching component test files to `jsdom` — they still ran
  in `node` and threw `document is not defined`. *Fix:* Use the `// @vitest-environment jsdom`
  per-file docblock comment at the top of each component test file instead. Commit: `feat(step-14)`.

- **2026-06-06 · `color-mix()` breaks in Tailwind arbitrary values:** During Pass B, replacing
  `style={{ background: 'color-mix(in srgb, var(--green) 16%, transparent)' }}` with a Tailwind
  arbitrary value like `bg-[color-mix(in_srgb,_var(--green)_16%,_transparent)]` (underscores for
  spaces) produces invalid CSS because `color-mix()` requires spaces around the keyword `in`. Tailwind
  converts underscores to spaces only outside function argument lists, making this unreliable. *Fix:*
  Keep all `color-mix()` calls as inline `style` props — they are legitimately dynamic values.
