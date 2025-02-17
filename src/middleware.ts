import { NextResponse, NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { DefaultSession } from 'next-auth';

export async function middleware(request: NextRequest): Promise<Response | undefined> {
  try {
    const { pathname } = new URL(request.url);
    console.log('Debug - Middleware path:', pathname);
    
    // Skip middleware for auth and music routes
    if (pathname.startsWith('/api/auth') || pathname.startsWith('/api/music')) {
      return NextResponse.next();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const token = await getToken({ req: request as any });
    console.log('Debug - Token exists:', !!token);
    
    const isAdminPath = pathname.startsWith('/admin');
    const isRetryPath = pathname.includes('/audio/retry');
    
    // Require authentication for admin paths and retry actions
    if ((isAdminPath || isRetryPath) && !token) {
      console.log('Debug - Redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/songs/:id/audio/retry",
  ]
};