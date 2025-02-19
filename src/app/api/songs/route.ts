import { NextResponse } from 'next/server';
import fs, { mkdir, writeFile, unlink } from 'fs/promises';
import path, { join } from 'path';
import { insertSong } from '@/lib/db';
import Database from 'better-sqlite3';
import { revalidateTag } from 'next/cache';
import { deleteAudio } from '@/lib/audio';
import { downloadQueue } from '@/lib/download-queue';
import ffmpeg from '@/lib/ffmpeg';

interface DbSong {
  id: number;
  artwork: string;
  youtube_url?: string;
}

function getDb() {
  return new Database(path.join(process.cwd(), 'songs.db'));
}

async function convertToAAC(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Try with libfdk_aac first (better quality)
    const baseConversion = ffmpeg(inputPath)
      .audioFrequency(44100)
      .audioChannels(2)
      .audioBitrate('192k');

    // First attempt with libfdk_aac (better quality) with streaming normalization preserving dynamics
    baseConversion.clone()
      .audioCodec('libfdk_aac')
      .audioFilter('dynaudnorm')
      .toFormat('ipod')  // AAC container
      .addOutputOption('-profile:a', 'aac_low')  // High compatibility
      .addOutputOption('-q:a', '4')  // VBR quality setting for libfdk_aac
      .on('error', (err) => {
        if (err.message.includes('libfdk_aac')) {
          // Fallback to native AAC encoder with good settings
          baseConversion.clone()
            .audioCodec('aac')
            .audioFilter('dynaudnorm')
            .toFormat('ipod')
            .addOutputOption('-strict', '-2')  // Allow experimental codecs
            .addOutputOption('-b:a', '192k')   // Constant bitrate as VBR isn't as good with native AAC
            .on('error', reject)
            .on('end', resolve)
            .save(outputPath);
        } else {
          reject(err);
        }
      })
      .on('end', resolve)
      .save(outputPath);
  });
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
    const youtubeUrl = data.get('youtubeUrl') as string;

    if (!titleJapanese || !titleEnglish || !artistJapanese || !artistEnglish || !lyrics || !romaji || !artwork) {
      return NextResponse.json(
        { error: 'All fields except YouTube URL are required' },
        { status: 400 }
      );
    }

    // Save the artwork file with romaji name
    const buffer = Buffer.from(await artwork.arrayBuffer());
    const artworkExt = artwork.name.split('.').pop() || 'jpg';
    const safeRomaji = romaji.split('\n')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const artworkFilename = `${safeRomaji}.${artworkExt}`;
    const artworkPath = path.join(process.cwd(), 'uploads', artworkFilename);
    
    // Ensure uploads directory exists
    await fs.mkdir(path.join(process.cwd(), 'uploads'), { recursive: true });
    
    // Delete existing file if it exists
    try {
      await fs.unlink(artworkPath);
    } catch {
      // Ignore if file doesn't exist
    }
    
    await fs.writeFile(artworkPath, buffer);

    // Insert into database with API route path
    const id = await insertSong({
      title_japanese: titleJapanese,
      title_english: titleEnglish,
      artist_japanese: artistJapanese,
      artist_english: artistEnglish,
      artwork: `/api/uploads/${artworkFilename}`,
      lyrics_japanese: lyrics,
      lyrics_romaji: romaji,
      youtube_url: youtubeUrl || null,
    });

    // Handle karaoke file if provided
    const karaokeFile = data.get('karaokeFile') as File;
    if (karaokeFile) {
      const karaokeDir = join(process.cwd(), 'music', 'karaoke');
      await mkdir(karaokeDir, { recursive: true });
      
      const tempPath = join(karaokeDir, `temp_${id}_${karaokeFile.name}`);
      const finalPath = join(karaokeDir, `${id}.aac`);
      
      // Save uploaded file
      const karaokeBuffer = Buffer.from(await karaokeFile.arrayBuffer());
      await writeFile(tempPath, karaokeBuffer);
      
      // Convert to AAC using the new function
      try {
        await convertToAAC(tempPath, finalPath);
      } finally {
        // Always try to delete temp file
        try {
          await unlink(tempPath);
        } catch {
          // Ignore error if temp file doesn't exist
        }
      }
    }

    // Revalidate the uploads directory
    revalidateTag('uploads');
    revalidateTag('songs');

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
    
    const songId = parseInt(id);

    // Get the song first to delete its files
    const song = db.prepare('SELECT id, artwork, youtube_url FROM songs WHERE id = ?').get(songId) as DbSong | undefined;
    
    if (song) {
      // Cancel any in-progress download
      downloadQueue.cancelDownload(songId);

      // Delete artwork file
      if (song.artwork) {
        try {
          const filename = song.artwork.split('/').pop();
          await fs.unlink(path.join(process.cwd(), 'uploads', filename || ''));
        } catch {
          // Ignore if file doesn't exist
        }
      }

      // Delete audio file if it exists
      await deleteAudio(songId);
    }

    // Delete the song record from database
    db.prepare('DELETE FROM songs WHERE id = ?').run(songId);

    // Also delete karaoke file if exists
    const karaokeFile = join(process.cwd(), 'music', 'karaoke', `${id}.aac`);
    if (fs.existsSync(karaokeFile)) {
      await unlink(karaokeFile);
    }

    // Revalidate after deletion
    revalidateTag('uploads');
    revalidateTag('songs');

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
    const songId = parseInt(id);
    // Get existing song to check if YouTube URL changed
    const existingSong = db.prepare('SELECT youtube_url FROM songs WHERE id = ?').get(songId) as { youtube_url: string | null } | undefined;
    
    const titleJapanese = data.get('titleJapanese') as string;
    const titleEnglish = data.get('titleEnglish') as string;
    const artistJapanese = data.get('artistJapanese') as string;
    const artistEnglish = data.get('artistEnglish') as string;
    const lyrics = data.get('lyrics') as string;
    const romaji = data.get('romaji') as string;
    const artwork = data.get('artwork') as File | null;
    const youtubeUrl = data.get('youtubeUrl') as string;

    if (!id || !titleJapanese || !titleEnglish || !artistJapanese || !artistEnglish || !lyrics || !romaji) {
      return NextResponse.json(
        { error: 'All fields except artwork and YouTube URL are required' },
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
      artworkPath = `/api/uploads/${artworkFilename}`;
      
      await fs.mkdir(path.join(process.cwd(), 'uploads'), { recursive: true });
      const fullPath = path.join(process.cwd(), 'uploads', artworkFilename);
      
      // Delete existing file if it exists
      try {
        await fs.unlink(fullPath);
      } catch {
        // Ignore if file doesn't exist
      }
      
      await fs.writeFile(fullPath, buffer);
    }

    // If YouTube URL changed, delete the old audio file
    const newYoutubeUrl = youtubeUrl || null;
    if (existingSong && existingSong.youtube_url !== newYoutubeUrl) {
      await deleteAudio(songId);
    }

    // Handle karaoke file if provided
    const karaokeFile = data.get('karaokeFile') as File;
    if (karaokeFile) {
      const karaokeDir = join(process.cwd(), 'music', 'karaoke');
      await mkdir(karaokeDir, { recursive: true });
      
      const tempPath = join(karaokeDir, `temp_${songId}_${karaokeFile.name}`);
      const finalPath = join(karaokeDir, `${songId}.aac`);
      
      const karaokeBuffer = Buffer.from(await karaokeFile.arrayBuffer());
      await writeFile(tempPath, karaokeBuffer);
      
      try {
        await convertToAAC(tempPath, finalPath);
      } finally {
        try {
          await unlink(tempPath);
        } catch {
          // Ignore error if temp file doesn't exist
        }
      }
    }

    // Update the database
    const stmt = db.prepare(`
      UPDATE songs 
      SET title_japanese = ?, title_english = ?,
          artist_japanese = ?, artist_english = ?,
          ${artwork ? 'artwork = ?,' : ''}
          youtube_url = ?,
          lyrics_japanese = ?, lyrics_romaji = ?
      WHERE id = ?
    `);

    const params = [
      titleJapanese,
      titleEnglish,
      artistJapanese,
      artistEnglish,
      ...(artwork ? [artworkPath] : []),
      newYoutubeUrl,
      lyrics,
      romaji,
      songId
    ];

    stmt.run(...params);

    // If there's a YouTube URL, trigger the audio download
    if (newYoutubeUrl) {
      const filename = `${songId}.opus`;
      const outputPath = path.join(process.cwd(), 'music', filename);
      downloadQueue.enqueue(songId, newYoutubeUrl, outputPath);
    }

    // Revalidate after update
    revalidateTag('uploads');
    revalidateTag('songs');

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