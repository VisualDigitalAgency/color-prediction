/**
 * components/primitives/CountUp.tsx — animated count-up number.
 *
 * Ported VERBATIM from the CDN prototype (`/tmp/proto_extract/app/components.jsx`).
 * Pass A (inline-parity): the cubic-ease rAF tween and the rendered `<span style>`
 * are byte-identical to the prototype; only `createElement` → JSX plus prop types.
 *
 * `fmt` reproduces the prototype `window.fmt`:
 *   fmt = (n, d=2) => Number(n).toLocaleString('en-US',
 *           { minimumFractionDigits: d, maximumFractionDigits: d })
 *
 * SSR-SAFETY: `disp` starts at `value` (a stable prop), so the first render —
 * on both server and client — emits exactly `prefix + fmt(value, d)`, with no
 * hydration mismatch. The animation only runs inside `useEffect` (client-only),
 * and only from the *previous* value when `value` actually changes; on initial
 * mount `from.current === value`, so nothing animates.
 */

'use client';

import * as React from 'react';
import { useEffect, useRef, useState } from 'react';

/** Prototype `window.fmt` — fixed-decimal en-US grouping. */
function fmt(n: number, d = 2): string {
  return Number(n).toLocaleString('en-US', {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
}

export interface CountUpProps {
  value: number;
  /** Tween duration in ms. */
  dur?: number;
  /** Static prefix prepended to the formatted number (e.g. '$'). */
  prefix?: string;
  /** Decimal places passed to `fmt`. */
  d?: number;
  style?: React.CSSProperties;
}

export function CountUp({ value, dur = 650, prefix = '', d = 2, style }: CountUpProps) {
  const [disp, setDisp] = useState(value);
  const from = useRef(value);
  const raf = useRef<number | undefined>(undefined);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    const b = value;
    if (raf.current !== undefined) cancelAnimationFrame(raf.current);
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      const v = a + (b - a) * e;
      from.current = v;
      setDisp(v);
      if (k < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current !== undefined) cancelAnimationFrame(raf.current);
    };
  }, [value, dur]);
  return <span style={style}>{prefix + fmt(disp, d)}</span>;
}

export default CountUp;
