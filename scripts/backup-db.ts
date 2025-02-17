import { copyFileSync } from 'fs';
import { join } from 'path';

function backupDatabase() {
  const date = new Date().toISOString().replace(/[:.]/g, '-');
  const sourceFile = join(process.cwd(), 'songs.db');
  const backupFile = join(process.cwd(), `songs.db.backup.${date}`);

  try {
    copyFileSync(sourceFile, backupFile);
    console.log(`Database backed up successfully to: ${backupFile}`);
  } catch (error) {
    console.error('Failed to backup database:', error);
    process.exit(1);
  }
}

backupDatabase();