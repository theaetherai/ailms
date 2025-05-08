// import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000']

// const isProtectedRoutes = createRouteMatcher(['/dashboard(.*)', '/payment(.*)'])
// export default clerkMiddleware(async (auth, req) => {
//   if (isProtectedRoutes(req)) {
//     auth().protect()
//   }
// })

// export const config = {
//   matcher: [
//     // Skip Next.js internals and all static files, unless found in search params
//     '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
//     // Always run for API routes
//     '/(api|trpc)(.*)',
//   ],
// }

import { authMiddleware, redirectToSignIn } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define public routes
const publicRoutes = [
  '/',
  '/home',
  '/courses',
  '/courses/(.*)',
  '/preview/(.*)',
  '/api/(.*)',
  '/auth/sign-in/(.*)',
  '/auth/sign-up/(.*)',
  '/auth/callback/(.*)',
  '/typography',
  '/design-system/(.*)',
  '/payment',
  '/verify-route',
  '/db-error'
]

// Function to check if a path is a public route
function isPathPublic(pathname: string): boolean {
  return publicRoutes.some(route => {
    if (route.includes('(.*)')) {
      const baseRoute = route.replace('(.*)', '')
      return pathname.startsWith(baseRoute)
    }
    return route === pathname
  }) || 
  pathname.startsWith('/api/auth/') || 
  pathname.startsWith('/db-error')
}

// This middleware handles authentication only in Docker - no database checks
export default authMiddleware({
  publicRoutes,
  
  beforeAuth: async (req) => {
    // Skip checks for static assets and media files
    const path = req.nextUrl.pathname
    if (
      path.includes('/_next') ||
      path.includes('/favicon') ||
      path.includes('/api/auth') ||
      path.endsWith('.svg') || 
      path.endsWith('.jpg') || 
      path.endsWith('.png') || 
      path.endsWith('.ico')
    ) {
      return NextResponse.next()
    }

    return NextResponse.next()
  },
  
  afterAuth(auth, req) {
    // For Docker, we'll provide a more permissive auth check with fallback
    // This allows the app to work even if Clerk has timing issues
    if (!auth.userId && !isPathPublic(req.nextUrl.pathname)) {
      // Check for session cookies as fallback
      const hasCookies = req.cookies.get('__session') || 
                         req.cookies.get('__clerk_db_auth_token');
                        
      if (hasCookies) {
        console.log('[MIDDLEWARE] Session cookies found, allowing access');
        return NextResponse.next();
      }
      
      return redirectToSignIn({ returnBackUrl: req.url })
    }
    return NextResponse.next()
  }
})

// Make sure to match all routes that should go through middleware
export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
