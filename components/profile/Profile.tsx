'use client';
/**
 * components/profile/Profile.tsx — WebProfile screen.
 * Pass A port of web-pages2.jsx WebProfile.
 */
import * as React from 'react';
import { useApp } from '@/lib/store/useApp';
import { Card } from '@/components/primitives/Card';
import { Button } from '@/components/primitives/Button';
import { Icon } from '@/components/icons/Icon';

const Wrap = ({
  children,
  w = 760,
}: {
  children: React.ReactNode;
  w?: number;
}) => (
  <div style={{ padding: '24px 28px 48px', maxWidth: w, margin: '0 auto' }}>
    {children}
  </div>
);

export function Profile() {
  const app = useApp();

  const rows: [string, string, string, string | null][] = [
    ['KYC verification', 'Level 1 · partially verified', 'shield', null],
    ['Security & 2FA', 'Password, 2FA, sessions', 'lock', null],
    ['Notification settings', 'Email, push, in-app', 'bell', null],
    ['Linked devices', '2 active sessions', 'phone', null],
    ['Help & support', '24/7 live chat', 'headset', null],
  ];

  const handle = 'player_ace';
  const uid = '88204417';
  const joined = 'Mar 2026';
  const initial = 'A';

  return (
    <Wrap w={760}>
      <Card
        pad={24}
        style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 16 }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: 'var(--header-grad)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            color: 'var(--accent-ink)',
            fontSize: 26,
          }}
        >
          {initial}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>
            {handle}
          </div>
          <div
            style={{ fontSize: 13, color: 'var(--text-mute)', fontWeight: 600 }}
          >
            UID {uid} · joined {joined}
          </div>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              marginTop: 8,
              fontSize: 11.5,
              fontWeight: 800,
              color: 'var(--gold)',
              background: 'var(--glass)',
              border: '1px solid var(--glass-brd)',
              padding: '4px 11px',
              borderRadius: 999,
            }}
          >
            {Icon.diamond({ size: 13 })}
            VIP {app.vip.level} {app.vip.name}
          </span>
        </div>
        <Button
          variant="ghost"
          onClick={() => app.pushToast('Edit profile', 'info')}
        >
          Edit
        </Button>
      </Card>

      <Card pad={6}>
        {rows.map((r, i) => (
          <button
            key={i}
            onClick={() =>
              app.pushToast(r[0], 'info')
            }
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              width: '100%',
              padding: '15px 14px',
              background: 'none',
              border: 'none',
              borderBottom:
                i < rows.length - 1 ? '1px solid var(--border)' : 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                background: 'var(--surface-2)',
                color: 'var(--accent-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {Icon[r[2] as keyof typeof Icon]?.({ size: 19 })}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text)' }}
              >
                {r[0]}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-mute)',
                  fontWeight: 600,
                }}
              >
                {r[1]}
              </div>
            </div>
            {Icon.chevR({ size: 18, color: 'var(--text-mute)' })}
          </button>
        ))}
      </Card>
    </Wrap>
  );
}

export default Profile;
