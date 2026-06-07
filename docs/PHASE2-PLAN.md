# AuraWin — Phase 2 Action Plan

> **Prepared:** 2026-06-07  
> **Status:** Phase 1 complete (198 tests passing, all 12 screens ported). Phase 2 begins here.  
> **Branch convention:** one feature branch per epic, PR into `main` per milestone.

---

## Executive summary

Phase 1 delivered a pixel-perfect, fully-functional demo frontend with localStorage. Every mutation
is already async and routes through the `DataRepository` interface — the seam was designed for this
swap. Phase 2 replaces the local backend with a real one: REST API, database, OTP auth, and
server-authoritative settlement. No structural rewrites are needed on the frontend; only adapters,
new API routes, and business-logic additions.

**Hard gates before any real-money launch** (regulatory, not optional):

1. Real OTP auth (no simulated login)
2. Server-authoritative balances (client cannot self-credit)
3. Age verification (server-authoritative, not checkbox)
4. KYC/AML before first withdrawal
5. Commit-reveal or equivalent fairness (ADR 0006)
6. "Simulated" → "Real money" copy change + updated disclaimer

---

## Dependency DAG

Phase 2 has strict ordering. Steps within a milestone can be parallelised; milestones cannot.

```
M1: Infrastructure & DB schema
  └─ M2: Auth (OTP + JWT)
       └─ M3: RestRepository (replaces LocalStorageRepository)
            ├─ M4a: Server-authoritative settlement (parallel with M4b)
            ├─ M4b: Commit-reveal fairness engine  (parallel with M4a)
            └─ M5: Withdrawal & KYC integration
                 └─ M6: Observability, compliance & launch hardening
```

---

## Milestone 1 — Infrastructure & database schema

### Goal
A running API server (Next.js API routes) backed by a PostgreSQL database, with a schema that
mirrors the existing TypeScript types exactly — no shape changes at the client.

### Tech choices

| Concern | Recommendation | Reason |
|---|---|---|
| Database | **PostgreSQL 16** | Reliable, ACID, integer arithmetic for money, good ORM support |
| ORM | **Drizzle ORM** | TypeScript-first, schema = source of truth, migrations are plain SQL, zero magic |
| API layer | **Next.js Route Handlers** (`app/api/**`) | Already in the stack; no extra server needed for Phase 1→2 |
| Money column type | `integer` (minor-units) | Matches existing `lib/money.ts` invariant, no decimal precision bugs |
| Session storage | **PostgreSQL** (`sessions` table) | Keeps infra simple; Redis optional for scale-out |
| Hosting | **Neon** (serverless Postgres) or **Supabase** | Connects natively to Vercel; auto-suspend on idle |

### Schema (mirrors existing TypeScript types)

```sql
-- Users
CREATE TABLE users (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       TEXT UNIQUE,           -- OTP target
  email       TEXT UNIQUE,
  created_at  BIGINT NOT NULL,        -- unix ms
  updated_at  BIGINT NOT NULL
);

-- Sessions
CREATE TABLE sessions (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL,          -- SHA-256 of the JWT; revocable
  expires_at  BIGINT NOT NULL,
  created_at  BIGINT NOT NULL
);

-- Wallets (one row per user)
CREATE TABLE wallets (
  user_id     TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  main        INTEGER NOT NULL DEFAULT 0,       -- minor-units
  bonus       INTEGER NOT NULL DEFAULT 0,
  winning     INTEGER NOT NULL DEFAULT 0,
  referral    INTEGER NOT NULL DEFAULT 0,
  updated_at  BIGINT NOT NULL
);

-- Bets
CREATE TABLE bets (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mode        INTEGER NOT NULL,         -- 30|60|180|300
  kind        TEXT NOT NULL,            -- 'color'|'size'|'number'
  pick        TEXT NOT NULL,
  stake       INTEGER NOT NULL,         -- minor-units
  period_idx  BIGINT NOT NULL,
  period_id   TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending',   -- 'pending'|'won'|'lost'
  payout      INTEGER,                  -- null until settled; minor-units
  created_at  BIGINT NOT NULL,
  settled_at  BIGINT
);

-- Transactions
CREATE TABLE transactions (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,   -- 'bet'|'win'|'deposit'|'withdraw'|'bonus'
  method      TEXT NOT NULL,
  amt         INTEGER NOT NULL,
  dir         INTEGER NOT NULL CHECK (dir IN (-1, 1)),
  status      TEXT NOT NULL,
  created_at  BIGINT NOT NULL
);

-- Settings
CREATE TABLE settings (
  user_id         TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme           TEXT NOT NULL DEFAULT 'neon',
  reduced_motion  BOOLEAN NOT NULL DEFAULT FALSE,
  color_blind_cue BOOLEAN NOT NULL DEFAULT FALSE
);

-- VIP
CREATE TABLE vip (
  user_id    TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  vip_level  INTEGER NOT NULL DEFAULT 0,
  xp         INTEGER NOT NULL DEFAULT 0
);
```

