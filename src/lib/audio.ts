import fs from 'fs/promises';
import { join } from 'path';
import { audioLogger } from './audio-logger';

export const MUSIC_DIR = join(process.cwd(), 'music');

export async function findAudioFile(songId: number): Promise<string | null> {
  try {
    const files = await fs.readdir(MUSIC_DIR);
    const audioFile = files.find(f => f.startsWith(`${songId}.`) && 
      /\.(opus|webm|m4a|mp3)$/i.test(f));
    return audioFile || null;
  } catch {
    return null;
  }
}

export async function getAudioForSong(songId: number): Promise<string | null> {
  // Check if audio file already exists in any supported format
  const existingFile = await findAudioFile(songId);
  if (existingFile) {
    return join(MUSIC_DIR, existingFile);
  }
  return null;
}

export async function deleteAudio(songId: number): Promise<void> {
  try {
    const audioFile = await findAudioFile(songId);
    if (audioFile) {
      await fs.unlink(join(MUSIC_DIR, audioFile));
    }
  } catch (error) {
    audioLogger.error(`Error deleting audio for song ${songId}`, songId, error as Error);
  }
}