---
name: round-verify
description: Recompute a round's result from (mode, periodIdx) using lib/fair and confirm a settled bet's win/loss. Proves engine determinism survived the port and is server-portable. (Demo fairness — not a "provably fair" proof.)
---

# round-verify

Verify the deterministic round engine and settlement.

## Inputs
- `mode` (30|60|180|300) and a `periodId`/`periodIdx`, or a `Bet` record.

## Procedure
1. Call `resultForPeriod(mode, periodIdx)` from `lib/fair`.
2. Show the derived `num`, `colors`, `big`, and per-pick payout multipliers.
3. If given a `Bet`, recompute `betWins` + payout and compare to its stored `status`/`payout`.
4. Report match/mismatch.

## Important framing
This proves **determinism**, not provable fairness. The result is computable by anyone, so this is
**not** a fraud-proof. Real provably-fair (server seed commit-reveal + client seed + nonce) is a
Phase-2 requirement (ADR 0006). Never present this skill's output as "provably fair".

## Done when
Recomputed result equals the engine's, and any provided settlement reconciles.
