import { NextResponse } from 'next/server';
import { getDownloadStatus, updateDownloadStatus } from '@/lib/audio-status';
import { findAudioFile } from '@/lib/audio';
import { audioLogger } from '@/lib/audio-logger';
import { downloadQueue } from '@/lib/download-queue';
import { join } from 'path';
import { getSongById } from '@/lib/db';

const MUSIC_DIR = 'music';

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  const params = await context.params;
  const songId = parseInt(params.id);
  
  try {
    // First check if the audio file actually exists
    const audioFile = await findAudioFile(songId);
    if (audioFile) {
      // If file exists, always return ready status regardless of stored state
      audioLogger.info(`Found audio file for song ${songId}, returning ready status`, songId);
      return NextResponse.json({ status: 'ready' });
    }

    // If no audio file exists, check if we need to start a download
    const song = await getSongById(songId);
    if (song?.youtube_url) {
      const status = getDownloadStatus(songId);
      if (status.status === 'error') {
        // Reset status and start new download
        const filename = `${songId}.opus`;
        const outputPath = join(process.cwd(), MUSIC_DIR, filename);
        
        updateDownloadStatus(songId, { status: 'pending' });
        downloadQueue.enqueue(songId, song.youtube_url, outputPath);
        
        audioLogger.info(`Restarting download for song ${songId}`, songId);
        return NextResponse.json({ status: 'pending' });
      }
    }

    // Return current status
    const status = getDownloadStatus(songId);
    audioLogger.info(`Current download status for song ${songId}: ${JSON.stringify(status)}`, songId);
    return NextResponse.json(status);
  } catch (error) {
    audioLogger.error(`Error checking status for song ${songId}`, songId, error as Error);
    return NextResponse.json({ 
      status: 'error', 
      error: { message: 'Failed to check status' } 
    }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const songId = parseInt(params.id);
  
  try {
    // First verify the audio file exists
    const audioFile = await findAudioFile(songId);
    if (audioFile) {
      // If file exists, force update the status to ready
      audioLogger.info(`Found audio file for song ${songId}, updating status to ready`, songId);
      await updateDownloadStatus(songId, { status: 'ready' });
      return NextResponse.json({ status: 'ready' });
    }

    audioLogger.warn(`Cannot update status to ready - no audio file found for song ${songId}`, songId);
    return NextResponse.json({ error: 'Audio file not found' }, { status: 404 });
  } catch (error) {
    audioLogger.error(`Error updating status for song ${songId}`, songId, error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}