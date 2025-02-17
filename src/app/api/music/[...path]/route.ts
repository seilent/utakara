import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import fs from 'fs';
import path from 'path';
import { findAudioFile } from '@/lib/audio';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const songId = parseInt(pathParts[pathParts.length - 1], 10);
    
    // Find the actual audio file with the correct extension
    const audioFileName = await findAudioFile(songId);
    if (!audioFileName) {
      console.error('Audio file not found for song:', songId);
      return new NextResponse('Not Found', { status: 404 });
    }

    const filePath = path.join(process.cwd(), 'music', audioFileName);
    console.log('Serving audio file:', filePath);
    
    // Get MIME type based on file extension
    const getAudioMimeType = (filePath: string) => {
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.webm': 'audio/webm',
        '.m4a': 'audio/mp4',
        '.mp3': 'audio/mpeg',
        '.opus': 'audio/opus'
      };
      return mimeTypes[ext] || 'audio/webm';
    };

    const exists = await fs.promises.access(filePath).then(() => true).catch(() => false);
    if (!exists) {
      console.error('File not found:', filePath);
      return new NextResponse('Not Found', { status: 404 });
    }

    const stat = await fs.promises.stat(filePath);
    const fileSize = stat.size;
    const headersList = await headers();
    const range = headersList.get('range');

    const file = await fs.promises.readFile(filePath);

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const chunk = file.slice(start, end + 1);

      return new NextResponse(chunk, {
        status: 206,
        headers: {
          'Accept-Ranges': 'bytes',
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Content-Length': chunksize.toString(),
          'Content-Type': getAudioMimeType(filePath),
          'Cache-Control': 'public, max-age=31536000'
        },
      });
    }

    return new NextResponse(file, {
      headers: {
        'Accept-Ranges': 'bytes',
        'Content-Type': getAudioMimeType(filePath),
        'Content-Length': fileSize.toString(),
        'Cache-Control': 'public, max-age=31536000'
      },
    });
  } catch (error) {
    console.error('Error serving audio file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
