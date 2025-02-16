import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { japanese, romaji } = await request.json();
    
    if (!japanese || !romaji) {
      return NextResponse.json(
        { error: 'Both japanese and romaji text are required' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      japanese,
      romaji
    });
  } catch (error) {
    console.error('Error processing lyrics:', error);
    return NextResponse.json(
      { error: 'Failed to process lyrics: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}