'use client';
/**
 * components/shell/NavButton.tsx — shared nav item button.
 * Used by both Sidebar (desktop) and MobileNav drawer (mobile) so style changes
 * apply to both in one place. Badge prop carries the "LIVE" pulse for the game tab.
 */
import * as React from 'react';
import { Icon, type IconName } from '@/components/icons/Icon';

export interface NavButtonProps {
  label: string;
  icon: IconName;
  active: boolean;
  onClick: () => void;
  badge?: string;
}

export function NavButton({ label, icon, active, badge, onClick }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '11px 13px',
        borderRadius: 'var(--radius-sm)',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: 14,
        fontWeight: 700,
        textAlign: 'left',
        width: '100%',
        background: active
          ? 'color-mix(in srgb, var(--accent) 16%, transparent)'
          : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text-dim)',
        position: 'relative',
      }}
    >
      {active && (
        <span
          style={{
            position: 'absolute',
            left: 0,
            top: 10,
            bottom: 10,
            width: 3,
            borderRadius: 3,
            background: 'var(--accent)',
          }}
        />
      )}
      {Icon[icon]({ size: 20 })}
      <span style={{ flex: 1 }}>{label}</span>
      {badge && (
        <span
          style={{
            fontSize: 8.5,
            fontWeight: 800,
            color: 'var(--green)',
            display: 'flex',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 4,
              background: 'var(--green)',
              boxShadow: 'var(--glow-green)',
              animation: 'pulse 1.4s infinite',
            }}
          />
          {badge}
        </span>
      )}
    </button>
  );
}

export default NavButton;
