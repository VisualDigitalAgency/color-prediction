# AuraWin — Phase 2 Action Plan

> **Prepared:** 2026-06-07  
> **Updated:** 2026-06-07 — Backend stack locked: **Supabase** (PostgreSQL + Auth)  
> **Status:** Phase 1 complete (198 tests passing, all 12 screens ported). Phase 2 begins here.  
> **Branch convention:** one feature branch per epic, PR into `main` per milestone.

---

## Executive summary

Phase 1 delivered a pixel-perfect, fully-functional demo frontend with localStorage. Every mutation
is already async and routes through the `DataRepository` interface — the seam was designed for this
swap. Phase 2 replaces the local backend with Supabase: managed PostgreSQL, built-in OTP auth,
Row-Level Security (RLS), and Realtime push — all under one platform, no custom auth plumbing.

**Supabase advantages for this project:**
- OTP auth (phone SMS + email magic link) is built-in — no Twilio/Resend integration needed
- JWT sessions managed automatically by `@supabase/ssr` in Next.js App Router
- Row-Level Security enforces `auth.uid() = user_id` at the DB layer — no hand-rolled guards
- Realtime subscriptions replace the SSE/polling option for settlement push
- Storage bucket for KYC document uploads (avoids a separate S3 setup)
- Supabase Edge Functions for cron-based settlement (runs on Deno, serverless)

**Hard gates before any real-money launch** (regulatory, not optional):

1. Real OTP auth (no simulated login)
2. Server-authoritative balances (client cannot self-credit)
3. Age verification (server-authoritative, not checkbox)
4. KYC/AML before first withdrawal
5. Commit-reveal or equivalent fairness (ADR 0006)
6. "Simulated" → "Real money" copy change + updated disclaimer

---

## Dependency DAG

M1 + M2 now collapse into one milestone because Supabase provides both DB and Auth together.

```
M1: Supabase project + DB schema + Auth (OTP)
     └─ M2: SupabaseRepository (replaces LocalStorageRepository)
          ├─ M3a: Server-authoritative settlement + Realtime push  (parallel with M3b)
          ├─ M3b: Commit-reveal fairness engine                    (parallel with M3a)
          └─ M4: Withdrawal & KYC integration
               └─ M5: Observability, compliance & launch hardening
```

---

## Milestone 1 — Supabase project, DB schema & Auth

### Goal
Provision a Supabase project, mirror the existing TypeScript types into a PostgreSQL schema,
enable OTP auth (phone + email), and wire `@supabase/ssr` into the Next.js App Router so
every route has a verified session.

### Tech stack (locked)

