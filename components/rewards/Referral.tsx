'use client';
/**
 * components/rewards/Referral.tsx — WebReferral screen.
 * Pass A port of web-pages2.jsx WebReferral.
 */
import * as React from 'react';
import { useApp } from '@/lib/store/useApp';
import { formatMoney } from '@/lib/money';
import { Card } from '@/components/primitives/Card';
import { Button } from '@/components/primitives/Button';
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

export function Referral() {
  const app = useApp();
  const code = 'ACE2026';
  const link = 'aurawin.gg/r/' + code;

  return (
    <Wrap w={1080}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: 18,
          marginBottom: 18,
        }}
      >
        <Card
          glow
          pad={26}
          style={{
            background:
              'linear-gradient(135deg, color-mix(in srgb,var(--green) 14%,var(--surface)), var(--surface))',
          }}
        >
          <div
            style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 700 }}
          >
            LIFETIME COMMISSION
          </div>
          <div
            style={{
              fontSize: 40,
              fontWeight: 900,
              color: 'var(--green)',
              margin: '4px 0 18px',
            }}
          >
            {formatMoney(app.wallet.referral)} USDT
          </div>
          <div
            style={{ display: 'flex', gap: 12, alignItems: 'center' }}
          >
            <div
              style={{
                flex: 1,
                background: 'var(--surface-2)',
                border: '1px dashed var(--border)',
                borderRadius: 12,
                padding: '14px 16px',
              }}
            >
              <div
                style={{
                  fontSize: 10.5,
                  color: 'var(--text-mute)',
                  fontWeight: 700,
                }}
              >
                INVITE LINK
              </div>
              <div
                style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}
              >
                {link}
              </div>
            </div>
            <Button
              size="lg"
              icon="copy"
              onClick={() => {
                if (typeof navigator !== 'undefined')
                  navigator.clipboard?.writeText(link);
                app.pushToast('Invite link copied', 'success');
              }}
            >
              Copy
            </Button>
          </div>
        </Card>

        <div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}
        >
          {(
            [
              ['Team', '128', 'users'],
              ['Active', '54', 'fire'],
              ['Turnover', '92K', 'trend'],
            ] as const
          ).map((s, i) => (
            <Card key={i} pad={18} style={{ textAlign: 'center' }}>
              <div
                style={{
                  color: 'var(--accent-2)',
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: 8,
                }}
              >
                {Icon[s[2]]?.({ size: 20 })}
              </div>
              <div
                style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)' }}
              >
                {s[1]}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-mute)',
                  fontWeight: 600,
                }}
              >
                {s[0]}
              </div>
            </Card>
          ))}
        </div>
      </div>

      <H2>Commission levels</H2>
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}
      >
        {(
          [
            ['Level 1', 'Direct invites', '30%', 'var(--green)'],
            ['Level 2', 'Their invites', '15%', 'var(--violet)'],
            ['Level 3', 'Extended team', '5%', 'var(--gold)'],
          ] as const
        ).map((l, i) => (
          <Card
            key={i}
            pad={20}
            style={{ display: 'flex', alignItems: 'center', gap: 14 }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: `color-mix(in srgb,${l[3]} 18%,transparent)`,
                color: l[3],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: 15,
              }}
            >
              L{i + 1}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text)' }}
              >
                {l[0]}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-mute)',
                  fontWeight: 600,
                }}
              >
                {l[1]}
              </div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: l[3] }}>
              {l[2]}
            </div>
          </Card>
        ))}
      </div>
    </Wrap>
  );
}

export default Referral;
