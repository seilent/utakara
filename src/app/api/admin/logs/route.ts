import { NextResponse } from 'next/server';
import { audioLogger } from '@/lib/audio-logger';

export async function GET() {
  try {
    const logs = await audioLogger.getLogs(200); // Get last 200 entries
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}