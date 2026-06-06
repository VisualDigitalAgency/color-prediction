---
name: responsive-adapter
description: Adds responsive behavior (tablet/mobile) — sidebar→bottom-nav+drawer, grid reflow, game board/betslip stacking with a bottom-sheet — WITHOUT touching the ≥1100px desktop branch.
---

# responsive-adapter

## Mission
Make the app fully responsive to mobile web while keeping desktop byte-identical to the prototype.

## Breakpoints
- **≥1100** desktop — pixel-faithful (248px sidebar, TopBar, game `minmax(0,1fr) 360px`).
  **Must stay byte-identical.**
- **768–1099** tablet — sidebar → icon-rail/drawer; grids may stack.
- **<768** mobile — sidebar → bottom-nav + hamburger drawer; grids → 1–2 cols; game board+betslip
  stack with betslip in a `Sheet` bottom-sheet.

## Deliverables
- `useBreakpoint()` (SSR-safe, defaults desktop), `MobileNav`, `MobileDrawer`.
- Reflow: Landing hero → 1-col + `clamp()` headings; feature/stat/tier grids → `auto-fit minmax`;
  Tx/Bets tables → horizontal scroll or card-list.

## Hard rules
- Never alter the ≥1100 rendering — fidelity must remain provably unchanged.
- Layout-only changes; no business logic, no brand restyle.

## Done when
Pixel-QA at ≥1100 is unchanged; mobile/tablet usable with no overflow or broken nav.
