import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let db: Database.Database;

try {
  db = new Database(join(process.cwd(), 'songs.db'));

  // Initialize database with required tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS songs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title_japanese TEXT NOT NULL,
      title_english TEXT NOT NULL,
      artist_japanese TEXT NOT NULL,
      artist_english TEXT NOT NULL,
      artwork TEXT NOT NULL,
      lyrics_japanese TEXT NOT NULL,
      lyrics_romaji TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
} catch (error) {
  console.error('Failed to initialize database:', error);
  throw error;
}

// Rest of the functions now wrapped in try-catch
export function getAllSongs() {
  try {
    const songs = db.prepare('SELECT * FROM songs ORDER BY created_at DESC').all();
    return songs.map(formatSongFromDb);
  } catch (error) {
    console.error('Error getting all songs:', error);
    throw error;
  }
}

export function getSongById(id: number) {
  try {
    const song = db.prepare('SELECT * FROM songs WHERE id = ?').get(id);
    return song ? formatSongFromDb(song) : null;
  } catch (error) {
    console.error('Error getting song by id:', error);
    throw error;
  }
}

export function insertSong(song: {
  title_japanese: string;
  title_english: string;
  artist_japanese: string;
  artist_english: string;
  artwork: string;
  lyrics_japanese: string;
  lyrics_romaji: string;
}) {
  try {
    const stmt = db.prepare(`
      INSERT INTO songs (
        title_japanese, title_english,
        artist_japanese, artist_english,
        artwork, lyrics_japanese, lyrics_romaji
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      song.title_japanese,
      song.title_english,
      song.artist_japanese,
      song.artist_english,
      song.artwork,
      song.lyrics_japanese,
      song.lyrics_romaji
    );

    return result.lastInsertRowid;
  } catch (error) {
    console.error('Error inserting song:', error);
    throw error;
  }
}

function formatSongFromDb(dbSong: any) {
  return {
    id: dbSong.id.toString(),
    title: {
      japanese: dbSong.title_japanese,
      english: dbSong.title_english,
    },
    artist: {
      japanese: dbSong.artist_japanese,
      english: dbSong.artist_english,
    },
    artwork: dbSong.artwork,
    lyrics: {
      japanese: dbSong.lyrics_japanese,
      romaji: dbSong.lyrics_romaji,
    },
  };
}