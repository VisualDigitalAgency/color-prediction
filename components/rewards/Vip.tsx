'use client';
/**
 * components/rewards/Vip.tsx — WebVip screen.
 * Pass A port of web-pages2.jsx WebVip.
 */
import * as React from 'react';
import { useApp } from '@/lib/store/useApp';
import { Card } from '@/components/primitives/Card';
import { Icon } from '@/components/icons/Icon';

const Wrap = ({
  children,
  w = 1080,
}: {
  children: React.ReactNode;
  w?: number;
}) => (
  <div style={{ padding: '24px 28px 48px', maxWidth: w, margin: '0 auto' }}>
    {children}
  </div>
);

const H2 = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      fontSize: 16,
      fontWeight: 800,
      color: 'var(--text)',
      margin: '4px 2px 14px',
    }}
  >
    {children}
  </div>
);

const TIERS = [
  [1, 'Bronze', '0', '0.3%', '#cd7f4a'],
  [2, 'Silver', '2K', '0.5%', '#b8c0cc'],
  [3, 'Platinum', '6K', '0.8%', '#1fe0ff'],
  [4, 'Diamond', '20K', '1.2%', '#8b5cff'],
  [5, 'Crown', '80K', '1.8%', '#ffc63d'],
] as const;

export function Vip() {
  const app = useApp();
  const pct = Math.round((app.vip.points / app.vip.next) * 100);

  return (
    <Wrap w={1080}>
      <Card
        glow
        pad={26}
        style={{
          marginBottom: 18,
          background:
            'linear-gradient(135deg, var(--surface), color-mix(in srgb,var(--violet) 14%,var(--surface)))',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: 17,
              background: 'var(--header-grad)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-ink)',
            }}
          >
            {Icon.diamond({ size: 30 })}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)' }}>
              VIP {app.vip.level} · {app.vip.name}
            </div>
            <div
              style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 600 }}
            >
              {app.vip.points.toLocaleString()} / {app.vip.next.toLocaleString()}{' '}
              XP
            </div>
          </div>
        </div>
        <div
          style={{
            height: 10,
            borderRadius: 5,
            background: 'var(--surface-2)',
            overflow: 'hidden',
            marginBottom: 6,
          }}
        >
          <div
            style={{
              width: pct + '%',
              height: '100%',
              background: 'var(--header-grad)',
            }}
          />
        </div>
        <div
          style={{ fontSize: 12, color: 'var(--text-mute)', fontWeight: 600 }}
        >
          {(app.vip.next - app.vip.points).toLocaleString()} XP to Diamond
        </div>
      </Card>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4,1fr)',
          gap: 14,
          marginBottom: 24,
        }}
      >
        {(
          [
            ['Daily cashback', '0.8%', 'gift'],
            ['Weekly bonus', '120 USDT', 'trophy'],
            ['Loss rebate', 'up to 5%', 'shield'],
            ['Withdraw limit', '50K/day', 'arrowUp'],
          ] as const
        ).map((b, i) => (
          <Card key={i} pad={18}>
            <div style={{ color: 'var(--accent-2)', marginBottom: 8 }}>
              {Icon[b[2]]?.({ size: 22 })}
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)' }}>
              {b[1]}
            </div>
            <div
              style={{
                fontSize: 11.5,
                color: 'var(--text-mute)',
                fontWeight: 600,
              }}
            >
              {b[0]}
            </div>
          </Card>
        ))}
      </div>

      <H2>All tiers</H2>
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14 }}
      >
        {TIERS.map((t) => (
          <Card
            key={t[0]}
            pad={18}
            style={{
              textAlign: 'center',
              border:
                t[0] === app.vip.level
                  ? '1px solid var(--accent)'
                  : '1px solid var(--border)',
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 13,
                margin: '0 auto 10px',
                background: `color-mix(in srgb,${t[4]} 22%,transparent)`,
                color: t[4],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: 16,
              }}
            >
              {t[0]}
            </div>
            <div
              style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--text)' }}
            >
              {t[1]}
            </div>
            <div
              style={{
                fontSize: 11.5,
                color: 'var(--text-mute)',
                fontWeight: 600,
                marginTop: 3,
              }}
            >
              {t[2]} XP
            </div>
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                color: t[4],
                marginTop: 6,
              }}
            >
              {t[3]} cashback
            </div>
            {t[0] === app.vip.level && (
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: 'var(--accent)',
                  marginTop: 8,
                }}
              >
                CURRENT
              </div>
            )}
          </Card>
        ))}
      </div>
    </Wrap>
  );
}

export default Vip;
