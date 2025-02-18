import fs from 'fs/promises';
import { join } from 'path';
import { clearDownloadStatus, updateDownloadStatus } from './audio-status';
import Database from 'better-sqlite3';
import { audioLogger } from './audio-logger';

const MUSIC_DIR = 'music';
const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
const MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function cleanupUnusedAudio() {
  audioLogger.info('Starting audio cleanup process');
  try {
    const db = new Database('songs.db');
    
    const files = await fs.readdir(MUSIC_DIR);
    const audioFiles = files.filter(f => /\.(opus|webm|m4a|mp3)$/i.test(f));
    
    audioLogger.info(`Found ${audioFiles.length} audio files to check`);

    for (const file of audioFiles) {
      try {
        const songId = parseInt(file.split('.')[0]);
        if (isNaN(songId)) continue;

        const song = db.prepare('SELECT id FROM songs WHERE id = ?').get(songId);
        
        // For files with valid songs, ensure status is "ready"
        if (song) {
          await clearDownloadStatus(songId);
          await updateDownloadStatus(songId, { status: 'ready' });
          
          const stats = await fs.stat(join(MUSIC_DIR, file));
          const age = Date.now() - stats.mtimeMs;
          
          if (age > MAX_AGE) {
            await fs.unlink(join(MUSIC_DIR, file));
            await clearDownloadStatus(songId);
            audioLogger.info(`Cleaned up old audio file for song ${songId} (age: ${Math.floor(age/86400000)} days)`, songId);
          }
        } else {
          // Clean up files for non-existent songs
          await fs.unlink(join(MUSIC_DIR, file));
          await clearDownloadStatus(songId);
          audioLogger.info(`Cleaned up unused audio file for non-existent song ${songId}`, songId);
        }
      } catch (error) {
        audioLogger.error(`Error cleaning up file ${file}`, undefined, error as Error);
      }
    }

    db.close();
    audioLogger.info('Completed audio cleanup process');
  } catch (error) {
    audioLogger.error('Error during audio cleanup process', undefined, error as Error);
  }
}

export function startCleanupJob() {
  // Run initial cleanup
  cleanupUnusedAudio();
  
  // Schedule periodic cleanup
  setInterval(cleanupUnusedAudio, CLEANUP_INTERVAL);
}