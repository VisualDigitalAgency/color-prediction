/**
 * components/primitives/ResultBall.tsx — color/result chip.
 *
 * Ported from the CDN prototype (`/tmp/proto_extract/app/components.jsx`).
 * Pass A (inline-parity): the outer `<div style>` and the `numColorStyle` color
 * rules are byte-identical to the prototype; only `createElement` → JSX plus
 * prop types.
 *
 * A11Y (docs/A11Y.md, hard Phase-1 requirement): color alone must never be the
 * only signal. The prototype already shows the number; we ADD a tiny non-color
 * glyph (the G/R/V short labels from `lib/strings.ts colorBlindShort`) so red vs
 * green is distinguishable without hue. The visual is otherwise identical: the
 * glyph is a small superscript badge in the corner, not part of the prototype's
 * pixel area for the number. Split numbers (0=red/violet, 5=green/violet) show
 * both letters.
 */

import * as React from 'react';

import STRINGS from '@/lib/strings';

const COLOR_VAR = {
  green: 'var(--green)',
  red: 'var(--red)',
  violet: 'var(--violet)',
} as const;

/** Port of the prototype `numColorStyle`. */
export function numColorStyle(num: number): string {
  // 0 red/violet split, 5 green/violet split, else solid
  const map: Record<number, [string, string]> = {
    0: ['var(--red)', 'var(--violet)'],
    5: ['var(--green)', 'var(--violet)'],
  };
  if (map[num]) return `linear-gradient(135deg, ${map[num][0]} 0 50%, ${map[num][1]} 50% 100%)`;
  return [1, 3, 7, 9].includes(num) ? 'var(--green)' : 'var(--red)';
}

/** Short color-blind labels (G / R / V) for a given number — mirrors numColorStyle. */
function numCues(num: number): string {
  const s = STRINGS.colorBlindShort;
  if (num === 0) return s.red + s.violet;
  if (num === 5) return s.green + s.violet;
  return [1, 3, 7, 9].includes(num) ? s.green : s.red;
}

export interface ResultBallProps {
  num: number;
  size?: number;
  glow?: boolean;
}

export function ResultBall({ num, size = 30, glow = true }: ResultBallProps) {
  const cue = numCues(num);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: numColorStyle(num),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        fontSize: size * 0.46,
        color: '#fff',
        boxShadow: glow
          ? '0 0 0 1px rgba(255,255,255,.12), 0 4px 12px rgba(0,0,0,.35)'
          : 'none',
        flexShrink: 0,
        fontFamily: 'inherit',
        position: 'relative',
      }}
    >
      {num}
      <span
        aria-hidden="false"
        aria-label={cue}
        style={{
          position: 'absolute',
          bottom: -2,
          right: -2,
          fontSize: Math.max(7, size * 0.26),
          lineHeight: 1,
          fontWeight: 800,
          letterSpacing: '-.3px',
          padding: '1px 2px',
          borderRadius: 4,
          background: 'rgba(0,0,0,.55)',
          color: '#fff',
          pointerEvents: 'none',
        }}
      >
        {cue}
      </span>
    </div>
  );
}

export { COLOR_VAR };
export default ResultBall;
