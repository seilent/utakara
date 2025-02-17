import fs from 'fs/promises';
import { join } from 'path';
import { createWriteStream } from 'fs';

const LOG_DIR = 'logs';
const AUDIO_LOG_FILE = join(LOG_DIR, 'audio.log');
const ERROR_LOG_FILE = join(LOG_DIR, 'audio-errors.log');
const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10MB

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  songId?: number;
  message: string;
  error?: Error | Record<string, unknown>;
}

class AudioLogger {
  private logStream: ReturnType<typeof createWriteStream>;
  private errorStream: ReturnType<typeof createWriteStream>;

  constructor() {
    this.initLogDir();
    this.logStream = createWriteStream(AUDIO_LOG_FILE, { flags: 'a' });
    this.errorStream = createWriteStream(ERROR_LOG_FILE, { flags: 'a' });
  }

  private async initLogDir() {
    try {
      await fs.mkdir(LOG_DIR, { recursive: true });
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }
  }

  private async rotateLogIfNeeded(logFile: string) {
    try {
      const stats = await fs.stat(logFile);
      if (stats.size > MAX_LOG_SIZE) {
        const rotatedFile = `${logFile}.${Date.now()}.old`;
        await fs.rename(logFile, rotatedFile);
        return true;
      }
    } catch (error) {
      console.error('Error rotating log file:', error);
    }
    return false;
  }

  private formatLogEntry(entry: LogEntry): string {
    const songIdStr = entry.songId ? ` [Song ${entry.songId}]` : '';
    const errorStr = entry.error ? `\n${JSON.stringify(entry.error, null, 2)}` : '';
    return `[${entry.timestamp}] ${entry.level.toUpperCase()}${songIdStr}: ${entry.message}${errorStr}\n`;
  }

  public async log(level: LogEntry['level'], message: string, songId?: number, error?: Error | Record<string, unknown>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      songId,
      message,
      error
    };

    const logLine = this.formatLogEntry(entry);

    if (level === 'error') {
      if (await this.rotateLogIfNeeded(ERROR_LOG_FILE)) {
        this.errorStream.end();
        this.errorStream = createWriteStream(ERROR_LOG_FILE, { flags: 'a' });
      }
      this.errorStream.write(logLine);
    }

    if (await this.rotateLogIfNeeded(AUDIO_LOG_FILE)) {
      this.logStream.end();
      this.logStream = createWriteStream(AUDIO_LOG_FILE, { flags: 'a' });
    }
    this.logStream.write(logLine);
  }

  public info(message: string, songId?: number) {
    this.log('info', message, songId);
  }

  public warn(message: string, songId?: number) {
    this.log('warn', message, songId);
  }

  public error(message: string, songId?: number, error?: Error | Record<string, unknown>) {
    this.log('error', message, songId, error);
  }

  public async getLogs(maxEntries = 100): Promise<LogEntry[]> {
    try {
      const content = await fs.readFile(AUDIO_LOG_FILE, 'utf-8');
      return content
        .split('\n')
        .filter(Boolean)
        .map(line => {
          try {
            return JSON.parse(line) as LogEntry;
          } catch {
            return null;
          }
        })
        .filter((entry): entry is LogEntry => entry !== null)
        .slice(-maxEntries);
    } catch (error) {
      console.error('Error reading logs:', error);
      return [];
    }
  }
}

export const audioLogger = new AudioLogger();