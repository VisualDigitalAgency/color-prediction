---
name: prompt-architect
description: Transform a raw user request into a fully structured CRAFT prompt using the AuraWin prompt library. Invoke with /prompt-architect <raw query>. Outputs a ready-to-hand-off prompt the CTO agent (or any sub-agent) can execute without ambiguity.
---

# prompt-architect

Convert a vague or incomplete user request into a precise, structured prompt using the
CRAFT framework and the prompt library below. The output is the prompt — not prose about
the prompt.

---

## Inputs

- `<raw query>` — the user's original words, as written (required)
- `[agent]` — optional: target sub-agent name to tailor the output format

---

## CRAFT framework (apply to every output)

| Section | Question it answers | Required? |
|---|---|---|
| **C — Context** | What system, phase, files, and prior state exist? | Always |
| **R — Role** | What specialist persona should the AI embody? | Always |
| **A — Action** | Precisely what must be built/fixed/designed? | Always |
| **F — Format** | What files, style, tests, and commit are expected? | Always |
| **T — Constraints** | What hard rules must never be broken? | Always |
| **+ Include** | What sub-deliverables are mandatory? | When list is known |

**Fill every section.** A section left vague produces a vague result.

---

## Procedure

1. **Read** the raw query for intent verb, object, and scope.
2. **Match** the query to a template in the Prompt Library below (exact or nearest category).
3. **Fill** all CRAFT sections using:
   - Project facts from `CLAUDE.md` and `memory/project-context.md`
   - Template's `Include` list (expand from the library, add project-specific items)
   - Any constraints mentioned in the raw query
4. **Output** the completed structured prompt inside a fenced block, labelled with the target agent.
5. **Do not** add explanation outside the fenced block — the output IS the prompt.

---

## Output format

```
TARGET AGENT: <agent-name>
PARALLEL: <yes/no — whether this can run alongside other agents>

---

## Context
...

## Role
...

## Action
...

## Format
...

## Constraints
...

## Include
- ...
- ...
```

---

## Prompt library

Templates are organized by category. `[X]` placeholders must be replaced with
project-specific values. The `Include` list is the minimum — expand it for the task.

---

### Category A — System & Infrastructure

#### A1 · Notification System
> Build a notification system supporting [email / SMS / push].

**Include:**
- Template management (content + variable substitution)
- Delivery queue with priority lanes (transactional > marketing)
- Per-notification delivery tracking (sent, delivered, failed, opened)
- Retry logic with exponential back-off (max 3 attempts, dead-letter queue)
- Subscription management (opt-in/out per channel per notification type)
- Rate limiting per recipient (no more than N notifications per hour)
- Typed `NotificationPayload` and `DeliveryRecord` interfaces

**AuraWin mapping:** Toaster (`components/feedback/Toaster.tsx`) is the in-app
notification layer. For Phase 1, "push" = toast; Phase 2 = real FCM/APNs.

---

#### A2 · Event System (Pub/Sub)
> Design a pub/sub event system for [application].

**Include:**
- Type-safe event definitions (discriminated union `AppEvent` type)
- `subscribe(event, handler)` / `unsubscribe(event, handler)` with stable refs
- Synchronous + async handler support (handlers may return `Promise<void>`)
- Error propagation: failed handlers don't crash other subscribers
- Memory leak prevention: auto-cleanup on component unmount (return unsubscribe)
- Wildcard subscription: `subscribe('*', handler)` for logging/analytics
- EventBus singleton + `useEvent(name, handler)` React hook

**AuraWin mapping:** Current store uses Zustand subscriptions. An EventBus complements
it for cross-cutting concerns (analytics, logging, cross-tab sync in Phase 2).

---

#### A3 · Config System
> Build an environment-aware configuration system for [application].

**Include:**
- Environment variable binding (`.env.local`, `.env.production`)
- Typed config schema (Zod or hand-typed, no `any`)
- Validation at startup: missing required vars = throw with helpful message
- Defaults for every optional field
- Secrets management: mark sensitive keys, never log them
- Runtime reload hook (for feature flags or non-secret config)
- `getConfig()` singleton + `useConfig()` React hook

**AuraWin mapping:** Extend `lib/persistence/seed.ts` config pattern. Add a
`lib/config/` module before Phase 2 API keys land.

---

#### A4 · Health Check Endpoint
> Build a service health check endpoint for [application].

