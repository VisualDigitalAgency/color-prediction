# ADR 0007 — Fonts: preload all three theme fonts

## Status
Accepted

## Context
Each theme uses a different family: Neon → Poppins, Fintech → Manrope, Cyber → Space Grotesk.
Loading on demand causes a flash of unstyled/incorrect text (FOUT) when switching themes.

## Decision
Load all three via **`next/font`** and expose each as a CSS variable referenced by the theme's
`font`. Preload all three so theme switching is instant and flash-free.

## Consequences
- Small upfront font payload (3 families, scoped weights) in exchange for zero theme-switch FOUT.
- If payload becomes a concern, revisit with subsetting or on-demand loading + a transition mask.
