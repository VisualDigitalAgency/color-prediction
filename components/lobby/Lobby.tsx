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

import { useEffect, useMemo, useState } from 'react';
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
  <div className="pt-6 px-4 app:px-7 pb-12 mx-auto max-w-[1180px]">{children}</div>
);

const H2 = ({ children }: { children: React.ReactNode }) => (
  <div className="text-base font-extrabold text-text mt-1 mx-0.5 mb-3.5">{children}</div>
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
  // Memoize: recentResults only changes when the 30s period rolls over, not every 250ms tick.
  const periodIdx30 = Math.floor(now / (30 * 1000));
  const recent = useMemo(
    () => app.recentResults(30, 8, now),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [periodIdx30],
  );

  return (
    <Wrap>
      {/* promo + balance */}
      <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-[18px] mb-[18px]">
        <div
          className="rounded-[var(--radius)] py-[30px] px-8 text-white relative overflow-hidden"
          style={{
            background: 'linear-gradient(120deg,#7c5cff,#1fe0ff)',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <div className="text-[13px] font-extrabold opacity-85 tracking-[.5px]">{L.welcomeOffer}</div>
          <div className="text-[34px] font-black mt-1.5 mb-1">{L.welcomeHeadline}</div>
          <div className="text-[15px] font-semibold opacity-90 mb-5">{L.welcomeSub}</div>
          <Button variant="glass" onClick={() => router.push(ROUTES.deposit)}>
            {L.claimBonus}
          </Button>
        </div>
        <Card glow pad={22}>
          <div className="text-xs text-[var(--text-mute)] font-bold">{L.totalBalance}</div>
          <div className="flex items-baseline gap-[7px] mt-1 mb-4">
            <CountUp value={fromMinor(app.totalBalance())} style={{ fontSize: 34, fontWeight: 900, color: 'var(--text)' }} />
            <span className="text-sm font-bold text-[var(--text-dim)]">{STRINGS.wallet.currency}</span>
          </div>
          <div className="flex gap-2.5">
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
      <div className="grid grid-cols-2 app:grid-cols-[repeat(4,1fr)] gap-3.5 mb-[26px]">
        {wallets.map((w, i) => (
          <Card key={i} pad={18}>
            <div className="text-xs text-[var(--text-mute)] font-semibold mb-1.5">{w[0]}</div>
            <div className="text-2xl font-black" style={{ color: w[2] }}>{formatMoney(w[1])}</div>
          </Card>
        ))}
      </div>

      {/* games */}
      <H2>{L.games}</H2>
      <div className="grid grid-cols-2 app:grid-cols-[repeat(4,1fr)] gap-4 mb-7">
        {GAMES.map((g) => (
          <div
            key={g.key}
            onClick={() => router.push(ROUTES.game)}
            className="bg-surface border border-[var(--border)] rounded-[var(--radius)] p-5 cursor-pointer relative shadow-[var(--card-shadow)] transition-transform duration-150"
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            {g.live && (
              <span className="absolute top-4 right-4 text-[9px] font-extrabold text-green flex items-center gap-1">
                <span className="size-1.5 rounded-[4px] bg-green shadow-[var(--glow-green)]" />
                {L.live}
              </span>
            )}
            <div
              className="size-14 rounded-2xl flex items-center justify-center mb-3.5"
              style={{ background: g.grad }}
            >
              {Icon[g.icon]({ size: 30, color: '#fff' })}
            </div>
            <div className="text-[17px] font-extrabold text-text">{g.name}</div>
            <div className="text-[12.5px] text-[var(--text-mute)] font-semibold mt-0.5">{g.tag}</div>
          </div>
        ))}
      </div>

      {/* winners + recent */}
      <div className="grid grid-cols-1 app:grid-cols-2 gap-[18px]">
        <Card pad={20}>
          <div className="text-sm font-extrabold text-text mb-3.5 flex items-center gap-[7px]">
            {Icon.trophy({ size: 17, color: 'var(--gold)' })}
            {L.liveWinners}
          </div>
          <div className="flex flex-col gap-2.5">
            {WINNERS.map((w, i) => {
              const fresh = i === wi % WINNERS.length;
              return (
                <div
                  key={i}
                  className="flex items-center gap-[11px] py-2 px-2.5 rounded-[10px]"
                  style={{
                    background: fresh ? 'color-mix(in srgb,var(--green) 10%,transparent)' : 'transparent',
                    transition: 'background .4s',
                  }}
                >
                  <div className="size-[30px] rounded-[9px] bg-[var(--surface-2)] flex items-center justify-center text-xs font-extrabold text-[var(--text-dim)]">
                    {w[0][0].toUpperCase()}
                  </div>
                  <span className="flex-1 text-[13px] text-text font-semibold">
                    {w[0]}
                    <span className="text-[var(--text-mute)] ml-1.5 text-[11.5px]">{w[1]}</span>
                  </span>
                  <span className="text-[13.5px] font-extrabold text-green">{'+' + formatMoney(toMinor(w[2]), { decimals: 0 })}</span>
                </div>
              );
            })}
          </div>
        </Card>
        <Card pad={20}>
          <div className="flex items-center justify-between mb-3.5">
            <div className="text-sm font-extrabold text-text">{L.latest}</div>
            <Button size="sm" variant="glass" onClick={() => router.push(ROUTES.game)}>
              {L.playNow}
            </Button>
          </div>
          <div className="flex gap-2.5 flex-wrap mb-4">
            {recent.map((r, i) => (
              <ResultBall key={i} num={r.num} size={38} />
            ))}
          </div>
          <div className="text-[12.5px] text-[var(--text-mute)] leading-[1.6]">{STRINGS.game.lobbyRoundNote}</div>
        </Card>
      </div>
    </Wrap>
  );
}

export default Lobby;
