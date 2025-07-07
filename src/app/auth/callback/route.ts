import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const access_token = requestUrl.searchParams.get('access_token');
  const refresh_token = requestUrl.searchParams.get('refresh_token');
  const next = requestUrl.searchParams.get('next') || '/';

  const response = NextResponse.redirect(new URL(next, requestUrl.origin));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // 1️⃣ OAuth / magic link flow
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error('❌ Error exchanging code:', error.message);
      return NextResponse.redirect(new URL('/login?error=auth', requestUrl.origin));
    }
    return response;
  }

  // 2️⃣ Password recovery flow
  if (access_token && refresh_token) {
    const { error } = await supabase.auth.setSession({ access_token, refresh_token });
    if (error) {
      console.error('❌ Error setting session:', error.message);
      return NextResponse.redirect(new URL('/login?error=session', requestUrl.origin));
    }
    return response;
  }

  // 3️⃣ Invalid link fallback
  return NextResponse.redirect(new URL('/login?error=invalid-link', requestUrl.origin));
}
