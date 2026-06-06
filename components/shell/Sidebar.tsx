/**
 * components/shell/Sidebar.tsx — desktop (≥1100px) left navigation rail.
 *
 * Ported VERBATIM from the CDN prototype (`/tmp/proto_extract/web/web-shell.jsx`
 * `Sidebar`). Pass A (inline-parity): every `style={{…}}` object is byte-identical
 * to the prototype — 248px width, the `color-mix(in srgb, var(--accent) 16%, …)`
 * active highlight, the brand mark, VIP card and log-out row all reference
 * `var(--…)`, never hardcoded hex. Tailwind refactor is Pass B.
 *
 * Routing change (ADR 0003): the prototype's in-memory `app.navigate(key)` is
 * replaced by real App Router navigation. The active item is derived from
 * `usePathname()` via `lib/nav.ts keyForPath`, not from `app.screen`.
 */

'use client';

import { usePathname, useRouter } from 'next/navigation';

import { Icon } from '@/components/icons/Icon';
import { NAV_ITEMS, ROUTES, keyForPath } from '@/lib/nav';
import { useApp } from '@/lib/store';
import STRINGS from '@/lib/strings';

export function Sidebar() {
  const app = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const activeKey = keyForPath(pathname);

  return (
    <aside
      style={{
        width: 248,
        flexShrink: 0,
        height: '100%',
        alignSelf: 'stretch',
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '22px 16px',
      }}
    >
      <div
        onClick={() => router.push(ROUTES.home)}
        style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '0 8px 22px', cursor: 'pointer' }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 13,
            background: 'var(--header-grad)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--glow-accent)',
          }}
        >
          {Icon.target({ size: 24, color: 'var(--accent-ink)' })}
        </div>
        <div>
          <div style={{ fontSize: 19, fontWeight: 900, color: 'var(--text)', letterSpacing: '.5px', lineHeight: 1 }}>
            {STRINGS.app.namePrefix}
            <span style={{ color: 'var(--accent)' }}>{STRINGS.app.nameSuffix}</span>
          </div>
          <div style={{ fontSize: 8.5, color: 'var(--text-mute)', fontWeight: 700, letterSpacing: '2.5px', marginTop: 3 }}>
            {STRINGS.app.subtitle}
          </div>
        </div>
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        {NAV_ITEMS.map((n) => {
          const on = activeKey === n.key;
          return (
            <button
              key={n.key}
              onClick={() => router.push(n.route)}
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
                transition: 'all .15s',
              }}
            >
              {on && (
                <span
                  style={{ position: 'absolute', left: 0, top: 10, bottom: 10, width: 3, borderRadius: 3, background: 'var(--accent)' }}
                />
              )}
              {Icon[n.icon]({ size: 20 })}
              <span style={{ flex: 1 }}>{n.label}</span>
              {n.badge && (
                <span
                  style={{ fontSize: 8.5, fontWeight: 800, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 3 }}
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
                  {n.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      <div
        onClick={() => router.push(ROUTES.vip)}
        style={{
          background: 'linear-gradient(135deg, color-mix(in srgb,var(--violet) 22%,var(--surface-2)), var(--surface-2))',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: 14,
          cursor: 'pointer',
          marginBottom: 12,
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
            {'VIP ' + app.vip.level + ' · ' + app.vip.name}
          </div>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: 'var(--surface)', overflow: 'hidden' }}>
          <div
            style={{ width: Math.round((app.vip.points / app.vip.next) * 100) + '%', height: '100%', background: 'var(--header-grad)' }}
          />
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--text-mute)', fontWeight: 600, marginTop: 6 }}>
          {(app.vip.next - app.vip.points).toLocaleString() + ' XP to next tier'}
        </div>
      </div>
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
  );
}

export default Sidebar;
