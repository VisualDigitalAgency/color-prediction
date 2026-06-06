'use client';
/**
 * components/game/Game.tsx — Wingo game screen.
 * Pass A: inline-parity port of /tmp/proto_extract/web/web-game.jsx.
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
import { formatMoney, toMinor, fromMinor } from '@/lib/money';
import { STRINGS } from '@/lib/strings';
import { ROUTES } from '@/lib/nav';
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
    <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
      {app.MODES.map((m) => {
        const on = m === mode;
        return (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '11px 20px',
              borderRadius: 999,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 14,
              fontWeight: 800,
              background: on ? 'var(--header-grad)' : 'var(--surface)',
              color: on ? 'var(--accent-ink)' : 'var(--text-dim)',
              border: on ? 'none' : '1px solid var(--border)',
              boxShadow: on ? 'var(--glow-accent)' : 'none',
              transition: 'all .15s',
            }}
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
        <div
          style={{
            background: 'var(--header-grad)',
            padding: '22px 26px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: 'var(--accent-ink)',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                opacity: 0.85,
                letterSpacing: '.5px',
              }}
            >
              WINGO · {app.MODE_LABEL[mode as keyof typeof app.MODE_LABEL]}
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, marginTop: 3 }}>
              Period {p.periodId}
            </div>
            <div
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                opacity: 0.75,
                marginTop: 5,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              {Icon.shield({ size: 13 })}
              {STRINGS.game.fairPlay}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div
              style={{ fontSize: 12, fontWeight: 800, opacity: 0.8, marginBottom: 5 }}
            >
              {locked ? 'DRAWING…' : 'TIME REMAINING'}
            </div>
            <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
              {timerStr.split('').map((ch, i) =>
                ch === ':' ? (
                  <span key={i} style={{ fontSize: 34, fontWeight: 900 }}>
                    :
                  </span>
                ) : (
                  <span
                    key={i}
                    style={{
                      background: 'rgba(0,0,0,.28)',
                      color: '#fff',
                      borderRadius: 8,
                      padding: '5px 10px',
                      fontSize: 32,
                      fontWeight: 900,
                      fontVariantNumeric: 'tabular-nums',
                      animation: locked ? 'pulse .8s infinite' : 'none',
                    }}
                  >
                    {ch}
                  </span>
                ),
              )}
            </div>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 26px',
          }}
        >
          <span
            style={{ fontSize: 11.5, color: 'var(--text-mute)', fontWeight: 700 }}
          >
            LAST 10
          </span>
          <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
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
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 5,
              borderRadius: 'var(--radius)',
              background: 'color-mix(in srgb, var(--bg) 72%, transparent)',
              backdropFilter: 'blur(2px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ color: 'var(--red)', animation: 'pulse 1s infinite' }}>
              {Icon.clock({ size: 34 })}
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>
              Betting closed
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-mute)' }}>
              Drawing result for this round…
            </div>
          </div>
        )}

        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--text-mute)',
            marginBottom: 12,
          }}
        >
          PICK A COLOR
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            gap: 14,
            marginBottom: 22,
          }}
        >
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
                padding: '20px',
                borderRadius: 'var(--radius-sm)',
                border: isSel('color', c[0]) ? '2px solid #fff' : '2px solid transparent',
                cursor: 'pointer',
                fontFamily: 'inherit',
                background: c[3],
                color: '#fff',
                boxShadow: c[4],
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                transition: 'transform .12s',
              }}
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
              <span style={{ fontSize: 19, fontWeight: 800 }}>{c[1]}</span>
              <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.85 }}>
                Win {c[2]}
              </span>
            </button>
          ))}
        </div>

        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--text-mute)',
            marginBottom: 12,
          }}
        >
          PICK A NUMBER · Win 9×
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(10,1fr)',
            gap: 10,
            marginBottom: 22,
          }}
        >
          {Array.from({ length: 10 }).map((_, n) => (
            <button
              key={n}
              onClick={() => pick('number', n)}
              style={{
                aspectRatio: '1',
                borderRadius: '50%',
                border: isSel('number', n) ? '3px solid #fff' : '3px solid transparent',
                cursor: 'pointer',
                fontFamily: 'inherit',
                background: numColorStyle(n),
                color: '#fff',
                fontSize: 20,
                fontWeight: 800,
                boxShadow: '0 4px 12px rgba(0,0,0,.35)',
                transition: 'transform .12s',
              }}
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

        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--text-mute)',
            marginBottom: 12,
          }}
        >
          BIG OR SMALL
        </div>
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}
        >
          {(
            [
              [
                'big',
                'BIG',
                '5 – 9',
                'linear-gradient(135deg,#ff9a3d,#ff5a3d)',
              ],
              [
                'small',
                'SMALL',
                '0 – 4',
                'linear-gradient(135deg,#3da5ff,#7c5cff)',
              ],
            ] as const
          ).map((s) => (
            <button
              key={s[0]}
              onClick={() => pick('size', s[0])}
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-sm)',
                border: isSel('size', s[0]) ? '2px solid #fff' : '2px solid transparent',
                cursor: 'pointer',
                fontFamily: 'inherit',
                background: s[3],
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
              }}
            >
              <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: '1px' }}>
                {s[1]}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, opacity: 0.85 }}>
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
      style={{
        flex: 1,
        padding: '9px 0',
        borderRadius: 9,
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: 13,
        fontWeight: 800,
        background: cur === v ? 'var(--accent)' : 'var(--surface-2)',
        color: cur === v ? 'var(--accent-ink)' : 'var(--text-dim)',
        border: '1px solid ' + (cur === v ? 'transparent' : 'var(--border)'),
      }}
    >
      {fmt(v)}
    </button>
  );

  return (
    <Card pad={18} style={{ marginBottom: 16 }}>
      <div
        style={{
          fontSize: 14,
          fontWeight: 800,
          color: 'var(--text)',
          marginBottom: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {Icon.target({ size: 18, color: 'var(--accent)' })}
        Bet slip
      </div>

      {!sel ? (
        <div
          style={{
            textAlign: 'center',
            padding: '26px 10px',
            color: 'var(--text-mute)',
          }}
        >
          <div
            style={{
              opacity: 0.5,
              display: 'flex',
              justifyContent: 'center',
              marginBottom: 10,
            }}
          >
            {Icon.target({ size: 32 })}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>
            Tap a color, number or size
          </div>
          <div style={{ fontSize: 12, marginTop: 2 }}>to build your bet</div>
        </div>
      ) : (
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 11,
              padding: '12px',
              background: 'var(--surface-2)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: 14,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: swatch,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 800,
              }}
            >
              {sel.kind === 'number' ? sel.pick : ''}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>
                {label}
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: 'var(--text-mute)',
                  fontWeight: 600,
                }}
              >
                Win {payMult}×
              </div>
            </div>
            <button
              onClick={() => setSel(null)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-mute)',
                cursor: 'pointer',
              }}
            >
              {Icon.x({ size: 18 })}
            </button>
          </div>

          <div
            style={{
              fontSize: 11,
              color: 'var(--text-mute)',
              fontWeight: 700,
              marginBottom: 7,
            }}
          >
            AMOUNT
          </div>
          <div style={{ display: 'flex', gap: 7, marginBottom: 12 }}>
            {[1, 10, 100, 1000].map((v) => chip(v, setAmount, amount, (x) => String(x)))}
          </div>

          <div
            style={{
              fontSize: 11,
              color: 'var(--text-mute)',
              fontWeight: 700,
              marginBottom: 7,
            }}
          >
            MULTIPLIER
          </div>
          <div style={{ display: 'flex', gap: 7, marginBottom: 16 }}>
            {[1, 5, 10, 20, 50].map((v) =>
              chip(v, setMult, mult, (x) => 'x' + x),
            )}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 13,
              marginBottom: 6,
            }}
          >
            <span style={{ color: 'var(--text-dim)', fontWeight: 600 }}>
              Total stake
            </span>
            <span style={{ color: 'var(--text)', fontWeight: 800 }}>
              {formatMoney(toMinor(stake))} USDT
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            <span style={{ color: 'var(--text-dim)', fontWeight: 600 }}>
              Potential win
            </span>
            <span style={{ color: 'var(--green)', fontWeight: 800 }}>
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
      <div
        style={{
          fontSize: 13,
          fontWeight: 800,
          color: 'var(--text)',
          marginBottom: 12,
        }}
      >
        Your bets this round
      </div>
      {mine.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
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
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--text)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 4,
                      background: 'var(--accent)',
                    }}
                  />
                  {lbl}
                </span>
                <span
                  style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dim)' }}
                >
                  {formatMoney(b.stake)} USDT
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          style={{
            fontSize: 12.5,
            color: 'var(--text-mute)',
            textAlign: 'center',
            padding: '12px 0',
          }}
        >
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
      <div
        style={{
          fontSize: 13,
          fontWeight: 800,
          color: 'var(--text)',
          marginBottom: 12,
        }}
      >
        Number trend
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 56 }}>
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
      <div
        style={{
          marginTop: 14,
          borderTop: '1px solid var(--border)',
          paddingTop: 12,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--text-mute)',
            marginBottom: 10,
          }}
        >
          RECENT DRAWS
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data.slice(0, 5).map((r, i) => (
            <div
              key={i}
              style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}
            >
              <span
                style={{
                  color: 'var(--text-mute)',
                  fontWeight: 600,
                  flex: 1,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                …{String(r.periodId).slice(-5)}
              </span>
              <ResultBall num={r.num} size={24} />
              <span
                style={{
                  width: 48,
                  textAlign: 'right',
                  color: 'var(--text-dim)',
                  fontWeight: 700,
                }}
              >
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
    <div style={{ padding: '24px 28px 40px', maxWidth: 1180, margin: '0 auto' }}>
      <ModeTabs mode={mode} setMode={setMode} app={app} />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) 360px',
          gap: 20,
          alignItems: 'start',
        }}
      >
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
