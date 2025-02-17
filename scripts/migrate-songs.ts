import { SAMPLE_SONGS } from '../src/data/songs';
import { insertSong, migrate } from '../src/lib/db';

export async function migrateSampleSongs() {
  // First run the schema migration
  await migrate();
  
  // Then migrate sample songs
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
        youtube_url: null
      });
      console.log(`Migrated song: ${song.title.english}`);
    } catch (error) {
      console.error(`Failed to migrate song ${song.title.english}:`, error);
    }
  }
}