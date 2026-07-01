import { searchGames } from '@/lib/igdb';
import GameCard from '@/components/GameCard';

export default async function SearchPage({ searchParams }) {
  // In Next.js 15+, searchParams must be awaited
  const { q } = await searchParams;
  const query = q || "";
  const results = query ? await searchGames(query) : [];

  return (
    <main style={{ backgroundColor: '#09090b', minHeight: '100vh', color: 'white', paddingTop: '80px', paddingLeft: '40px', paddingRight: '40px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.5rem', color: '#71717a', marginBottom: '30px' }}>
          {query ? (
            <>Results for <span style={{ color: '#00FF88' }}>&quot;{query}&quot;</span></>
          ) : (
            <>Search games using the bar above.</>
          )}
        </h1>

        {query ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '25px' }}>
            {results.length > 0 ? (
              results.map((game) => <GameCard key={game.id} game={game} />)
            ) : (
              <div style={{ padding: '40px', borderRadius: '24px', backgroundColor: '#111827', border: '1px solid #27272a' }}>
                <p style={{ color: '#94a3b8', marginBottom: '12px' }}>No games found.</p>
                <p style={{ color: '#cbd5e1' }}>Try searching for a different title.</p>
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: '40px', borderRadius: '24px', backgroundColor: '#111827', border: '1px solid #27272a', maxWidth: '600px' }}>
            <p style={{ color: '#94a3b8', marginBottom: '12px', fontSize: '1rem' }}>
              Use the search bar at the top to find games and reviews.
            </p>
            <p style={{ color: '#cbd5e1', fontSize: '0.95rem' }}>
              Start typing a game name and hit enter to see results here.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}