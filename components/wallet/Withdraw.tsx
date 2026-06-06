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

const inputCls =
  'w-full bg-bg border border-[var(--border)] rounded-[var(--radius-sm)] py-3.5 px-4 text-text text-[15px] font-semibold font-sans outline-none box-border';

const Wrap = ({ children, w = 620 }: { children: React.ReactNode; w?: number }) => (
  <div className="pt-6 px-4 app:px-7 pb-12 mx-auto" style={{ maxWidth: w }}>
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
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-xs text-[var(--text-mute)] font-bold">
              WITHDRAWABLE
            </div>
            <div className="text-[26px] font-black text-text">
              {formatMoney(app.wallet.main)} USDT
            </div>
          </div>
          <div className="size-[46px] rounded-[14px] bg-[var(--header-grad)] flex items-center justify-center text-[var(--accent-ink)]">
            {Icon.wallet({ size: 24 })}
          </div>
        </div>

        <div className="text-[11.5px] text-[var(--text-mute)] font-bold mb-2">
          AMOUNT (USDT)
        </div>
        <div className="flex gap-2.5 mb-4">
          <input
            value={amt}
            onChange={(e) =>
              setAmt(e.target.value.replace(/[^0-9.]/g, ''))
            }
            placeholder="0.00"
            className={inputCls}
          />
          <Button
            variant="ghost"
            onClick={() => setAmt(String(fromMinor(app.wallet.main)))}
          >
            MAX
          </Button>
        </div>

        <div className="text-[11.5px] text-[var(--text-mute)] font-bold mb-2">
          USDT ADDRESS (TRC20)
        </div>
        <input
          value={addr}
          onChange={(e) => setAddr(e.target.value)}
          placeholder="Paste wallet address"
          className={`${inputCls} mb-4`}
        />

        <div className="bg-[var(--surface-2)] rounded-[var(--radius-sm)] py-3.5 px-4 mb-[18px]">
          {(
            [
              ['Network fee (1%)', `−${formatMoney(feeMinor)}`],
              ['You receive', `${formatMoney(recvMinor)} USDT`],
              ['Arrival', '~3 min · on-chain'],
            ] as const
          ).map((r, i) => (
            <div
              key={i}
              className="flex justify-between py-[5px] text-[13px]"
              style={{
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
