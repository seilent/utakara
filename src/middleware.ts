import { NextResponse, NextRequest } from 'next/server';
import { getSession } from './lib/session';

export async function middleware(request: NextRequest) {
  const { pathname } = new URL(request.url);
  
  // Skip middleware for static assets and public API endpoints
  if (
    pathname.startsWith('/_next/') || 
    pathname.startsWith('/api/auth/') ||
    pathname === '/login'
  ) {
    return NextResponse.next();
  }

  // Check auth for admin routes and protected endpoints
  if (pathname.startsWith('/admin') || pathname.includes('/audio/retry')) {
    const session = await getSession(request);
                        
    if (!session.isLoggedIn) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.headers.set('x-middleware-cache', 'no-cache');
      return response;
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ]
};