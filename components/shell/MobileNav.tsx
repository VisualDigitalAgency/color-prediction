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
 * only at <1100px via a media query (no inline display:none needed).
 */
import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Icon } from '@/components/icons/Icon';
import { NAV_ITEMS, ROUTES, keyForPath } from '@/lib/nav';
import { useApp } from '@/lib/store';
import STRINGS from '@/lib/strings';

// 4 primary tabs shown in the fixed bottom bar.
const BOTTOM_TABS = NAV_ITEMS.filter((n) =>
  ['home', 'game', 'wallet', 'rewards'].includes(n.key),
);

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
      <nav
        className="app-mobile-nav"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 30,
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

      {/* ── Drawer overlay ─────────────────────────────────── */}
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
              <div>
                <div style={{ fontSize: 17, fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>
                  {STRINGS.app.namePrefix}
                  <span style={{ color: 'var(--accent)' }}>{STRINGS.app.nameSuffix}</span>
                </div>
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
            {NAV_ITEMS.map((n) => {
              const on = activeKey === n.key;
              return (
                <button
                  key={n.key}
                  onClick={() => go(n.route)}
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
                    background: on ? 'color-mix(in srgb, var(--accent) 16%, transparent)' : 'transparent',
                    color: on ? 'var(--accent)' : 'var(--text-dim)',
                    position: 'relative',
                  }}
                >
                  {on && (
                    <span
                      style={{ position: 'absolute', left: 0, top: 10, bottom: 10, width: 3, borderRadius: 3, background: 'var(--accent)' }}
                    />
                  )}
                  {Icon[n.icon]({ size: 20 })}
                  <span style={{ flex: 1 }}>{n.label}</span>
                </button>
              );
            })}
            {/* Profile & Settings links */}
            {([
              { key: 'profile', route: ROUTES.profile, label: STRINGS.titles.profile, icon: 'user' },
              { key: 'settings', route: ROUTES.settings, label: STRINGS.titles.settings, icon: 'settings' },
            ] as const).map((n) => {
              const on = activeKey === n.key;
              return (
                <button
                  key={n.key}
                  onClick={() => go(n.route)}
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
                    background: on ? 'color-mix(in srgb, var(--accent) 16%, transparent)' : 'transparent',
                    color: on ? 'var(--accent)' : 'var(--text-dim)',
                    position: 'relative',
                  }}
                >
                  {on && (
                    <span
                      style={{ position: 'absolute', left: 0, top: 10, bottom: 10, width: 3, borderRadius: 3, background: 'var(--accent)' }}
                    />
                  )}
                  {Icon[n.icon]({ size: 20 })}
                  <span>{n.label}</span>
                </button>
              );
            })}
          </nav>

          {/* VIP mini card */}
          <div
            onClick={() => go(ROUTES.vip)}
            style={{
              background: 'linear-gradient(135deg, color-mix(in srgb,var(--violet) 22%,var(--surface-2)), var(--surface-2))',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: 14,
              cursor: 'pointer',
              margin: '12px 0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: 'var(--header-grad)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-ink)',
                }}
              >
                {Icon.diamond({ size: 15 })}
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>
                {'VIP ' + app.vip.level + ' · ' + app.vip.name}
              </div>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: 'var(--surface-3)', overflow: 'hidden' }}>
              <div
                style={{ width: Math.round((app.vip.points / app.vip.next) * 100) + '%', height: '100%', background: 'var(--header-grad)' }}
              />
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={() => {
              app.setAuthed(false);
              router.replace('/');
            }}
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
        </aside>
      )}
    </>
  );
}

export default MobileNav;