### Deliverables

- [ ] `lib/db/schema.ts` — Drizzle schema (mirrors TypeScript types 1:1)
- [ ] `lib/db/client.ts` — Neon/pg connection singleton (SSR-safe)
- [ ] `drizzle/` migrations — initial migration from schema
- [ ] `.env.example` — `DATABASE_URL`, `JWT_SECRET`, `OTP_*` keys
- [ ] `drizzle.config.ts` — migration config
- [ ] CI: `npm run db:migrate` in GitHub Actions on deploy

**Estimated complexity:** Medium. Schema is already defined in TypeScript; Drizzle schema
is a mechanical translation.

---

## Milestone 2 — Authentication (OTP + JWT)

### Goal
Replace the simulated `AuthModal` (any input accepted) with a real OTP-based login
that issues a signed JWT session the client stores and sends on every API call.

### Flow

```
User enters phone/email
  → POST /api/auth/otp/send   { target, type }
  → OTP provider sends 6-digit code
  → User enters code
  → POST /api/auth/otp/verify { target, code }
  → Server: verify code, upsert user, create session, sign JWT
  → Response: { token, expiresAt } (httpOnly cookie preferred)
  → Client: store authed=true + user in Zustand (NOT the JWT — stays in cookie)
```

### Tech choices

| Concern | Recommendation |
|---|---|
| OTP provider | **Twilio Verify** (SMS/WhatsApp) or **Resend** (email OTP) |
| JWT library | `jose` (Web Crypto API, edge-compatible, used by NextAuth) |
| Token storage | `httpOnly` `Secure` cookie (no XSS risk vs localStorage) |
| Session revocation | `sessions` table `token_hash` — DELETE row to revoke |
| Token expiry | 7-day refresh + 15-min access token (standard pattern) |

### API routes

```
POST   /api/auth/otp/send     { target: string, type: 'sms'|'email' }
POST   /api/auth/otp/verify   { target: string, code: string }
POST   /api/auth/session/refresh
DELETE /api/auth/session       (logout)
GET    /api/auth/me            (validate session, return User)
```

### Frontend changes

- `components/auth/AuthModal.tsx` — wire to real API (same UI, different action)
- `components/shell/AgeGate.tsx` — server-authoritative check: session claim
  `ageConfirmed: true` set at OTP verification time, not client checkbox
- Route middleware (`middleware.ts`) — validate session cookie; redirect to `/` if invalid

### Deliverables

- [ ] `app/api/auth/**` — Route Handlers (send, verify, refresh, logout, me)
- [ ] `lib/auth/otp.ts` — OTP provider adapter (Twilio or Resend)
- [ ] `lib/auth/jwt.ts` — sign/verify helpers (`jose`)
- [ ] `lib/auth/session.ts` — session DB operations (create, revoke, validate)
- [ ] `middleware.ts` — session validation on `(app)` routes
- [ ] Update `AuthModal.tsx` — POST to real endpoints, handle errors
- [ ] Update `AgeGate.tsx` — read from session claim, not local checkbox
- [ ] Tests: `lib/auth/*.test.ts` (mock OTP provider)

**Estimated complexity:** Medium-high. OTP flow is standard; the seam is clean (AuthModal
already abstracts the detail). JWT/cookie plumbing is boilerplate.

---

## Milestone 3 — RestRepository (replace LocalStorageRepository)

### Goal
Implement `RestRepository` that satisfies the existing `DataRepository` interface using
real API calls. Swap it in for `LocalStorageRepository` via dependency injection — zero
changes to the store or any component.

### DataRepository interface (already exists in `types/index.ts`)

