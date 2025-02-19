import ffmpeg from 'fluent-ffmpeg';
import { join } from 'path';

// Set ffmpeg path based on environment
if (process.platform === 'win32') {
  // On Windows, use the local ffmpeg.exe from bin folder
  ffmpeg.setFfmpegPath(join(process.cwd(), 'bin', 'ffmpeg.exe'));
} else {
  // On Linux/Mac, use the system-wide installation
  ffmpeg.setFfmpegPath('ffmpeg');
}

export default ffmpeg;
