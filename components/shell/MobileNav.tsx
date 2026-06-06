'use client';
/**
 * components/shell/MobileNav.tsx — mobile navigation (< 1100 px).
 * Step 13 responsive pass.
 *
 * Renders two pieces, both visible only at <1100px via CSS:
 *   1. Fixed bottom tab bar (.app-mobile-nav) — 4 primary destinations + "More"
 *   2. Slide-out drawer + backdrop — full nav list, VIP card, logout
 *
 * MUST NOT affect the ≥1100 px desktop branch.
 * The `.app-mobile-nav` class is hidden by default in globals.css and revealed
 * only at <1100px via a media query.
 *
 * Z-index stack (ascending):
 *   30 — reserved
 *   40 — backdrop overlay
 *   41 — slide-out drawer panel
 *   42 — bottom tab bar (above overlay so tabs are always tappable)
 */
import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Icon } from '@/components/icons/Icon';
import { NavButton } from '@/components/shell/NavButton';
import { NavLogout } from '@/components/shell/NavLogout';
import { VipMiniCard } from '@/components/shell/VipMiniCard';
import { NAV_ITEMS, ROUTES, keyForPath } from '@/lib/nav';
import { useApp } from '@/lib/store';
import STRINGS from '@/lib/strings';

// 4 primary tabs shown in the fixed bottom bar.
const BOTTOM_TABS = NAV_ITEMS.filter((n) =>
  (['home', 'game', 'wallet', 'rewards'] as string[]).includes(n.key),
);

// Profile + Settings are not in NAV_ITEMS but appear in the drawer.
const EXTRA_NAV = [
  { key: 'profile' as const, route: ROUTES.profile, label: STRINGS.titles.profile, icon: 'user' as const },
  { key: 'settings' as const, route: ROUTES.settings, label: STRINGS.titles.settings, icon: 'settings' as const },
];

interface Props {
  drawerOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export function MobileNav({ drawerOpen, onOpen, onClose }: Props) {
  const app = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const activeKey = keyForPath(pathname);

  function go(route: string) {
    router.push(route);
    onClose();
  }

  return (
    <>
      {/* ── Bottom tab bar ──────────────────────────────────── */}
      {/* zIndex:42 keeps the tab bar above the backdrop overlay (40) so tabs  */}
      {/* remain tappable even when the drawer is open.                        */}
      <nav
        className="app-mobile-nav"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 42,
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          flexDirection: 'row',
          justifyContent: 'space-around',
          padding: '6px 0 max(6px, env(safe-area-inset-bottom))',
          backdropFilter: 'blur(14px)',
        }}
      >
        {BOTTOM_TABS.map((n) => {
          const on = activeKey === n.key;
          return (
            <button
              key={n.key}
              onClick={() => go(n.route)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                padding: '4px 8px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: on ? 'var(--accent)' : 'var(--text-mute)',
                fontFamily: 'inherit',
              }}
            >
              {Icon[n.icon]({ size: 22 })}
              <span style={{ fontSize: 10, fontWeight: 700 }}>{n.label}</span>
            </button>
          );
        })}
        {/* More — opens the drawer */}
        <button
          onClick={drawerOpen ? onClose : onOpen}
          aria-label="More navigation"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            padding: '4px 8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: drawerOpen ? 'var(--accent)' : 'var(--text-mute)',
            fontFamily: 'inherit',
          }}
        >
          {Icon.grid({ size: 22 })}
          <span style={{ fontSize: 10, fontWeight: 700 }}>More</span>
        </button>
      </nav>

      {/* ── Drawer backdrop ─────────────────────────────────── */}
      {drawerOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            zIndex: 40,
            animation: 'fadeIn 0.18s ease-out',
          }}
        />
      )}

      {/* ── Slide-out drawer ──────────────────────────────── */}
      {drawerOpen && (
        <aside
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            width: 280,
            background: 'var(--surface)',
            borderRight: '1px solid var(--border)',
            zIndex: 41,
            display: 'flex',
            flexDirection: 'column',
            padding: '22px 16px',
            overflowY: 'auto',
            animation: 'drawerIn 0.22s ease-out',
          }}
        >
          {/* Brand + close */}
          <div
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}
          >
            <div
              onClick={() => go(ROUTES.home)}
              style={{ display: 'flex', alignItems: 'center', gap: 11, cursor: 'pointer' }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: 'var(--header-grad)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--glow-accent)',
                }}
              >
                {Icon.target({ size: 22, color: 'var(--accent-ink)' })}
              </div>
              <div style={{ fontSize: 17, fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>
                {STRINGS.app.namePrefix}
                <span style={{ color: 'var(--accent)' }}>{STRINGS.app.nameSuffix}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close navigation"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'var(--surface-2)',
                border: 'none',
                color: 'var(--text-mute)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              {Icon.x({ size: 18 })}
            </button>
          </div>

          {/* Full nav list */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
            {NAV_ITEMS.map((n) => (
              <NavButton
                key={n.key}
                label={n.label}
                icon={n.icon}
                active={activeKey === n.key}
                onClick={() => go(n.route)}
              />
            ))}
            {EXTRA_NAV.map((n) => (
              <NavButton
                key={n.key}
                label={n.label}
                icon={n.icon}
                active={activeKey === n.key}
                onClick={() => go(n.route)}
              />
            ))}
          </nav>

          {/* VIP card */}
          <div style={{ margin: '12px 0' }}>
            <VipMiniCard
              level={app.vip.level}
              name={app.vip.name}
              points={app.vip.points}
              next={app.vip.next}
              onClick={() => go(ROUTES.vip)}
            />
          </div>

          {/* Logout */}
          <NavLogout
            onLogout={() => {
              app.setAuthed(false);
              router.replace('/');
            }}
          />
        </aside>
      )}
    </>
  );
}

export default MobileNav;
