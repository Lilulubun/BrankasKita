// src/middleware.ts

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- THIS IS THE DEFINITIVE FIX ---
  // This rule runs first. If the path starts with '/api', the middleware
  // does nothing and immediately lets the request pass through.
  // This prevents it from ever redirecting your API calls.
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // --- The rest of the logic only runs for page requests ---

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  // Define all routes that are public and accessible to everyone.
  const publicRoutes = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/update-password',
    '/admin/login',
  ];

  const isPublicRoute = publicRoutes.includes(pathname);

  // If a logged-in user tries to visit the login or register page, redirect them home.
  if (session && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If a user is NOT logged in and they are trying to access a page that is NOT public,
  // send them to the login page.
  if (!session && !isPublicRoute) {
    if (pathname.startsWith('/admin')) {
        return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

// The config remains the same, but the logic inside the function is now more robust.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|.*\\..*).*)',
  ],
};