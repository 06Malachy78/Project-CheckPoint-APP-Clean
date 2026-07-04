import { searchGames } from '@/lib/igdb';
import { searchUsers } from '@/lib/user-search';
import GameCard from '@/components/GameCard';
import Link from 'next/link';

export default async function SearchPage({ searchParams }) {
  // In Next.js 15+, searchParams must be awaited
  const { q, type } = await searchParams;
  const query = q || "";
  const requestedType = (type || 'all').toLowerCase();
  const activeType = ['all', 'games', 'users'].includes(requestedType) ? requestedType : 'all';
  let gameResults = [];
  let userResults = [];

  if (query) {
    gameResults = await searchGames(query);
    userResults = await searchUsers(query, 18);
  }

  const showUsers = activeType === 'all' || activeType === 'users';
  const showGames = activeType === 'all' || activeType === 'games';

  const createSearchHref = (nextType) => {
    const params = new URLSearchParams();
    if (query) {
      params.set('q', query);
    }
    if (nextType !== 'all') {
      params.set('type', nextType);
    }
    const paramString = params.toString();
    return paramString ? `/search?${paramString}` : '/search';
  };

  const filterLinkStyle = (tabType) => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 14px',
    borderRadius: '999px',
    border: activeType === tabType ? '1px solid #00FF88' : '1px solid #27272a',
    color: activeType === tabType ? '#00FF88' : '#a1a1aa',
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    fontWeight: 800,
    fontSize: '0.7rem',
    textDecoration: 'none',
    backgroundColor: activeType === tabType ? 'rgba(0, 255, 136, 0.08)' : '#111827'
  });

  return (
    <main style={{ backgroundColor: '#09090b', minHeight: '100vh', color: 'white', paddingTop: '80px', paddingLeft: '40px', paddingRight: '40px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.5rem', color: '#71717a', marginBottom: '30px' }}>
          {query ? (
            <>Results for <span style={{ color: '#00FF88' }}>&quot;{query}&quot;</span></>
          ) : (
            <>Search games and users using the bar above.</>
          )}
        </h1>

        {query && (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <Link href={createSearchHref('all')} style={filterLinkStyle('all')}>
              All
            </Link>
            <Link href={createSearchHref('games')} style={filterLinkStyle('games')}>
              Games
            </Link>
            <Link href={createSearchHref('users')} style={filterLinkStyle('users')}>
              Users
            </Link>
          </div>
        )}

        {query ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
            {showUsers && (
              <section>
                <h2 style={{ fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#71717a', marginBottom: '14px', fontWeight: 800 }}>
                  Users
                </h2>

                {userResults.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
                    {userResults.map((profile) => {
                      const avatarUrl = profile.avatar_url || profile.avatar || profile.image_url || '';
                      const initials = (profile.username || 'U').slice(0, 2).toUpperCase();

                      return (
                        <Link
                          key={profile.id}
                          href={`/api/analytics/user-search-click?username=${encodeURIComponent(profile.username)}&source=search-page&q=${encodeURIComponent(query)}&redirect=${encodeURIComponent(`/profile/${profile.username}`)}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '14px',
                            borderRadius: '16px',
                            border: '1px solid #27272a',
                            backgroundColor: '#111827',
                            textDecoration: 'none',
                            color: 'white'
                          }}
                        >
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={`${profile.username} avatar`}
                              style={{ width: '46px', height: '46px', borderRadius: '999px', objectFit: 'cover', backgroundColor: '#27272a', flexShrink: 0 }}
                            />
                          ) : (
                            <div style={{ width: '46px', height: '46px', borderRadius: '999px', backgroundColor: '#27272a', color: '#d4d4d8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>
                              {initials}
                            </div>
                          )}

                          <div style={{ minWidth: 0 }}>
                            <p style={{ margin: 0, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile.username}</p>
                            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#a1a1aa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {profile.bio || 'View profile'}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: '#111827', border: '1px solid #27272a', marginBottom: '6px' }}>
                    <p style={{ color: '#94a3b8', marginBottom: 0 }}>No users found.</p>
                  </div>
                )}
              </section>
            )}

            {showGames && (
              <section>
                <h2 style={{ fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#71717a', marginBottom: '14px', fontWeight: 800 }}>
                  Games
                </h2>

                {gameResults.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '25px' }}>
                    {gameResults.map((game) => <GameCard key={game.id} game={game} />)}
                  </div>
                ) : (
                  <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: '#111827', border: '1px solid #27272a' }}>
                    <p style={{ color: '#94a3b8', marginBottom: 0 }}>No games found.</p>
                  </div>
                )}
              </section>
            )}

            {((showUsers && userResults.length === 0) && (showGames && gameResults.length === 0) && activeType === 'all') && (
              <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: '#111827', border: '1px solid #27272a' }}>
                <p style={{ color: '#cbd5e1', marginBottom: 0 }}>Try searching for a different game title or username.</p>
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: '40px', borderRadius: '24px', backgroundColor: '#111827', border: '1px solid #27272a', maxWidth: '600px' }}>
            <p style={{ color: '#94a3b8', marginBottom: '12px', fontSize: '1rem' }}>
              Use the search bar at the top to find games, users, and reviews.
            </p>
            <p style={{ color: '#cbd5e1', fontSize: '0.95rem' }}>
              Start typing a game name or username and hit enter to see results here.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}