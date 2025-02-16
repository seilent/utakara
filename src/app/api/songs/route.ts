import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { insertSong } from '@/lib/db';
import { db } from '@/lib/db';

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

    // Save the artwork file
    const buffer = Buffer.from(await artwork.arrayBuffer());
    const artworkFilename = `${Date.now()}-${artwork.name}`;
    const artworkPath = path.join(process.cwd(), 'public', 'uploads', artworkFilename);
    
    // Ensure uploads directory exists
    await fs.mkdir(path.join(process.cwd(), 'public', 'uploads'), { recursive: true });
    await fs.writeFile(artworkPath, buffer);

    // Insert into database
    const id = insertSong({
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
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Song ID is required' }, { status: 400 });
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
  }
}

export async function PUT(request: Request) {
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
      const artworkFilename = `${Date.now()}-${artwork.name}`;
      artworkPath = `/uploads/${artworkFilename}`;
      await fs.mkdir(path.join(process.cwd(), 'public', 'uploads'), { recursive: true });
      await fs.writeFile(path.join(process.cwd(), 'public', 'uploads', artworkFilename), buffer);
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
  }
}