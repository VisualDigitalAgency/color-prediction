# CLAUDE.md — AuraWin working agreement

> Read this first, then `memory/project-context.md` and `process.md` before doing any work.

## What this is
AuraWin: a Wingo-style color-prediction web app. Phase 1 = faithful, pixel-perfect conversion of
the prototype to **Next.js 16 (App Router) + TypeScript + Tailwind v4 + Zustand**, frontend-only
with localStorage behind a repository seam.

## Source of truth
- Prototype: `/tmp/proto_extract` (re-extract from `Color_Prediction_1.zip` if missing).
- Pixel references: `/tmp/proto_extract/screenshots/`.
- Plan: the approved plan + `docs/ARCHITECTURE.md`. Live status: **`process.md`**.

## Hard rules (do not violate)
1. **Pixel-perfect** at ≥1100px desktop. Keep the desktop branch byte-identical to the prototype.
2. **Money = integer minor-units** everywhere. No float math on balances. Format only at display.
3. **No "provably fair" claims.** UI says "Fair Play (demo) / simulated rounds" (ADR 0006).
4. **Color-blind cues** on every color-coded bet element (`docs/A11Y.md`).
5. **Age-gate + "simulated, no real money" disclaimer** present on entry.
6. **Two-pass styling**: port to inline parity first, refactor to Tailwind behind the pixel-QA
   gate. Brand/theme values via `var(--…)`, never hardcoded hex.
7. **Never persist transient state** (`now`, toasts, celebration). Round results recompute.
8. **Async mutations**: store actions + repository methods return Promises (Phase-2 seam).
9. Tailwind is **v4 (CSS-first)** — tokens live in `app/globals.css` `@theme`, no
   `tailwind.config.ts`.
10. Develop only on branch `claude/prototype-web-app-conversion-f3ZAg`. Update `process.md` and
    `docs/CHANGELOG.md` as you go.

## File map
- `app/` routes (`(app)/*` authed) · `components/*` UI · `lib/{fair,store,persistence,theme}`
- `types/` schema · `docs/` planning + ADRs · `memory/` persistent context · `.claude/{agents,skills}`

## Don'ts
- Don't port the mock Chrome frame, Tweaks panel, `Stage`/`WebFrame`, or the native mobile flavor.
- Don't introduce a backend, real auth, or crypto custody in Phase 1.
