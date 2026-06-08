import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer, createSupabaseServiceRole } from '@/lib/supabase/server';
import { sub } from '@/lib/money';
import type { NetworkId } from '@/types';

function genId(prefix: string) {
  return `${prefix}${Date.now()}${Math.random().toString(36).slice(2, 7)}`;
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { network, address, amt } = await req.json() as {
    network: NetworkId;
    address: string;
    amt: number;
  };

  if (!network || !address || !amt || amt <= 0) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 422 });
  }

  const svc = await createSupabaseServiceRole();
  const now = Date.now();

  const { data: wallet } = await svc
    .from('wallets')
    .select('main')
    .eq('user_id', user.id)
    .single();

  if (!wallet || wallet.main < amt) {
    return NextResponse.json({ error: 'Insufficient balance' }, { status: 409 });
  }

  const txId = genId('wd');

  await svc.from('wallets').update({
    main: sub(wallet.main, amt),
    updated_at: now,
  }).eq('user_id', user.id);

  await svc.from('transactions').insert({
    id: txId,
    user_id: user.id,
    type: 'withdraw',
    method: network,
    amt,
    dir: -1,
    status: 'pending',
    created_at: now,
  });

  return NextResponse.json({
    id: txId,
    user_id: user.id,
    type: 'withdraw',
    method: network,
    amt,
    dir: -1,
    status: 'pending',
    created_at: now,
  });
}
