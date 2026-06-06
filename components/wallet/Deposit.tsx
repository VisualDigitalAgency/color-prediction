'use client';
/**
 * components/wallet/Deposit.tsx — WebDeposit screen.
 * Pass A port of web-pages.jsx WebDeposit.
 * Adaptations:
 *   - `app.deposit(amt, label)` → `app.deposit({ network, amt: toMinor(amt) })`
 *   - `app.navigate('wallet')` → `router.push(ROUTES.wallet)`
 *   - `navigator.clipboard` guarded for SSR
 */
import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store/useApp';
import { toMinor } from '@/lib/money';
import { ROUTES } from '@/lib/nav';
import type { NetworkId } from '@/types';
import { Card } from '@/components/primitives/Card';
import { Button } from '@/components/primitives/Button';
import { Icon } from '@/components/icons/Icon';
import { QR } from './QR';

interface Network {
  k: NetworkId;
  label: string;
  fee: string;
  addr: string;
}

const NETWORKS: Network[] = [
  {
    k: 'trc20',
    label: 'USDT · TRC20',
    fee: 'No fee',
    addr: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
  },
  {
    k: 'bep20',
    label: 'USDT · BEP20',
    fee: '~0.8 USDT',
    addr: '0x9f4eA2b71C3dDf0a5E8b1c6F7a2D9e4B3c8A1d6E',
  },
  {
    k: 'erc20',
    label: 'USDT · ERC20',
    fee: '~6 USDT',
    addr: '0x3aB2c9D1e8F45a6B7c0D2e1F3a4B5c6D7e8F9a0B',
  },
];

const Wrap = ({ children, w = 920 }: { children: React.ReactNode; w?: number }) => (
  <div style={{ maxWidth: w }} className="pt-6 px-4 app:px-7 pb-12 mx-auto">
    {children}
  </div>
);

const H2 = ({ children }: { children: React.ReactNode }) => (
  <div className="text-base font-extrabold text-text mt-1 mx-0.5 mb-3.5">
    {children}
  </div>
);

export function Deposit() {
  const app = useApp();
  const router = useRouter();
  const [net, setNet] = useState<Network>(NETWORKS[0]);
  const [amt, setAmt] = useState(100);

  return (
    <Wrap w={920}>
      <div className="grid grid-cols-1 app:grid-cols-2 gap-[18px]">
        <div>
          <H2>Select network</H2>
          <div className="flex flex-col gap-2.5 mb-5">
            {NETWORKS.map((n) => (
              <button
                key={n.k}
                onClick={() => setNet(n)}
                className="flex items-center gap-[13px] py-[15px] px-4 rounded-[var(--radius-sm)] cursor-pointer text-left"
                style={{
                  background:
                    net.k === n.k
                      ? 'color-mix(in srgb,var(--accent) 12%,var(--surface))'
                      : 'var(--surface)',
                  border:
                    '1px solid ' + (net.k === n.k ? 'var(--accent)' : 'var(--border)'),
                }}
              >
                <div className="size-[38px] rounded-[11px] bg-[var(--header-grad)] flex items-center justify-center text-[var(--accent-ink)]">
                  {Icon.coin({ size: 20 })}
                </div>
                <div className="flex-1">
                  <div className="text-[14.5px] font-bold text-text">
                    {n.label}
                  </div>
                  <div className="text-[11.5px] text-[var(--text-mute)] font-semibold">
                    Network fee: {n.fee}
                  </div>
                </div>
                {net.k === n.k && (
                  <div className="text-[var(--accent)]">
                    {Icon.check({ size: 20 })}
                  </div>
                )}
              </button>
            ))}
          </div>

          <H2>Quick simulate (demo)</H2>
          <div className="flex gap-2.5 mb-4">
            {[50, 100, 500, 1000].map((v) => (
              <button
                key={v}
                onClick={() => setAmt(v)}
                className={`flex-1 py-[13px] rounded-[10px] cursor-pointer text-sm font-extrabold border ${amt === v ? 'bg-[var(--accent)] text-[var(--accent-ink)] border-transparent' : 'bg-[var(--surface-2)] text-[var(--text-dim)] border-[var(--border)]'}`}
              >
                {v}
              </button>
            ))}
          </div>
          <Button
            full
            size="lg"
            onClick={() => {
              app
                .deposit({ network: net.k, amt: toMinor(amt) })
                .then(() => router.push(ROUTES.wallet));
            }}
          >
            I have paid · credit {amt} USDT
          </Button>
        </div>

        <Card pad={26} style={{ textAlign: 'center' }}>
          <div className="inline-block">
            <QR data={net.addr} />
          </div>
          <div className="text-[11.5px] text-[var(--text-mute)] font-bold mt-4 mb-2">
            DEPOSIT ADDRESS · {net.label}
          </div>
          <div className="flex items-center gap-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl py-3 px-3.5">
            <span className="flex-1 text-xs text-text font-mono break-all text-left">
              {net.addr}
            </span>
            <button
              onClick={() => {
                if (typeof navigator !== 'undefined')
                  navigator.clipboard?.writeText(net.addr);
                app.pushToast('Address copied', 'success');
              }}
              className="bg-[var(--accent)] text-[var(--accent-ink)] border-0 rounded-[9px] py-[9px] px-[11px] cursor-pointer"
            >
              {Icon.copy({ size: 16 })}
            </button>
          </div>
          <div className="text-xs text-green font-bold mt-4 flex items-center justify-center gap-1.5">
            {Icon.gift({ size: 14 })}
            First deposit +200% bonus applies
          </div>
        </Card>
      </div>
    </Wrap>
  );
}

export default Deposit;
