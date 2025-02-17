/* eslint-disable */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { NextRequest } from 'next/server';
import { createReadStream, statSync } from 'fs';
import path from 'path';
import { getAudioForSong } from '@/lib/audio';
import { audioLogger } from '@/lib/audio-logger';

function getAudioMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.webm': 'audio/webm',
    '.m4a': 'audio/mp4',
    '.mp3': 'audio/mpeg',
    '.opus': 'audio/opus'
  };
  return mimeTypes[ext] || 'audio/webm';
}

export async function GET(
    request: NextRequest,
    context: { params: { id: string } }
): Promise<Response> {
    const { id } = context.params;
    const songId = parseInt(id, 10);
    const audioPath = await getAudioForSong(songId);
    
    if (!audioPath) {
        return Response.json({ error: 'Audio not found' }, { status: 404 });
    }

    const stat = statSync(audioPath);
    const fileSize = stat.size;
    const range = request.headers.get('range');
    const contentType = getAudioMimeType(audioPath);

    if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = (end - start) + 1;
        const stream = createReadStream(audioPath, { start, end });

        const headers = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize.toString(),
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000',
        };

        return new Response(stream as unknown as ReadableStream, { 
            headers, 
            status: 206 
        });
    }

    const stream = createReadStream(audioPath);
    return new Response(stream as unknown as ReadableStream, {
        headers: {
            'Content-Type': contentType,
            'Content-Length': fileSize.toString(),
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'public, max-age=31536000',
        },
    });
}

export async function POST(
    request: NextRequest,
    context: { params: { id: string } }
): Promise<Response> {
    const { id } = context.params;
    const audioPath = await getAudioForSong(parseInt(id, 10));
    
    if (!audioPath) {
        return new Response(null, { status: 404 });
    }
    
    return new Response(null, { status: 200 });
}