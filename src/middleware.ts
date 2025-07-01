// src/middleware.ts

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const { pathname } = request.nextUrl

  // --- NEW, MORE ROBUST LOGIC ---

  // Define all routes that should be accessible to unauthenticated users.
  const publicRoutes = [
    '/login',
    '/register',
    '/forgot-password',
    '/update-password' 
  ];

  // If the user IS logged in...
  if (session) {
    // ...and they are trying to access a public-only page (like login),
    // redirect them to the homepage.
    if (publicRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  } 
  // If the user is NOT logged in...
  else {
    // ...and they are trying to access a page that is NOT public,
    // redirect them to the login page.
    if (!publicRoutes.some(route => pathname.startsWith(route)) && pathname !== '/') {
        return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return response
}

// This config ensures the middleware runs on all paths except for static assets.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
