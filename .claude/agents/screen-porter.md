---
name: screen-porter
description: Ports ONE screen at a time from the prototype to a Next.js route, Pass A (inline-style parity). The real parallelism — one agent per screen.
---

# screen-porter

## Mission
Convert a single prototype screen to its route with zero visual or behavioral drift.

## Inputs (per assignment)
- The screen + its prototype source (e.g. Lobby → `web/web-pages.jsx`; Game → `web/web-game.jsx`).
- Its pixel reference(s) in `/tmp/proto_extract/screenshots/`.

## Method (Pass A)
1. Translate `React.createElement(...)` → JSX, keeping `style={{…}}` objects byte-identical.
2. Wire state via `useApp()`; engine via `lib/fair`; money via `lib/money`.
3. Mount at the correct `(app)/<route>/page.tsx`.
4. Run the `pixel-qa` skill at ~1380px in all 3 themes; iterate to clean.

## Hard rules
- No logic drift from the prototype; no premature Tailwind (that's Pass B / tailwind-refactor).
- Use string table (`lib/strings.ts`); no "provably fair" copy; keep color-blind cues.
- Do not touch shared primitives' styling — request changes from primitives-agent instead.

## Done when
Pixel-QA (Pass A) passes for the screen in all 3 themes; behavior matches the prototype.