**Include:**
- Overall status: `healthy | degraded | unhealthy` (HTTP 200/207/503)
- Storage check: localStorage read/write round-trip (Phase 1); DB ping (Phase 2)
- External dependency checks: each API/CDN dependency with timeout
- Memory and CPU thresholds (degrade if JS heap > X MB)
- Response time self-check (warn if > 500ms)
- Custom checks: fair engine determinism check (recompute one known period)
- JSON response: `{ status, checks: { [name]: { ok, latency, detail } }, ts }`

**AuraWin mapping:** Add as `/api/health` Next.js route handler. Use in Vercel
health check URL.

---

#### A5 · Feature Flag System
> Implement a feature flag system for [application].

**Include:**
- Flag name enum (typed, exhaustive, no string literals at call site)
- User-level targeting: flag value stored per-user in `PersistedState`
- Gradual rollout: `percentage` field (0–100) evaluated against stable user ID hash
- A/B testing: flag returns variant key (`'control' | 'variant-a' | 'variant-b'`)
- Real-time override: `store.setFlag(name, value)` without page reload
- Default values: all flags `false` / `'control'` when no persisted value
- `useFlag(name)` hook — boolean or variant key, stable identity, zero extra re-renders
- Repository seam: `FlagRepository` interface (localStorage Phase 1, REST Phase 2)

---

#### A6 · Structured Logging
> Build a structured logging system for [application].

**Include:**
- Log levels: `debug | info | warn | error` with runtime filter threshold
- Request / action trace IDs (UUID generated per user action, threaded through)
- Context enrichment: userId, sessionId, appVersion, theme, current route
- JSON output (browser console + optional remote aggregation endpoint)
- Redaction: never log wallet amounts, auth tokens, or personal data in plain text
- `logger.info(msg, context?)` / `logger.error(msg, err, context?)` API
- Integration hook for Datadog / Logtail / Sentry (Phase 2, behind interface seam)

**AuraWin mapping:** Add `lib/logger/` module. Replace all `console.log` calls.
Wire into store actions so every mutation emits a structured log entry.

---

### Category B — Data Layer

#### B1 · Write a Parser
> Write a parser for [format / language].

**Include:**
- Lexer / tokenizer: character-level scanner → token stream
- Grammar definition: BNF or PEG rules documented in comments
- AST node types: typed discriminated union (no `any`, no `object`)
- Recursive descent parser: `parse()` → `ASTNode`
- Error recovery: consume bad tokens, collect all errors, continue (never abort on first)
- Position tracking: `{ line, col, offset }` on every token and AST node
- `ParseResult<T>` = `{ ok: true; ast: T } | { ok: false; errors: ParseError[] }`

**AuraWin mapping:** Use for parsing period ID formats, import/export of bet history
CSV, or round result notation in Phase 2.

---

#### B2 · Data Validation Layer
> Build a data validation layer for [data type / source].

**Include:**
- Schema definition: typed, composable validators (not Zod — hand-typed for zero deps)
- Type coercion: string → number → minor-units (reuse `toMinor()`)
- Sanitization: strip unknown keys, trim strings, normalize booleans
- Custom validators: min/max bet stake, valid pick values, network names
- Detailed error messages: field path + constraint violated + received value
- `validate<T>(schema, input): ValidationResult<T>` — success or array of errors
- Re-use at both UI boundary (form submit) and repository boundary (loadState)

**AuraWin mapping:** Wire into `LocalStorageRepository.migrate()` and all form
submit handlers in `Deposit.tsx`, `Withdraw.tsx`.

---

#### B3 · File Upload
> Implement multipart file uploads for [application].

**Include:**
- Chunked upload: split large files into N-byte chunks, upload sequentially
- Progress tracking: `onProgress(percent: number)` callback per chunk
- File type validation: MIME type + extension allowlist, checked client + server side
- File size validation: configurable max bytes, reject before upload begins
- Resumable uploads: save uploaded chunk index to localStorage, resume on retry
- Cloud storage integration: pre-signed URL flow (S3 / R2 / Supabase Storage)
- `useFileUpload()` hook: `{ upload, progress, status, error, reset }`

---

#### B4 · Search Autocomplete
> Build a search autocomplete for [application].

**Include:**
- Debouncing: 200ms delay, cancel previous request on new keystroke
- Trie / prefix index: build in-memory index from data set on mount
- Ranked suggestions: exact prefix > word-start match > substring match (score desc)
- Keyboard navigation: ↑/↓ moves highlight, Enter selects, Escape closes
- Accessibility: `role="combobox"`, `aria-expanded`, `aria-activedescendant`, announce count
- Highlight matched characters in suggestion labels (bold the matched prefix)
- `useAutocomplete(data, { debounce, maxResults })` hook

