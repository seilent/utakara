import { NextResponse, NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { DefaultSession } from 'next-auth';

export async function middleware(request: NextRequest): Promise<Response | undefined> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token = await getToken({ req: request as any });
  const { pathname } = new URL(request.url);
  const isAdminPath = pathname.startsWith('/admin');
  const isRetryPath = pathname.includes('/audio/retry');
  
  // Require authentication for admin paths and retry actions
  if ((isAdminPath || isRetryPath) && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/songs/:id/audio/retry",
  ]
};