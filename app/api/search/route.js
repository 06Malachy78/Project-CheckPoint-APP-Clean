import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim();

  if (!query) {
    return NextResponse.json([]);
  }

  const clientId = process.env.IGDB_CLIENT_ID?.trim();
  const clientSecret = process.env.IGDB_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    console.error('IGDB credentials missing from environment variables.');
    return NextResponse.json(
      { error: 'Server configuration missing' },
      { status: 500 }
    );
  }

  try {
    const tokenResponse = await fetch(
      `https://id.twitch.tv/oauth2/token?client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&grant_type=client_credentials`,
      { method: 'POST' }
    );

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      console.error('Failed to fetch IGDB access token:', tokenData);
      return NextResponse.json([], { status: 502 });
    }

    const res = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Client-ID': clientId,
        Authorization: `Bearer ${accessToken}`,
      },
      body: `search "${query}"; fields name, cover.url, first_release_date; where version_parent = null; limit 6;`,
    });

    const data = await res.json();

    if (!Array.isArray(data)) {
      console.error('IGDB API error response:', data);
      return NextResponse.json([], { status: 502 });
    }

    const formattedData = data.map((game) => ({
      ...game,
      cover: game.cover
        ? {
            ...game.cover,
            url: game.cover.url?.startsWith('http')
              ? game.cover.url
              : `https:${game.cover.url}`,
          }
        : null,
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Search API failed:', error);
    return NextResponse.json([], { status: 500 });
  }
}