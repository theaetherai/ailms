// Simple middleware for Docker environment without Prisma
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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
];

// Function to check if a path is a public route
function isPathPublic(pathname: string): boolean {
  return publicRoutes.some(route => {
    if (route.includes('(.*)')) {
      const baseRoute = route.replace('(.*)', '');
      return pathname.startsWith(baseRoute);
    }
    return route === pathname;
  }) || 
  pathname.startsWith('/api/auth/') || 
  pathname.startsWith('/db-error');
}

// Simple middleware that doesn't try to use Prisma
export function middleware(request: NextRequest) {
  // Skip processing for static assets
  const path = request.nextUrl.pathname;
  if (
    path.includes('/_next') ||
    path.includes('/favicon') ||
    path.endsWith('.svg') || 
    path.endsWith('.jpg') || 
    path.endsWith('.png') || 
    path.endsWith('.ico')
  ) {
    return NextResponse.next();
  }

  // For error cases or database issues, a redirect could be added here
  // but we're keeping it simple to avoid Edge Runtime issues

  // Just pass the request through
  return NextResponse.next();
}

// Configuration to match routes but avoid static assets
export const config = {
  matcher: [
    // Skip for static files and image files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 