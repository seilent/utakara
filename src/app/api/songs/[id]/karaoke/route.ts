import { NextResponse } from 'next/server';
import * as fs from 'fs';
import { join } from 'path';
import { Readable } from 'stream';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = await Promise.resolve(params.id);
    const karaokeFile = join(process.cwd(), 'music', 'karaoke', `${id}.m4a`);
    
    if (!fs.existsSync(karaokeFile)) {
      console.error('Karaoke file not found:', karaokeFile);
      return new NextResponse('Karaoke version not found', { status: 404 });
    }

    const stream = fs.createReadStream(karaokeFile);
    const headers = new Headers({
      'Content-Type': 'audio/mp4',
      'Accept-Ranges': 'bytes',
      'Content-Length': fs.statSync(karaokeFile).size.toString()
    });

    return new NextResponse(stream as unknown as ReadableStream, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Error streaming karaoke file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
