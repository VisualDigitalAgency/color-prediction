import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

// Routes that require an authenticated session
const PROTECTED_PREFIX = '/app'; // (app) group routes all start here after routing
// More specific: all routes under (app) layout are /lobby, /game, /wallet, etc.
const PROTECTED_ROUTES = [
  '/lobby',
  '/game',
  '/wallet',
  '/deposit',
  '/withdraw',
  '/history',
  '/rewards',
  '/referral',
  '/vip',
  '/profile',
  '/settings',
];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh session if expired — must call getUser() not getSession()
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isProtected = PROTECTED_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'));

  if (isProtected && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/';
    redirectUrl.searchParams.set('auth', '1'); // signal Landing to open AuthModal
    return NextResponse.redirect(redirectUrl);
  }

  // If authed user hits the landing page, redirect to lobby
  if (pathname === '/' && user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/lobby';
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
