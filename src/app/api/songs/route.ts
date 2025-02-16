import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { insertSong } from '@/lib/db';

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