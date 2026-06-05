# ADR 0003 — Navigation: App Router routes vs in-memory screen router

## Status
Accepted

## Context
The prototype uses an in-memory router stack (`app.navigate('key')` / `back()`). Next.js App
Router gives real URLs, deep-linking, and server/client boundaries.

## Decision
Use **App Router routes**. Map screen-keys → routes in `lib/nav.ts` and derive the active screen
from `usePathname()`. Keep `navigate(key)`/`back()` call sites working by translating to
`router.push`/`router.back` behind the `useApp()` wrapper. Titles (`WEB_TITLES`) move to
`lib/nav.ts`.

## Consequences
- Real URLs, shareable/deep-linkable screens, browser back/forward.
- Auth gating handled by the `(app)` route-group layout instead of conditional rendering.
- Minor translation layer between prototype keys and route paths.
