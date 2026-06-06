'use client';
/**
 * components/wallet/History.tsx — WebHistory screen.
 * Pass A port of web-pages.jsx WebHistory.
 */
import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store/useApp';
import { formatMoney } from '@/lib/money';
import { ROUTES } from '@/lib/nav';
import { Card } from '@/components/primitives/Card';
import { Button } from '@/components/primitives/Button';
import { ResultBall } from '@/components/primitives/ResultBall';
import { Icon } from '@/components/icons/Icon';
import { TxTable } from './TxTable';
import { StatusBadge } from './StatusBadge';

const Wrap = ({ children, w = 980 }: { children: React.ReactNode; w?: number }) => (
  <div style={{ padding: '24px 28px 48px', maxWidth: w, margin: '0 auto' }}>
    {children}
  </div>
);

export function History() {
  const app = useApp();
  const router = useRouter();
  const [tab, setTab] = useState<'tx' | 'bets'>('tx');

  return (
    <Wrap w={980}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
        {(
          [
            ['tx', 'Transactions'],
            ['bets', 'Bets'],
          ] as const
        ).map((t) => (
          <button
            key={t[0]}
            onClick={() => setTab(t[0])}
            style={{
              padding: '9px 18px',
              borderRadius: 999,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 13.5,
              fontWeight: 700,
              background: tab === t[0] ? 'var(--accent)' : 'var(--surface)',
              color: tab === t[0] ? 'var(--accent-ink)' : 'var(--text-dim)',
              border:
                '1px solid ' + (tab === t[0] ? 'transparent' : 'var(--border)'),
            }}
          >
            {t[1]}
          </button>
        ))}
      </div>

      {tab === 'tx' ? (
        <TxTable items={app.tx} />
      ) : app.bets.length ? (
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: 8,
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {app.bets.map((b, i) => {
                const pickStr = String(b.pick);
                const label =
                  b.kind === 'number'
                    ? 'Number ' + b.pick
                    : b.kind === 'size'
                    ? pickStr.toUpperCase()
                    : pickStr[0].toUpperCase() + pickStr.slice(1);
                return (
                  <tr
                    key={b.id}
                    style={{
                      borderBottom:
                        i < app.bets.length - 1
                          ? '1px solid var(--border)'
                          : 'none',
                    }}
                  >
                    <td style={{ padding: '12px' }}>
                      {b.result ? (
                        <ResultBall num={b.result.num} size={32} />
                      ) : (
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: 'var(--surface-2)',
                            color: 'var(--gold)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {Icon.clock({ size: 16 })}
                        </div>
                      )}
                    </td>
                    <td
                      style={{
                        padding: '12px',
                        fontSize: 13.5,
                        fontWeight: 700,
                        color: 'var(--text)',
                      }}
                    >
                      Wingo{' '}
                      {
                        app.MODE_LABEL[
                          b.mode as keyof typeof app.MODE_LABEL
                        ]
                      }{' '}
                      · {label}
                    </td>
                    <td
                      style={{
                        padding: '12px',
                        fontSize: 11.5,
                        color: 'var(--text-mute)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      Period {b.periodId}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <StatusBadge status={b.status} />
                    </td>
                    <td
                      style={{
                        padding: '12px',
                        textAlign: 'right',
                        fontSize: 14,
                        fontWeight: 800,
                        color:
                          b.status === 'won'
                            ? 'var(--green)'
                            : b.status === 'lost'
                            ? 'var(--text-mute)'
                            : 'var(--gold)',
                      }}
                    >
                      {b.status === 'won'
                        ? '+' + formatMoney(b.payout ?? 0)
                        : b.status === 'lost'
                        ? '−' + formatMoney(b.stake)
                        : formatMoney(b.stake)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <Card pad={48} style={{ textAlign: 'center', color: 'var(--text-mute)' }}>
          <div
            style={{
              marginBottom: 10,
              display: 'flex',
              justifyContent: 'center',
              opacity: 0.5,
            }}
          >
            {Icon.history({ size: 38 })}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>No bets yet</div>
          <div style={{ fontSize: 12.5, marginTop: 4, marginBottom: 16 }}>
            Place your first bet on Wingo
          </div>
          <Button onClick={() => router.push(ROUTES.game)}>Play now</Button>
        </Card>
      )}
    </Wrap>
  );
}

export default History;
