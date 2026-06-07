import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer, createSupabaseServiceRole } from '@/lib/supabase/server';
import { periodAt } from '@/lib/fair';
import { sub } from '@/lib/money';
import type { RoundMode, BetKind } from '@/types';

function genId(prefix: string) {
  return `${prefix}${Date.now()}${Math.random().toString(36).slice(2, 7)}`;
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { mode, kind, pick, stake } = body as {
    mode: RoundMode;
    kind: BetKind;
    pick: string;
    stake: number;
  };

  if (!mode || !kind || pick === undefined || !stake || stake <= 0) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 422 });
  }

  const svc = await createSupabaseServiceRole();

  // Check balance (service role reads bypass RLS)
  const { data: wallet } = await svc
    .from('wallets')
    .select('main')
    .eq('user_id', user.id)
    .single();

  if (!wallet || wallet.main < stake) {
    return NextResponse.json({ error: 'Insufficient balance' }, { status: 409 });
  }

  const period = periodAt(mode, Date.now());
  const betId = genId('b');
  const now = Date.now();

  // Atomic: insert bet + debit wallet + insert tx
  const { error: betErr } = await svc.from('bets').insert({
    id: betId,
    user_id: user.id,
    mode,
    kind,
    pick,
    stake,
    period_idx: period.periodIdx,
    period_id: period.periodId,
    status: 'pending',
    created_at: now,
  });
  if (betErr) return NextResponse.json({ error: betErr.message }, { status: 500 });

  const newMain = sub(wallet.main, stake);
  const { error: walletErr } = await svc
    .from('wallets')
    .update({ main: newMain, updated_at: now })
    .eq('user_id', user.id);
  if (walletErr) return NextResponse.json({ error: walletErr.message }, { status: 500 });

  await svc.from('transactions').insert({
    id: genId('tb'),
    user_id: user.id,
    type: 'bet',
    method: 'system',
    amt: stake,
    dir: -1,
    status: 'success',
    created_at: now,
  });

  return NextResponse.json({
    id: betId,
    user_id: user.id,
    mode,
    kind,
    pick,
    stake,
    period_idx: period.periodIdx,
    period_id: period.periodId,
    status: 'pending',
    created_at: now,
  });
}
