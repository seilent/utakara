import { NextResponse, NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = new URL(request.url);
  
  // Skip middleware for public routes and API routes
  if (pathname.startsWith('/api/') || pathname === '/login') {
    return NextResponse.next();
  }

  // Only check auth for admin routes
  if (pathname.startsWith('/admin')) {
    const sessionToken = request.cookies.get('next-auth.session-token') || 
                        request.cookies.get('__Secure-next-auth.session-token');
                        
    if (!sessionToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/songs/:id/audio/retry'
  ]
};