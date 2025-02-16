import { SAMPLE_SONGS } from './data/songs';
import { insertSong } from './lib/db';

export async function migrateSampleSongs() {
  for (const song of SAMPLE_SONGS) {
    try {
      insertSong({
        title_japanese: song.title.japanese,
        title_english: song.title.english,
        artist_japanese: song.artist.japanese,
        artist_english: song.artist.english,
        artwork: song.artwork,
        lyrics_japanese: song.lyrics.japanese,
        lyrics_romaji: song.lyrics.romaji,
      });
      console.log(`Migrated song: ${song.title.english}`);
    } catch (error) {
      console.error(`Failed to migrate song ${song.title.english}:`, error);
    }
  }
}