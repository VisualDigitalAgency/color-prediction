# color-prediction — AuraWin

Production web-app conversion of the **AuraWin** Wingo-style color-prediction prototype.

- **Phase 1:** frontend-only — Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Zustand;
  state in localStorage behind a `DataRepository` seam. Pixel-perfect to the prototype; fully
  responsive incl. mobile web.
- **Planning & process:** see `process.md` (live execution tracker), `docs/` (PRD, ARCHITECTURE,
  TECHSTACK, SCHEMA, A11Y, ADRs), `memory/`, and `.claude/{agents,skills}`.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

> Simulated demo — no real money. 18+.
