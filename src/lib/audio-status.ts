import { loadDownloadState, updateSongDownloadState, removeSongDownloadState } from './download-state';

export type AudioStatus = {
  status: 'pending' | 'downloading' | 'ready' | 'error';
  progress?: number;
  error?: {
    message: string;
    code?: string;
    retryCount?: number;
    maxRetries?: number;
  };
  size?: number;
};

const downloadStates = new Map<number, AudioStatus>();

// Initialize states from persistent storage
loadDownloadState().then(state => {
  Object.entries(state).forEach(([id, status]) => {
    // Reset any non-final states to error on startup
    if (status.status === 'downloading' || status.status === 'pending') {
      status = {
        status: 'error',
        error: {
          message: 'Download interrupted by server restart',
          code: 'SERVER_RESTART'
        }
      };
    }
    downloadStates.set(parseInt(id), status);
  });
});

export async function updateDownloadStatus(songId: number, status: AudioStatus) {
  downloadStates.set(songId, status);
  await updateSongDownloadState(songId, status);
  return status;
}

export function getDownloadStatus(songId: number): AudioStatus {
  return downloadStates.get(songId) || { status: 'pending' };
}

export async function clearDownloadStatus(songId: number) {
  downloadStates.delete(songId);
  await removeSongDownloadState(songId);
}