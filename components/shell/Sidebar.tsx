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
 *
 * Pass-B note: `className="app-sidebar"` paired with `.app-sidebar { display:none
 * !important }` in globals.css hides this element on mobile. The `!important` is
 * required to override the inline `display:'flex'` on the <aside>. When Pass-B
 * Tailwind refactor runs, preserve the className and keep `display` as a Tailwind
 * utility so the media-query override continues to work.
 */

'use client';

import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

import { Icon } from '@/components/icons/Icon';
import { NavButton } from '@/components/shell/NavButton';
import { NavLogout } from '@/components/shell/NavLogout';
import { VipMiniCard } from '@/components/shell/VipMiniCard';
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
      className="app-sidebar"
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
        {NAV_ITEMS.map((n) => (
          <NavButton
            key={n.key}
            label={n.label}
            icon={n.icon}
            active={activeKey === n.key}
            badge={n.badge}
            onClick={() => router.push(n.route)}
          />
        ))}
      </nav>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
        <NavButton
          label={STRINGS.titles.profile}
          icon="user"
          active={activeKey === 'profile'}
          onClick={() => router.push(ROUTES.profile)}
        />
        <NavButton
          label={STRINGS.titles.settings}
          icon="settings"
          active={activeKey === 'settings'}
          onClick={() => router.push(ROUTES.settings)}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <VipMiniCard
          level={app.vip.level}
          name={app.vip.name}
          points={app.vip.points}
          next={app.vip.next}
          onClick={() => router.push(ROUTES.vip)}
        />
      </div>

      <NavLogout
        onLogout={async () => {
          const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          );
          await supabase.auth.signOut();
          app.setAuthed(false);
          router.refresh();
          router.replace('/');
        }}
      />
    </aside>
  );
}

export default Sidebar;
