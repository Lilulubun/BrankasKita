// src/middleware.ts

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Create a response object that we can modify
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create a Supabase client that can read/write cookies
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

  // Get the current user session
  const { data: { session } } = await supabase.auth.getSession()

  const { pathname } = request.nextUrl

  // --- THE FIX IS HERE ---

  // First, check if the user is trying to reset their password.
  // The URL will contain a special hash with `type=recovery`.
  // The middleware cannot see the hash, but we can check if the user is on the update-password page.
  // If they are, we let them through no matter what.
  if (pathname.startsWith('/update-password')) {
    return response // Allow the request to proceed to the page
  }

  // --- The rest of the logic remains the same ---

  // If the user IS logged in...
  if (session) {
    // ...and they are trying to access public-only pages (like login),
    // redirect them to the homepage.
    if (pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/forgot-password')) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  } else {
    // If the user is NOT logged in...
    // ...and they are trying to access a protected page, redirect them to the login page.
    // Add all your protected routes to this array.
    const protectedRoutes = ['/my-orders', '/notifications', '/payment', '/set-pin', '/confirmation']
    if (protectedRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // If none of the above conditions are met, just continue as normal.
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
