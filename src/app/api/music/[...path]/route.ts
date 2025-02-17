import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import fs from 'fs';
import path from 'path';
import { findAudioFile } from '@/lib/audio';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const songId = parseInt(pathParts[pathParts.length - 1], 10);
    
    const audioFileName = await findAudioFile(songId);
    if (!audioFileName) {
      console.error('Audio file not found for song:', songId);
      return new Response('Not Found', { status: 404 });
    }

    const filePath = path.join(process.cwd(), 'music', audioFileName);
    console.log('Serving audio file:', filePath);
    
    const exists = await fs.promises.access(filePath).then(() => true).catch(() => false);
    if (!exists) {
      console.error('File not found:', filePath);
      return new Response('Not Found', { status: 404 });
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

    const headersList = headers();
    const range = headersList.get('range');

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      
      const fileBuffer = await fs.promises.readFile(filePath);
      const chunk = fileBuffer.subarray(start, end + 1);

      const headers = {
        'Accept-Ranges': 'bytes',
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Content-Length': chunksize.toString(),
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000'
      };

      return new Response(chunk, { status: 206, headers });
    }

    const fileBuffer = await fs.promises.readFile(filePath);
    const headers = {
      'Accept-Ranges': 'bytes',
      'Content-Type': mimeType,
      'Content-Length': fileSize.toString(),
      'Cache-Control': 'public, max-age=31536000'
    };

    return new Response(fileBuffer, { headers });
  } catch (error) {
    console.error('Error serving audio file:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
