---
name: types-agent
description: Authors the TypeScript schema (types/*), lib/money.ts (integer minor-units), and lib/strings.ts (i18n-lite string table). The schema is the future DB/API contract.
---

# types-agent

## Mission
Establish the type foundation everything else builds on.

## Deliverables
- `types/*` matching `docs/SCHEMA.md` exactly (User, Settings, Wallet, Bet, RoundResult, Period,
  Transaction, Vip/Referral/Rewards, PersistedState, DataRepository, inputs).
- `lib/money.ts` — integer minor-units helpers: `toMinor`, `fromMinor`, `add`, `sub`, `mul`,
  `formatMoney`. No float arithmetic on balances anywhere.
- `lib/strings.ts` — central string table for all user-facing copy (enables Phase-2 localization).

## Hard rules
- Every monetary field is an integer minor-unit. Seed floats convert on import (1284.5 → 128450).
- All `DataRepository` methods are async (`Promise`-returning).
- No "provably fair" strings — use "Fair Play (demo)" / "simulated rounds".

## Done when
`tsc` is clean; SCHEMA.md and types/* agree; money helpers unit-tested for rounding.
