import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

const PUBLIC_PATHS = ['/login', '/register', '/delete-account'];
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/workouts',
  '/meals',
  '/challenges',
  '/squads',
  '/friends',
  '/notifications',
  '/profile',
  '/settings',
  '/wallet',
  '/analytics',
  '/leaderboard',
  '/subscriptions',
  '/referral',
  '/onboarding',
  '/feed',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  // Allow static files, api routes, and public assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/sw.js') ||
    pathname.startsWith('/manifest.json') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Check if current path is a protected route
  const isProtectedPath = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  );

  // Check if current path is an auth page
  const isAuthPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  );

  if (token) {
    // User is authenticated (has token cookie)
    const payload = verifyToken(token);

    if (isAuthPath) {
      // Redirect authenticated users away from auth pages
      if (payload) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
    return NextResponse.next();
  }

  // No token - check if trying to access protected route
  if (isProtectedPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|sw.js|manifest.json).*)'],
};
