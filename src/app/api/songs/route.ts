import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { insertSong } from '@/lib/db';
import Database from 'better-sqlite3';

interface DbSong {
  id: number;
  artwork: string;
}

function getDb() {
  return new Database(path.join(process.cwd(), 'songs.db'));
}

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const titleJapanese = data.get('titleJapanese') as string;
    const titleEnglish = data.get('titleEnglish') as string;
    const artistJapanese = data.get('artistJapanese') as string;
    const artistEnglish = data.get('artistEnglish') as string;
    const lyrics = data.get('lyrics') as string;
    const romaji = data.get('romaji') as string;
    const artwork = data.get('artwork') as File;

    if (!titleJapanese || !titleEnglish || !artistJapanese || !artistEnglish || !lyrics || !romaji || !artwork) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Save the artwork file with romaji name
    const buffer = Buffer.from(await artwork.arrayBuffer());
    const artworkExt = artwork.name.split('.').pop() || 'jpg';
    const safeRomaji = romaji.split('\n')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const artworkFilename = `${safeRomaji}.${artworkExt}`;
    const artworkPath = path.join(process.cwd(), 'public', 'uploads', artworkFilename);
    
    // Ensure uploads directory exists
    await fs.mkdir(path.join(process.cwd(), 'public', 'uploads'), { recursive: true });
    
    // Delete existing file if it exists
    try {
      await fs.unlink(artworkPath);
    } catch {
      // Ignore if file doesn't exist
    }
    
    await fs.writeFile(artworkPath, buffer);

    // Insert into database
    const id = await insertSong({
      title_japanese: titleJapanese,
      title_english: titleEnglish,
      artist_japanese: artistJapanese,
      artist_english: artistEnglish,
      artwork: `/uploads/${artworkFilename}`,
      lyrics_japanese: lyrics,
      lyrics_romaji: romaji,
    });

    return NextResponse.json({ 
      success: true,
      songId: id 
    });
  } catch (error) {
    console.error('Error saving song:', error);
    return NextResponse.json(
      { error: 'Failed to save song: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const db = getDb();
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Song ID is required' }, { status: 400 });
    }

    // Get the song first to delete its artwork
    const song = db.prepare('SELECT artwork FROM songs WHERE id = ?').get(parseInt(id)) as DbSong | undefined;
    if (song?.artwork) {
      try {
        await fs.unlink(path.join(process.cwd(), 'public', song.artwork));
      } catch {
        // Ignore if file doesn't exist
      }
    }

    // Delete the song record from database
    db.prepare('DELETE FROM songs WHERE id = ?').run(parseInt(id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting song:', error);
    return NextResponse.json(
      { error: 'Failed to delete song: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  } finally {
    db.close();
  }
}

export async function PUT(request: Request) {
  const db = getDb();
  try {
    const data = await request.formData();
    const id = data.get('id') as string;
    const titleJapanese = data.get('titleJapanese') as string;
    const titleEnglish = data.get('titleEnglish') as string;
    const artistJapanese = data.get('artistJapanese') as string;
    const artistEnglish = data.get('artistEnglish') as string;
    const lyrics = data.get('lyrics') as string;
    const romaji = data.get('romaji') as string;
    const artwork = data.get('artwork') as File | null;

    if (!id || !titleJapanese || !titleEnglish || !artistJapanese || !artistEnglish || !lyrics || !romaji) {
      return NextResponse.json(
        { error: 'All fields except artwork are required' },
        { status: 400 }
      );
    }

    let artworkPath = '';
    if (artwork) {
      // Save the new artwork file
      const buffer = Buffer.from(await artwork.arrayBuffer());
      const artworkExt = artwork.name.split('.').pop() || 'jpg';
      const safeRomaji = romaji.split('\n')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const artworkFilename = `${safeRomaji}.${artworkExt}`;
      artworkPath = `/uploads/${artworkFilename}`;
      
      await fs.mkdir(path.join(process.cwd(), 'public', 'uploads'), { recursive: true });
      const fullPath = path.join(process.cwd(), 'public', artworkPath);
      
      // Delete existing file if it exists
      try {
        await fs.unlink(fullPath);
      } catch {
        // Ignore if file doesn't exist
      }
      
      await fs.writeFile(fullPath, buffer);
    }

    // Update the database
    const stmt = db.prepare(`
      UPDATE songs 
      SET title_japanese = ?, title_english = ?,
          artist_japanese = ?, artist_english = ?,
          ${artwork ? 'artwork = ?,' : ''}
          lyrics_japanese = ?, lyrics_romaji = ?
      WHERE id = ?
    `);

    const params = [
      titleJapanese,
      titleEnglish,
      artistJapanese,
      artistEnglish,
      ...(artwork ? [artworkPath] : []),
      lyrics,
      romaji,
      parseInt(id)
    ];

    stmt.run(...params);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating song:', error);
    return NextResponse.json(
      { error: 'Failed to update song: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  } finally {
    db.close();
  }
}