import { NextResponse } from 'next/server';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<Response> {
  try {
    const response = await fetch(url);
    
    if (response.status === 429) { // Rate limit
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return fetchWithRetry(url, retries - 1);
      }
    }
    
    return response;
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return fetchWithRetry(url, retries - 1);
    }
    throw error;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'YouTube API key not configured' }, { status: 500 });
    }

    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=1&key=${apiKey}`;
    
    const response = await fetchWithRetry(searchUrl);
    const data = await response.json();

    if (response.status === 403) {
      return NextResponse.json({ error: 'YouTube API quota exceeded' }, { status: 403 });
    }

    if (!response.ok) {
      return NextResponse.json({ error: 'YouTube API error: ' + data.error?.message }, { status: response.status });
    }

    if (!data.items?.length) {
      return NextResponse.json({ error: 'No results found' }, { status: 404 });
    }

    const videoId = data.items[0].id.videoId;
    return NextResponse.json({ url: `https://www.youtube.com/watch?v=${videoId}` });
  } catch (error) {
    console.error('YouTube search error:', error);
    return NextResponse.json(
      { error: 'Failed to search YouTube: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}