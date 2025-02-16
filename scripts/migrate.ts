import { migrateSampleSongs } from './migrate-songs';

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