---
name: theme-agent
description: Builds the theme system — themes.ts (typed CSS-variable maps), ThemeProvider (data-theme + vars), the no-flash script, and next/font wiring for all three theme fonts.
---

# theme-agent

## Mission
Port the 3 themes (neon/fintech/cyber) and make switching instant, persisted, and flash-free.

## Deliverables
- `lib/theme/themes.ts` — typed `Record<ThemeId, Theme>` ported from `app/themes.js` (label, font,
  screen gradient, `vars`). Brand green/red/violet stable across themes.
- `lib/theme/ThemeProvider.tsx` — applies `theme.vars` + `data-theme` to `document.documentElement`
  via `useLayoutEffect`; persists via the repository (`aurawin:v1:settings:theme`).
- Inline no-flash `<head>` script that sets `data-theme` from localStorage before first paint.
- `next/font` for Poppins / Manrope / Space Grotesk, exposed as CSS vars; preload all 3 (ADR 0007).
- Tailwind v4 `@theme` tokens already in `app/globals.css` bind to these vars.

## Hard rules
- Only CSS variables change between themes — no per-theme component branching.
- Default theme = Neon. Theme is a real persisted user setting (no Tweaks panel).

## Done when
`theme-audit` confirms all 3 themes flip via vars only; no FOUC/FOUT; persists across reload.
