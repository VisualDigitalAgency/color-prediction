# ADR 0005 — Authority: client now, server-authoritative in Phase 2

## Status
Accepted

## Context
In Phase 1 the client computes results, settles bets, and mutates balances. In Phase 2 the server
must be authoritative over money and outcomes (anti-cheat, integrity). Naively, that transition
changes every mutation signature and introduces optimistic-UI/rollback work late.

## Decision
Treat the **authority boundary**, not just persistence, as the real Phase boundary. In Phase 1:
- The client is authoritative, but **all wallet/outcome mutations are async now** (`placeBet`,
  `deposit`, `withdraw`, `claim*`) and route through reversible repository methods.
- The store applies mutations as if they could be confirmed/rejected later.

In Phase 2 the server becomes authoritative; the same async methods call REST endpoints and the
client reconciles (confirm/rollback) without signature changes.

## Consequences
- No signature churn at the Phase boundary; optimistic-update seam exists from day one.
- Slightly more ceremony in Phase 1 (async + reversible) for a much cheaper Phase 2.