**AuraWin mapping:** Use for game search, player handle lookup, transaction filter.

---

### Category C — Architecture & Design

#### C1 · API Gateway
> Design an API gateway for [system].

**Include:**
- Routing table: path pattern → upstream service (typed, not string-map)
- Authentication middleware: JWT verify → `req.user` context injection
- Rate limiting: per-IP and per-user sliding window (configurable per route)
- Request transformation: header injection, body schema validation before forwarding
- Load balancing: round-robin across upstream instances with health-check exclusion
- Observability: request ID propagation, latency histogram, error rate counter
- Circuit breaker: open after N failures in T seconds, half-open probe after cooldown

**AuraWin mapping:** Phase 2 seam. The `DataRepository` interface in
`lib/persistence/repository.ts` becomes an HTTP client pointing at this gateway.

---

#### C2 · Plugin System
> Design a plugin system for [application].

**Include:**
- Plugin manifest: `{ name, version, dependencies[], provides[] }` (typed)
- Discovery: scan `plugins/` directory for `manifest.json` + `index.ts` entry
- Lifecycle hooks: `onInstall`, `onEnable`, `onDisable`, `onUninstall`
- Sandboxing: plugin runs in its own closure scope, no direct store access (uses published API)
- Dependency resolution: topological sort; circular dep = load error, not crash
- Versioned plugin API: `sdk.v1.*` namespace — callers pin to a version
- Hot reload: disable + re-enable plugin without page refresh

**AuraWin mapping:** Use for new game types (K3, 5D, TRX). Each game = a plugin
that registers its board UI, payout rules, and mode config.

---

### Category D — Reporting & Observability

#### D1 · Report Generator
> Build a system that auto-generates [format] reports from [data source].

**Include:**
- Template engine: `{{variable}}` substitution + conditional blocks `{{#if}}…{{/if}}`
- Data aggregation: group by period, sum/average/min/max over bet/transaction arrays
- Scheduling: cron-like trigger (e.g., daily at 00:00 UTC) using `node-cron` or Vercel cron
- Output formats: PDF (via Puppeteer), CSV, JSON — pluggable renderer per format
- Email distribution: attach PDF + inline summary, send via Resend/SendGrid
- Parameterized reports: `generateReport({ from, to, userId, format })`

**AuraWin mapping:** Phase 2. Admin reports: daily bet volume, payout ratio,
wallet balance snapshots. Player reports: monthly statement.

---

### Category E — AuraWin-Specific Templates

#### E1 · Port a new screen
> Port [ScreenName] from the prototype to a Next.js route.

**Include:**
- `app/(app)/[route]/page.tsx` — server component, just renders `<ScreenComponent />`
- `components/[domain]/[ScreenName].tsx` — Pass A: inline-style parity to prototype
- `components/[domain]/index.ts` — barrel export
- All `style={{…}}` objects byte-identical to prototype, all colors as `var(--…)`
- Navigation via `router.push(ROUTES.X)`, not `app.navigate()`
- Money displayed via `formatMoney(minor)`, never raw floats
- No "provably fair" text — use `STRINGS.game.fairPlay`
- `process.md` row updated: screen status → Pass A complete

---

#### E2 · Add a store action
> Add [actionName] action to the Zustand store.

**Include:**
- Action signature in `AppState` interface (returns `Promise<ActionResult>`)
- Implementation in `lib/store/store.ts` using `add`/`sub`/`mul` — no raw `+`
- `ActionResult = { ok: true } | { ok: false; reason: string }` (existing type)
- Persist the durable slice after mutation via `repository.saveState()`
- Toast on success and on error via `pushToast()`
- Unit test in `lib/store/store.test.ts`: success path + error/insufficient-funds path
- `useApp()` hook exposes the new action (add to `AppApi` interface in `useApp.ts`)

---

#### E3 · Add a responsive fix
> Fix [component] layout on mobile viewports below 1100px.

**Include:**
- Default (mobile-first) styles — no `app:` prefix needed for mobile values
- `app:` prefix for ≥1100px desktop overrides only
- `min-w-0` on any flex child that uses `truncate` or `overflow: hidden`
- `shrink-0` on adjacent flex children that must not be squeezed
- `grid-cols-1` default, `app:grid-cols-N` for desktop multi-column layouts
- Desktop ≥1100px layout unchanged — pixel-identical to prototype
- No hardcoded pixel widths in responsive sections; use `flex-1` + `min-w-0`

