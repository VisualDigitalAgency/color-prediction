# Glossary — AuraWin

- **Wingo** — the color-prediction game genre: bet on a color/number/size for a timed round.
- **Period / periodIdx / periodId** — a single round; `periodIdx` is the integer index used by the
  engine; `periodId` is its display id.
- **Mode** — round length in seconds: 30 / 60 / 180 / 300.
- **Result engine** — pure functions in `lib/fair/` mapping `(mode, periodIdx)` → `RoundResult`
  via FNV-1a hash. Deterministic; **demo only**, not provably fair (ADR 0006).
- **Provably fair (Phase 2)** — server seed committed (hashed) before a round + client seed +
  nonce, revealed after, so players can verify the result wasn't manipulated.
- **Settlement** — resolving pending bets when a period rolls; credits winnings, writes a win tx.
- **Sub-wallets** — main / bonus / winning / referral balances.
- **Minor-units** — integer representation of money (e.g. cents) to avoid float drift.
- **Repository seam** — the `DataRepository` interface separating the store from storage; the
  Phase-2 backend boundary.
- **`useApp()`** — selector-hook wrapper over the Zustand store preserving the prototype's `app.*`
  call shape.
- **`useNow()`** — SSR-safe hook returning 0 until mounted, then the live tick; prevents
  `Date.now()` hydration mismatches.
- **Two-pass styling** — Pass A: port to inline-style parity; Pass B: refactor to Tailwind behind
  the pixel-QA gate.
- **data-theme** — attribute on `<html>` selecting the active theme's CSS variables.
- **Themes** — neon (Neon Casino / Poppins), fintech (Premium Fintech / Manrope), cyber
  (Futuristic Cyber / Space Grotesk).
