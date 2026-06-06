/**
 * components/lobby/Lobby.tsx — the authed home/lobby screen.
 *
 * Ported from the CDN prototype `Lobby` in `/tmp/proto_extract/web/web-pages.jsx`.
 * Pass A (inline-parity): `style={{}}` objects are byte-identical to the prototype;
 * only `createElement(...)` became JSX and prop types were added. Brand/theme values
 * stay as `var(--…)` — never hardcoded hex (the game-card gradients are decorative
 * literals, faithful to the prototype).
 *
 * Adaptations to the production port (behaviour preserved):
 *   - Money is integer minor-units. Store balances (`wallet.*`, `totalBalance()`)
 *     are formatted via `formatMoney`; `CountUp` takes a DISPLAY number, so the
 *     total balance is passed through `fromMinor`. Decorative winner amounts are
 *     display literals → `toMinor` before `formatMoney`.
 *   - Navigation (ADR 0003): the prototype's `app.navigate(key)` → App Router
 *     `router.push(ROUTES[key])`.
 *   - Live clock: `app.now` → SSR-safe `useNow()` (0 until mounted, then live).
 *   - No "provably fair" claim: the prototype's recent-round footnote is replaced
 *     with the demo-safe `STRINGS.game.lobbyRoundNote`.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button, Card, CountUp, ResultBall } from '@/components/primitives';
import { Icon, type IconName } from '@/components/icons';
import { useApp } from '@/lib/store/useApp';
import { useNow } from '@/lib/store/useNow';
import { ROUTES } from '@/lib/nav';
import { formatMoney, fromMinor, toMinor } from '@/lib/money';
import { STRINGS } from '@/lib/strings';

const L = STRINGS.lobby;

interface GameCard {
  key: string;
  name: string;
  tag: string;
  grad: string;
  icon: IconName;
  live?: boolean;
}

const GAMES: GameCard[] = [
  { key: 'wingo', name: 'Wingo', tag: 'Color prediction', grad: 'linear-gradient(135deg,#15e08a,#0bb568)', icon: 'target', live: true },
  { key: 'k3', name: 'K3 Dice', tag: 'Lucky dice', grad: 'linear-gradient(135deg,#ff9a3d,#ff5a3d)', icon: 'grid' },
  { key: '5d', name: '5D Lotto', tag: 'Number draw', grad: 'linear-gradient(135deg,#8b5cff,#5a3dff)', icon: 'diamond' },
  { key: 'trx', name: 'TRX Win', tag: 'Hash blocks', grad: 'linear-gradient(135deg,#ff3460,#c41846)', icon: 'bolt' },
];

const WINNERS: [string, string, number][] = [
  ['c***7', 'Wingo 1m', 880],
  ['m***x', '5D Lotto', 2400],
  ['ace**', 'Wingo 30s', 360],
  ['z***9', 'TRX Win', 1290],
  ['k***p', 'K3 Dice', 540],
  ['n***2', 'Wingo 3m', 1760],
];

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div style={{ padding: '24px 28px 48px', maxWidth: 1180, margin: '0 auto' }}>{children}</div>
);

const H2 = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', margin: '4px 2px 14px' }}>{children}</div>
);

export function Lobby() {
  const app = useApp();
  const now = useNow();
  const router = useRouter();
  const [wi, setWi] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setWi((x) => x + 1), 2200);
    return () => clearInterval(iv);
  }, []);

  const wallets: [string, number, string][] = [
    [L.mainWallet, app.wallet.main, 'var(--accent)'],
    [L.winningsWallet, app.wallet.winning, 'var(--green)'],
    [L.bonusWallet, app.wallet.bonus, 'var(--gold)'],
    [L.referralWallet, app.wallet.referral, 'var(--violet)'],
  ];
  const recent = app.recentResults(30, 8, now);

  return (
    <Wrap>
      {/* promo + balance */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18, marginBottom: 18 }}>
        <div
          style={{
            borderRadius: 'var(--radius)',
            padding: '30px 32px',
            background: 'linear-gradient(120deg,#7c5cff,#1fe0ff)',
            color: '#fff',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 800, opacity: 0.85, letterSpacing: '.5px' }}>{L.welcomeOffer}</div>
          <div style={{ fontSize: 34, fontWeight: 900, margin: '6px 0 4px' }}>{L.welcomeHeadline}</div>
          <div style={{ fontSize: 15, fontWeight: 600, opacity: 0.9, marginBottom: 20 }}>{L.welcomeSub}</div>
          <Button variant="glass" onClick={() => router.push(ROUTES.deposit)}>
            {L.claimBonus}
          </Button>
        </div>
        <Card glow pad={22}>
          <div style={{ fontSize: 12, color: 'var(--text-mute)', fontWeight: 700 }}>{L.totalBalance}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, margin: '4px 0 16px' }}>
            <CountUp value={fromMinor(app.totalBalance())} style={{ fontSize: 34, fontWeight: 900, color: 'var(--text)' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-dim)' }}>{STRINGS.wallet.currency}</span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button full icon="plus" onClick={() => router.push(ROUTES.deposit)}>
              {STRINGS.wallet.deposit}
            </Button>
            <Button full variant="ghost" icon="arrowUp" onClick={() => router.push(ROUTES.withdraw)}>
              {STRINGS.wallet.withdraw}
            </Button>
          </div>
        </Card>
      </div>

      {/* wallet stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 26 }}>
        {wallets.map((w, i) => (
          <Card key={i} pad={18}>
            <div style={{ fontSize: 12, color: 'var(--text-mute)', fontWeight: 600, marginBottom: 6 }}>{w[0]}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: w[2] }}>{formatMoney(w[1])}</div>
          </Card>
        ))}
      </div>

      {/* games */}
      <H2>{L.games}</H2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        {GAMES.map((g) => (
          <div
            key={g.key}
            onClick={() => router.push(ROUTES.game)}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: 20,
              cursor: 'pointer',
              position: 'relative',
              boxShadow: 'var(--card-shadow)',
              transition: 'transform .15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            {g.live && (
              <span style={{ position: 'absolute', top: 16, right: 16, fontSize: 9, fontWeight: 800, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: 4, background: 'var(--green)', boxShadow: 'var(--glow-green)' }} />
                {L.live}
              </span>
            )}
            <div style={{ width: 56, height: 56, borderRadius: 16, background: g.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              {Icon[g.icon]({ size: 30, color: '#fff' })}
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)' }}>{g.name}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-mute)', fontWeight: 600, marginTop: 2 }}>{g.tag}</div>
          </div>
        ))}
      </div>

      {/* winners + recent */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <Card pad={20}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
            {Icon.trophy({ size: 17, color: 'var(--gold)' })}
            {L.liveWinners}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {WINNERS.map((w, i) => {
              const fresh = i === wi % WINNERS.length;
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 11,
                    padding: '8px 10px',
                    borderRadius: 10,
                    background: fresh ? 'color-mix(in srgb,var(--green) 10%,transparent)' : 'transparent',
                    transition: 'background .4s',
                  }}
                >
                  <div style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: 'var(--text-dim)' }}>
                    {w[0][0].toUpperCase()}
                  </div>
                  <span style={{ flex: 1, fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>
                    {w[0]}
                    <span style={{ color: 'var(--text-mute)', marginLeft: 6, fontSize: 11.5 }}>{w[1]}</span>
                  </span>
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--green)' }}>{'+' + formatMoney(toMinor(w[2]), { decimals: 0 })}</span>
                </div>
              );
            })}
          </div>
        </Card>
        <Card pad={20}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>{L.latest}</div>
            <Button size="sm" variant="glass" onClick={() => router.push(ROUTES.game)}>
              {L.playNow}
            </Button>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            {recent.map((r, i) => (
              <ResultBall key={i} num={r.num} size={38} />
            ))}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-mute)', lineHeight: 1.6 }}>{STRINGS.game.lobbyRoundNote}</div>
        </Card>
      </div>
    </Wrap>
  );
}

export default Lobby;
