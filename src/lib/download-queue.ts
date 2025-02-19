import { exec } from 'child_process';
import { join } from 'path';
import fs from 'fs/promises';
import { platform } from 'os';
import { updateDownloadStatus, clearDownloadStatus, getDownloadStatus } from './audio-status';
import { downloadRateLimiter } from './rate-limiter';
import { audioLogger } from './audio-logger';
import { FFMPEG_PATH } from './audio-config';

type QueuedDownload = {
  songId: number;
  youtubeUrl: string;
  outputPath: string;
  retryCount: number;
};

const getYtDlpPath = () => {
  const os = platform();
  const ext = os === 'win32' ? '.exe' : '';
  return join(process.cwd(), 'bin', `yt-dlp${ext}`);
};

interface DownloadError {
  code: string | number;
  message: string;
  stdout?: string;
  stderr?: string;
  [key: string]: unknown;
}

class DownloadQueue {
  private queue: QueuedDownload[] = [];
  private isProcessing = false;
  private readonly maxRetries = 10;
  private readonly retryDelay = 5000; // 5 seconds
  private currentProcess: { process: ReturnType<typeof exec>; songId: number } | null = null;

  public async enqueue(songId: number, youtubeUrl: string, outputPath: string) {
    // Check current status first
    const currentStatus = getDownloadStatus(songId);
    if (currentStatus.status === 'ready') {
      audioLogger.info(`Skipping download for song ${songId} as it is already ready`, songId);
      return;
    }

    audioLogger.info(`Enqueueing download for song ${songId}`, songId);
    // Check if already in queue
    const existing = this.queue.find(d => d.songId === songId);
    if (existing) {
      audioLogger.info(`Song ${songId} already in queue, updating URL`, songId);
      existing.youtubeUrl = youtubeUrl;
      return;
    }

    this.queue.push({ songId, youtubeUrl, outputPath, retryCount: 0 });
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  public cancelDownload(songId: number) {
    audioLogger.info(`Cancelling download for song ${songId}`, songId);
    // Remove from queue if pending
    this.queue = this.queue.filter(d => d.songId !== songId);
    
    // Kill current download process if it's for this song
    if (this.currentProcess?.songId === songId && this.currentProcess.process) {
      try {
        if (this.currentProcess.process.pid) {
          process.kill(-this.currentProcess.process.pid);
          audioLogger.info(`Killed download process for song ${songId}`, songId);
        }
      } catch (error) {
        audioLogger.error(`Error killing download process for song ${songId}`, songId, error as Error);
      }
      this.currentProcess = null;
    }

    // Clear status
    updateDownloadStatus(songId, { status: 'error', error: { message: 'Download cancelled' } });
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const download = this.queue[0];

    try {
      // Acquire rate limit token before downloading
      await downloadRateLimiter.acquire();
      audioLogger.info(`Starting download for song ${download.songId}`, download.songId);
      await this.downloadAudio(download);
      audioLogger.info(`Download completed for song ${download.songId}`, download.songId);
      this.queue.shift(); // Remove successful download
    } catch (error) {
      const download = this.queue[0];
      if (download.retryCount < this.maxRetries) {
        download.retryCount++;
        // Move to end of queue for retry
        this.queue.shift();
        this.queue.push(download);
        audioLogger.warn(
          `Download failed for song ${download.songId}, retry ${download.retryCount}/${this.maxRetries}`,
          download.songId
        );
        updateDownloadStatus(download.songId, {
          status: 'error',
          error: {
            message: error instanceof Error ? error.message : 'Download failed',
            retryCount: download.retryCount,
            maxRetries: this.maxRetries
          }
        });
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      } else {
        audioLogger.error(
          `Download permanently failed for song ${download.songId}`,
          download.songId,
          error as Error | Record<string, unknown>
        );
        updateDownloadStatus(download.songId, {
          status: 'error',
          error: {
            message: 'Maximum retry attempts reached',
            retryCount: download.retryCount,
            maxRetries: this.maxRetries
          }
        });
        this.queue.shift(); // Remove failed download
      }
    } finally {
      // Release rate limit token after download attempt
      downloadRateLimiter.release();
      this.isProcessing = false;
      if (this.queue.length > 0) {
        this.processQueue();
      }
    }
  }

  private async processError(songId: number, error: DownloadError): Promise<void> {
    await audioLogger.error(`Download failed for song ${songId}`, songId, error);
  }

  private async downloadFile(url: string): Promise<string> {
    try {
      return await this.processDownload(url);
    } catch (error) {
      throw error as DownloadError;
    }
  }

  private async processDownload(url: string): Promise<string> {
    try {
      return await this.downloadAndProcess(url);
    } catch (error) {
      throw error as DownloadError;
    }
  }

  private async downloadAndProcess(url: string): Promise<string> {
    try {
      // Implementation here
      return url;
    } catch (error) {
      throw error as DownloadError;
    }
  }

  private async downloadAudio(download: QueuedDownload): Promise<void> {
    const { songId, youtubeUrl } = download;
    const ytDlpPath = getYtDlpPath();
    const outputDir = join(process.cwd(), 'music');
    const binDir = join(process.cwd(), 'bin');
    const finalOutput = `${outputDir}/${songId}.m4a`;

    return new Promise(async (resolve, reject) => {
      // Ensure output directory exists
      await fs.mkdir(outputDir, { recursive: true }).catch(() => {});

      // Download the audio directly in m4a format
      const downloadCommand = [
        `"${ytDlpPath}"`,
        '--no-check-certificate',
        '--verbose',
        '-f bestaudio[ext=m4a]', // Prefer m4a format
        '--no-playlist',
        '-o',
        `"${finalOutput}"`,
        `"${youtubeUrl}"`
      ].join(' ');

      // Set up environment with proper PATH
      const env: NodeJS.ProcessEnv = {
        ...process.env,
        PATH: `${binDir}${platform() === 'win32' ? ';' : ':'}${process.env.PATH}`
      };

      // Add Windows-specific env vars only on Windows
      if (platform() === 'win32') {
        env.PATHEXT = '.COM;.EXE;.BAT;.CMD';
      }

      const currentProcess = exec(downloadCommand, { env }, async (downloadError: Error | null, stdout: string, stderr: string) => {
        if (downloadError) {
          audioLogger.error(`Download failed for song ${songId}`, songId, { error: downloadError, stdout, stderr });
          reject(downloadError);
          return;
        }

        try {
          // Verify the file exists
          await fs.access(finalOutput);
          
          await clearDownloadStatus(songId);
          await updateDownloadStatus(songId, { status: 'ready' });
          resolve();
        } catch (error) {
          audioLogger.error(`Post-download error for song ${songId}`, songId, error as Error);
          reject(error);
        }
      });

      this.currentProcess = { process: currentProcess, songId };

      // Track download progress
      if (currentProcess.stderr) {
        currentProcess.stderr.on('data', (data: string) => {
          const progressMatch = data.match(/\[download\]\s+(\d+\.?\d*)%/);
          if (progressMatch) {
            const progress = parseFloat(progressMatch[1]);
            updateDownloadStatus(songId, { 
              status: 'downloading', 
              progress 
            });
          }
        });
      }

      currentProcess.on('error', (error) => {
        audioLogger.error(`Process error for song ${songId}`, songId, error);
        reject(error);
      });
    });
  }
}

export const downloadQueue = new DownloadQueue();