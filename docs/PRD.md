# AuraWin — Product Requirements (Phase 1)

## 1. Summary
AuraWin is a Wingo-style **color-prediction** game. Players predict an outcome for a timed
round — a **color** (green / red / violet), a **number** (0–9), or **size** (big / small) — and
win a multiple of their stake when the round result matches. Phase 1 ships the **web app** as a
faithful, production-quality conversion of the supplied prototype: a marketing Landing + auth,
then an authed shell (Sidebar + TopBar) with Lobby, Game, Wallet/Deposit/Withdraw/History,
Rewards, Referral, VIP, Profile, Settings.

**Phase 1 is frontend-only.** All state is client-side, persisted to `localStorage` behind a
repository interface so a real backend drops in for Phase 2 with minimal change.

## 2. Goals
- **Pixel-perfect** parity with the prototype at the ~1380px desktop reference.
- Fully **responsive** down to mobile web (sidebar → bottom-nav + drawer; grids reflow).
- Faithful game loop: wall-clock round timer, deterministic result engine, auto-settlement,
  4 sub-wallets, win celebration, toasts.
- Three switchable **themes** (Neon Casino / Premium Fintech / Futuristic Cyber) as a real,
  persisted user setting (default Neon).
- Stand up project knowledge: PRD, architecture, tech stack, schema, ADRs, memory, agents/skills.

## 3. Non-goals (Phase 2+)
Real backend/API + DB, server-side commit-reveal fairness, real auth & crypto custody, KYC/AML,
analytics, full i18n, the native mobile flavor.

## 4. Personas
- **Player** — places bets, manages wallet, claims rewards, climbs VIP, invites friends.
- **(Phase 2) Operator** — configures payouts, reviews ledgers, handles withdrawals/KYC.

## 5. Core features
1. **Auth** — phone → OTP modal (simulated). Sets `authed`, routes to `/lobby`.
2. **Game (Wingo)** — modes [30s, 60s, 180s, 300s]; bet color/number/size; live countdown;
   last-10 results; locked overlay at ≤5s; bet slip (amount × multiplier); My Bets; Records trend.
3. **Wallet** — 4 sub-wallets (main/bonus/winning/referral); deposit (TRC20/BEP20/ERC20 + QR);
   withdraw (1% fee); transaction + bet history.
4. **Rewards** — spin wheel, daily check-in, missions.
5. **Referral** — 3-level commission (30/15/5%), shareable code.
6. **VIP** — 5 tiers with progress.
7. **Profile / Settings** — theme picker, accessibility toggles.

## 6. Payout rules (from prototype)
Color 2× · Violet 4.5× · Number 9× · Big/Small 2×. Result: number 0–9 → color
(0 = red+violet, 5 = green+violet, 1/3/7/9 = green, else red); big = num ≥ 5.

## 7. Fairness (IMPORTANT — Phase 1 framing)
The result engine is a **deterministic** FNV-hash of `mode|periodIdx`. It is **NOT provably
fair** — there is no server seed or commit-reveal, so anyone can recompute outcomes. **Phase 1
UI must label this "Fair Play (demo) / simulated rounds" and must NOT claim "provably fair."**
Genuine provably-fair (server seed committed pre-round, client seed, nonce, post-round reveal)
is a **hard Phase-2 requirement** (ADR 0006).

## 8. Accessibility (Phase 1 requirements)
This is a *color*-prediction game; ~8% of males are red-green color-blind. Every color-coded bet
element MUST carry a **non-color cue** (R/G/V label or shape). Respect `prefers-reduced-motion`;
visible keyboard focus. See `docs/A11Y.md`.

## 9. Money handling
All monetary amounts are stored as **integer minor-units** (no float arithmetic on balances).
Formatting happens only at the display edge. Prevents float-rounding drift across many
bet/settlement cycles.

## 10. Legal & regulatory risk (business)
Color-prediction apps (e.g. 91 Club, Daman, Tiranga) have a **documented fraud and ban history**
in India and other jurisdictions; several have faced law-enforcement action. Even as a simulated
demo, AuraWin must: (a) gate entry with an **age confirmation (18+)**, (b) display a clear
**"simulated — no real money"** disclaimer, and (c) avoid any "provably fair"/guaranteed-returns
claims. Real-money operation would require jurisdiction-by-jurisdiction legal review, licensing,
KYC/AML, and responsible-gambling controls — explicitly **out of Phase 1 scope** and flagged as
a go/no-go business decision before Phase 2.

## 11. Success criteria
- Pixel-QA passes for every screen in all 3 themes vs `/screenshots`.
- Place-bet → settle → wallet/celebration/tx flow works end-to-end; no hydration warnings.
- Theme + state persist across reload; age-gate enforced.
- Engine determinism verified by `round-verify`.