```typescript
interface DataRepository {
  loadState(): Promise<PersistedState | null>;
  saveState(s: PersistedState): Promise<void>;
  placeBet(input: PlaceBetInput): Promise<Bet>;
  createDeposit(input: DepositInput): Promise<Transaction>;
  createWithdrawal(input: WithdrawInput): Promise<Transaction>;
  listTransactions(): Promise<Transaction[]>;
  listBets(): Promise<Bet[]>;
  getSetting<K extends keyof Settings>(k: K): Promise<Settings[K] | undefined>;
  setSetting<K extends keyof Settings>(k: K, v: Settings[K]): Promise<void>;
}
```

### API routes (mirror DataRepository methods 1:1)

```
GET    /api/state                     → loadState()
POST   /api/state                     body: PersistedState → saveState()
POST   /api/bets                      body: PlaceBetInput → placeBet()
POST   /api/transactions/deposit      body: DepositInput → createDeposit()
POST   /api/transactions/withdraw     body: WithdrawInput → createWithdrawal()
GET    /api/transactions              → listTransactions()
GET    /api/bets                      → listBets()
GET    /api/settings/:key             → getSetting()
PUT    /api/settings/:key             body: value → setSetting()
```

### RestRepository implementation pattern

```typescript
export class RestRepository implements DataRepository {
  private async request<T>(path: string, opts?: RequestInit): Promise<T> {
    const res = await fetch(`/api${path}`, {
      ...opts,
      headers: { 'Content-Type': 'application/json', ...opts?.headers },
      credentials: 'include',         // sends httpOnly session cookie
    });
    if (!res.ok) throw new ApiError(res.status, await res.text());
    return res.json() as Promise<T>;
  }

  loadState() { return this.request<PersistedState | null>('/state'); }
  placeBet(input: PlaceBetInput) { return this.request<Bet>('/bets', { method: 'POST', body: JSON.stringify(input) }); }
  // ... other methods follow same pattern
}
```

### Dependency injection (swap point)

```typescript
// lib/persistence/index.ts
export function createRepository(): DataRepository {
  if (typeof window === 'undefined') return new NullRepository(); // SSR
  if (process.env.NEXT_PUBLIC_API_MODE === 'rest') return new RestRepository();
  return new LocalStorageRepository(); // Phase 1 fallback / dev
}
```

### Optimistic UI + reconciliation

This is the Phase-2 authority shift (ADR 0005). The store already fires async actions:

```
User clicks "Place Bet"
  → store.placeBet() optimistically updates UI (deduct stake)
  → RestRepository.placeBet() POSTs to server
  → Server validates balance, places bet, returns canonical Bet
  → store reconciles: replace optimistic bet with server version
  → If server rejects: rollback (re-credit stake), show toast
```

Reconciliation requires:
- `rollback` action in the store (already has the right async shape)
- Server 409/422 responses for invalid bets (insufficient balance, invalid mode)
- Client-side balance floor (never show negative; optimistic deduct capped at balance)

### Deliverables

- [ ] `lib/persistence/RestRepository.ts` — implements DataRepository
- [ ] `lib/persistence/NullRepository.ts` — no-op SSR stub
- [ ] `lib/persistence/index.ts` — updated factory (env-gated injection)
- [ ] `lib/persistence/ApiError.ts` — typed error with status + body
- [ ] `app/api/state/route.ts`
- [ ] `app/api/bets/route.ts`
- [ ] `app/api/transactions/route.ts`
- [ ] `app/api/settings/[key]/route.ts`
- [ ] Store rollback action (`lib/store/store.ts`)
- [ ] Tests: `lib/persistence/RestRepository.test.ts` (MSW mocks)

**Estimated complexity:** Medium. The interface is already defined; this is plumbing work.
The optimistic-UI reconciliation is the only non-trivial piece.

---

## Milestone 4a — Server-authoritative settlement

### Goal
Move bet settlement from the client-side `setNow()` tick to a server process. The server
becomes the source of truth for round results and payouts.

### Current flow (Phase 1 — client authoritative)

```
useNow() tick (250ms)
  → store.setNow(now)
  → for each pending bet whose period has rolled over:
       result = resultForPeriod(bet.mode, bet.periodIdx)  ← pure engine, client-side
       if betWins(bet, result): credit winning wallet, emit celebration
```

### Phase 2 flow (server authoritative)

