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
  <div style={{ padding: '24px 28px 48px', maxWidth: w, margin: '0 auto' }}>
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
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '380px 1fr',
          gap: 18,
          alignItems: 'start',
        }}
      >
        <SpinWheel />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <CheckIn />
          <Card pad={22}>
            <div
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: 'var(--text)',
                marginBottom: 14,
              }}
            >
              Daily missions
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                    style={{ display: 'flex', alignItems: 'center', gap: 13 }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        background: 'var(--glass)',
                        border: '1px solid var(--glass-brd)',
                        color: 'var(--accent-2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {Icon[iconKey as keyof typeof Icon]?.({ size: 20 })}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: 'var(--text)',
                        }}
                      >
                        {m.label}
                      </div>
                      <div
                        style={{
                          height: 5,
                          borderRadius: 3,
                          background: 'var(--surface-2)',
                          overflow: 'hidden',
                          margin: '7px 0 4px',
                        }}
                      >
                        <div
                          style={{
                            width:
                              Math.min(100, (m.progress / m.goal) * 100) + '%',
                            height: '100%',
                            background: 'var(--header-grad)',
                          }}
                        />
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--text-mute)',
                          fontWeight: 600,
                        }}
                      >
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
