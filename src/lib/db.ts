import Database from 'better-sqlite3';
import { join } from 'path';
import { Song } from '@/types/song';

let db: Database.Database;

interface DbSong {
  id: number;
  title_japanese: string;
  title_english: string;
  artist_japanese: string;
  artist_english: string;
  artwork: string;
  lyrics_japanese: string;
  lyrics_romaji: string;
  created_at: string;
}

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

export async function getAllSongs(): Promise<Song[]> {
  try {
    return new Promise((resolve, reject) => {
      try {
        const songs = db.prepare('SELECT * FROM songs ORDER BY created_at DESC').all() as DbSong[];
        resolve(songs.map(formatSongFromDb));
      } catch (error) {
        reject(error);
      }
    });
  } catch (error) {
    console.error('Error getting all songs:', error);
    throw error;
  }
}

export async function getSongById(id: number): Promise<Song | null> {
  try {
    return new Promise((resolve, reject) => {
      try {
        const song = db.prepare('SELECT * FROM songs WHERE id = ?').get(id) as DbSong | undefined;
        resolve(song ? formatSongFromDb(song) : null);
      } catch (error) {
        reject(error);
      }
    });
  } catch (error) {
    console.error('Error getting song by id:', error);
    throw error;
  }
}

export async function getSongByRomaji(romaji: string): Promise<Song | null> {
  try {
    return new Promise((resolve, reject) => {
      try {
        // Get all songs with matching first line of romaji lyrics
        const songs = db.prepare(`
          SELECT * FROM songs 
          WHERE lyrics_romaji LIKE ? || '%'
          ORDER BY created_at ASC
        `).all(romaji) as DbSong[];
        
        if (songs.length === 0) return resolve(null);
        
        // Return the first matching song
        resolve(formatSongFromDb(songs[0]));
      } catch (error) {
        reject(error);
      }
    });
  } catch (error) {
    console.error('Error getting song by romaji:', error);
    throw error;
  }
}

export async function insertSong(song: {
  title_japanese: string;
  title_english: string;
  artist_japanese: string;
  artist_english: string;
  artwork: string;
  lyrics_japanese: string;
  lyrics_romaji: string;
}) {
  try {
    return new Promise((resolve, reject) => {
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

        resolve(result.lastInsertRowid);
      } catch (error) {
        reject(error);
      }
    });
  } catch (error) {
    console.error('Error inserting song:', error);
    throw error;
  }
}

function formatSongFromDb(dbSong: DbSong): Song {
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