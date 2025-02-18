import { NextResponse, NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = new URL(request.url);
  
  // Skip middleware for public routes and API routes except retry
  if ((pathname.startsWith('/api/') && !pathname.includes('/audio/retry')) || pathname === '/login') {
    return NextResponse.next();
  }

  // Check auth for admin routes and retry endpoint
  if (pathname.startsWith('/admin') || pathname.includes('/audio/retry')) {
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