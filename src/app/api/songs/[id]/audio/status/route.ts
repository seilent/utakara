import { NextResponse } from 'next/server';

export async function GET() {
  // This route is deprecated and will always return ready status
  return NextResponse.json({ status: 'ready' });
}