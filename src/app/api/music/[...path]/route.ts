import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { findAudioFile } from '@/lib/audio';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const songId = parseInt(pathParts[pathParts.length - 1], 10);
    
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

    const fileBuffer = await fs.promises.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = {
      '.webm': 'audio/webm',
      '.m4a': 'audio/mp4',
      '.mp3': 'audio/mpeg',
      '.opus': 'audio/opus'
    }[ext] || 'audio/webm';

    return new Response(fileBuffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'no-cache'
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
