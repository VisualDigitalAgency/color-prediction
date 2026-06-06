---
name: pixel-qa
description: Screenshot a route at a fixed viewport in each theme and diff it against the prototype reference images; report mismatches. The gate between a ported screen and "done".
---

# pixel-qa

Verify pixel parity between a built route and the prototype.

## Inputs
- Route (e.g. `/lobby`), viewport (default ~1380×900 desktop; plus mobile widths for step 13),
  theme(s) to test (default all 3: neon/fintech/cyber).
- Reference images in `/tmp/proto_extract/screenshots/` (see `process.md` reference map).

## Procedure
1. `next dev` running; set `data-theme` (or use the settings/theme switch) per theme.
2. With Playwright, navigate to the route, set the viewport, wait for fonts/animations to settle,
   screenshot.
3. Diff against the matching reference with `pixelmatch`; produce a diff image + % mismatch.
4. Report: per-theme mismatch %, the largest diff regions, and a pass/fail against threshold.

## Pass criteria
- Below the agreed mismatch threshold (allow tiny AA/sub-pixel noise; flag structural diffs:
  spacing, radii, shadows/glows, colors, font, grid columns).
- For Pass B (Tailwind refactor): zero regression vs the stored Pass-A baseline.

## Notes
Animations (confetti/pulse/count-up) should be paused or settled before capture. Update the
screen's row in `process.md` with the result.
