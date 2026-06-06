/**
 * components/landing/Landing.tsx — unauthed marketing landing (route `/`).
 *
 * Ported from the CDN React 18 prototype (`/tmp/proto_extract/web/web-shell.jsx`
 * `Landing`). Pass A (inline-parity): every `style={{…}}` object is byte-identical
 * to the prototype — hero grid, live-preview card, feature grid, stats row — all
 * referencing `var(--…)`, never hardcoded hex. Tailwind refactor is Pass B.
 *
 * DELTAS FROM PROTOTYPE (intentional, per the conversion plan):
 *   - Routing (ADR 0003): the prototype's `onEnter` opened the in-shell auth via
 *     `app.navigate`. Here the CTAs open a real portal `<AuthModal/>`; on success
 *     the modal routes to `/lobby`.
 *   - "Provably fair" is BANNED — the first feature uses the "Fair Play (demo)"
 *     copy from `lib/strings.ts landing.features.fairPlay`.
 *   - A VISIBLE "simulated — no real money · 18+" disclaimer line is rendered near
 *     the hero CTA (the blocking AgeGate is global in providers.tsx; this is the
 *     separate always-visible landing disclaimer required by the plan).
 *   - Live clock comes from `useNow()` (SSR-safe: `0` until mount), and an
 *     authed-redirect to `/lobby` runs in an effect after hydration.
 *
 * SSR-safe: no `window`/`Date.now()` during render. Router pushes + authed-redirect
 * run only in effects.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { AuthModal } from '@/components/auth/AuthModal';
import { Icon, type IconName } from '@/components/icons/Icon';
import { Button, Card, ResultBall } from '@/components/primitives';
import { ROUTES } from '@/lib/nav';
import { useApp, useNow } from '@/lib/store';
import STRINGS from '@/lib/strings';

export function Landing() {
  const app = useApp();
  const router = useRouter();
  const now = useNow();
  const [authOpen, setAuthOpen] = useState(false);

  // After hydration, an already-authed visitor is bounced to the lobby. Runs in
  // an effect (never during render) so it's SSR-safe and only fires post-mount.
  useEffect(() => {
    if (app.authed) router.replace(ROUTES.home);
  }, [app.authed, router]);

  const onEnter = () => setAuthOpen(true);

  const recent = app.recentResults(30, 6, now);

  // Feature grid — the first card replaces the prototype's banned "Provably fair"
  // badge with the "Fair Play (demo)" copy. All copy comes from lib/strings.ts.
  const feats: [IconName, string, string][] = [
    ['target', STRINGS.landing.features.fairPlay, STRINGS.landing.features.fairPlayDesc],
    ['bolt', STRINGS.landing.features.instantPayouts, STRINGS.landing.features.instantPayoutsDesc],
    ['shield', STRINGS.landing.features.security, STRINGS.landing.features.securityDesc],
    ['users', STRINGS.landing.features.referrals, STRINGS.landing.features.referralsDesc],
  ];

  const stats: [string, string][] = [
    ['$48M+', STRINGS.landing.stats.paidOut],
    ['180K+', STRINGS.landing.stats.players],
    ['99.2%', STRINGS.landing.stats.avgPayout],
  ];

  const colors: [string, string, string][] = [
    [STRINGS.colors.green, 'var(--green)', '2×'],
    [STRINGS.colors.violet, 'var(--violet)', '4.5×'],
    [STRINGS.colors.red, 'var(--red)', '2×'],
  ];

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 32px' }}>
        {/* nav */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '24px 0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
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
            <div style={{ fontSize: 21, fontWeight: 900, color: 'var(--text)', letterSpacing: '.5px' }}>
              {STRINGS.app.namePrefix}
              <span style={{ color: 'var(--accent)' }}>{STRINGS.app.nameSuffix}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="ghost" onClick={onEnter}>
              {STRINGS.auth.signIn}
            </Button>
            <Button onClick={onEnter}>{STRINGS.auth.register}</Button>
          </div>
        </div>

        {/* hero */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.05fr .95fr',
            gap: 40,
            alignItems: 'center',
            padding: '50px 0 60px',
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '6px 13px',
                borderRadius: 999,
                background: 'var(--glass)',
                border: '1px solid var(--glass-brd)',
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--accent-2)',
                marginBottom: 22,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  background: 'var(--green)',
                  boxShadow: 'var(--glow-green)',
                }}
              />
              {'12,480 ' + STRINGS.landing.playersOnline}
            </div>
            <h1
              style={{
                fontSize: 58,
                lineHeight: 1.04,
                fontWeight: 900,
                color: 'var(--text)',
                margin: '0 0 18px',
                letterSpacing: '-1px',
              }}
            >
              {STRINGS.landing.heroTitle}
              <br />
              <span
                style={{
                  background: 'var(--header-grad)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {STRINGS.landing.heroTitleAccent}
              </span>
            </h1>
            <p
              style={{
                fontSize: 17,
                color: 'var(--text-dim)',
                lineHeight: 1.6,
                margin: '0 0 30px',
                maxWidth: 460,
              }}
            >
              {STRINGS.landing.heroBody}
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <Button size="lg" icon="bolt" onClick={onEnter}>
                {STRINGS.actions.startPlaying}
              </Button>
              <Button size="lg" variant="ghost" icon="eye" onClick={onEnter}>
                {STRINGS.actions.watchLive}
              </Button>
            </div>
            {/* Visible "simulated — no real money · 18+" disclaimer (separate from
                the global blocking AgeGate). Placed directly under the hero CTA. */}
            <div
              style={{
                fontSize: 12,
                color: 'var(--text-mute)',
                fontWeight: 600,
                marginTop: 16,
              }}
            >
              {STRINGS.app.disclaimer}
            </div>
            <div style={{ display: 'flex', gap: 28, marginTop: 36 }}>
              {stats.map((s, i) => (
                <div key={i}>
                  <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--text)' }}>{s[0]}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-mute)', fontWeight: 600 }}>{s[1]}</div>
                </div>
              ))}
            </div>
          </div>

          {/* live preview card */}
          <Card pad={0} glow style={{ overflow: 'hidden' }}>
            <div style={{ background: 'var(--header-grad)', padding: '20px 22px', color: 'var(--accent-ink)' }}>
              <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.8 }}>WINGO · 30s · LIVE</div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 6,
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 800 }}>{STRINGS.landing.nextDraw}</div>
                <div style={{ fontSize: 30, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>
                  {'00:' + String(app.secondsLeft(30, now)).padStart(2, '0')}
                </div>
              </div>
            </div>
            <div style={{ padding: 22 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-mute)', marginBottom: 10 }}>
                {STRINGS.landing.recentResults}
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
                {recent.map((r, i) => (
                  <ResultBall key={i} num={r.num} size={38} />
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                {colors.map((c, i) => (
                  <div
                    key={i}
                    onClick={onEnter}
                    style={{
                      background: c[1],
                      color: '#fff',
                      borderRadius: 'var(--radius-sm)',
                      padding: '14px 8px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 0 18px ' + c[1],
                    }}
                  >
                    <div style={{ fontSize: 15, fontWeight: 800 }}>{c[0]}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.85 }}>{'Win ' + c[2]}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* features */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, paddingBottom: 70 }}>
          {feats.map((f, i) => (
            <Card key={i} pad={20}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 13,
                  background: 'var(--glass)',
                  border: '1px solid var(--glass-brd)',
                  color: 'var(--accent-2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14,
                }}
              >
                {Icon[f[0]]({ size: 22 })}
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 5 }}>{f[1]}</div>
              <div style={{ fontSize: 13, color: 'var(--text-mute)', lineHeight: 1.5 }}>{f[2]}</div>
            </Card>
          ))}
        </div>
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}

export default Landing;
