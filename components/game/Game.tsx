'use client';
/**
 * components/game/Game.tsx — Wingo game screen.
 * Pass B: inline styles → Tailwind v4 utilities. Logic unchanged from Pass A.
 * Adaptations:
 *  - `window.useApp()` → useApp() / useNow()
 *  - `window.fmt(x)` → formatMoney(toMinor(x)) for display-float inputs;
 *    for minor-unit store values use formatMoney(x) directly
 *  - `app.now` → now (useNow())
 *  - `app.placeBet(mode, kind, pick, stakeDisplay)` →
 *      app.placeBet({ mode, kind, pick, stake: toMinor(stake) })
 *  - "Provably fair" → STRINGS.game.fairLabel (ADR 0006)
 *  - Stakes/amounts in BetSlip are display floats (chip selections 1/10/100/1000);
 *    converted to minor-units only at placeBet call time
 */

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useApp } from '@/lib/store/useApp';
import { useNow } from '@/lib/store/useNow';
import { formatMoney, toMinor } from '@/lib/money';
import { STRINGS } from '@/lib/strings';
import { Card } from '@/components/primitives/Card';
import { Button } from '@/components/primitives/Button';
import { ResultBall, numColorStyle } from '@/components/primitives/ResultBall';
import { Icon } from '@/components/icons/Icon';

const pad2 = (n: number) => String(n).padStart(2, '0');

// ── ModeTabs ────────────────────────────────────────────────────────────────

function ModeTabs({
  mode,
  setMode,
  app,
}: {
  mode: number;
  setMode: (m: number) => void;
  app: ReturnType<typeof useApp>;
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-[18px]">
      {app.MODES.map((m) => {
        const on = m === mode;
        return (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              background: on ? 'var(--header-grad)' : 'var(--surface)',
              color: on ? 'var(--accent-ink)' : 'var(--text-dim)',
              border: on ? 'none' : '1px solid var(--border)',
              boxShadow: on ? 'var(--glow-accent)' : 'none',
            }}
            className="flex items-center gap-2 py-[11px] px-5 rounded-full cursor-pointer text-sm font-extrabold transition-all duration-150"
          >
            {Icon.clock({ size: 17 })}
            {app.MODE_LABEL[m as keyof typeof app.MODE_LABEL]}
          </button>
        );
      })}
    </div>
  );
}

// ── Board ───────────────────────────────────────────────────────────────────

interface Sel {
  kind: 'color' | 'size' | 'number';
  pick: string | number;
}

