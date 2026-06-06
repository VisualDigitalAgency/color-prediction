/**
 * components/shell/TopBar.tsx — sticky desktop header (≥1100px).
 *
 * Ported VERBATIM from the CDN prototype (`/tmp/proto_extract/web/web-shell.jsx`
 * `TopBar`). Pass A (inline-parity): every `style={{…}}` object is byte-identical
 * to the prototype — sticky blur header, the balance pill, Deposit button, bell
 * with red dot, and the avatar all reference `var(--…)`, never hardcoded hex.
 *
 * Two faithful adaptations of the prototype, both required by the production
 * store/router:
 *   - Balance: the prototype showed `app.wallet.main` (a display float). The
 *     store stores integer minor-units across four sub-wallets, so the pill
 *     renders `formatMoney(app.totalBalance())` (total balance, minor-unit safe).
 *   - Navigation (ADR 0003): `app.navigate('deposit'|'profile')` →
 *     App Router `router.push(ROUTES.…)`.
 *
 * `title` is derived from the route by the (app) layout and passed in.
 */

'use client';

import { useRouter } from 'next/navigation';

import { Icon } from '@/components/icons/Icon';
import { Button } from '@/components/primitives/Button';
import { formatMoney } from '@/lib/money';
import { ROUTES } from '@/lib/nav';
import { useApp } from '@/lib/store';
import STRINGS from '@/lib/strings';

export interface TopBarProps {
  title: string;
}

export function TopBar({ title }: TopBarProps) {
  const app = useApp();
  const router = useRouter();

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '16px 28px',
        background: 'color-mix(in srgb, var(--bg) 82%, transparent)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)' }}>{title}</div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 8px 8px 14px',
          borderRadius: 999,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 13,
            background: 'var(--header-grad)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-ink)',
          }}
        >
          {Icon.coin({ size: 16 })}
        </div>
        <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>
          {formatMoney(app.totalBalance())}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-mute)', fontWeight: 700 }}>{STRINGS.wallet.currency}</span>
        <Button size="sm" icon="plus" onClick={() => router.push(ROUTES.deposit)} style={{ marginLeft: 4 }}>
          {STRINGS.wallet.deposit}
        </Button>
      </div>
      <button
        onClick={() => app.pushToast(STRINGS.toast.notifications, 'info')}
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        {Icon.bell({ size: 20 })}
        <span style={{ position: 'absolute', top: 9, right: 11, width: 7, height: 7, borderRadius: 4, background: 'var(--red)' }} />
      </button>
      <button
        onClick={() => router.push(ROUTES.profile)}
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          background: 'var(--header-grad)',
          border: 'none',
          color: 'var(--accent-ink)',
          fontWeight: 800,
          fontSize: 17,
          cursor: 'pointer',
        }}
      >
        A
      </button>
    </header>
  );
}

export default TopBar;
