/**
 * components/wallet/StatusBadge.tsx
 * Pass A port of StatusBadge from web-pages.jsx.
 */
import * as React from 'react';

type BadgeStatus = 'success' | 'pending' | 'failed' | 'won' | 'lost' | string;

export function StatusBadge({ status }: { status: BadgeStatus }) {
  const map: Record<string, [string, string]> = {
    success: ['var(--green)', 'Success'],
    pending: ['var(--gold)', 'Pending'],
    won: ['var(--green)', 'Won'],
    lost: ['var(--text-mute)', 'Lost'],
    failed: ['var(--red)', 'Failed'],
  };
  const [c, t] = map[status] ?? ['var(--text-mute)', status];
  return (
    <span
      style={{
        fontSize: 10.5,
        fontWeight: 700,
        color: c,
        padding: '3px 9px',
        borderRadius: 999,
        background: `color-mix(in srgb, ${c} 14%, transparent)`,
        border: `1px solid color-mix(in srgb, ${c} 30%, transparent)`,
      }}
    >
      {t}
    </span>
  );
}

export default StatusBadge;
