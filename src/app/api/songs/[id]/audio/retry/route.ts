import { NextResponse } from 'next/server';
import { getSongById } from '@/lib/db';
import { downloadQueue } from '@/lib/download-queue';
import { updateDownloadStatus } from '@/lib/audio-status';
import { join } from 'path';

const MUSIC_DIR = 'music';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const songId = parseInt(id);
    const song = await getSongById(songId);

    if (!song?.youtube_url) {
      return NextResponse.json({ 
        error: 'No YouTube URL found for this song' 
      }, { status: 404 });
    }

    const filename = `${songId}.opus`;
    const outputPath = join(process.cwd(), MUSIC_DIR, filename);

    // Reset status and enqueue new download
    updateDownloadStatus(songId, { status: 'pending' });
    downloadQueue.enqueue(songId, song.youtube_url, outputPath);

    return NextResponse.json({ status: 'pending' });
  } catch (error) {
    console.error('Error retrying download:', error);
    return NextResponse.json({ 
      error: 'Failed to retry download: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}