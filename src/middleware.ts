// src/middleware.ts

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
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
  const { pathname } = request.nextUrl;

  // Define all routes that are public and accessible to everyone.
  const publicRoutes = [
    '/', // Allow access to the homepage
    '/login',
    '/register',
    '/forgot-password',
    '/update-password',
  ];

  // Check if the current page is one of the public routes.
  const isPublicRoute = publicRoutes.some(path => pathname === path);

  // If the user IS logged in...
  if (session) {
    // ...and they try to visit the login or register page, redirect them home.
    if (pathname === '/login' || pathname === '/register') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  } 
  // If the user is NOT logged in...
  else {
    // ...and they are trying to access a page that is NOT public,
    // redirect them to the login page.
    if (!isPublicRoute) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // In all other cases (e.g., a logged-out user visiting a public page), let them through.
  return response;
}

// This config ensures the middleware runs on all paths except for static assets.
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|.*\\..*).*)',
  ],
};