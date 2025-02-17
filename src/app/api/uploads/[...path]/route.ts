import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: Request) {
  try {
    const { pathname } = new URL(request.url);
    const filename = pathname.split('/').pop();
    
    if (!filename) {
      return new NextResponse('File not found', { status: 404 });
    }

    const filePath = path.join(process.cwd(), 'uploads', filename);
    
    try {
      const file = await fs.readFile(filePath);
      const contentType = filename.endsWith('.webp') ? 'image/webp' : 
                         filename.endsWith('.jpg') || filename.endsWith('.jpeg') ? 'image/jpeg' :
                         filename.endsWith('.png') ? 'image/png' : 
                         'application/octet-stream';

      return new NextResponse(file, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=0, must-revalidate',
        },
      });
    } catch (error) {
      console.error('Error reading file:', error);
      return new NextResponse('File not found', { status: 404 });
    }
  } catch (error) {
    console.error('Error serving file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}