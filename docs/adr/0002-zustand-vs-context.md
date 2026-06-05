# ADR 0002 — State: Zustand over React Context

## Status
Accepted

## Context
The prototype holds all state in one React Context with a 250ms timer tick driving the countdown.
With Context, every tick re-renders the whole consumer tree. The store also carries wallet, bets,
tx, vip, rewards, toasts, and celebration.

## Decision
Use **Zustand** with a `useApp()` selector-hook wrapper that preserves the prototype's `app.*`
call shape, so ported components need minimal edits. Components subscribe to slices, so the timer
tick only re-renders timer-dependent UI.

## Consequences
- Avoids whole-tree re-render from the tick; better perf, especially in the game screen.
- Slight indirection (`useApp()` wrapper) to keep call sites stable.
- If Context were ever required instead, TimerContext must be split from wallet/bets — recorded
  here as the rejected alternative.
