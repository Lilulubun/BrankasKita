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

  const publicRoutes = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/update-password'
  ];

  // A helper function to check if the current path is public
  const isPublicPath = (path: string) => {
    return publicRoutes.some(publicPath => 
      path === publicPath || (publicPath !== '/' && path.startsWith(publicPath + '/'))
    );
  };

  // If the user IS logged in...
  if (session) {
    // ...and they are trying to access a public-only page (like login),
    // redirect them to the homepage.
    if (isPublicPath(pathname)) {
      // Exception: allow access to homepage even when logged in
      if (pathname === '/') {
        return response;
      }
      return NextResponse.redirect(new URL('/', request.url))
    }
  } 
  // If the user is NOT logged in...
  else {
    // ...and they are trying to access a page that is NOT public,
    // redirect them to the login page.
    if (!isPublicPath(pathname)) {
        return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return response
}

// --- THIS IS THE CORRECTED PART ---
// This new matcher rule is more robust. It tells the middleware to run on all
// paths EXCEPT for those that start with '/api', '/_next/static', '/_next/image',
// or any path that contains a '.' (which signifies a file extension like .svg or .png).
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|.*\\..*).*)',
  ],
}