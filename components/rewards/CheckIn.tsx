'use client';
/**
 * components/rewards/CheckIn.tsx
 * Pass A port of CheckIn from web-pages2.jsx.
 * Adaptations:
 *   - `app.setWallet()` → `app.claimCheckIn()`
 *   - `app.rewards.checkInClaimed` drives claimed state
 *   - `app.rewards.checkInRewards` drives day reward amounts (minor-units)
 */
import * as React from 'react';
import { useApp } from '@/lib/store/useApp';
import { formatMoney } from '@/lib/money';
import { Card } from '@/components/primitives/Card';
import { Button } from '@/components/primitives/Button';
import { Icon } from '@/components/icons/Icon';

export function CheckIn() {
  const app = useApp();
  const claimed = app.rewards.checkInClaimed.length;
  const rewards = app.rewards.checkInRewards;

  return (
    <Card pad={22}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>
            Daily check-in
          </div>
          <div
            style={{
              fontSize: 12.5,
              color: 'var(--text-mute)',
              fontWeight: 600,
            }}
          >
            Day {claimed + 1} of {rewards.length} · keep your streak
          </div>
        </div>
        <span
          style={{
            fontSize: 12,
            fontWeight: 800,
            color: 'var(--gold)',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          {Icon.fire({ size: 15 })}
          {claimed} day streak
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${rewards.length},1fr)`,
          gap: 9,
          marginBottom: 16,
        }}
      >
        {rewards.map((reward, i) => {
          const done = i < claimed;
          const today = i === claimed;
          return (
            <div
              key={i}
              style={{
                borderRadius: 12,
                padding: '14px 4px',
                textAlign: 'center',
                background: done
                  ? 'color-mix(in srgb,var(--green) 16%,transparent)'
                  : today
                  ? 'var(--header-grad)'
                  : 'var(--surface-2)',
                border:
                  '1px solid ' + (today ? 'transparent' : 'var(--border)'),
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: 4,
                  color: today ? 'var(--accent-ink)' : 'var(--gold)',
                }}
              >
                {done
                  ? Icon.check({ size: 16, color: 'var(--green)' })
                  : Icon.coin({ size: 16 })}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: today
                    ? 'var(--accent-ink)'
                    : done
                    ? 'var(--green)'
                    : 'var(--text-dim)',
                }}
              >
                {formatMoney(reward, { decimals: 0 })}
              </div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  color: today ? 'var(--accent-ink)' : 'var(--text-mute)',
                  opacity: 0.8,
                }}
              >
                Day {i + 1}
              </div>
            </div>
          );
        })}
      </div>

      <Button
        full
        size="lg"
        onClick={() => {
          if (claimed < rewards.length) {
            app.claimCheckIn().then((result) => {
              if (!result.ok) {
                app.pushToast(result.error ?? 'Already claimed', 'info');
              }
            });
          }
        }}
        disabled={claimed >= rewards.length}
      >
        {claimed < rewards.length
          ? `Claim Day ${claimed + 1} · ${formatMoney(rewards[claimed] ?? 0)} USDT`
          : 'All days claimed!'}
      </Button>
    </Card>
  );
}

export default CheckIn;
