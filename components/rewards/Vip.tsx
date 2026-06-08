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
  <div style={{ maxWidth: w }} className="pt-6 px-4 app:px-7 pb-12 mx-auto">
    {children}
  </div>
);

const H2 = ({ children }: { children: React.ReactNode }) => (
  <div className="text-base font-extrabold text-text mt-1 mx-0.5 mb-3.5">
    {children}
  </div>
);

const TIERS = [
  [1, 'Bronze',   '0',   '0.3%', '#cd7f4a'],
  [2, 'Silver',   '2K',  '0.5%', '#b8c0cc'],
  [3, 'Platinum', '6K',  '0.8%', 'var(--accent-2)'],
  [4, 'Diamond',  '20K', '1.2%', 'var(--violet)'],
  [5, 'Crown',    '80K', '1.8%', 'var(--gold)'],
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
        <div className="flex items-center gap-3.5 mb-[18px]">
          <div className="size-[58px] rounded-[17px] bg-[var(--header-grad)] flex items-center justify-center text-[var(--accent-ink)]">
            {Icon.diamond({ size: 30 })}
          </div>
          <div className="flex-1">
            <div className="text-[22px] font-black text-text">
              VIP {app.vip.level} · {app.vip.name}
            </div>
            <div className="text-[13px] text-[var(--text-dim)] font-semibold">
              {app.vip.points.toLocaleString()} / {app.vip.next.toLocaleString()}{' '}
              XP
            </div>
          </div>
        </div>
        <div className="h-[10px] rounded-[5px] bg-[var(--surface-2)] overflow-hidden mb-1.5">
          <div
            style={{
              width: pct + '%',
              height: '100%',
              background: 'var(--header-grad)',
            }}
          />
        </div>
        <div className="text-xs text-[var(--text-mute)] font-semibold">
          {(app.vip.next - app.vip.points).toLocaleString()} XP to Diamond
        </div>
      </Card>

      <div className="grid grid-cols-2 app:grid-cols-[repeat(4,1fr)] gap-3.5 mb-6">
        {(
          [
            ['Daily cashback', '0.8%', 'gift'],
            ['Weekly bonus', '120 USDT', 'trophy'],
            ['Loss rebate', 'up to 5%', 'shield'],
            ['Withdraw limit', '50K/day', 'arrowUp'],
          ] as const
        ).map((b, i) => (
          <Card key={i} pad={18}>
            <div className="text-[var(--accent-2)] mb-2">
              {Icon[b[2]]?.({ size: 22 })}
            </div>
            <div className="text-xl font-black text-text">
              {b[1]}
            </div>
            <div className="text-[11.5px] text-[var(--text-mute)] font-semibold">
              {b[0]}
            </div>
          </Card>
        ))}
      </div>

      <H2>All tiers</H2>
      <div className="grid grid-cols-2 sm:grid-cols-3 app:grid-cols-[repeat(5,1fr)] gap-3.5">
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
              className="size-11 rounded-[13px] mx-auto mb-2.5 flex items-center justify-center font-black text-base"
              style={{
                background: `color-mix(in srgb,${t[4]} 22%,transparent)`,
                color: t[4],
              }}
            >
              {t[0]}
            </div>
            <div className="text-[14.5px] font-extrabold text-text">
              {t[1]}
            </div>
            <div className="text-[11.5px] text-[var(--text-mute)] font-semibold mt-[3px]">
              {t[2]} XP
            </div>
            <div
              className="text-[12.5px] font-bold mt-1.5"
              style={{ color: t[4] }}
            >
              {t[3]} cashback
            </div>
            {t[0] === app.vip.level && (
              <div className="text-[10px] font-extrabold text-[var(--accent)] mt-2">
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
