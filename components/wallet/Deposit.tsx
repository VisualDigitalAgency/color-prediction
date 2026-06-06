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
  <div style={{ padding: '24px 28px 48px', maxWidth: w, margin: '0 auto' }}>
    {children}
  </div>
);

const H2 = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      fontSize: 16,
      fontWeight: 800,
      color: 'var(--text)',
      margin: '4px 2px 14px',
    }}
  >
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div>
          <H2>Select network</H2>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              marginBottom: 20,
            }}
          >
            {NETWORKS.map((n) => (
              <button
                key={n.k}
                onClick={() => setNet(n)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 13,
                  padding: '15px 16px',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  background:
                    net.k === n.k
                      ? 'color-mix(in srgb,var(--accent) 12%,var(--surface))'
                      : 'var(--surface)',
                  border:
                    '1px solid ' + (net.k === n.k ? 'var(--accent)' : 'var(--border)'),
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 11,
                    background: 'var(--header-grad)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-ink)',
                  }}
                >
                  {Icon.coin({ size: 20 })}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 14.5,
                      fontWeight: 700,
                      color: 'var(--text)',
                    }}
                  >
                    {n.label}
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: 'var(--text-mute)',
                      fontWeight: 600,
                    }}
                  >
                    Network fee: {n.fee}
                  </div>
                </div>
                {net.k === n.k && (
                  <div style={{ color: 'var(--accent)' }}>
                    {Icon.check({ size: 20 })}
                  </div>
                )}
              </button>
            ))}
          </div>

          <H2>Quick simulate (demo)</H2>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            {[50, 100, 500, 1000].map((v) => (
              <button
                key={v}
                onClick={() => setAmt(v)}
                style={{
                  flex: 1,
                  padding: '13px 0',
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 14,
                  fontWeight: 800,
                  background: amt === v ? 'var(--accent)' : 'var(--surface-2)',
                  color: amt === v ? 'var(--accent-ink)' : 'var(--text-dim)',
                  border:
                    '1px solid ' + (amt === v ? 'transparent' : 'var(--border)'),
                }}
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
          <div style={{ display: 'inline-block' }}>
            <QR data={net.addr} />
          </div>
          <div
            style={{
              fontSize: 11.5,
              color: 'var(--text-mute)',
              fontWeight: 700,
              margin: '16px 0 8px',
            }}
          >
            DEPOSIT ADDRESS · {net.label}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '12px 14px',
            }}
          >
            <span
              style={{
                flex: 1,
                fontSize: 12,
                color: 'var(--text)',
                fontFamily: 'monospace',
                wordBreak: 'break-all',
                textAlign: 'left',
              }}
            >
              {net.addr}
            </span>
            <button
              onClick={() => {
                if (typeof navigator !== 'undefined')
                  navigator.clipboard?.writeText(net.addr);
                app.pushToast('Address copied', 'success');
              }}
              style={{
                background: 'var(--accent)',
                color: 'var(--accent-ink)',
                border: 'none',
                borderRadius: 9,
                padding: '9px 11px',
                cursor: 'pointer',
              }}
            >
              {Icon.copy({ size: 16 })}
            </button>
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--green)',
              fontWeight: 700,
              marginTop: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            {Icon.gift({ size: 14 })}
            First deposit +200% bonus applies
          </div>
        </Card>
      </div>
    </Wrap>
  );
}

export default Deposit;