| Concern | Tool | Notes |
|---|---|---|
| Database | **Supabase PostgreSQL** | Managed, auto-backups, connection pooling via Supavisor |
| ORM / migrations | **Drizzle ORM** | TypeScript-first; migrations are plain SQL; works alongside Supabase native migrations |
| Auth | **Supabase Auth** | Phone OTP (SMS via Supabase's Twilio integration) + email magic link — zero custom code |
| Session management | **`@supabase/ssr`** | Handles cookie-based sessions in Next.js App Router (server + client components) |
| Authorization | **Row-Level Security (RLS)** | `auth.uid() = user_id` policies; no hand-rolled guards in API routes |
| Hosting | **Vercel + Supabase** | Vercel for Next.js; Supabase for all backend services |
| Money columns | `integer` (minor-units) | Matches `lib/money.ts` invariant exactly; no DECIMAL precision bugs |

### Schema (mirrors existing TypeScript types)

```sql
-- Users (managed by Supabase Auth — extends auth.users)
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone       TEXT,
  created_at  BIGINT NOT NULL
);

-- Wallets (one row per user)
CREATE TABLE public.wallets (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  main        INTEGER NOT NULL DEFAULT 128450,   -- minor-units; seed = 1284.50 USDT
  bonus       INTEGER NOT NULL DEFAULT 3600,
  winning     INTEGER NOT NULL DEFAULT 41275,
  referral    INTEGER NOT NULL DEFAULT 8820,
  updated_at  BIGINT NOT NULL DEFAULT extract(epoch FROM now()) * 1000
);

-- Bets
CREATE TABLE public.bets (
  id          TEXT PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode        INTEGER NOT NULL,           -- 30|60|180|300
  kind        TEXT NOT NULL,             -- 'color'|'size'|'number'
  pick        TEXT NOT NULL,
  stake       INTEGER NOT NULL,          -- minor-units
  period_idx  BIGINT NOT NULL,
  period_id   TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending',   -- 'pending'|'won'|'lost'
  payout      INTEGER,                   -- null until settled
  created_at  BIGINT NOT NULL,
  settled_at  BIGINT
);

-- Transactions
CREATE TABLE public.transactions (
  id          TEXT PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,   -- 'bet'|'win'|'deposit'|'withdraw'|'bonus'
  method      TEXT NOT NULL,
  amt         INTEGER NOT NULL,
  dir         INTEGER NOT NULL CHECK (dir IN (-1, 1)),
  status      TEXT NOT NULL,
  tx_hash     TEXT,            -- on-chain hash (withdrawals only)
  created_at  BIGINT NOT NULL
);

-- Settings
CREATE TABLE public.settings (
  user_id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme            TEXT NOT NULL DEFAULT 'neon',
  reduced_motion   BOOLEAN NOT NULL DEFAULT FALSE,
  color_blind_cue  BOOLEAN NOT NULL DEFAULT FALSE,
  age_confirmed    BOOLEAN NOT NULL DEFAULT FALSE
);

-- VIP
CREATE TABLE public.vip (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  vip_level  INTEGER NOT NULL DEFAULT 0,
  xp         INTEGER NOT NULL DEFAULT 0
);
```

### Row-Level Security policies

```sql
-- Enable RLS on all tables
ALTER TABLE public.wallets     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bets        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip         ENABLE ROW LEVEL SECURITY;

-- Users can only see and modify their own rows
CREATE POLICY "own rows only" ON public.wallets     USING (auth.uid() = user_id);
CREATE POLICY "own rows only" ON public.bets        USING (auth.uid() = user_id);
CREATE POLICY "own rows only" ON public.transactions USING (auth.uid() = user_id);
CREATE POLICY "own rows only" ON public.settings    USING (auth.uid() = user_id);
CREATE POLICY "own rows only" ON public.vip         USING (auth.uid() = user_id);

-- Wallet mutations must go through server-side functions (service role only)
CREATE POLICY "server writes only" ON public.wallets FOR UPDATE
  USING (auth.role() = 'service_role');
```

### Supabase Auth setup

```
Supabase Dashboard → Authentication → Providers:
  ✅ Phone (SMS OTP via Supabase's built-in Twilio connection)
  ✅ Email (magic link / OTP)

OTP flow (replaces simulated AuthModal):
  1. User enters phone/email → supabase.auth.signInWithOtp({ phone })
  2. Supabase sends 6-digit code
  3. User enters code → supabase.auth.verifyOtp({ phone, token, type: 'sms' })
  4. Session cookie set automatically by @supabase/ssr
  5. AuthModal reads auth.user → sets authed=true in Zustand store
```

### Next.js wiring (`@supabase/ssr`)

```typescript
// lib/supabase/server.ts — for Server Components, Route Handlers, middleware
import { createServerClient } from '@supabase/ssr';
export function createSupabaseServer() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { /* Next.js cookies() adapter */ } }
  );
}

// lib/supabase/client.ts — for Client Components
import { createBrowserClient } from '@supabase/ssr';
export function createSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// middleware.ts — session refresh on every request
export async function middleware(req: NextRequest) {
  const supabase = createSupabaseServer();
  await supabase.auth.getUser();  // refreshes cookie if needed
  // redirect to '/' if no valid session and route is in (app)/
}
```

### Age-gate update
Set `age_confirmed = true` in `public.settings` at OTP verification time (server-side).
`AgeGate.tsx` reads from the Supabase session claim — no client checkbox bypasses this.

### Deliverables

- [ ] Supabase project provisioned (production + dev environments)
- [ ] `lib/db/schema.ts` — Drizzle schema mirroring types above
- [ ] `drizzle/` migrations — initial migration + RLS policies
- [ ] `lib/supabase/server.ts` + `lib/supabase/client.ts` — SSR-safe client factories
- [ ] `middleware.ts` — session refresh + auth guard for `(app)/` routes
- [ ] `.env.example` — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `components/auth/AuthModal.tsx` — wire to `supabase.auth.signInWithOtp()` / `verifyOtp()`
- [ ] `components/shell/AgeGate.tsx` — read from session; set in settings table on first confirm
- [ ] Tests: auth flow mocked with `@supabase/supabase-js` mock client

**Estimated complexity:** Medium. Supabase handles the hard parts (OTP, JWT, session refresh). The
wiring is mostly plumbing: schema + RLS + client factories + updating AuthModal.

---

## Milestone 2 — SupabaseRepository (replaces LocalStorageRepository)

### Goal
Implement `SupabaseRepository` that satisfies the existing `DataRepository` interface using the
Supabase client. Swap it in via the factory function — zero changes to the store or any component.

### Architecture: two-tier approach

Simple reads (wallet balance, settings, bet history) go **directly from the client to Supabase**
via RLS-protected queries. Complex mutations (place bet, withdraw) go through **Next.js API routes**
which use the service-role key to bypass RLS and apply business logic atomically.

```
Simple reads:    Client → Supabase (anon key, RLS enforced)
Complex writes:  Client → Next.js API Route → Supabase (service role, atomic tx)
```

### SupabaseRepository implementation pattern

```typescript
// lib/persistence/SupabaseRepository.ts
export class SupabaseRepository implements DataRepository {
  constructor(private supabase: SupabaseClient) {}

  async loadState(): Promise<PersistedState | null> {
    const userId = (await this.supabase.auth.getUser()).data.user?.id;
    if (!userId) return null;

    const [wallet, bets, tx, settings, vip] = await Promise.all([
      this.supabase.from('wallets').select('*').eq('user_id', userId).single(),
      this.supabase.from('bets').select('*').order('created_at', { ascending: false }).limit(100),
      this.supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(200),
      this.supabase.from('settings').select('*').eq('user_id', userId).single(),
      this.supabase.from('vip').select('*').eq('user_id', userId).single(),
    ]);

    return buildPersistedState({ wallet, bets, tx, settings, vip });
  }

  // Bet placement → API route (validates balance + atomicity server-side)
  async placeBet(input: PlaceBetInput): Promise<Bet> {
    const res = await fetch('/api/bets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      credentials: 'include',
    });
    if (!res.ok) throw new ApiError(res.status, await res.text());
    return res.json();
  }

  // Settings → direct Supabase upsert (RLS-safe, no business logic)
  async setSetting<K extends keyof Settings>(k: K, v: Settings[K]): Promise<void> {
    await this.supabase
      .from('settings')
      .upsert({ user_id: (await this.supabase.auth.getUser()).data.user!.id, [k]: v });
  }

  // ... other methods follow same two-tier pattern
}
```

### Dependency injection (swap point — no store changes needed)

```typescript
// lib/persistence/index.ts
export function createRepository(supabase?: SupabaseClient): DataRepository {
  if (typeof window === 'undefined') return new NullRepository();
  if (supabase) return new SupabaseRepository(supabase);
  return new LocalStorageRepository();  // dev fallback / Phase-1 mode
}
```

### Optimistic UI + reconciliation (ADR 0005 Phase 2)

```
User clicks "Place Bet"
  → store.placeBet(): optimistically deduct stake, add pending bet to UI
  → SupabaseRepository.placeBet(): POST /api/bets
  → API route: validate balance (service role read) → insert bet → deduct wallet (atomic tx)
  → Returns canonical Bet object
  → store reconciles: replace optimistic bet with server version
  → If 409 (insufficient balance) or 422 (invalid input): rollback + toast
```

### API routes (for complex mutations only)

```
POST  /api/bets                     → placeBet() — validates balance, inserts bet + debit tx atomically
POST  /api/transactions/deposit     → createDeposit() — credits main wallet
POST  /api/transactions/withdraw    → createWithdrawal() — validates KYC, calls payment processor
```

### Deliverables

- [ ] `lib/persistence/SupabaseRepository.ts` — implements DataRepository
- [ ] `lib/persistence/NullRepository.ts` — SSR stub (no-op, server render)
- [ ] `lib/persistence/ApiError.ts` — typed error (status + body)
- [ ] `lib/persistence/index.ts` — updated factory (Supabase injection)
- [ ] `app/api/bets/route.ts` — place bet, atomic balance deduction
- [ ] `app/api/transactions/deposit/route.ts`
- [ ] `app/api/transactions/withdraw/route.ts` (placeholder; KYC gate added in M4)
- [ ] Store: `rollback(betId)` action for failed placements
- [ ] Tests: `SupabaseRepository.test.ts` (mock `@supabase/supabase-js`)
- [ ] Tests: API routes with mock service-role client

**Estimated complexity:** Medium. The interface exists; this is plumbing + Supabase client wiring.

---

## Milestone 3a — Server-authoritative settlement + Realtime push

### Goal
Move bet settlement from the client-side 250ms tick to a Supabase Edge Function (cron).
Results are pushed to connected clients via **Supabase Realtime** — no polling needed.

### Settlement flow

```
Supabase Edge Function (cron — runs at each period boundary for each mode):
  1. SELECT pending bets WHERE period_idx < current_period_idx
  2. Compute result: resultForPeriod(mode, periodIdx)  ← same lib/fair/engine.ts (Deno-compatible)
  3. UPDATE bets SET status, payout, settled_at
  4. UPDATE wallets.winning += payout  (atomic, service role)
  5. INSERT win transactions
  6. Supabase Realtime broadcasts the change automatically (bets table subscription)

Client (store):
  supabase.channel('bets')
    .on('postgres_changes', { event: 'UPDATE', table: 'bets' }, (payload) => {
      store.onSettlement(payload.new as Bet);  // reconcile + emit celebration if won
    })
    .subscribe();
```

### lib/fair/engine.ts in Deno (Edge Function)
The engine is already zero-dependency pure TypeScript — no changes needed. Import directly:

```typescript
// supabase/functions/settle-period/index.ts
import { resultForPeriod, betWins, payoutMult } from '../../lib/fair/engine.ts';
```

Supabase Edge Functions run Deno, which handles TypeScript natively and can import local files.

### Cron configuration

```toml
# supabase/functions/settle-period/cron.toml
[cron]
schedule = "* * * * *"   # every minute — handles 60s, 180s, 300s modes
# 30s mode needs more granularity; use pg_cron at 30s intervals
```

For 30-second mode: use `pg_cron` extension (available in Supabase) to run every 30 seconds.

### Store additions

```typescript
// Realtime subscription (set up in useApp or store hydration)
const onSettlement = (bet: Bet) => {
  // Update bet status in store
  // If won: emit celebration, credit winning wallet display
  // store already has the shape for this — just needs the reconcile path
};
```

### Deliverables

- [ ] `supabase/functions/settle-period/index.ts` — Edge Function (Deno, TypeScript)
- [ ] `supabase/functions/settle-period/cron.toml` — cron schedule
- [ ] `lib/db/settlement.ts` — settlement query helpers (used by Edge Function)
- [ ] Store: `onSettlement(bet)` action + Realtime channel setup in `hydration.ts`
- [ ] DB: `rounds` table (period result cache — avoids recomputing for every late subscriber)
- [ ] Tests: Edge Function integration test (mock Supabase DB client)

**Estimated complexity:** Medium. Engine is server-portable already. Supabase Realtime is
near-zero config for table change subscriptions.

---

## Milestone 3b — Commit-reveal fairness (ADR 0006)

### Goal
Replace the demo fairness model with a verifiable commit-reveal scheme per ADR 0006.
Players can independently verify results; UI copy changes from "(demo)" to "Provably Fair".

### Protocol

```
Round N opens (T seconds before period end):
  1. Edge Function generates: serverSeed_N = crypto.getRandomValues(32 bytes)
  2. Publishes commitment: commitment_N = SHA-256(serverSeed_N) → stored in rounds table
  3. Client reads commitment_N and optionally submits clientSeed_N

Betting closes (T-10s before period end):
  4. No further bets accepted

Period boundary (settlement):
  5. Server reveals serverSeed_N
  6. result_num = HMAC-SHA256(serverSeed_N || clientSeed_N || periodIdx) % 10
  7. rounds table updated with serverSeed + result; anyone can verify

UI:
  - Game history row shows "Verify" button → modal with commitment, seed, formula
  - /verify page (public, unauthenticated): enter (mode, periodIdx) → recompute + confirm
```

### New DB table

```sql
CREATE TABLE public.rounds (
  id           TEXT PRIMARY KEY,    -- '{mode}|{periodIdx}'
  mode         INTEGER NOT NULL,
  period_idx   BIGINT NOT NULL,
  commitment   TEXT NOT NULL,       -- SHA-256(serverSeed), published at round open
  server_seed  TEXT,                -- null until reveal
  client_seed  TEXT,                -- user-supplied entropy (optional)
  result_num   INTEGER,             -- 0-9, null until settled
  settled_at   BIGINT,
  UNIQUE (mode, period_idx)
);

ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read" ON public.rounds FOR SELECT USING (true);  -- anyone can verify
```

### New code

```typescript
// lib/fair/commitReveal.ts
export function generateServerSeed(): string        // 32 random bytes → hex
export function commit(serverSeed: string): string  // SHA-256 → hex commitment
export function reveal(serverSeed: string, clientSeed: string, periodIdx: number): number
// HMAC-SHA256(serverSeed || clientSeed || periodIdx) % 10

// lib/fair/verify.ts (client-side — runs on /verify page)
export function verifyResult(serverSeed: string, commitment: string, clientSeed: string, periodIdx: number, claimedNum: number): boolean
```

### UI additions

- Game history row: "Verify" chip → opens modal showing commitment, seed, formula
- `/verify` public page: paste any `(mode, periodIdx)` → recompute result → green/red confirmation
- `lib/strings.ts` copy change: `"Fair Play (demo)"` → `"Provably Fair"` (two string keys updated)

### Deliverables

- [ ] `lib/fair/commitReveal.ts` — server-side: generateServerSeed, commit, reveal
- [ ] `lib/fair/verify.ts` — client-side: verifyResult (Web Crypto API)
- [ ] `lib/fair/commitReveal.test.ts` — golden-value tests: commitment → reveal → verify cycle
- [ ] `supabase/functions/open-round/index.ts` — Edge Function: generates + stores commitment at period open
- [ ] DB migration: `rounds` table + RLS
- [ ] `app/api/rounds/[mode]/[periodIdx]/client-seed/route.ts` — accept user entropy
- [ ] Game history: Verify modal (`components/game/VerifyModal.tsx`)
- [ ] `app/verify/page.tsx` — public verification page (unauthed)
- [ ] `lib/strings.ts` — update fairness copy keys

**Estimated complexity:** Medium-high. Web Crypto API is standard. The lifecycle coordination
(open-round Edge Function + settlement update) is the main complexity.

---

## Milestone 4 — Withdrawal & KYC integration

### Goal
Replace the simulated withdrawal (balance deducted locally, nothing settles) with real on-chain
settlement. KYC must be verified before any withdrawal is processed.

### Hard gates (non-negotiable before enabling withdrawals)

1. KYC verification completed (identity document + selfie)
2. Wallet address passes regex + checksum + OFAC screening
3. Withdrawal within limits (min, max, daily cap, cooldown)
4. 1% fee actually deducted and routed to operator account

### Flow

```
User submits withdrawal → POST /api/transactions/withdraw
  Server (service role):
    1. Check KYC status = 'verified' → 403 if not
    2. Validate amount ≤ wallet.main - daily_withdrawn
    3. Validate address format + checksum
    4. OFAC screening (Chainalysis or Elliptic API)
    5. BEGIN transaction:
         UPDATE wallets SET main = main - amt WHERE user_id = $uid
         INSERT transactions (status: 'pending')
       COMMIT
    6. Submit to payment processor → get tx_id
    7. UPDATE transactions SET tx_hash = tx_id

Payment processor webhook → POST /api/webhooks/payments
  Server verifies HMAC signature
  On success: UPDATE transactions SET status = 'success'
  On failure: BEGIN tx → re-credit wallet → UPDATE status = 'failed' → COMMIT
              → push notification to client via Realtime
```

### Tech choices

| Concern | Recommendation | Notes |
|---|---|---|
| Payment processor | **NOWPayments** | Simple API, supports TRC20/BEP20/ERC20, webhooks |
| KYC provider | **Sumsub** | Widely used for crypto, good SDKs, webhook-based |
| Address validation | Regex + checksum (`ethers.utils.isAddress` / `tronweb`) | Per-network |
| OFAC screening | **Chainalysis** (API) | Free tier available for basic screening |
| KYC doc storage | **Supabase Storage** (private bucket) | Zero extra infra; RLS-protected |

### New DB additions

```sql
CREATE TABLE public.kyc_status (
  user_id       UUID PRIMARY KEY REFERENCES auth.users(id),
  status        TEXT NOT NULL DEFAULT 'unverified',  -- 'unverified'|'pending'|'verified'|'rejected'
  provider_ref  TEXT,    -- Sumsub applicantId
  verified_at   BIGINT
);

ALTER TABLE public.kyc_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own row" ON public.kyc_status USING (auth.uid() = user_id);
```

### Deliverables

- [ ] `lib/payments/PaymentAdapter.ts` — interface (same seam pattern as DataRepository)
- [ ] `lib/payments/NowPaymentsAdapter.ts` — NOWPayments REST client
- [ ] `lib/kyc/KycAdapter.ts` — interface
- [ ] `lib/kyc/SumsubAdapter.ts` — Sumsub SDK wrapper
- [ ] `app/api/transactions/withdraw/route.ts` — full validation + processor call
- [ ] `app/api/webhooks/payments/route.ts` — HMAC-verified; re-credit on failure
- [ ] `app/api/kyc/route.ts` — initiate Sumsub session → return SDK token
- [ ] DB migration: `kyc_status` table + Supabase Storage KYC bucket
- [ ] Withdraw screen: KYC gate UI (locked with "Verify identity" CTA until verified)
- [ ] Realtime: push withdrawal status updates to client

**Estimated complexity:** High — external provider onboarding takes 2–4 weeks. Start account
applications for NOWPayments + Sumsub immediately; engineering can proceed in parallel.

---

## Milestone 5 — Observability, compliance & launch hardening

### Observability

| Concern | Tool | What to instrument |
|---|---|---|
| Application errors | **Sentry** (Next.js SDK) | Route handler errors, store action failures, Realtime disconnects |
| API latency | **Vercel Analytics** | p50/p95/p99 per route |
| Business metrics | **Supabase Dashboard** | Bet volume, deposit/withdrawal funnel, DAU |
| DB health | **Supabase Dashboard** | Query latency, connection pool saturation |
| Settlement lag | Custom metric | Time from period end → bets settled (target < 5s) |
| On-chain settlement | Payment processor dashboard | Failed txs, pending backlog |

### Rate limiting

Use Vercel Edge Middleware + **`@upstash/ratelimit`** (Redis-backed, edge-compatible):

```
POST /api/bets                        → 10 bets / user / minute
POST /api/auth/* (OTP send)           → 3 requests / phone / 10 minutes  (Supabase enforces this natively)
POST /api/transactions/withdraw       → 5 withdrawals / user / 24 hours
POST /api/kyc                         → 3 sessions / user / day
```

### Security hardening checklist

- [ ] All API routes: validate Supabase session before any DB operation (use `createSupabaseServer()`)
- [ ] Wallet mutations via service-role only (RLS policy; anon key cannot UPDATE wallets)
- [ ] Bet placement: server validates `stake ≤ wallet.main` inside DB transaction (no race)
- [ ] No client-supplied `userId` in request bodies — always from `supabase.auth.getUser()`
- [ ] Webhook endpoints: verify HMAC signature + reject replays (timestamp window ±5 min)
- [ ] CSP headers: strict (no unsafe-inline; Tailwind CSS hash)
- [ ] CORS: only `aurawin.com` allowed on API routes
- [ ] Withdrawal addresses: regex + checksum + OFAC before processor call

### Compliance checklist

- [ ] "Simulated, no real money" disclaimer → real-money disclaimer + T&C link
- [ ] Responsible gambling: session time warnings, self-exclusion, spend limits
- [ ] Jurisdiction block: IP check on middleware + API (OFAC sanctioned countries)
- [ ] Audit log: all wallet mutations to append-only table (`actor_id`, `ip`, `ts`, `delta`)
- [ ] GDPR: account deletion flow (DELETE from all tables; Supabase cascade handles FK)
- [ ] Privacy policy + T&C (real-money version, reviewed by legal)

### Launch readiness gate

| Gate | Owner |
|---|---|
| All 5 Phase-2 milestones complete | Engineering |
| Penetration test passed | Security |
| KYC provider live + tested end-to-end | Product |
| Payment processor live + withdrawal tested | Payments |
| Legal review of T&C + real-money disclaimer | Legal |
| Jurisdiction block list verified | Compliance |
| Load test: 1000 concurrent bets | Engineering |
| Playwright golden snapshots captured (`npm run test:e2e:update`) | QA |
| Responsible gambling controls live | Product |
| Supabase backups + PITR verified | Engineering |
| On-call runbook published | Engineering |

---

## What does NOT change in Phase 2

| Artifact | Why it carries forward |
|---|---|
| All 12 screen components | Pixel-perfect; no structural changes needed |
| `lib/fair/engine.ts` | Pure functions; zero-dependency; Deno-compatible for Edge Functions |
| `lib/money.ts` | Integer minor-units match DB column types (`integer`) exactly |
| `lib/theme/` | Pure CSS-variable system; no backend dependency |
| `types/index.ts` | Schema is the contract; DB mirrors these types |
| `components/primitives/` | Backend-agnostic |
| `app/globals.css` | Tailwind v4 tokens unchanged |
| 198 unit tests | All pass; Phase-2 adds integration tests on top |
| `DataRepository` interface | Only the implementation swaps — store unchanged |

---

## Phase 2 agent routing (CTO agent table)

| Milestone | Agents |
|---|---|
| M1: Supabase + DB + Auth | `types-agent` (schema types) → `claude` (Drizzle schema, RLS, auth wiring) → `screen-porter` (AuthModal update) |
| M2: SupabaseRepository | `store-agent` (rollback action) → `claude` (SupabaseRepository, API routes) |
| M3a: Settlement + Realtime | `engine-agent` (Edge Function port) → `store-agent` (onSettlement action) → `claude` (cron, Realtime channel) |
| M3b: Commit-reveal | `engine-agent` (commitReveal.ts, verify.ts) → `screen-porter` (VerifyModal + /verify page) |
| M4: Withdrawal + KYC | `claude` (payment/KYC adapters, API routes) → `screen-porter` (Withdraw screen KYC gate) |
| M5: Hardening | `claude` (rate limiting, CSP, audit log, observability wiring) |

---

## Estimated effort

| Milestone | Complexity | Engineering weeks (solo) |
|---|---|---|
| M1: Supabase + DB + Auth | Medium | 1.5 |
| M2: SupabaseRepository | Medium | 1 |
| M3a: Server settlement + Realtime | Medium | 1 |
| M3b: Commit-reveal | Medium-high | 1.5 |
| M4: Withdrawal + KYC | High | 3 |
| M5: Hardening & launch | Medium | 1.5 |
| **Total** | | **~9.5 weeks** |

M3a + M3b in parallel saves ~1 week. M4 depends on external provider onboarding (2–4 weeks
for account approval — start today).

---

## Immediate next actions

1. **Create Supabase project** — production + dev environments at supabase.com
2. **Apply for payment processor + KYC accounts** — NOWPayments + Sumsub (approval takes weeks)
3. **Add env vars to Vercel** — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
4. **Install packages** — `@supabase/ssr`, `@supabase/supabase-js`, `drizzle-orm`, `drizzle-kit`
5. **Create `feat/phase2-supabase` branch** and begin M1
6. **Update `process.md`** — add Phase 2 milestone rows
