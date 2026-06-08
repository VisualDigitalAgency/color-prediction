/**
 * app/auth/callback/route.ts — Supabase magic-link / OAuth callback handler.
 *
 * Supabase redirects here after a user clicks a magic-link email.
 * Exchanges the `code` for a session, provisions missing user rows
 * (wallet/settings/vip) on first login, then redirects to /lobby.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer, createSupabaseServiceRole } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/lobby';

  if (code) {
    const supabase = await createSupabaseServer();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const userId = data.user.id;

      // Provision rows that AuthModal.provisionUserRows handles for phone OTP.
      // Use service role so wallet upsert bypasses the "service writes only" RLS policy.
      const svc = await createSupabaseServiceRole();
      await Promise.all([
        supabase.from('profiles').upsert({
          id: userId,
          phone: data.user.phone ?? null,
          created_at: Date.now(),
        }, { ignoreDuplicates: true }),
        svc.from('wallets').upsert({ user_id: userId }, { ignoreDuplicates: true }),
        supabase.from('settings').upsert({ user_id: userId }, { ignoreDuplicates: true }),
        supabase.from('vip').upsert({ user_id: userId }, { ignoreDuplicates: true }),
      ]);

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/?auth_error=1`);
}
