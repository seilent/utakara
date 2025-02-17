import { NextResponse } from 'next/server';
import { findAudioFile } from '@/lib/audio';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const songId = parseInt(id);
    const audioFile = await findAudioFile(songId);
    
    return NextResponse.json({ exists: !!audioFile });
  } catch (error) {
    console.error('Error checking audio existence:', error);
    return NextResponse.json({ exists: false });
  }
}
