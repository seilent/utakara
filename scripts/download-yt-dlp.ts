import { exec } from 'child_process';
import { promisify } from 'util';
import { platform } from 'os';
import fs from 'fs/promises';
import { join } from 'path';

const execAsync = promisify(exec);

async function downloadYtDlp() {
  const os = platform();
  const ext = os === 'win32' ? '.exe' : '';
  const url = `https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp${ext}`;
  const binDir = join(process.cwd(), 'bin');
  const outputPath = join(binDir, `yt-dlp${ext}`);

  try {
    // Create bin directory
    await fs.mkdir(binDir, { recursive: true });

    console.log('Downloading yt-dlp...');
    
    // Download yt-dlp using curl or wget
    if (os === 'win32') {
      await execAsync(`curl -L "${url}" -o "${outputPath}"`);
    } else {
      await execAsync(`curl -L "${url}" -o "${outputPath}" && chmod +x "${outputPath}"`);
    }

    console.log('yt-dlp downloaded successfully');
  } catch (error) {
    console.error('Error downloading yt-dlp:', error);
    process.exit(1);
  }
}

// Run the download
downloadYtDlp();