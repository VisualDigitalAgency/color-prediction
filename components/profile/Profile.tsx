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
  <div className="pt-6 px-4 app:px-7 pb-12 mx-auto" style={{ maxWidth: w }}>
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
        <div className="size-16 rounded-[18px] bg-[var(--header-grad)] flex items-center justify-center font-black text-[var(--accent-ink)] text-[26px]">
          {initial}
        </div>
        <div className="flex-1">
          <div className="text-xl font-extrabold text-text">
            {handle}
          </div>
          <div className="text-[13px] text-[var(--text-mute)] font-semibold">
            UID {uid} · joined {joined}
          </div>
          <span className="inline-flex items-center gap-[5px] mt-2 text-[11.5px] font-extrabold text-[var(--gold)] bg-[var(--glass)] border border-[var(--glass-brd)] py-1 px-[11px] rounded-full">
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
            className="flex items-center gap-3.5 w-full py-[15px] px-3.5 bg-transparent border-0 cursor-pointer text-left"
            style={{
              borderBottom:
                i < rows.length - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            <div className="size-[38px] rounded-[11px] bg-[var(--surface-2)] text-[var(--accent-2)] flex items-center justify-center">
              {Icon[r[2] as keyof typeof Icon]?.({ size: 19 })}
            </div>
            <div className="flex-1">
              <div className="text-[14.5px] font-bold text-text">
                {r[0]}
              </div>
              <div className="text-xs text-[var(--text-mute)] font-semibold">
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
