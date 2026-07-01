// lib/igdb.js

async function getAccessToken() {
  const response = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${process.env.IGDB_CLIENT_ID}&client_secret=${process.env.IGDB_CLIENT_SECRET}&grant_type=client_credentials`,
    { method: 'POST' }
  );

  const data = await response.json();
  return data.access_token; // This is the temporary key we need
}

export async function fetchGameData(gameId) {
  const token = await getAccessToken();
  
  // Cleaned up query format
  const query = `fields name, summary, first_release_date, cover.url; where id = ${gameId};`;

  const response = await fetch('https://api.igdb.com/v4/games', {
    method: 'POST',
    headers: {
      'Client-ID': process.env.IGDB_CLIENT_ID,
      'Authorization': `Bearer ${token}`,
    },
    body: query,
  });

  const games = await response.json();
  
  // Add this line to see what the API is actually sending back in your terminal
  console.log("IGDB Response:", games); 

  return games && games.length > 0 ? games[0] : null;
}
export async function searchGames(query, token) {
  const authToken = token || await getAccessToken();
  const safeQuery = query.replace(/"/g, '');
  
  // IGDB search requires the 'search' keyword first, then fields
  const body = `search "${safeQuery}"; fields name, summary, cover.url, first_release_date; limit 24;`;

  const response = await fetch('https://api.igdb.com/v4/games', {
    method: 'POST',
    headers: {
      'Client-ID': process.env.IGDB_CLIENT_ID,
      'Authorization': `Bearer ${authToken}`,
    },
    body: body,
  });

  const data = await response.json();
  console.log("Search results:", data); // Check your terminal to see the list!
  return data;
}

export async function fetchTrendingGames(limit = 6) {
  const token = await getAccessToken();
  const query = `fields name, summary, first_release_date, cover.url; where cover != null; sort popularity desc; limit ${limit};`;

  const response = await fetch('https://api.igdb.com/v4/games', {
    method: 'POST',
    headers: {
      'Client-ID': process.env.IGDB_CLIENT_ID,
      'Authorization': `Bearer ${token}`,
    },
    body: query,
  });

  const data = await response.json();
  return data;
}

export async function fetchTwitchTopGames(limit = 6) {
  const token = await getAccessToken();

  const twitchResponse = await fetch(`https://api.twitch.tv/helix/games/top?first=${limit}`, {
    method: 'GET',
    headers: {
      'Client-ID': process.env.IGDB_CLIENT_ID,
      'Authorization': `Bearer ${token}`,
    },
  });

  const twitchData = await twitchResponse.json();
  const twitchGames = Array.isArray(twitchData.data) ? twitchData.data : [];

  const games = await Promise.all(
    twitchGames.map(async (twitchGame) => {
      const results = await searchGames(twitchGame.name, token);
      const igdbMatch = Array.isArray(results) && results.length > 0 ? results[0] : null;
      const coverUrl = igdbMatch?.cover?.url
        ? igdbMatch.cover.url.replace('t_thumb', 't_cover_big')
        : twitchGame.box_art_url?.replace('{width}', '720').replace('{height}', '1000');

      return {
        name: twitchGame.name,
        summary: igdbMatch?.summary || '',
        cover: { url: coverUrl },
      };
    })
  );

  return games;
}