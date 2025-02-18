import path from 'path';
import { platform } from 'os';
import { execSync } from 'child_process';

export type AudioStorageType = 'local' | 'proxy';

function findSystemBinary(name: string): string | null {
  if (platform() === 'win32') return null;
  
  try {
    const which = platform() === 'darwin' ? 'which' : 'command -v';
    const path = execSync(`${which} ${name}`).toString().trim();
    return path || null;
  } catch {
    return null;
  }
}

// Try to find system FFmpeg first, fall back to bundled version
const ext = platform() === 'win32' ? '.exe' : '';
export const FFMPEG_PATH = findSystemBinary('ffmpeg') || path.join(process.cwd(), 'bin', `ffmpeg${ext}`);
export const FFPROBE_PATH = findSystemBinary('ffprobe') || path.join(process.cwd(), 'bin', `ffprobe${ext}`);

interface AudioConfig {
  storageType: AudioStorageType;
  proxyUrl?: string;
}

export function getAudioConfig(): AudioConfig {
  const storageType = (process.env.AUDIO_STORAGE || 'local') as AudioStorageType;
  const proxyUrl = process.env.AUDIO_PROXY_URL;

  if (storageType === 'proxy' && !proxyUrl) {
    console.warn('AUDIO_PROXY_URL is required when using proxy storage. Falling back to local storage.');
    return { storageType: 'local' };
  }

  return {
    storageType,
    proxyUrl
  };
}

export function getAudioFilePath(songId: number): string {
  // In production Linux, use absolute path if provided
  const musicPath = process.env.MUSIC_PATH || path.join(process.cwd(), 'music');
  return path.join(musicPath, `${songId}`);
}

export function getAudioFileUrl(songId: number): string {
  return `/music/${songId}`;
}