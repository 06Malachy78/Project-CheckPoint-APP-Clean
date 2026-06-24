import { searchGames } from '@/lib/igdb';
import GameCard from '@/components/GameCard';
import Navbar from '@/components/Navbar';

export default async function SearchPage({ searchParams }) {
  // In Next.js 15+, searchParams must be awaited
  const { q } = await searchParams;
  const query = q || "";
  const results = query ? await searchGames(query) : [];

   return (
  <main style={{ backgroundColor: '#09090b', minHeight: '100vh', color: 'white', paddingTop: '80px', paddingLeft: '40px', paddingRight: '40px' }}>
    <Navbar />
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', color: '#71717a', marginBottom: '30px' }}>
        Results for <span style={{ color: '#00FF88' }}>"{query}"</span>
      </h1>
      
      {/* THIS IS THE GRID FIX */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
        gap: '25px' 
      }}>
        {results.length > 0 ? (
          results.map((game) => <GameCard key={game.id} game={game} />)
        ) : (
          <p>No games found.</p>
        )}
      </div>
    </div>
  </main>
);
}