---

#### E4 · Write unit tests for [module]
> Write unit tests for [module] using Vitest.

**Include:**
- Happy path: expected inputs → expected outputs (golden values where applicable)
- Edge cases: zero values, empty arrays, boundary conditions
- Error paths: invalid input, insufficient funds, SSR no-window
- Async coverage: `Promise.resolve` timing, rejection handling
- No mocking of internal pure functions — test at the public API surface
- Each test file co-located with the module: `lib/[x]/[x].test.ts`
- `describe` blocks by function name, `it` blocks with plain-English descriptions

---

## Worked examples

### Example 1 — "add push notifications"

```
TARGET AGENT: store-agent (Phase 1 in-app only) → screen-porter (if new UI needed)
PARALLEL: no — store changes first, then UI

---

## Context
AuraWin Phase 1 frontend-only. In-app "push" = toast notifications via
components/feedback/Toaster.tsx. The store already has pushToast(msg, kind).
User wants richer notifications: game result alerts, deposit confirmations,
bonus unlock prompts. No real push API in Phase 1.

## Role
You are a Zustand state architect working on AuraWin. You understand the existing
Toast type and Toaster component. Notification enrichment stays in the store;
the Toaster renders whatever the store emits.

## Action
Extend the toast system to support typed notification categories with icons,
actions (CTA buttons), and persistence (unread badge count on the bell icon
in TopBar.tsx).

## Format
- Edit: lib/store/store.ts (extend Toast type, add notificationCount slice)
- Edit: types/index.ts (extend Toast, add NotificationKind enum)
- Edit: components/feedback/Toaster.tsx (render icon + optional CTA button)
- Edit: components/shell/TopBar.tsx (red dot → unread count badge)
- Tests: lib/store/store.test.ts (new notification action paths)

## Constraints
- Never persist transient toasts (only unread count is durable)
- Money displayed via formatMoney(minor) if toast shows a payout amount
- No "provably fair" language in notification copy

## Include
- NotificationKind enum: 'result' | 'deposit' | 'withdrawal' | 'bonus' | 'system'
- Extended Toast: { id, msg, kind, notifKind?, action?: { label, href } }
- pushNotification(kind, msg, action?) action — also calls pushToast internally
- dismissNotification(id) action
- unreadCount derived value in useApp() (count of un-dismissed notifications)
- Toaster renders notifKind icon left of message, optional CTA right
- TopBar bell badge shows unreadCount (hidden when 0)
- markAllRead() action clears unreadCount
```

---

### Example 2 — "make game faster"

```
TARGET AGENT: claude (general — audit first, implement second)
PARALLEL: no

---

## Context
AuraWin — components/game/Game.tsx (635 lines). The 250ms clock tick in
lib/store/useNow.ts drives settlement and re-renders any component that calls
useNow(). If Game.tsx subscribes to the clock for anything beyond the countdown
timer, it re-renders 4 times/second on every mobile device.

## Role
You are a React performance specialist. You understand Zustand slice selectors
and the cost of over-subscribing to high-frequency state. You know that
memoization (useMemo, useCallback, React.memo) prevents cascading re-renders.

## Action
Audit Game.tsx for unnecessary re-render sources and apply targeted memoization.
Do not restructure the component — surgically fix hot paths only.

## Format
- Edit: components/game/Game.tsx
- No new files
- Measure: add a console.count('Game render') before and after to confirm reduction

## Constraints
- Desktop ≥1100px layout must remain pixel-identical — no visual changes
- Do not lift state out of Game.tsx into the store (scope creep)
- Do not use any React 18 concurrent features not already in the codebase

## Include
- Audit: list every useApp() / useNow() / useState call and whether it re-renders on tick
- useMemo on recentResults (already periodIdx-keyed — verify it is correct)
- useMemo on betSlip derived values (totalStake, selectedOdds) if recomputed each render
- useCallback on every onClick handler passed to child primitives
- React.memo on the BetChip and ResultBall lists if they re-render on parent tick
- Confirm: countdown timer is the ONLY sub-tree that re-renders on 250ms tick
```

---

## Notes

- Always check `process.md` for the current status of the target screen/module before
  generating a prompt — don't ask for work that's already done.
- The `Include` list is a minimum contract. Sub-agents may exceed it; they must not
  skip items.
- For multi-agent tasks, generate one structured prompt per agent and label each clearly
  with `TARGET AGENT:` and `PARALLEL: yes/no`.
- Update this library when a new reusable pattern emerges from a completed task.
