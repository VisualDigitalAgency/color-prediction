/**
 * lib/fair/engine.ts — Deterministic round engine (pure functions).
 *
 * Ported VERBATIM from the CDN React prototype (`app/store.jsx`). This is the
 * single source of truth for how a Wingo round resolves: a wall-clock period
 * index is hashed to a digit 0–9, which maps to Wingo color/size rules.
 *
 * HARD RULES:
 * - ZERO React / store / DOM dependencies. Pure TypeScript so a Phase-2 API
 *   route can import this module unchanged and produce identical results.
 * - The hash MUST match the prototype byte-for-byte. The FNV-1a offset basis
 *   (2166136261), prime (16777619), `Math.imul`, and the final `>>> 0` fold
 *   are preserved exactly. DO NOT "improve" the math — determinism is the spec.
 * - This is a SIMULATED demo. No "provably fair" language anywhere — these are
 *   simulated rounds (see lib/strings.ts → game.fairPlay = 'Fair Play (demo)').
 *
 * Time units: `mode` is a duration in SECONDS; timestamps `ts` are unix MS.
 */

import type { RoundMode, RoundResult, Period, BetKind, BetPick } from '../../types';

// ── Round modes (seconds) ───────────────────────────────────────────────────

/** Available round durations, in seconds. */
export const MODES: readonly RoundMode[] = [30, 60, 180, 300] as const;

/** Short display labels per mode (matches prototype MODE_LABEL). */
export const MODE_LABEL: Record<RoundMode, string> = {
  30: '30s',
  60: '1min',
  180: '3min',
  300: '5min',
};

// ── Payout multipliers ──────────────────────────────────────────────────────

/**
 * Payout multipliers keyed by pick/kind (matches prototype PAYOUT object):
 * green:2, red:2, violet:4.5, big:2, small:2, number:9.
 */
export const PAYOUT: Record<string, number> = {
  green: 2,
  red: 2,
  violet: 4.5,
  big: 2,
  small: 2,
  number: 9,
};

// ── Deterministic result per period ─────────────────────────────────────────

/**
 * FNV-1a hash of `str` folded to an unsigned 32-bit integer.
 *
 * VERBATIM from the prototype — offset basis 2166136261, prime 16777619,
 * `Math.imul` for 32-bit wrapping multiply, final `>>> 0` to coerce unsigned.
 * Callers take `% 10` to derive the 0–9 round digit.
 */
export function hashNum(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Deterministic outcome for `(mode, periodIdx)`.
 *
 * num = hashNum(`${mode}|${periodIdx}`) % 10. Wingo color rules:
 *   0          → ['red', 'violet']
 *   5          → ['green', 'violet']
 *   1, 3, 7, 9 → ['green']
 *   else       → ['red']
 * big = num >= 5.
 */
export function resultForPeriod(mode: RoundMode, periodIdx: number): RoundResult {
  const num = hashNum(`${mode}|${periodIdx}`) % 10;
  let colors: ('green' | 'red' | 'violet')[];
  if (num === 0) colors = ['red', 'violet'];
  else if (num === 5) colors = ['green', 'violet'];
  else if (num === 1 || num === 3 || num === 7 || num === 9) colors = ['green'];
  else colors = ['red'];
  return { num, colors, big: num >= 5 };
}

// ── Period math ─────────────────────────────────────────────────────────────

/**
 * The period (index + display id) active for `mode` at unix-ms timestamp `ts`.
 *
 * periodIdx = floor(ts / (mode * 1000)). The display id mirrors the prototype:
 * `${YYYYMMDD}1000${within}` where YYYYMMDD is derived from the period start
 * (LOCAL time, matching the prototype's `new Date(...)` getters) and `within`
 * is `periodIdx % 100000` zero-padded to 5 digits.
 */
export function periodAt(mode: RoundMode, ts: number): Period {
  const periodIdx = Math.floor(ts / (mode * 1000));
  const d = new Date(periodIdx * mode * 1000);
  const ymd =
    `${d.getFullYear()}` +
    `${String(d.getMonth() + 1).padStart(2, '0')}` +
    `${String(d.getDate()).padStart(2, '0')}`;
  const within = String(periodIdx % 100000).padStart(5, '0');
  return { mode, periodIdx, periodId: `${ymd}1000${within}` };
}

/**
 * Whole seconds remaining in the current `mode` period at timestamp `ts` (ms).
 * Returns `mode` at the exact start of a period and counts down to 1.
 */
export function secondsLeft(mode: RoundMode, ts: number): number {
  return mode - Math.floor((ts % (mode * 1000)) / 1000);
}

/**
 * The `count` most recently SETTLED rounds for `mode` at timestamp `ts`,
 * newest first. The in-progress period is excluded (starts at periodIdx - 1).
 * Each entry merges the period descriptor with its deterministic result.
 */
export function recentResults(
  mode: RoundMode,
  count: number,
  ts: number,
): (Period & RoundResult)[] {
  const cur = Math.floor(ts / (mode * 1000));
  const out: (Period & RoundResult)[] = [];
  for (let i = 1; i <= count; i++) {
    const idx = cur - i;
    out.push({
      ...periodAt(mode, idx * mode * 1000),
      ...resultForPeriod(mode, idx),
    });
  }
  return out;
}

// ── Bet resolution ──────────────────────────────────────────────────────────

/** A bet's resolvable shape — only the fields the engine needs. */
export interface BetLike {
  kind: BetKind;
  pick: BetPick;
}

/**
 * Whether `bet` wins against `result` (matches prototype betWins):
 *   color  → result.colors includes the picked color
 *   size   → (pick === 'big') matches result.big
 *   number → result.num === picked digit
 */
export function betWins(bet: BetLike, result: RoundResult): boolean {
  switch (bet.kind) {
    case 'color':
      return result.colors.includes(bet.pick as 'green' | 'red' | 'violet');
    case 'size':
      return (bet.pick === 'big') === result.big;
    case 'number':
      return result.num === bet.pick;
    default:
      return false;
  }
}

/**
 * Payout multiplier for `bet` (matches prototype payoutMult):
 *   color → PAYOUT[pick] (green/red 2, violet 4.5)
 *   size  → PAYOUT[pick] (big/small 2)
 *   else  → PAYOUT.number (9)
 */
export function payoutMult(bet: BetLike): number {
  if (bet.kind === 'color') return PAYOUT[bet.pick as string];
  if (bet.kind === 'size') return PAYOUT[bet.pick as string];
  return PAYOUT.number;
}