function Board({
  mode,
  app,
  now,
  sel,
  setSel,
  locked,
}: {
  mode: number;
  app: ReturnType<typeof useApp>;
  now: number;
  sel: Sel | null;
  setSel: (s: Sel | null) => void;
  locked: boolean;
}) {
  const p = app.periodAt(mode as import('@/types').RoundMode, now);
  const sl = app.secondsLeft(mode as import('@/types').RoundMode, now);
  const mm = Math.floor(sl / 60);
  const ss = sl % 60;
  const recent = app.recentResults(mode as import('@/types').RoundMode, 10, now);
  const pick = (kind: Sel['kind'], pk: string | number) => {
    if (!locked) setSel({ kind, pick: pk });
  };
  const isSel = (kind: Sel['kind'], pk: string | number) =>
    sel && sel.kind === kind && sel.pick === pk;

  const timerStr = `${pad2(mm)}:${pad2(ss)}`;

  return (
    <div>
      {/* timer board */}
      <Card pad={0} style={{ overflow: 'hidden', marginBottom: 16 }}>
        <div className="bg-[var(--header-grad)] py-[22px] px-[26px] flex items-center justify-between gap-3 text-[var(--accent-ink)]">
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-extrabold opacity-85 tracking-[.5px]">
              WINGO · {app.MODE_LABEL[mode as keyof typeof app.MODE_LABEL]}
            </div>
            <div className="text-base app:text-[22px] font-black mt-[3px] truncate">
              Period {p.periodId}
            </div>
            <div className="text-[11.5px] font-bold opacity-75 mt-[5px] flex items-center gap-[5px]">
              {Icon.shield({ size: 13 })}
              {STRINGS.game.fairPlay}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xs font-extrabold opacity-80 mb-[5px]">
              {locked ? 'DRAWING…' : 'TIME REMAINING'}
            </div>
            <div className="flex gap-[5px] justify-end">
              {timerStr.split('').map((ch, i) =>
                ch === ':' ? (
                  <span key={i} className="text-[34px] font-black">
                    :
                  </span>
                ) : (
                  <span
                    key={i}
                    style={{
                      background: 'rgba(0,0,0,.28)',
                      animation: locked ? 'pulse .8s infinite' : 'none',
                    }}
                    className="text-white rounded-lg py-[5px] px-2.5 text-[32px] font-black tabular-nums"
                  >
                    {ch}
                  </span>
                ),
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 py-3.5 px-[26px]">
          <span className="text-[11.5px] text-[var(--text-mute)] font-bold">
            LAST 10
          </span>
          <div className="flex gap-[9px] flex-wrap">
            {recent.map((r, i) => (
              <ResultBall key={i} num={r.num} size={30} />
            ))}
          </div>
        </div>
      </Card>

      {/* betting board */}
      <Card pad={24} style={{ position: 'relative' }}>
        {locked && (
          <div
            style={{ background: 'color-mix(in srgb, var(--bg) 72%, transparent)' }}
            className="absolute inset-0 z-[5] rounded-[var(--radius)] backdrop-blur-[2px] flex items-center justify-center flex-col gap-2"
          >
            <div
              style={{ animation: 'pulse 1s infinite' }}
              className="text-red"
            >
              {Icon.clock({ size: 34 })}
            </div>
            <div className="text-base font-extrabold text-text">
              Betting closed
            </div>
            <div className="text-[13px] text-[var(--text-mute)]">
              Drawing result for this round…
            </div>
          </div>
        )}

        <div className="text-xs font-bold text-[var(--text-mute)] mb-3">
          PICK A COLOR
        </div>
        <div className="grid grid-cols-[repeat(3,1fr)] gap-3.5 mb-[22px]">
          {(
            [
              ['green', 'Green', '2×', 'var(--green)', 'var(--glow-green)'],
              ['violet', 'Violet', '4.5×', 'var(--violet)', 'var(--glow-violet)'],
              ['red', 'Red', '2×', 'var(--red)', 'var(--glow-red)'],
            ] as const
          ).map((c) => (
            <button
              key={c[0]}
              onClick={() => pick('color', c[0])}
              style={{
                background: c[3],
                boxShadow: c[4],
                border: isSel('color', c[0]) ? '2px solid #fff' : '2px solid transparent',
              }}
              className="py-5 rounded-[var(--radius-sm)] cursor-pointer text-white flex flex-col items-center gap-[3px] transition-transform duration-[120ms]"
              onMouseDown={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.transform = 'scale(.97)')
              }
              onMouseUp={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)')
              }
            >
              <span className="text-[19px] font-extrabold">{c[1]}</span>
              <span className="text-xs font-bold opacity-85">
                Win {c[2]}
              </span>
            </button>
          ))}
        </div>

        <div className="text-xs font-bold text-[var(--text-mute)] mb-3">
          PICK A NUMBER · Win 9×
        </div>
        <div className="grid grid-cols-5 app:grid-cols-[repeat(10,1fr)] gap-2.5 mb-[22px]">
          {Array.from({ length: 10 }).map((_, n) => (
            <button
              key={n}
              onClick={() => pick('number', n)}
              style={{
                background: numColorStyle(n),
                border: isSel('number', n) ? '3px solid #fff' : '3px solid transparent',
                boxShadow: '0 4px 12px rgba(0,0,0,.35)',
              }}
              className="aspect-square rounded-full cursor-pointer text-white text-xl font-extrabold transition-transform duration-[120ms]"
              onMouseDown={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.transform = 'scale(.9)')
              }
              onMouseUp={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)')
              }
            >
              {n}
            </button>
          ))}
        </div>

        <div className="text-xs font-bold text-[var(--text-mute)] mb-3">
          BIG OR SMALL
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          {(
            [
              ['big', 'BIG', '5 – 9', 'linear-gradient(135deg,#ff9a3d,#ff5a3d)'],
              ['small', 'SMALL', '0 – 4', 'linear-gradient(135deg,#3da5ff,#7c5cff)'],
            ] as const
          ).map((s) => (
            <button
              key={s[0]}
              onClick={() => pick('size', s[0])}
              style={{
                background: s[3],
                border: isSel('size', s[0]) ? '2px solid #fff' : '2px solid transparent',
              }}
              className="py-4 rounded-[var(--radius-sm)] cursor-pointer text-white flex items-center justify-center gap-2.5"
            >
              <span className="text-lg font-black tracking-[1px]">
                {s[1]}
              </span>
              <span className="text-[13px] font-bold opacity-85">
                {s[2]}
              </span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── BetSlip ─────────────────────────────────────────────────────────────────

function BetSlip({
  sel,
  setSel,
  mode,
  app,
  locked,
}: {
  sel: Sel | null;
  setSel: (s: Sel | null) => void;
  mode: number;
  app: ReturnType<typeof useApp>;
  locked: boolean;
}) {
  const [amount, setAmount] = useState(10);
  const [mult, setMult] = useState(1);
  const stake = amount * mult; // display float
  const payMult =
    !sel
      ? 0
      : sel.kind === 'number'
      ? 9
      : sel.pick === 'violet'
      ? 4.5
      : 2;
  const win = +(stake * payMult).toFixed(2);
  const label = !sel
    ? ''
    : sel.kind === 'number'
    ? 'Number ' + sel.pick
    : sel.kind === 'size'
    ? String(sel.pick).toUpperCase()
    : String(sel.pick)[0].toUpperCase() + String(sel.pick).slice(1);
  const swatch = !sel
    ? ''
    : sel.kind === 'number'
    ? numColorStyle(Number(sel.pick))
    : sel.kind === 'size'
    ? sel.pick === 'big'
      ? 'linear-gradient(135deg,#ff9a3d,#ff5a3d)'
      : 'linear-gradient(135deg,#3da5ff,#7c5cff)'
    : sel.pick === 'green'
    ? 'var(--green)'
    : sel.pick === 'red'
    ? 'var(--red)'
    : 'var(--violet)';

  const chip = (
    v: number,
    set: (n: number) => void,
    cur: number,
    fmt: (n: number) => string,
  ) => (
    <button
      key={v}
      onClick={() => set(v)}
      className={`flex-1 py-[9px] rounded-[9px] cursor-pointer text-[13px] font-extrabold border ${
        cur === v
          ? 'bg-[var(--accent)] text-[var(--accent-ink)] border-transparent'
          : 'bg-[var(--surface-2)] text-[var(--text-dim)] border-[var(--border)]'
      }`}
    >
      {fmt(v)}
    </button>
  );

  return (
    <Card pad={18} style={{ marginBottom: 16 }}>
      <div className="text-sm font-extrabold text-text mb-3.5 flex items-center gap-2">
        {Icon.target({ size: 18, color: 'var(--accent)' })}
        Bet slip
      </div>

      {!sel ? (
        <div className="text-center py-[26px] px-2.5 text-[var(--text-mute)]">
          <div className="opacity-50 flex justify-center mb-2.5">
            {Icon.target({ size: 32 })}
          </div>
          <div className="text-[13px] font-semibold">
            Tap a color, number or size
          </div>
          <div className="text-xs mt-0.5">to build your bet</div>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-[11px] p-3 bg-[var(--surface-2)] rounded-[var(--radius-sm)] mb-3.5">
            <div
              style={{ background: swatch }}
              className="size-10 rounded-full flex items-center justify-center text-white font-extrabold"
            >
              {sel.kind === 'number' ? sel.pick : ''}
            </div>
            <div className="flex-1">
              <div className="text-sm font-extrabold text-text">
                {label}
              </div>
              <div className="text-[11.5px] text-[var(--text-mute)] font-semibold">
                Win {payMult}×
              </div>
            </div>
            <button
              onClick={() => setSel(null)}
              className="bg-transparent border-0 text-[var(--text-mute)] cursor-pointer"
            >
              {Icon.x({ size: 18 })}
            </button>
          </div>

          <div className="text-[11px] text-[var(--text-mute)] font-bold mb-[7px]">
            AMOUNT
          </div>
          <div className="flex gap-[7px] mb-3">
            {[1, 10, 100, 1000].map((v) => chip(v, setAmount, amount, (x) => String(x)))}
          </div>

          <div className="text-[11px] text-[var(--text-mute)] font-bold mb-[7px]">
            MULTIPLIER
          </div>
          <div className="flex gap-[7px] mb-4">
            {[1, 5, 10, 20, 50].map((v) =>
              chip(v, setMult, mult, (x) => 'x' + x),
            )}
          </div>

          <div className="flex justify-between text-[13px] mb-1.5">
            <span className="text-[var(--text-dim)] font-semibold">
              Total stake
            </span>
            <span className="text-text font-extrabold">
              {formatMoney(toMinor(stake))} USDT
            </span>
          </div>
          <div className="flex justify-between text-[13px] mb-4">
            <span className="text-[var(--text-dim)] font-semibold">
              Potential win
            </span>
            <span className="text-green font-extrabold">
              {formatMoney(toMinor(win))} USDT
            </span>
          </div>

          <Button
            full
            size="lg"
            disabled={locked}
            onClick={() => {
              if (!sel) return;
              const betPick: import('@/types').BetPick =
                sel.kind === 'number'
                  ? Number(sel.pick)
                  : (sel.pick as 'green' | 'red' | 'violet' | 'big' | 'small');
              app
                .placeBet({
                  mode: mode as import('@/types').RoundMode,
                  kind: sel.kind,
                  pick: betPick,
                  stake: toMinor(stake),
                })
                .then((result) => {
                  if (result.ok) {
                    app.pushToast(
                      `Bet placed · ${formatMoney(toMinor(stake))} on ${label}`,
                      'success',
                    );
                    setSel(null);
                  } else {
                    app.pushToast(result.error ?? 'Could not place bet', 'error');
                  }
                });
            }}
          >
            {locked
              ? 'Betting closed'
              : `Place bet · ${formatMoney(toMinor(stake))} USDT`}
          </Button>
        </div>
      )}
    </Card>
  );
}

// ── MyBets ───────────────────────────────────────────────────────────────────

function MyBets({
  mode,
  app,
  now,
}: {
  mode: number;
  app: ReturnType<typeof useApp>;
  now: number;
}) {
  const curIdx = app.periodAt(mode as import('@/types').RoundMode, now).periodIdx;
  const mine = app.bets.filter(
    (b) => b.mode === mode && b.periodIdx === curIdx,
  );

  return (
    <Card pad={18} style={{ marginBottom: 16 }}>
      <div className="text-[13px] font-extrabold text-text mb-3">
        Your bets this round
      </div>
      {mine.length ? (
        <div className="flex flex-col gap-[9px]">
          {mine.map((b) => {
            const pickStr = String(b.pick);
            const lbl =
              b.kind === 'number'
                ? 'Number ' + b.pick
                : b.kind === 'size'
                ? pickStr.toUpperCase()
                : pickStr[0].toUpperCase() + pickStr.slice(1);
            return (
              <div
                key={b.id}
                className="flex items-center justify-between"
              >
                <span className="text-[13px] font-bold text-text flex items-center gap-[7px]">
                  <span className="size-[7px] rounded-[4px] bg-[var(--accent)]" />
                  {lbl}
                </span>
                <span className="text-[13px] font-bold text-[var(--text-dim)]">
                  {formatMoney(b.stake)} USDT
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-[12.5px] text-[var(--text-mute)] text-center py-3">
          No bets placed yet
        </div>
      )}
    </Card>
  );
}

// ── Records ──────────────────────────────────────────────────────────────────

function Records({
  mode,
  app,
  now,
}: {
  mode: number;
  app: ReturnType<typeof useApp>;
  now: number;
}) {
  const data = app.recentResults(mode as import('@/types').RoundMode, 12, now);
  const W = 300,
    H = 60,
    pad = 6;
  const pts = data
    .slice()
    .reverse()
    .map((r, i) => [
      pad + (i / 11) * (W - pad * 2),
      pad + (1 - r.num / 9) * (H - pad * 2),
      r.num,
    ] as [number, number, number]);
  const path = pts
    .map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1))
    .join(' ');

  return (
    <Card pad={18}>
      <div className="text-[13px] font-extrabold text-text mb-3">
        Number trend
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 56 }}>
        <path
          d={path}
          fill="none"
          stroke="var(--accent-2)"
          strokeWidth={2}
          strokeLinecap="round"
        />
        {pts.map((p, i) => {
          const cs = numColorStyle(p[2]);
          return (
            <circle
              key={i}
              cx={p[0]}
              cy={p[1]}
              r={3}
              fill={cs.startsWith('linear') ? 'var(--violet)' : cs}
            />
          );
        })}
      </svg>
      <div className="mt-3.5 border-t border-[var(--border)] pt-3">
        <div className="text-[11px] font-bold text-[var(--text-mute)] mb-2.5">
          RECENT DRAWS
        </div>
        <div className="flex flex-col gap-2">
          {data.slice(0, 5).map((r, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 text-xs"
            >
              <span className="text-[var(--text-mute)] font-semibold flex-1 tabular-nums">
                …{String(r.periodId).slice(-5)}
              </span>
              <ResultBall num={r.num} size={24} />
              <span className="w-12 text-right text-[var(--text-dim)] font-bold">
                {r.big ? 'Big' : 'Small'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ── WebGame (root) ───────────────────────────────────────────────────────────

export function Game() {
  const app = useApp();
  const now = useNow();
  const [mode, setMode] = useState<number>(30);
  const [sel, setSel] = useState<Sel | null>(null);
  const locked = app.secondsLeft(mode as import('@/types').RoundMode, now) <= 5;

  useEffect(() => {
    setSel(null);
  }, [mode]);

  return (
    <div className="pt-6 px-4 app:px-7 pb-10 mx-auto max-w-[1180px]">
      <ModeTabs mode={mode} setMode={setMode} app={app} />
      <div className="grid grid-cols-1 app:grid-cols-[minmax(0,1fr)_360px] gap-5 items-start">
        <Board
          mode={mode}
          app={app}
          now={now}
          sel={sel}
          setSel={setSel}
          locked={locked}
        />
        <div>
          <BetSlip
            sel={sel}
            setSel={setSel}
            mode={mode}
            app={app}
            locked={locked}
          />
          <MyBets mode={mode} app={app} now={now} />
          <Records mode={mode} app={app} now={now} />
        </div>
      </div>
    </div>
  );
}

export default Game;
