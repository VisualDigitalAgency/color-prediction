'use client';
/**
 * components/rewards/SpinWheel.tsx
 * Pass A port of SpinWheel from web-pages2.jsx.
 * Adaptations:
 *   - `app.setWallet(w => {...})` → `app.claimSpinPrize()`
 *   - Store manages prize selection via weighted random; local state still
 *     manages the visual rotation independently for animation.
 *   - `app.rewards.freeSpins` drives the spin count instead of local state.
 */
import * as React from 'react';
import { useState } from 'react';
import { useApp } from '@/lib/store/useApp';
import { fromMinor } from '@/lib/money';
import { Button } from '@/components/primitives/Button';
import { Icon } from '@/components/icons/Icon';

const PRIZES_VISUAL = [
  { label: '5', c: '#15e08a' },
  { label: 'x2', c: '#23263a' },
  { label: '20', c: '#b14bff' },
  { label: 'Again', c: '#23263a' },
  { label: '50', c: '#ffc63d' },
  { label: 'x5', c: '#23263a' },
  { label: '100', c: '#ff3460' },
  { label: '888', c: '#1fe0ff' },
];

export function SpinWheel() {
  const app = useApp();
  const [rot, setRot] = useState(0);
  const [spinning, setSpinning] = useState(false);

  const seg = 360 / PRIZES_VISUAL.length;
  const grad = PRIZES_VISUAL.map(
    (p, i) => `${p.c} ${i * seg}deg ${(i + 1) * seg}deg`,
  ).join(', ');

  const freeSpins = app.rewards.freeSpins;

  const spin = () => {
    if (spinning || freeSpins <= 0) return;
    setSpinning(true);

    const idx = Math.floor(Math.random() * PRIZES_VISUAL.length);
    const final = rot + (360 * 6 - (idx * seg + seg / 2) - (rot % 360));
    setRot(final);

    app.claimSpinPrize().then((result) => {
      setTimeout(() => {
        setSpinning(false);
      }, 4200);
    });
  };

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: 26,
        boxShadow: 'var(--card-shadow)',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)' }}>
        Lucky Spin
      </div>
      <div
        style={{
          fontSize: 13,
          color: 'var(--text-mute)',
          fontWeight: 600,
          marginBottom: 20,
        }}
      >
        {freeSpins} free spins left today
      </div>

      <div
        style={{
          position: 'relative',
          width: 260,
          height: 260,
          margin: '0 auto 22px',
        }}
      >
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
          style={{
            width: 260,
            height: 260,
            borderRadius: '50%',
            background: `conic-gradient(${grad})`,
            transform: `rotate(${rot}deg)`,
            transition: spinning ? 'transform 4.1s cubic-bezier(.15,.85,.25,1)' : 'none',
            boxShadow:
              '0 0 0 7px var(--surface-2), 0 0 0 9px var(--accent), var(--glow-accent)',
            position: 'relative',
          }}
        >
          {PRIZES_VISUAL.map((p, i) => (
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
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'var(--header-grad)',
            border: '3px solid var(--surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
            color: 'var(--accent-ink)',
          }}
        >
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
