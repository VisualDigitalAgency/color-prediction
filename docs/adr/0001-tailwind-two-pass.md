# ADR 0001 — Styling: Tailwind CSS v4 via a two-pass port

## Status
Accepted

## Context
The prototype is all-inline styles referencing CSS custom properties, tuned to exact px values,
gradients, glows, and `color-mix` highlights. Pixel-perfect parity is a hard requirement, yet the
user wants Tailwind CSS. Porting and re-platforming styling at the same time makes any visual diff
ambiguous (port bug vs Tailwind bug). create-next-app provisioned **Tailwind v4**, which is
CSS-first (no `tailwind.config.ts`).

## Decision
Adopt Tailwind in **two passes**:
- **Pass A** — mechanical `React.createElement → JSX` keeping `style={{…}}` objects byte-identical.
  Reach pixel parity vs `/screenshots` first.
- **Pass B** — refactor to Tailwind **screen-by-screen, behind the pixel-QA gate**. Tailwind owns
  layout/responsive utilities; brand/theme values stay CSS-variable-driven
  (`bg-[var(--header-grad)]`, never hardcoded hex). One-off pixels use arbitrary values
  (`w-[248px]`).

Theme tokens are declared with `@theme` in `app/globals.css` (Tailwind v4 CSS-first), bound to
runtime CSS variables that `ThemeProvider` sets per `data-theme`.

## Consequences
- Fidelity is provable independently of Tailwind; regressions are attributable to one pass.
- Tailwind's real payoff here is the responsive pass, not the brand styling (which remains
  variable-driven) — set that expectation.
- No `tailwind.config.ts`; contributors must know tokens live in `globals.css`.
