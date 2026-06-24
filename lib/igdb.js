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
export async function searchGames(query) {
  const token = await getAccessToken();
  
  // IGDB search requires the 'search' keyword first, then fields
  const body = `search "${query}"; fields name, cover.url, first_release_date; limit 24;`;

  const response = await fetch('https://api.igdb.com/v4/games', {
    method: 'POST',
    headers: {
      'Client-ID': process.env.IGDB_CLIENT_ID,
      'Authorization': `Bearer ${token}`,
    },
    body: body,
  });

  const data = await response.json();
  console.log("Search results:", data); // Check your terminal to see the list!
  return data;
}