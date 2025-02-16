import { migrateSampleSongs } from './migrate-songs.js';

async function main() {
  try {
    await migrateSampleSongs();
    console.log('Sample songs migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();