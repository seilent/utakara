import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  const res = new NextResponse(JSON.stringify({ success: true }));
  await updateSession(request, res, {
    isLoggedIn: false,
    user: undefined
  });
  return res;
}