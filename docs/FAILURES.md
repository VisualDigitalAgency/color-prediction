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
- *(none yet — append with date, symptom, root cause, fix, commit)*
