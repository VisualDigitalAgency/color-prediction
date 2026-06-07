'use client';
/**
 * components/wallet/TxTable.tsx
 * Pass A port of TxTable from web-pages.jsx.
 * t.t (prototype date string) → formatted from t.createdAt (unix ms).
 */
import * as React from 'react';
import type { Transaction } from '@/types';
import { formatMoney } from '@/lib/money';
import { StatusBadge } from './StatusBadge';
import { Icon } from '@/components/icons/Icon';

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function TxTable({ items }: { items: Transaction[] }) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: 8,
        boxShadow: 'var(--card-shadow)',
        overflowX: 'auto',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 420 }}>
        <tbody>
          {items.map((t, i) => (
            <tr
              key={t.id}
              style={{
                borderBottom:
                  i < items.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <td style={{ padding: '12px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: 'var(--surface-2)',
                      color: t.dir > 0 ? 'var(--green)' : 'var(--red)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {t.dir > 0
                      ? Icon.arrowDown({ size: 17 })
                      : Icon.arrowUp({ size: 17 })}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 13.5,
                        fontWeight: 700,
                        color: 'var(--text)',
                      }}
                    >
                      {t.type}
                    </div>
                    <div
                      style={{
                        fontSize: 11.5,
                        color: 'var(--text-mute)',
                        fontWeight: 600,
                      }}
                    >
                      {t.method ?? ''}
                    </div>
                  </div>
                </div>
              </td>
              <td
                style={{
                  padding: '12px',
                  textAlign: 'right',
                  color: 'var(--text-mute)',
                  fontSize: 12,
                }}
              >
                {fmtDate(t.createdAt)}
              </td>
              <td style={{ padding: '12px', textAlign: 'right' }}>
                <StatusBadge status={t.status} />
              </td>
              <td
                style={{
                  padding: '12px 12px',
                  textAlign: 'right',
                  fontSize: 14.5,
                  fontWeight: 800,
                  color: t.dir > 0 ? 'var(--green)' : 'var(--text)',
                }}
              >
                {t.dir > 0 ? '+' : '−'}
                {formatMoney(t.amt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TxTable;
