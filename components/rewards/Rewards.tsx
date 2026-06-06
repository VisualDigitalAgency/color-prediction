'use client';
/**
 * components/rewards/Rewards.tsx — WebRewards screen.
 * Pass A port of web-pages2.jsx WebRewards.
 * Adaptations:
 *   - Missions from `app.rewards.missions` (store), not hardcoded
 *   - `app.claimMission(id)` for mission claims
 */
import * as React from 'react';
import { useApp } from '@/lib/store/useApp';
import { formatMoney } from '@/lib/money';
import { Card } from '@/components/primitives/Card';
import { Button } from '@/components/primitives/Button';
import { Icon } from '@/components/icons/Icon';
import { SpinWheel } from './SpinWheel';
import { CheckIn } from './CheckIn';

const Wrap = ({
  children,
  w = 1080,
}: {
  children: React.ReactNode;
  w?: number;
}) => (
  <div className="pt-6 px-7 pb-12 mx-auto" style={{ maxWidth: w }}>
    {children}
  </div>
);

const MISSION_ICONS: Record<string, string> = {
  bets: 'target',
  deposit: 'wallet',
  referral: 'users',
};

export function Rewards() {
  const app = useApp();
  const missions = app.rewards.missions;

  return (
    <Wrap w={1080}>
      <div className="grid grid-cols-[380px_1fr] gap-[18px] items-start">
        <SpinWheel />
        <div className="flex flex-col gap-[18px]">
          <CheckIn />
          <Card pad={22}>
            <div className="text-base font-extrabold text-text mb-3.5">
              Daily missions
            </div>
            <div className="flex flex-col gap-3">
              {missions.map((m) => {
                const iconKey =
                  m.id.includes('bet')
                    ? 'target'
                    : m.id.includes('deposit')
                    ? 'wallet'
                    : 'users';
                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-[13px]"
                  >
                    <div className="size-10 rounded-xl bg-[var(--glass)] border border-[var(--glass-brd)] text-[var(--accent-2)] flex items-center justify-center">
                      {Icon[iconKey as keyof typeof Icon]?.({ size: 20 })}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-text">
                        {m.label}
                      </div>
                      <div className="h-[5px] rounded-[3px] bg-[var(--surface-2)] overflow-hidden mt-[7px] mb-1">
                        <div
                          style={{
                            width:
                              Math.min(100, (m.progress / m.goal) * 100) + '%',
                            height: '100%',
                            background: 'var(--header-grad)',
                          }}
                        />
                      </div>
                      <div className="text-[11px] text-[var(--text-mute)] font-semibold">
                        {m.progress}/{m.goal} · +{formatMoney(m.reward)} USDT
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={m.done ? 'primary' : 'ghost'}
                      disabled={!m.done}
                      onClick={() => {
                        if (m.done) {
                          app.claimMission(m.id).then((result) => {
                            if (!result.ok)
                              app.pushToast(
                                result.error ?? 'Already claimed',
                                'info',
                              );
                          });
                        }
                      }}
                    >
                      {m.done ? 'Claim' : 'Go'}
                    </Button>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </Wrap>
  );
}

export default Rewards;
