/**
 * app/auth/callback/route.ts — Supabase magic-link / OAuth callback handler.
 *
 * Supabase redirects here after a user clicks a magic-link email.
 * Exchanges the `code` query param for a session cookie via @supabase/ssr,
 * then redirects to /lobby (authenticated home).
 *
 * URL: /auth/callback?code=<pkce_code>&next=/lobby
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/lobby';

  if (code) {
    const supabase = await createSupabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth failed — redirect to landing with error flag
  return NextResponse.redirect(`${origin}/?auth_error=1`);
}
