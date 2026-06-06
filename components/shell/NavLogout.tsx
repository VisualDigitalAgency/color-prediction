'use client';
/**
 * components/shell/NavLogout.tsx — shared logout button for Sidebar + MobileNav.
 * Adding a confirmation dialog or audit log only needs one change here.
 */
import * as React from 'react';
import { Icon } from '@/components/icons/Icon';
import STRINGS from '@/lib/strings';

export interface NavLogoutProps {
  onLogout: () => void;
}

export function NavLogout({ onLogout }: NavLogoutProps) {
  return (
    <button
      onClick={onLogout}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 13px',
        background: 'none',
        border: 'none',
        color: 'var(--text-mute)',
        fontFamily: 'inherit',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {Icon.chevL({ size: 16 })}
      {STRINGS.nav.logOut}
    </button>
  );
}

export default NavLogout;
