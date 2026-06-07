'use client';
/**
 * components/rewards/SpinWheel.tsx
 * Pass A port of SpinWheel from web-pages2.jsx.
 * Adaptations:
 *   - `app.setWallet(w => {...})` → `app.claimSpinPrize()`
 *   - Store manages prize selection via weighted random; local state still
 *     manages the visual rotation independently for animation.
 *   - `app.rewards.freeSpins` drives the spin count instead of local state.
 *   - Segment colours read from CSS vars at render time so all three themes work.
 */
import * as React from 'react';
import { useState } from 'react';
import { useApp } from '@/lib/store/useApp';
import { Button } from '@/components/primitives/Button';
import { Icon } from '@/components/icons/Icon';

/** Read a CSS custom property from the document root (theme-aware). */
function cssVar(name: string): string {
  if (typeof document === 'undefined') return '#000';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// Segment colour keys — resolved at render time from the active theme's CSS vars.
// Alternating 'dark' segments use --chip so they adapt to each theme's surface colour.
const PRIZE_TOKENS = [
  { label: '5',     token: '--green' },
  { label: 'x2',   token: '--chip' },
  { label: '20',   token: '--violet' },
  { label: 'Again',token: '--chip' },
  { label: '50',   token: '--gold' },
  { label: 'x5',   token: '--chip' },
  { label: '100',  token: '--red' },
  { label: '888',  token: '--accent-2' },
] as const;

export function SpinWheel() {
  const app = useApp();
  const [rot, setRot] = useState(0);
  const [spinning, setSpinning] = useState(false);

  // Resolve CSS vars at render time so the wheel re-colours on theme change.
  const prizes = PRIZE_TOKENS.map((p) => ({ ...p, c: cssVar(p.token) }));
  const seg = 360 / prizes.length;
  const grad = prizes.map(
    (p, i) => `${p.c} ${i * seg}deg ${(i + 1) * seg}deg`,
  ).join(', ');

  const freeSpins = app.rewards.freeSpins;

  const spin = () => {
    if (spinning || freeSpins <= 0) return;
    setSpinning(true);

    const idx = Math.floor(Math.random() * PRIZE_TOKENS.length);
    const final = rot + (360 * 6 - (idx * seg + seg / 2) - (rot % 360));
    setRot(final);

    app.claimSpinPrize().then((result) => {
      setTimeout(() => {
        setSpinning(false);
      }, 4200);
    });
  };

  return (
    <div className="bg-surface border border-[var(--border)] rounded-[var(--radius)] p-[26px] shadow-[var(--card-shadow)] text-center">
      <div className="text-[17px] font-extrabold text-text">
        Lucky Spin
      </div>
      <div className="text-[13px] text-[var(--text-mute)] font-semibold mb-5">
        {freeSpins} free spins left today
      </div>

      <div className="relative size-[260px] mx-auto mb-[22px]">
        {/* pointer */}
        <div
          style={{
            position: 'absolute',
            top: -6,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 3,
            width: 0,
            height: 0,
            borderLeft: '13px solid transparent',
            borderRight: '13px solid transparent',
            borderTop: '22px solid var(--gold)',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.4))',
          }}
        />
        {/* wheel */}
        <div
          className="size-[260px] rounded-full relative"
          style={{
            background: `conic-gradient(${grad})`,
            transform: `rotate(${rot}deg)`,
            transition: spinning ? 'transform 4.1s cubic-bezier(.15,.85,.25,1)' : 'none',
            boxShadow:
              '0 0 0 7px var(--surface-2), 0 0 0 9px var(--accent), var(--glow-accent)',
          }}
        >
          {prizes.map((p, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transformOrigin: '0 0',
                transform: `rotate(${i * seg + seg / 2}deg) translate(66px, -10px)`,
                fontSize: 15,
                fontWeight: 800,
                color: '#fff',
                textShadow: '0 1px 2px rgba(0,0,0,.5)',
              }}
            >
              {p.label}
            </div>
          ))}
        </div>
        {/* center hub */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[52px] rounded-full bg-[var(--header-grad)] border-[3px] border-surface flex items-center justify-center z-[2] text-[var(--accent-ink)]">
          {Icon.bolt({ size: 26 })}
        </div>
      </div>

      <Button
        full
        size="lg"
        disabled={spinning || freeSpins <= 0}
        onClick={spin}
      >
        {spinning ? 'Spinning…' : freeSpins > 0 ? 'Spin now · FREE' : 'Come back tomorrow'}
      </Button>
    </div>
  );
}

export default SpinWheel;
