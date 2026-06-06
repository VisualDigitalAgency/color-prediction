'use client';
/**
 * components/wallet/Wallet.tsx — WebWallet screen.
 * Pass A port of web-pages.jsx WebWallet.
 */
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store/useApp';
import { formatMoney, fromMinor } from '@/lib/money';
import { ROUTES } from '@/lib/nav';
import { Card } from '@/components/primitives/Card';
import { Button } from '@/components/primitives/Button';
import { CountUp } from '@/components/primitives/CountUp';
import { Icon } from '@/components/icons/Icon';
import { TxTable } from './TxTable';

const Wrap = ({ children, w = 980 }: { children: React.ReactNode; w?: number }) => (
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

export function Wallet() {
  const app = useApp();
  const router = useRouter();

  const wallets: [string, string, number, string, string][] = [
    ['Main wallet', 'Available for betting', app.wallet.main, 'var(--accent)', 'wallet'],
    ['Winnings', 'Withdrawable', app.wallet.winning, 'var(--green)', 'trophy'],
    ['Bonus wallet', 'Wager to unlock', app.wallet.bonus, 'var(--gold)', 'gift'],
    ['Referral', 'Commission earnings', app.wallet.referral, 'var(--violet)', 'users'],
  ];

  return (
    <Wrap w={980}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
          marginBottom: 16,
        }}
      >
        <Card glow pad={24}>
          <div style={{ fontSize: 12, color: 'var(--text-mute)', fontWeight: 700 }}>
            TOTAL BALANCE
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 7,
              margin: '6px 0 18px',
            }}
          >
            <CountUp
              value={fromMinor(app.totalBalance())}
              style={{ fontSize: 38, fontWeight: 900, color: 'var(--text)' }}
            />
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-dim)' }}>
              USDT
            </span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button
              full
              size="lg"
              icon="plus"
              onClick={() => router.push(ROUTES.deposit)}
            >
              Deposit
            </Button>
            <Button
              full
              size="lg"
              variant="ghost"
              icon="arrowUp"
              onClick={() => router.push(ROUTES.withdraw)}
            >
              Withdraw
            </Button>
          </div>
        </Card>

        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
        >
          {wallets.slice(0, 4).map((w, i) => (
            <Card key={i} pad={16}>
              <div style={{ color: w[3], marginBottom: 8 }}>
                {Icon[w[4] as keyof typeof Icon]?.({ size: 20 })}
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: w[3] }}>
                {formatMoney(w[2])}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-mute)',
                  fontWeight: 600,
                  marginTop: 2,
                }}
              >
                {w[0]}
              </div>
            </Card>
          ))}
        </div>
      </div>

      <H2>Recent activity</H2>
      <TxTable items={app.tx.slice(0, 7)} />
    </Wrap>
  );
}

export default Wallet;
