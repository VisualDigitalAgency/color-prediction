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
  <div className="pt-6 px-7 pb-12 mx-auto" style={{ maxWidth: w }}>
    {children}
  </div>
);

const H2 = ({ children }: { children: React.ReactNode }) => (
  <div className="text-base font-extrabold text-text mt-1 mx-0.5 mb-3.5">
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
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Card glow pad={24}>
          <div className="text-xs text-[var(--text-mute)] font-bold">
            TOTAL BALANCE
          </div>
          <div className="flex items-baseline gap-[7px] mt-1.5 mb-[18px]">
            <CountUp
              value={fromMinor(app.totalBalance())}
              style={{ fontSize: 38, fontWeight: 900, color: 'var(--text)' }}
            />
            <span className="text-[15px] font-bold text-[var(--text-dim)]">
              USDT
            </span>
          </div>
          <div className="flex gap-2.5">
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

        <div className="grid grid-cols-2 gap-4">
          {wallets.slice(0, 4).map((w, i) => (
            <Card key={i} pad={16}>
              <div style={{ color: w[3] }} className="mb-2">
                {Icon[w[4] as keyof typeof Icon]?.({ size: 20 })}
              </div>
              <div style={{ color: w[3] }} className="text-xl font-black">
                {formatMoney(w[2])}
              </div>
              <div className="text-[11px] text-[var(--text-mute)] font-semibold mt-0.5">
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
