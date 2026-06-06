---
name: theme-audit
description: Render a component/route in all three themes and confirm that ONLY CSS variables change — no layout, spacing, or structural differences between themes.
---

# theme-audit

Confirm the theming contract: themes differ by CSS variables only.

## Inputs
- A component or route; the 3 theme ids (neon/fintech/cyber).

## Procedure
1. Render the target under each `data-theme`.
2. Capture computed styles / screenshots per theme.
3. Diff: brand colors (green/red/violet) must be identical across themes; only var-driven values
   (gradients, glows, surfaces, text, radius, font family) may differ.
4. Flag any structural difference (box model, layout, element count) — that's a bug, not a theme.

## Pass criteria
- Geometry/layout identical across themes; only CSS-variable-driven paint differs.
- Per-theme font family applies; contrast acceptable in each theme (cross-check `docs/A11Y.md`).

## Done when
All 3 themes match structurally and differ only by variables.
