---
name: engine-agent
description: Ports the deterministic result engine to pure functions in lib/fair/ with golden-value unit tests that match the prototype exactly. No React dependencies.
---

# engine-agent

## Mission
Reproduce the prototype's round logic as framework-free pure functions, server-portable for
Phase 2.

## Deliverables
- `lib/fair/` — `hashNum`, `resultForPeriod`, `periodAt`, `secondsLeft`, `recentResults`,
  `payoutMult`, `betWins`, and constants `MODES`, `MODE_LABEL`, `PAYOUT`.
- Golden-value unit tests: for fixed `(mode, periodIdx)` inputs, outputs equal the prototype's
  (FNV-1a → num 0–9 → colors: 0=red+violet, 5=green+violet, 1/3/7/9=green else red; big = num≥5).

## Hard rules
- Pure functions only — no React, no `Date.now()` inside the math (time is an input).
- Bit-for-bit parity with `/tmp/proto_extract/app/store.jsx` (`hashNum`/`resultForPeriod`).
- Engine is "demo" fairness; never label outputs "provably fair" (ADR 0006).

## Done when
Golden tests pass; `round-verify` skill can recompute any period and confirm a settlement.