```
useNow() tick (250ms) — UI only (timer display, period ID)

Server settlement job (runs at each period boundary):
  → Query all pending bets for the period
  → Compute result (same pure engine, now server-side)
  → Update bets.status, bets.payout
  → Credit wallets (wallets.winning += payout)
  → Write win transactions

Client reconciliation:
  → WebSocket push OR polling on period boundary
  → store.onSettlement(settledBets) reconciles client state
  → celebration emitted if any bet won
```

### Implementation options

| Option | Mechanism | Complexity | Latency |
|---|---|---|---|
| A — Polling | Client polls `/api/bets?status=pending` after each period | Low | ~1s lag |
| B — Server-Sent Events | `/api/sse/settlements` pushes settled round | Medium | <200ms |
| C — WebSocket | Bidirectional; push settlements, also used for chat/live odds | High | <50ms |

**Recommendation:** Start with **Option A (polling)** in Phase 2.0 — it's simple, requires
no new infrastructure, and the DataRepository interface already supports it. Upgrade to
Option B (SSE) in Phase 2.1 when live round feel becomes a priority.

### Settlement API route

```
GET /api/settlements?mode=30&periodIdx=N
→ Returns: { result: RoundResult, settledBets: Bet[] }
```

The server uses the same `lib/fair/engine.ts` functions (zero-dependency pure functions,
importable in any Next.js Route Handler).

### Deliverables

- [ ] Settlement cron / period-boundary trigger (Next.js cron route or Vercel Cron)
- [ ] `app/api/settlements/route.ts` — serve result + settled bets for a period
- [ ] `app/api/sse/settlements/route.ts` — optional SSE stream (Phase 2.1)
- [ ] Store: `onSettlement(bets)` action — reconcile + emit celebration
- [ ] Tests: settlement integration test (mock DB, verify wallet credit)

**Estimated complexity:** Medium. Engine is already pure and server-portable. The main
work is the cron trigger and polling/SSE wiring.

---

## Milestone 4b — Commit-reveal fairness (ADR 0006)

### Goal
Replace the demo fairness model with a cryptographically verifiable commit-reveal scheme,
so players can independently verify round results are not manipulated.

### Protocol

```
Round N opens:
  1. Server generates serverSeed_N (32 random bytes)
  2. Server publishes commitment: SHA-256(serverSeed_N) → stored in rounds table
  3. Client can optionally provide clientSeed_N (user-generated entropy)

Betting closes (T-10s before period end):
  4. Bets locked; no further picks accepted

Period boundary:
  5. Server reveals serverSeed_N
  6. Result = HMAC-SHA256(serverSeed_N + clientSeed + periodIdx) mod 10
  7. Result + serverSeed_N published; anyone can verify

UI copy changes:
  - "Fair Play (demo) / simulated rounds" → "Provably Fair / verifiable results"
  - Verification link per round: shows serverSeed, clientSeed, computed result
```

### New DB tables

```sql
CREATE TABLE rounds (
  id            TEXT PRIMARY KEY,       -- mode|periodIdx
  mode          INTEGER NOT NULL,
  period_idx    BIGINT NOT NULL,
  server_seed   TEXT,                   -- null until reveal
  commitment    TEXT NOT NULL,          -- SHA-256(serverSeed), published at round open
  client_seed   TEXT,                   -- user-supplied entropy (optional)
  result_num    INTEGER,                -- 0-9, null until settled
  settled_at    BIGINT,
  UNIQUE(mode, period_idx)
);
```

### API routes

```
GET    /api/rounds/:mode/:periodIdx/commitment   → { commitment, periodId }
GET    /api/rounds/:mode/:periodIdx/result       → { result, serverSeed, commitment }
POST   /api/rounds/:mode/:periodIdx/client-seed  body: { seed: string }
```

### UI additions

- Round history row: "Verify" button → opens modal showing commitment, seed, formula
- `/verify` page: paste `(mode, periodIdx, serverSeed)` → recompute + confirm

### Deliverables

- [ ] `lib/fair/commitReveal.ts` — server-side: `generateSeed()`, `commit()`, `reveal()`
- [ ] `lib/fair/verify.ts` — client + server: `verifyResult(serverSeed, clientSeed, periodIdx)`
- [ ] `app/api/rounds/[mode]/[periodIdx]/**` — Route Handlers for commitment, result, client seed
- [ ] `drizzle/` migration — add `rounds` table
- [ ] UI: verify button + modal in game history
- [ ] `/verify` page (unauthenticated, public)
- [ ] Update copy: "Fair Play (demo)" → "Provably Fair" (strings.ts only)
- [ ] Tests: golden-value tests for HMAC derivation (match commitment → verify cycle)

