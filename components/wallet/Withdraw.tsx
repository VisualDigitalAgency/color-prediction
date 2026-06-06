'use client';
/**
 * components/wallet/Withdraw.tsx — WebWithdraw screen.
 * Pass A port of web-pages.jsx WebWithdraw.
 * Adaptations:
 *   - `app.withdraw(n, label)` → `app.withdraw({ network:'trc20', address, amt: toMinor(n) })`
 *   - All balance display from minor-units → formatMoney()
 */
import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store/useApp';
import { formatMoney, toMinor, fromMinor, mul, sub } from '@/lib/money';
import { ROUTES } from '@/lib/nav';
import { Card } from '@/components/primitives/Card';
import { Button } from '@/components/primitives/Button';
import { Icon } from '@/components/icons/Icon';

const webInput: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  padding: '14px 16px',
  color: 'var(--text)',
  fontSize: 15,
  fontWeight: 600,
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
};

const Wrap = ({ children, w = 620 }: { children: React.ReactNode; w?: number }) => (
  <div style={{ padding: '24px 28px 48px', maxWidth: w, margin: '0 auto' }}>
    {children}
  </div>
);

export function Withdraw() {
  const app = useApp();
  const router = useRouter();
  const [amt, setAmt] = useState('');
  const [addr, setAddr] = useState('');

  const n = parseFloat(amt) || 0;
  const nMinor = toMinor(n);
  const feeMinor = mul(nMinor, 0.01);
  const recvMinor = sub(nMinor, feeMinor);

  return (
    <Wrap w={620}>
      <Card pad={24}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          <div>
            <div
              style={{ fontSize: 12, color: 'var(--text-mute)', fontWeight: 700 }}
            >
              WITHDRAWABLE
            </div>
            <div
              style={{ fontSize: 26, fontWeight: 900, color: 'var(--text)' }}
            >
              {formatMoney(app.wallet.main)} USDT
            </div>
          </div>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              background: 'var(--header-grad)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-ink)',
            }}
          >
            {Icon.wallet({ size: 24 })}
          </div>
        </div>

        <div
          style={{
            fontSize: 11.5,
            color: 'var(--text-mute)',
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          AMOUNT (USDT)
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <input
            value={amt}
            onChange={(e) =>
              setAmt(e.target.value.replace(/[^0-9.]/g, ''))
            }
            placeholder="0.00"
            style={webInput}
          />
          <Button
            variant="ghost"
            onClick={() => setAmt(String(fromMinor(app.wallet.main)))}
          >
            MAX
          </Button>
        </div>

        <div
          style={{
            fontSize: 11.5,
            color: 'var(--text-mute)',
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          USDT ADDRESS (TRC20)
        </div>
        <input
          value={addr}
          onChange={(e) => setAddr(e.target.value)}
          placeholder="Paste wallet address"
          style={{ ...webInput, marginBottom: 16 }}
        />

        <div
          style={{
            background: 'var(--surface-2)',
            borderRadius: 'var(--radius-sm)',
            padding: '14px 16px',
            marginBottom: 18,
          }}
        >
          {(
            [
              ['Network fee (1%)', `−${formatMoney(feeMinor)}`],
              ['You receive', `${formatMoney(recvMinor)} USDT`],
              ['Arrival', '~3 min · on-chain'],
            ] as const
          ).map((r, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '5px 0',
                fontSize: 13,
                fontWeight: i === 1 ? 800 : 600,
                color: i === 1 ? 'var(--text)' : 'var(--text-dim)',
              }}
            >
              <span>{r[0]}</span>
              <span style={{ color: i === 1 ? 'var(--green)' : undefined }}>
                {r[1]}
              </span>
            </div>
          ))}
        </div>

        <Button
          full
          size="lg"
          disabled={!(nMinor > 0 && addr.length > 6)}
          onClick={() => {
            app
              .withdraw({ network: 'trc20', address: addr, amt: nMinor })
              .then((result) => {
                if (result.ok) router.push(ROUTES.wallet);
                else app.pushToast(result.error ?? 'Withdrawal failed', 'error');
              });
          }}
        >
          Request withdrawal
        </Button>
      </Card>
    </Wrap>
  );
}

export default Withdraw;
