# AuraWin — Decisions Index (ADRs)

Architecture Decision Records live in `docs/adr/`. Each is short: context → decision →
consequences. Status: Accepted unless noted.

| ADR | Title | Status |
|-----|-------|--------|
| [0001](adr/0001-tailwind-two-pass.md) | Styling: Tailwind CSS v4 via a two-pass port | Accepted |
| [0002](adr/0002-zustand-vs-context.md) | State: Zustand over React Context | Accepted |
| [0003](adr/0003-route-vs-screen-router.md) | Navigation: App Router routes vs in-memory screen router | Accepted |
| [0004](adr/0004-repository-seam.md) | Persistence: DataRepository seam over localStorage | Accepted |
| [0005](adr/0005-client-now-server-authoritative-later.md) | Authority: client now, server (authoritative) in Phase 2 | Accepted |
| [0006](adr/0006-fairness-demo-now-commit-reveal-phase2.md) | Fairness: "demo" now, commit-reveal provably-fair in Phase 2 | Accepted |
| [0007](adr/0007-font-preload-strategy.md) | Fonts: preload all 3 theme fonts | Accepted |

## Open questions
- Deep-research competitor findings (blocked on session limit) to inform differentiation; fold
  into PRD §10 and a possible ADR on monetization once available.
