/**
 * components/feedback/Celebration.tsx — win celebration overlay.
 *
 * Ported from the CDN prototype (`/tmp/proto_extract/app/components.jsx`).
 * Pass A (inline-parity): every `style` object — including the `fadeIn` /
 * `popIn` overlay animations and the per-piece `confetti` keyframe — is
 * byte-identical to the prototype; only `createElement` → JSX plus types, the
 * store read moved from `window.useApp()` to `useApp()`, and `window.fmt(...)`
 * became `formatMoney(...)` from `lib/money`.
 *
 * REDUCED-MOTION (docs/A11Y.md, hard requirement): the confetti layer is
 * skipped entirely when reduced motion is requested — either via
 * `settings.reducedMotion` (the in-app toggle) or the OS
 * `prefers-reduced-motion: reduce` media query. The celebration stays fully
 * comprehensible without it (trophy, "You Won", amount, profit line). The
 * global reduced-motion CSS rule in `globals.css` additionally near-instants
 * the popIn/fadeIn entrance, so nothing animates when motion is reduced.
 */

'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';

import { Icon } from '@/components/icons/Icon';
import { CountUp } from '@/components/primitives/CountUp';
import { formatMoney, fromMinor } from '@/lib/money';
import { useApp } from '@/lib/store';
import STRINGS from '@/lib/strings';

export interface CelebrationProps {
  /** Confetti intensity (piece count grows with this). Prototype default = 7. */
  motion?: number;
}

export function Celebration({ motion = 7 }: CelebrationProps) {
  const app = useApp();
  const c = app.celebration;

  // OS-level reduced-motion preference (SSR-safe: read only after mount).
  const [prefersReduced, setPrefersReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mq.matches);
    const on = () => setPrefersReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  useEffect(() => {
    if (!c) return;
    const id = setTimeout(() => app.clearCelebration(), 4200);
    return () => clearTimeout(id);
  }, [c]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!c) return null;

  // Reduced motion (in-app toggle OR OS preference) → no confetti.
  const reduced = !!app.settings.reducedMotion || prefersReduced;
  const effMotion = reduced ? 0 : motion;
  const N = Math.round(6 + effMotion * 5);
  const cols = ['var(--green)', 'var(--gold)', 'var(--violet)', 'var(--accent-2)', '#fff'];

  return (
    <div
      onClick={() => app.clearCelebration()}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 90,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(4,4,10,.6)',
        backdropFilter: 'blur(3px)',
        animation: 'fadeIn .25s',
      }}
    >
      {effMotion > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        >
          {Array.from({ length: N }).map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '-8%',
                left: `${(i * 97) % 100}%`,
                width: 8,
                height: 13,
                borderRadius: 2,
                background: cols[i % cols.length],
                animation: `confetti ${1.3 + (i % 5) * 0.25}s ${
                  (i % 7) * 0.08
                }s cubic-bezier(.3,.6,.4,1) forwards`,
                transform: `rotate(${i * 47}deg)`,
              }}
            />
          ))}
        </div>
      )}
      <div style={{ textAlign: 'center', animation: 'popIn .5s cubic-bezier(.2,1.4,.4,1)' }}>
        <div
          style={{
            width: 86,
            height: 86,
            margin: '0 auto 16px',
            borderRadius: '50%',
            background: 'var(--header-grad)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--glow-accent)',
          }}
        >
          {Icon.trophy({ size: 44, color: 'var(--accent-ink)' })}
        </div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--accent-2)',
            letterSpacing: '2px',
            textTransform: 'uppercase',
          }}
        >
          {STRINGS.game.youWon}
        </div>
        <div
          style={{
            fontSize: 46,
            fontWeight: 900,
            color: 'var(--text)',
            margin: '2px 0',
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          +
          <CountUp value={fromMinor(c.credit)} />
          <span style={{ fontSize: 18, color: 'var(--text-dim)', fontWeight: 700 }}>
            {STRINGS.wallet.currency}
          </span>
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--text-mute)' }}>
          {'Net profit +' + formatMoney(c.amount) + ' · added to winnings'}
        </div>
        <div
          style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 18, opacity: 0.8 }}
        >
          tap to continue
        </div>
      </div>
    </div>
  );
}

export default Celebration;
