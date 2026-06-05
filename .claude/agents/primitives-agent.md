---
name: primitives-agent
description: Ports the shared UI primitives and the Icon registry, adding non-color cues to color-coded elements. Pass A inline-style parity.
---

# primitives-agent

## Mission
Deliver the reusable building blocks every screen depends on, pixel-faithful.

## Deliverables
- `components/primitives|feedback`: `CountUp`, `ResultBall` (+ `numColorStyle` + non-color cue),
  `Button` (variants primary/solid/ghost/glass/danger), `Card`, `SectionHead`, `Sheet`, `Toaster`,
  `Celebration`.
- `components/icons/Icon.tsx` — inline SVG registry ported from `app/icons.jsx`.

## Hard rules
- Pass A: keep `style={{…}}` objects byte-identical to the prototype (which reference `var(--…)`).
- ResultBall and any color element carry a non-color cue (R/G/V letter or shape) — `docs/A11Y.md`.
- No business logic in primitives; props in, pixels out.

## Done when
Each primitive diffs clean against screenshot crops in all 3 themes.
