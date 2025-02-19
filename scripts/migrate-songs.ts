import { SAMPLE_SONGS } from '../src/data/songs.js';
import { insertSong, migrate, getAllSongs } from '../src/lib/db.js';

export async function migrateSampleSongs() {
  try {
    // First run the schema migration
    await migrate();
    
    // Check if database is empty
    const existingSongs = await getAllSongs();
    if (existingSongs.length > 0) {
      console.log('Database already contains songs, skipping sample data migration');
      return;
    }
    
    // Only populate sample songs if database is empty
    console.log('Database is empty, populating with sample songs...');
    for (const song of SAMPLE_SONGS) {
      try {
        await insertSong({
          title_japanese: song.title.japanese,
          title_english: song.title.english,
          artist_japanese: song.artist.japanese,
          artist_english: song.artist.english,
          artwork: song.artwork,
          lyrics_japanese: song.lyrics.japanese,
          lyrics_romaji: song.lyrics.romaji,
          youtube_url: song.youtube_url || null
        });
        console.log(`Migrated song: ${song.title.english}`);
      } catch (error) {
        console.error(`Failed to migrate song ${song.title.english}:`, error);
        throw error; // Re-throw to stop the migration if any song fails
      }
    }
  } catch (error) {
    console.error('Migration failed with error:', error);
    throw error;
  }
}