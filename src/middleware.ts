import { NextResponse, NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { DefaultSession } from 'next-auth';

export async function middleware(request: NextRequest): Promise<Response | undefined> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token = await getToken({ req: request as any });
  const isAdminPath = request.url.includes('/admin/');
  const isRetryPath = request.url.includes('/audio/retry');
  
  // Require authentication for admin paths and retry actions
  if ((isAdminPath || isRetryPath) && !token) {
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'content-type': 'application/json' } }
    );
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/songs/:id/audio/retry",
  ]
};