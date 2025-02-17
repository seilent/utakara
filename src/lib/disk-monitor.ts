import { exec } from 'child_process';
import { promisify } from 'util';
import { platform } from 'os';
import { cleanupUnusedAudio } from './audio-cleanup';

const execAsync = promisify(exec);

interface DiskSpace {
  available: number;
  total: number;
  used: number;
}

export async function checkDiskSpace(path: string): Promise<DiskSpace> {
  const isWindows = platform() === 'win32';
  
  try {
    if (isWindows) {
      const { stdout } = await execAsync(`wmic logicaldisk where "DeviceID='${path.charAt(0)}:'" get size,freespace /format:value`);
      const lines = stdout.trim().split('\n');
      const values: { [key: string]: number } = {};
      
      lines.forEach(line => {
        const [key, value] = line.trim().split('=');
        if (key && value) {
          values[key.toLowerCase()] = parseInt(value);
        }
      });

      const total = values['size'] || 0;
      const available = values['freespace'] || 0;
      
      return {
        available,
        total,
        used: total - available
      };
    } else {
      const { stdout } = await execAsync(`df -B1 ${path} | tail -1`);
      const [, total, used, available] = stdout.trim().split(/\s+/);
      
      return {
        available: parseInt(available),
        total: parseInt(total),
        used: parseInt(used)
      };
    }
  } catch (error) {
    console.error('Error checking disk space:', error);
    throw error;
  }
}

export async function monitorDiskSpace(path: string, lowSpaceThreshold = 0.1): Promise<void> {
  try {
    const space = await checkDiskSpace(path);
    const availablePercent = space.available / space.total;

    if (availablePercent < lowSpaceThreshold) {
      console.warn(`Low disk space detected (${(availablePercent * 100).toFixed(1)}% available). Triggering cleanup...`);
      await cleanupUnusedAudio();
    }
  } catch (error) {
    console.error('Error monitoring disk space:', error);
  }
}

// Check disk space every hour
export function startDiskSpaceMonitoring(path: string) {
  monitorDiskSpace(path);
  setInterval(() => monitorDiskSpace(path), 60 * 60 * 1000);
}