**Estimated complexity:** Medium-high. Cryptographic primitives are standard Web Crypto API.
The UI additions are small. The main work is the round lifecycle management and DB design.

---

## Milestone 5 — Withdrawal & KYC integration

### Goal
Replace the simulated withdrawal (balance deducted, tx written, nothing actually settles)
with real on-chain settlement via a crypto payment processor.

### Hard gates (non-negotiable before enabling withdrawals)

1. **KYC verification** — user must verify identity before first withdrawal
2. **Withdrawal limits** — min/max per-tx, daily limit, cooldown
3. **AML screening** — wallet address sanity check (e.g. Chainalysis, Elliptic)
4. **Fee settlement** — the 1% fee currently computed but discarded must actually settle

### Flow

```
User submits withdrawal:
  → POST /api/transactions/withdraw { amt, network, address }
  → Server: validate balance, validate address, check KYC/AML
  → Write tx (status: 'pending'), deduct wallet
  → Submit to payment processor (TRC20/BEP20/ERC20)
  → Processor webhook: confirm on-chain → update tx status to 'success' / 'failed'
  → On failure: re-credit wallet, update tx to 'failed', send notification
```

### Tech choices

| Concern | Option |
|---|---|
| Payment processor | **Fireblocks** (enterprise) / **CoinPayments** (simpler) / **NOWPayments** |
| KYC provider | **Persona** / **Jumio** / **Sumsub** |
| Address validation | Regex per network + checksum + Chainalysis OFAC screening |
| Webhook security | HMAC signature verification on processor callbacks |

### New DB additions

```sql
ALTER TABLE transactions ADD COLUMN tx_hash TEXT;           -- on-chain tx hash
ALTER TABLE transactions ADD COLUMN network_address TEXT;   -- destination address

CREATE TABLE kyc_status (
  user_id       TEXT PRIMARY KEY REFERENCES users(id),
  status        TEXT NOT NULL DEFAULT 'unverified',  -- 'unverified'|'pending'|'verified'|'rejected'
  provider_ref  TEXT,    -- KYC provider's reference ID
  verified_at   BIGINT
);
```

### Deliverables

- [ ] `lib/payments/PaymentAdapter.ts` — interface (same seam pattern as DataRepository)
- [ ] `lib/payments/NowPaymentsAdapter.ts` — concrete Phase-2 implementation
- [ ] `lib/kyc/KycAdapter.ts` — interface
- [ ] `lib/kyc/PersonaAdapter.ts` — concrete implementation
- [ ] `app/api/transactions/withdraw/route.ts` — updated with validation + processor call
- [ ] `app/api/webhooks/payments/route.ts` — HMAC-verified processor callbacks
- [ ] `app/api/kyc/route.ts` — initiate KYC session
- [ ] UI: KYC flow in Withdraw screen (locked until KYC verified)
- [ ] `drizzle/` migration — tx_hash, network_address, kyc_status table
- [ ] Tests: withdrawal integration (mock processor adapter)

**Estimated complexity:** High. The adapter seam is clean, but KYC + AML + processor
integration have significant external dependencies and compliance requirements.

---

## Milestone 6 — Observability, compliance & launch hardening

### Observability

| Concern | Tool | What to instrument |
|---|---|---|
| Application errors | **Sentry** | Next.js route handler errors, store action failures |
| API latency | **Vercel Analytics** or **Datadog** | p50/p95/p99 per route |
| Business metrics | Custom event tracking | Bets placed, deposits, withdrawals, DAU |
| DB health | **Neon monitoring** | Connection pool saturation, query latency |
| On-chain settlement | Payment processor dashboard + webhook log | Failed txs, pending backlog |

### Rate limiting

```
POST /api/bets                → 10 bets / user / minute
POST /api/auth/otp/send       → 3 OTP sends / phone / 10 minutes
POST /api/transactions/withdraw → 5 withdrawals / user / 24 hours
```

Use Vercel Edge Middleware + `@upstash/ratelimit` (Redis-backed, edge-compatible).

### Security hardening checklist

