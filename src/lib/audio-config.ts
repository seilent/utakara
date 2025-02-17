import path from 'path';

export type AudioStorageType = 'local' | 'proxy';

export const FFMPEG_PATH = path.join(process.cwd(), 'bin', 'ffmpeg.exe');
export const FFPROBE_PATH = path.join(process.cwd(), 'bin', 'ffprobe.exe');

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