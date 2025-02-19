import { NextResponse } from 'next/server';
import * as fs from 'fs';
import { join } from 'path';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = await Promise.resolve(params.id);
    const karaokeFile = join(process.cwd(), 'music', 'karaoke', `${id}.aac`);
    const exists = fs.existsSync(karaokeFile);
    
    console.log('Checking karaoke file:', karaokeFile, exists);
    return NextResponse.json({ exists });
  } catch (error) {
    console.error('Error checking karaoke file:', error);
    return NextResponse.json({ exists: false });
  }
}
