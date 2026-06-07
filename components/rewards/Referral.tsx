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
  <div style={{ maxWidth: w }} className="pt-6 px-4 app:px-7 pb-12 mx-auto">
    {children}
  </div>
);

const H2 = ({ children }: { children: React.ReactNode }) => (
  <div className="text-base font-extrabold text-text mt-1 mx-0.5 mb-3.5">
    {children}
  </div>
);

export function Referral() {
  const app = useApp();
  const code = 'ACE2026';
  const link = 'aurawin.gg/r/' + code;

  return (
    <Wrap w={1080}>
      <div className="grid grid-cols-1 app:grid-cols-[1.2fr_1fr] gap-[18px] mb-[18px]">
        <Card
          glow
          pad={26}
          style={{
            background:
              'linear-gradient(135deg, color-mix(in srgb,var(--green) 14%,var(--surface)), var(--surface))',
          }}
        >
          <div className="text-xs text-[var(--text-dim)] font-bold">
            LIFETIME COMMISSION
          </div>
          <div className="text-[40px] font-black text-green mt-1 mb-[18px]">
            {formatMoney(app.wallet.referral)} USDT
          </div>
          <div className="flex gap-3 items-center">
            <div className="flex-1 bg-[var(--surface-2)] border border-dashed border-[var(--border)] rounded-xl py-3.5 px-4">
              <div className="text-[10.5px] text-[var(--text-mute)] font-bold">
                INVITE LINK
              </div>
              <div className="text-[15px] font-extrabold text-text">
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

        <div className="grid grid-cols-3 gap-3.5">
          {(
            [
              ['Team', '128', 'users'],
              ['Active', '54', 'fire'],
              ['Turnover', '92K', 'trend'],
            ] as const
          ).map((s, i) => (
            <Card key={i} pad={18} style={{ textAlign: 'center' }}>
              <div className="text-[var(--accent-2)] flex justify-center mb-2">
                {Icon[s[2]]?.({ size: 20 })}
              </div>
              <div className="text-[22px] font-black text-text">
                {s[1]}
              </div>
              <div className="text-[11px] text-[var(--text-mute)] font-semibold">
                {s[0]}
              </div>
            </Card>
          ))}
        </div>
      </div>

      <H2>Commission levels</H2>
      <div className="grid grid-cols-1 md:grid-cols-[repeat(3,1fr)] gap-3.5">
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
              className="size-11 rounded-xl flex items-center justify-center font-black text-[15px]"
              style={{
                background: `color-mix(in srgb,${l[3]} 18%,transparent)`,
                color: l[3],
              }}
            >
              L{i + 1}
            </div>
            <div className="flex-1">
              <div className="text-[14.5px] font-bold text-text">
                {l[0]}
              </div>
              <div className="text-xs text-[var(--text-mute)] font-semibold">
                {l[1]}
              </div>
            </div>
            <div className="text-2xl font-black" style={{ color: l[3] }}>
              {l[2]}
            </div>
          </Card>
        ))}
      </div>
    </Wrap>
  );
}

export default Referral;
