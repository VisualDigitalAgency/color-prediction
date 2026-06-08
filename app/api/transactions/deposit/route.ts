import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer, createSupabaseServiceRole } from '@/lib/supabase/server';
import { add } from '@/lib/money';
import type { NetworkId } from '@/types';

function genId(prefix: string) {
  return `${prefix}${Date.now()}${Math.random().toString(36).slice(2, 7)}`;
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { network, amt } = await req.json() as { network: NetworkId; amt: number };
  if (!network || !amt || amt <= 0) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 422 });
  }

  const svc = await createSupabaseServiceRole();
  const now = Date.now();
  const txId = genId('d');

  const { data: wallet } = await svc
    .from('wallets')
    .select('main')
    .eq('user_id', user.id)
    .single();

  const currentMain = wallet?.main ?? 0;

  await svc.from('wallets').upsert({
    user_id: user.id,
    main: add(currentMain, amt),
    updated_at: now,
  });

  await svc.from('transactions').insert({
    id: txId,
    user_id: user.id,
    type: 'deposit',
    method: network,
    amt,
    dir: 1,
    status: 'success',
    created_at: now,
  });

  return NextResponse.json({
    id: txId,
    user_id: user.id,
    type: 'deposit',
    method: network,
    amt,
    dir: 1,
    status: 'success',
    created_at: now,
  });
}
