# ADR 0006 — Fairness: "demo" now, commit-reveal provably-fair in Phase 2

## Status
Accepted

## Context
The result engine is a deterministic FNV-1a hash of `mode|periodIdx` computed **client-side**.
This is reproducible but **NOT provably fair**: there is no secret server seed and no
commit-reveal, so any client can compute all future results. Labeling it "provably fair" would be
a materially false claim — a serious trust/legal risk for a betting-style product.

## Decision
- **Phase 1:** keep the deterministic engine for the simulated demo, but **never** call it
  "provably fair." UI copy: **"Fair Play (demo) / simulated rounds."** The verification skill is
  named `round-verify` (not `pf-verify`) and only asserts determinism.
- **Phase 2 (hard gate):** implement real provably-fair — server generates `serverSeed`, publishes
  its hash (commitment) **before** the round; combine with a `clientSeed` + incrementing `nonce`;
  reveal `serverSeed` after settlement so players can verify. The engine already lives behind a
  pure-function/repository seam to accept server inputs.

## Consequences
- Honest Phase-1 framing; no false fairness claims.
- Clear, scoped Phase-2 requirement with the seam already in place.
