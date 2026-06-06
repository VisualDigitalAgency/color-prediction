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
  <div className="pt-6 px-4 app:px-7 pb-12 mx-auto" style={{ maxWidth: w }}>
    {children}
  </div>
);

export function History() {
  const app = useApp();
  const router = useRouter();
  const [tab, setTab] = useState<'tx' | 'bets'>('tx');

  return (
    <Wrap w={980}>
      <div className="flex gap-2.5 mb-[18px]">
        {(
          [
            ['tx', 'Transactions'],
            ['bets', 'Bets'],
          ] as const
        ).map((t) => (
          <button
            key={t[0]}
            onClick={() => setTab(t[0])}
            className={`py-[9px] px-[18px] rounded-full cursor-pointer text-[13.5px] font-bold border ${
              tab === t[0]
                ? 'bg-[var(--accent)] text-[var(--accent-ink)] border-transparent'
                : 'bg-surface text-[var(--text-dim)] border-[var(--border)]'
            }`}
          >
            {t[1]}
          </button>
        ))}
      </div>

      {tab === 'tx' ? (
        <TxTable items={app.tx} />
      ) : app.bets.length ? (
        <div className="bg-surface border border-[var(--border)] rounded-[var(--radius)] p-2 shadow-[var(--card-shadow)] overflow-x-auto">
          <table className="w-full border-collapse min-w-[480px]">
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
                    className={i < app.bets.length - 1 ? 'border-b border-[var(--border)]' : ''}
                  >
                    <td className="p-3">
                      {b.result ? (
                        <ResultBall num={b.result.num} size={32} />
                      ) : (
                        <div className="size-8 rounded-full bg-[var(--surface-2)] text-[var(--gold)] flex items-center justify-center">
                          {Icon.clock({ size: 16 })}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-[13.5px] font-bold text-text">
                      Wingo{' '}
                      {
                        app.MODE_LABEL[
                          b.mode as keyof typeof app.MODE_LABEL
                        ]
                      }{' '}
                      · {label}
                    </td>
                    <td className="p-3 text-[11.5px] text-[var(--text-mute)] tabular-nums">
                      Period {b.periodId}
                    </td>
                    <td className="p-3 text-right">
                      <StatusBadge status={b.status} />
                    </td>
                    <td
                      className="p-3 text-right text-sm font-extrabold"
                      style={{
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
          <div className="mb-2.5 flex justify-center opacity-50">
            {Icon.history({ size: 38 })}
          </div>
          <div className="text-sm font-bold">No bets yet</div>
          <div className="text-[12.5px] mt-1 mb-4">
            Place your first bet on Wingo
          </div>
          <Button onClick={() => router.push(ROUTES.game)}>Play now</Button>
        </Card>
      )}
    </Wrap>
  );
}

export default History;
