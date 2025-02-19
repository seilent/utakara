import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { findAudioFile } from '@/lib/audio';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Optimal chunk size for streaming (2MB)
const CHUNK_SIZE = 2 * 1024 * 1024;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // Check if this is a karaoke request
    const isKaraoke = pathParts.includes('karaoke');
    const songId = parseInt(pathParts[pathParts.length - (isKaraoke ? 2 : 1)], 10);

    if (isKaraoke) {
      const id = await Promise.resolve(songId);
      const karaokeFile = path.join(process.cwd(), 'music', 'karaoke', `${id}.m4a`);
      
      try {
        await fs.promises.access(karaokeFile);
      } catch {
        return new Response('Audio file not found', { 
          status: 404,
          headers: { 'Content-Type': 'text/plain' }
        });
      }

      const stat = await fs.promises.stat(karaokeFile);
      const fileSize = stat.size;

      const rangeHeader = request.headers.get('range');
      if (rangeHeader) {
        const parts = rangeHeader.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + CHUNK_SIZE, fileSize - 1);
        const chunkSize = end - start + 1;
        const file = await fs.promises.open(karaokeFile, 'r');
        const buffer = Buffer.alloc(chunkSize);
        await file.read(buffer, 0, chunkSize, start);
        await file.close();

        return new Response(buffer, {
          status: 206,
          headers: {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize.toString(),
            'Content-Type': 'audio/mp4',
            'Cache-Control': 'public, max-age=3600'
          }
        });
      }

      // For initial request
      const initialChunkSize = Math.min(CHUNK_SIZE, fileSize);
      const buffer = Buffer.alloc(initialChunkSize);
      const file = await fs.promises.open(karaokeFile, 'r');
      await file.read(buffer, 0, initialChunkSize, 0);
      await file.close();

      return new Response(buffer, {
        headers: {
          'Content-Type': 'audio/mp4',
          'Content-Length': fileSize.toString(),
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }

    // Original audio handling
    const audioFileName = await findAudioFile(songId);
    if (!audioFileName) {
      return new Response('Audio file not found', { 
        status: 404,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    const musicPath = process.env.MUSIC_PATH || path.join(process.cwd(), 'music');
    const filePath = path.join(musicPath, audioFileName);
    
    try {
      await fs.promises.access(filePath);
    } catch {
      return new Response('File not found', { 
        status: 404,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    const stat = await fs.promises.stat(filePath);
    const fileSize = stat.size;
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = {
      '.webm': 'audio/webm',
      '.m4a': 'audio/mp4',
      '.mp3': 'audio/mpeg',
      '.opus': 'audio/opus'
    }[ext] || 'audio/webm';

    const rangeHeader = request.headers.get('range');
    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + CHUNK_SIZE, fileSize - 1);
      const chunkSize = end - start + 1;
      const file = await fs.promises.open(filePath, 'r');
      const buffer = Buffer.alloc(chunkSize);
      await file.read(buffer, 0, chunkSize, start);
      await file.close();

      return new Response(buffer, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize.toString(),
          'Content-Type': mimeType,
          'Cache-Control': 'public, max-age=3600',
          'Transfer-Encoding': 'chunked'
        }
      });
    }

    // For initial request, only send the first chunk to start playback quickly
    const initialChunkSize = Math.min(CHUNK_SIZE, fileSize);
    const buffer = Buffer.alloc(initialChunkSize);
    const file = await fs.promises.open(filePath, 'r');
    await file.read(buffer, 0, initialChunkSize, 0);
    await file.close();

    return new Response(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Length': fileSize.toString(),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600',
        'Transfer-Encoding': 'chunked'
      }
    });
  } catch (error) {
    console.error('Audio serving error:', error);
    return new Response('Internal Server Error', { 
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}
