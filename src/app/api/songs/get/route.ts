import { NextResponse } from 'next/server';
import { getAllSongs, getSongById } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const song = await getSongById(parseInt(id));
      if (!song) {
        return NextResponse.json({ error: 'Song not found' }, { status: 404 });
      }
      return NextResponse.json(song);
    }

    const songs = await getAllSongs();
    return NextResponse.json(songs);
  } catch (error) {
    console.error('Error fetching songs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch songs: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}