- [ ] All API routes validate session cookie before any DB operation
- [ ] Wallet mutations are database transactions (ACID — no partial credits)
- [ ] Bet placement: server validates `stake ≤ wallet.main` before deducting
- [ ] No client-supplied `userId` accepted in request bodies (always from JWT)
- [ ] CORS: only allow `aurawin.com` origin on API routes
- [ ] CSP headers: strict (no unsafe-inline outside Tailwind's hash)
- [ ] Withdrawal addresses: regex + checksum + OFAC screening before processing
- [ ] Webhook endpoints: verify HMAC signature, reject replays (nonce or timestamp window)

### Compliance checklist

- [ ] "Simulated, no real money" disclaimer → removed / replaced with real-money disclaimer
- [ ] Responsible gambling: session time limits, self-exclusion option, spend limits
- [ ] Privacy policy + Terms of Service (real-money version)
- [ ] Jurisdiction check: block IPs from restricted regions on API + frontend
- [ ] Audit log: all wallet mutations logged to append-only table with actor + IP
- [ ] Data retention: PII deletion on account close (GDPR Article 17)

### Launch readiness gate

| Gate | Owner | Status |
|---|---|---|
| All 6 Phase-2 milestones complete | Engineering | - |
| Penetration test passed | Security | - |
| KYC provider live | Product | - |
| Payment processor live + tested | Payments | - |
| Legal review of T&C + disclaimer | Legal | - |
| Jurisdiction block list verified | Compliance | - |
| Load test: 1000 concurrent bets | Engineering | - |
| Playwright golden snapshots updated | QA | - |
| Responsible gambling controls live | Product | - |
| On-call runbook published | Engineering | - |

---

## What does NOT change in Phase 2

The following Phase-1 artifacts carry forward unchanged:

| Artifact | Why it carries forward |
|---|---|
| All 12 screen components | Pixel-perfect; no structural changes needed |
| `lib/fair/engine.ts` | Pure functions, already server-portable; just import in API routes |
| `lib/money.ts` | Integer minor-units enforced everywhere; column types match |
| `lib/theme/` | Theme system is pure CSS-variable, no backend dependency |
| `types/index.ts` | Schema is the contract; DB columns mirror these types |
| `components/primitives/` | UI primitives are backend-agnostic |
| Tailwind v4 tokens | `app/globals.css` unchanged |
| 198 unit tests | All pass; add Phase-2 integration tests on top |
| `DataRepository` interface | The seam was built for this; only the implementation swaps |

---

## Phase 2 team / agent routing

Using the CTO agent's routing table for Phase 2 tasks:

| Epic | Agents |
|---|---|
| M1: DB schema | `types-agent` (schema mirrors) → `store-agent` (new slices) |
| M2: Auth | `claude` general (API routes) → `screen-porter` (AuthModal update) |
| M3: RestRepository | `store-agent` (rollback action) → `claude` (RestRepository, API routes) |
| M4a: Settlement | `engine-agent` (server-side engine) → `claude` (cron + API routes) |
| M4b: Commit-reveal | `engine-agent` (commitReveal.ts) → `screen-porter` (verify UI) |
| M5: Withdrawal/KYC | `claude` (payment/KYC adapters + API routes) → `screen-porter` (Withdraw screen KYC gate) |
| M6: Hardening | `claude` (rate limiting, CSP, observability wiring) |

---

## Estimated effort

| Milestone | Complexity | Engineering weeks (solo) |
|---|---|---|
| M1: Infrastructure & DB | Medium | 1 |
| M2: Auth (OTP + JWT) | Medium-high | 1.5 |
| M3: RestRepository | Medium | 1 |
| M4a: Server settlement | Medium | 1 |
| M4b: Commit-reveal | Medium-high | 1.5 |
| M5: Withdrawal + KYC | High | 3 |
| M6: Hardening & launch | Medium | 1.5 |
| **Total** | | **~10.5 weeks** |

Parallel M4a + M4b reduces wall-clock time by ~1 week. M5 depends on external provider
onboarding time (KYC/payment processors typically take 2–4 weeks for account approval).

---

## Immediate next actions

1. **Decide hosting** — Vercel + Neon (recommended) vs self-hosted Postgres
2. **Provision accounts** — OTP provider, payment processor, KYC provider (start now; approval takes weeks)
3. **Start M1** — DB schema in Drizzle, first migration, connection wired in dev
4. **Update `process.md`** — add Phase 2 milestone rows
5. **Open Phase 2 branch** — `feat/phase2-infrastructure`
