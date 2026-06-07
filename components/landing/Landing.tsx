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
    <div className="h-full overflow-y-auto">
      <div className="max-w-[1180px] mx-auto px-4 app:px-8">
        {/* nav */}
        <div className="flex items-center justify-between py-6">
          <div className="flex items-center gap-[11px]">
            <div className="size-10 rounded-[13px] bg-[var(--header-grad)] flex items-center justify-center shadow-[var(--glow-accent)]">
              {Icon.target({ size: 24, color: 'var(--accent-ink)' })}
            </div>
            <div className="text-[21px] font-black text-text tracking-[.5px]">
              {STRINGS.app.namePrefix}
              <span className="text-[var(--accent)]">{STRINGS.app.nameSuffix}</span>
            </div>
          </div>
          <div className="flex gap-2.5">
            <Button variant="ghost" onClick={onEnter}>
              {STRINGS.auth.signIn}
            </Button>
            <Button onClick={onEnter}>{STRINGS.auth.register}</Button>
          </div>
        </div>

        {/* hero */}
        <div className="grid grid-cols-1 app:grid-cols-[1.05fr_.95fr] gap-10 items-center pt-[30px] pb-[30px] app:pt-[50px] app:pb-[60px]">
          <div>
            <div className="inline-flex items-center gap-[7px] py-1.5 px-[13px] rounded-full bg-[var(--glass)] border border-[var(--glass-brd)] text-xs font-bold text-[var(--accent-2)] mb-[22px]">
              <span className="size-[7px] rounded-[4px] bg-green shadow-[var(--glow-green)]" />
              {'12,480 ' + STRINGS.landing.playersOnline}
            </div>
            <h1 className="text-[36px] app:text-[58px] leading-[1.04] font-black text-text mt-0 mb-[18px] tracking-[-1px]">
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
            <p className="text-[17px] text-[var(--text-dim)] leading-[1.6] mt-0 mb-[30px] max-w-[460px]">
              {STRINGS.landing.heroBody}
            </p>
            <div className="flex gap-3">
              <Button size="lg" icon="bolt" onClick={onEnter}>
                {STRINGS.actions.startPlaying}
              </Button>
              <Button size="lg" variant="ghost" icon="eye" onClick={onEnter}>
                {STRINGS.actions.watchLive}
              </Button>
            </div>
            {/* Visible "simulated — no real money · 18+" disclaimer (separate from
                the global blocking AgeGate). Placed directly under the hero CTA. */}
            <div className="text-xs text-[var(--text-mute)] font-semibold mt-4">
              {STRINGS.app.disclaimer}
            </div>
            <div className="flex gap-7 mt-9">
              {stats.map((s, i) => (
                <div key={i}>
                  <div className="text-[26px] font-black text-text">{s[0]}</div>
                  <div className="text-xs text-[var(--text-mute)] font-semibold">{s[1]}</div>
                </div>
              ))}
            </div>
          </div>

          {/* live preview card */}
          <Card pad={0} glow style={{ overflow: 'hidden' }}>
            <div className="bg-[var(--header-grad)] py-5 px-[22px] text-[var(--accent-ink)]">
              <div className="text-xs font-extrabold opacity-80">WINGO · 30s · LIVE</div>
              <div className="flex items-center justify-between mt-1.5">
                <div className="text-[15px] font-extrabold">{STRINGS.landing.nextDraw}</div>
                <div className="text-[30px] font-black tabular-nums">
                  {'00:' + String(app.secondsLeft(30, now)).padStart(2, '0')}
                </div>
              </div>
            </div>
            <div className="p-[22px]">
              <div className="text-[11px] font-bold text-[var(--text-mute)] mb-2.5">
                {STRINGS.landing.recentResults}
              </div>
              <div className="flex gap-2.5 mb-[18px]">
                {recent.map((r, i) => (
                  <ResultBall key={i} num={r.num} size={38} />
                ))}
              </div>
              <div className="grid grid-cols-[repeat(3,1fr)] gap-2.5">
                {colors.map((c, i) => (
                  <div
                    key={i}
                    onClick={onEnter}
                    className="text-white rounded-[var(--radius-sm)] py-3.5 px-2 text-center cursor-pointer"
                    style={{
                      background: c[1],
                      boxShadow: '0 0 18px ' + c[1],
                    }}
                  >
                    <div className="text-[15px] font-extrabold">{c[0]}</div>
                    <div className="text-[11px] font-bold opacity-85">{'Win ' + c[2]}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* features */}
        <div className="grid grid-cols-2 app:grid-cols-[repeat(4,1fr)] gap-4 pb-[40px] app:pb-[70px]">
          {feats.map((f, i) => (
            <Card key={i} pad={20}>
              <div className="size-11 rounded-[13px] bg-[var(--glass)] border border-[var(--glass-brd)] text-[var(--accent-2)] flex items-center justify-center mb-3.5">
                {Icon[f[0]]({ size: 22 })}
              </div>
              <div className="text-base font-extrabold text-text mb-[5px]">{f[1]}</div>
              <div className="text-[13px] text-[var(--text-mute)] leading-[1.5]">{f[2]}</div>
            </Card>
          ))}
        </div>
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}

export default Landing;
