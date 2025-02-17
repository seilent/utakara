import fs from 'fs/promises';
import { join } from 'path';
import { AudioStatus } from './audio-status';

const STATE_FILE = join(process.cwd(), 'music', '.download-state.json');

interface DownloadState {
  [songId: string]: AudioStatus;
}

export async function saveDownloadState(state: DownloadState) {
  try {
    await fs.mkdir(join(process.cwd(), 'music'), { recursive: true });
    await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error('Error saving download state:', error);
  }
}

export async function loadDownloadState(): Promise<DownloadState> {
  try {
    const data = await fs.readFile(STATE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

export async function updateSongDownloadState(songId: number, status: AudioStatus) {
  try {
    const state = await loadDownloadState();
    state[songId] = status;
    await saveDownloadState(state);
  } catch (error) {
    console.error('Error updating song download state:', error);
  }
}

export async function removeSongDownloadState(songId: number) {
  try {
    const state = await loadDownloadState();
    delete state[songId];
    await saveDownloadState(state);
  } catch (error) {
    console.error('Error removing song download state:', error);
  }
}