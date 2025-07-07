import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
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
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({
              name,
              value: '',
              ...options,
            });
          },
        },
      }
    );

    const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

    if (sessionError) {
      console.error('Error exchanging code for session:', sessionError);
      return NextResponse.redirect(new URL('/login?error=Authentication failed', requestUrl.origin));
    }

    if (session?.user) {
      // Check if user already exists in our users table
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', session.user.id)
        .single();

      if (userError && userError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error checking existing user:', userError);
        return NextResponse.redirect(new URL('/login?error=Database error', requestUrl.origin));
      }

      // If user doesn't exist, create them
      if (!existingUser) {
        const { error: insertError } = await supabase
          .from('users')
          .insert([
            {
              id: session.user.id,
              email: session.user.email,
              full_name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'User',
              is_admin: false,
            },
          ]);

        if (insertError) {
          console.error('Error creating user:', insertError);
          return NextResponse.redirect(new URL('/login?error=Failed to create user', requestUrl.origin));
        }
      }
    }

    return response;
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL('/', requestUrl.origin));
} 