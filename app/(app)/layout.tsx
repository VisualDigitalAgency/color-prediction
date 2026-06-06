/**
 * app/(app)/layout.tsx — the authenticated route-group shell.
 *
 * Renders the desktop (≥1100px) chrome around every authed screen, ported
 * VERBATIM from the prototype `WebFrame` authed branch
 * (`/tmp/proto_extract/web/web-app.jsx`): an outer `display:flex` row with the
 * 248px `<Sidebar/>`, then a flex column holding the sticky `<TopBar/>` and a
 * scrollable `<main>` content area. Every `style={{…}}` object is byte-identical
 * to the prototype; all colors are `var(--…)` tokens.
 *
 * ROUTING (ADR 0003): the prototype kept `app.screen` in memory and indexed
 * `WEB_TITLES[screen]`. Here the active screen is derived from the URL via
 * `lib/nav.ts keyForPath`, and the TopBar title from `TITLES[key]`.
 *
 * AUTH GATE: after hydration, if the user is not authed we `router.replace('/')`
 * (the landing route). The redirect runs in an effect — never during render — so
 * it is SSR-safe.
 *
 * HYDRATION / no-mismatch: `auth.authed` is only trustworthy once `hydrate()`
 * has run (in an effect). Before that we render a STABLE placeholder (the shell
 * background) on both server and client, so there is no hydration mismatch and
 * no flash of authed chrome for a logged-out visitor. Once hydrated, we either
 * redirect (unauthed) or render the full shell (authed).
 */

'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { MobileNav } from '@/components/shell/MobileNav';
import { Sidebar } from '@/components/shell/Sidebar';
import { TopBar } from '@/components/shell/TopBar';
import { TITLES, keyForPath } from '@/lib/nav';
import { useApp } from '@/lib/store';
import { useStore } from '@/lib/store';
import STRINGS from '@/lib/strings';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const app = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useStore((s) => s.hydrated);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Auth gate: once we trust the persisted auth state, bounce unauthed users to
  // the landing route. Effect-only → SSR-safe, no redirect during render.
  useEffect(() => {
    if (hydrated && !app.authed) {
      router.replace('/');
    }
  }, [hydrated, app.authed, router]);

  // Stable placeholder until we know the real auth state (no hydration mismatch,
  // no flash of authed chrome). Also covers the brief moment after an unauthed
  // user is detected but before the redirect lands.
  if (!hydrated || !app.authed) {
    return (
      <div
        style={{
          minHeight: '100vh',
          width: '100%',
          background: 'var(--bg)',
          color: 'var(--text)',
        }}
      />
    );
  }

  const activeKey = keyForPath(pathname);
  const title = (activeKey && TITLES[activeKey]) || STRINGS.app.name;

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        background: 'var(--bg)',
        color: 'var(--text)',
        display: 'flex',
        alignItems: 'stretch',
      }}
    >
      <Sidebar />
      <MobileNav
        drawerOpen={drawerOpen}
        onOpen={() => setDrawerOpen(true)}
        onClose={() => setDrawerOpen(false)}
      />
      <div
        style={{
          flex: 1,
          minWidth: 0,
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <TopBar title={title} onMenu={() => setDrawerOpen(true)} />
        <main className="app-main-content" style={{ flex: 1, overflowY: 'auto' }}>{children}</main>
      </div>
    </div>
  );
}
