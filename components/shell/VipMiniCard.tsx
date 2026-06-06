'use client';
/**
 * components/shell/VipMiniCard.tsx — shared VIP progress card.
 * Used by both Sidebar and MobileNav so a tier rename or bar color change
 * stays in one place. Guards vip.next === 0 to prevent Infinity% bar width.
 */
import * as React from 'react';
import { Icon } from '@/components/icons/Icon';

export interface VipMiniCardProps {
  level: number;
  name: string;
  points: number;
  next: number;
  onClick: () => void;
}

export function VipMiniCard({ level, name, points, next, onClick }: VipMiniCardProps) {
  const pct = next > 0 ? Math.round((points / next) * 100) : 100;

  return (
    <div
      onClick={onClick}
      style={{
        background:
          'linear-gradient(135deg, color-mix(in srgb,var(--violet) 22%,var(--surface-2)), var(--surface-2))',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: 14,
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 9,
            background: 'var(--header-grad)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-ink)',
          }}
        >
          {Icon.diamond({ size: 17 })}
        </div>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>
          {'VIP ' + level + ' · ' + name}
        </div>
      </div>
      <div
        style={{ height: 6, borderRadius: 3, background: 'var(--surface)', overflow: 'hidden' }}
      >
        <div
          style={{ width: pct + '%', height: '100%', background: 'var(--header-grad)' }}
        />
      </div>
      {next > 0 && (
        <div style={{ fontSize: 10.5, color: 'var(--text-mute)', fontWeight: 600, marginTop: 6 }}>
          {(next - points).toLocaleString() + ' XP to next tier'}
        </div>
      )}
    </div>
  );
}

export default VipMiniCard;
