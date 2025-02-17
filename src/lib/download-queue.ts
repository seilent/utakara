import { exec } from 'child_process';
import { join } from 'path';
import fs from 'fs/promises';
import { platform } from 'os';
import { updateDownloadStatus } from './audio-status';
import { downloadRateLimiter } from './rate-limiter';
import { audioLogger } from './audio-logger';

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
  private readonly maxRetries = 3;
  private readonly retryDelay = 5000; // 5 seconds
  private currentProcess: { process: ReturnType<typeof exec>; songId: number } | null = null;

  public async enqueue(songId: number, youtubeUrl: string, outputPath: string) {
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
    const ffmpegPath = join(process.cwd(), 'bin', 'ffmpeg.exe');

    return new Promise((resolve, reject) => {
      // Use a temporary pattern for the output file that includes the extension
      const tempOutput = `${outputDir}/${songId}.%(ext)s`;
      
      const process = exec(
        `"${ytDlpPath}" -x --force-overwrites --audio-format opus --audio-quality 0 --ffmpeg-location "${ffmpegPath}" -o "${tempOutput}" "${youtubeUrl}"`,
        async (error: Error | null) => {
          this.currentProcess = null;
          if (error) {
            reject(error);
            return;
          }

          try {
            // Find the actual downloaded file by checking common audio extensions
            const files = await fs.readdir(outputDir);
            const audioFile = files.find(f => f.startsWith(`${songId}.`) && 
              /\.(opus|webm|m4a|mp3)$/i.test(f));

            if (!audioFile) {
              reject(new Error('Audio file not found after download'));
              return;
            }

            // Get the actual extension
            const ext = audioFile.split('.').pop()!;
            const finalPath = join(outputDir, `${songId}.${ext}`);

            // Rename if needed (in case of leftover .opus.webm)
            if (audioFile !== `${songId}.${ext}`) {
              await fs.rename(join(outputDir, audioFile), finalPath);
            }

            updateDownloadStatus(songId, { status: 'ready' });
            resolve();
          } catch {
            reject(new Error('Failed to process downloaded file'));
          }
        }
      );

      // Store current process for potential cancellation
      this.currentProcess = { process, songId };

      // Track download progress
      if (process.stderr) {
        process.stderr.on('data', (data: string) => {
          const match = data.match(/\[download\]\s+(\d+\.?\d*)%/);
          if (match) {
            const progress = parseFloat(match[1]);
            updateDownloadStatus(songId, { 
              status: 'downloading', 
              progress 
            });
          }
        });
      }
    });
  }
}

export const downloadQueue = new DownloadQueue();