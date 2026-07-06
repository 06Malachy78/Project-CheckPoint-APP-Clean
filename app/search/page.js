import { searchGames } from '@/lib/igdb';
import { searchUsers } from '@/lib/user-search';
import GameCard from '@/components/GameCard';
import FollowButton from '@/components/FollowButton';
import { createClient } from '@/lib/server';
import Link from 'next/link';

export default async function SearchPage({ searchParams }) {
  const supabase = await createClient();
  const {
    data: { user: viewerUser },
  } = await supabase.auth.getUser();

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

  const followedUserIds = new Set();
  if (viewerUser?.id && userResults.length > 0) {
    const userIds = userResults.map((profile) => profile.id).filter(Boolean);
    if (userIds.length > 0) {
      const { data: followingRows } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', viewerUser.id)
        .in('following_id', userIds);

      for (const row of followingRows || []) {
        if (row.following_id) {
          followedUserIds.add(row.following_id);
        }
      }
    }
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
    <main className="min-h-screen bg-[#09090b] text-white pt-28 sm:pt-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-xl sm:text-2xl text-zinc-500 mb-6 sm:mb-8 leading-tight">
          {query ? (
            <>Results for <span className="text-[#00FF88]">&quot;{query}&quot;</span></>
          ) : (
            <>Search games and users using the bar above.</>
          )}
        </h1>

        {query && (
          <div className="flex gap-2.5 mb-6 flex-wrap">
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
          <div className="flex flex-col gap-8 sm:gap-9">
            {showUsers && (
              <section>
                <h2 className="text-[11px] tracking-[0.2em] uppercase text-zinc-500 mb-3.5 font-extrabold">
                  Users
                </h2>

                {userResults.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                    {userResults.map((profile) => {
                      const avatarUrl = profile.avatar_url || profile.avatar || profile.image_url || '';
                      const initials = (profile.username || 'U').slice(0, 2).toUpperCase();

                      return (
                        <div
                          key={profile.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px',
                            padding: '14px',
                            borderRadius: '16px',
                            border: '1px solid #27272a',
                            backgroundColor: '#111827',
                            color: 'white'
                          }}
                        >
                          <Link
                            href={`/api/analytics/user-search-click?username=${encodeURIComponent(profile.username)}&source=search-page&q=${encodeURIComponent(query)}&redirect=${encodeURIComponent(`/profile/${profile.username}`)}`}
                            style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: 'white', minWidth: 0, flex: 1 }}
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

                          {viewerUser?.id && viewerUser.id !== profile.id && (
                            <FollowButton
                              targetUserId={profile.id}
                              initiallyFollowing={followedUserIds.has(profile.id)}
                              compact
                              showCount={false}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-5 sm:p-6 rounded-2xl bg-[#111827] border border-zinc-800 mb-1.5">
                    <p className="text-slate-400 mb-0">No users found.</p>
                  </div>
                )}
              </section>
            )}

            {showGames && (
              <section>
                <h2 className="text-[11px] tracking-[0.2em] uppercase text-zinc-500 mb-3.5 font-extrabold">
                  Games
                </h2>

                {gameResults.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
                    {gameResults.map((game) => <GameCard key={game.id} game={game} />)}
                  </div>
                ) : (
                  <div className="p-5 sm:p-6 rounded-2xl bg-[#111827] border border-zinc-800">
                    <p className="text-slate-400 mb-0">No games found.</p>
                  </div>
                )}
              </section>
            )}

            {((showUsers && userResults.length === 0) && (showGames && gameResults.length === 0) && activeType === 'all') && (
              <div className="p-5 sm:p-6 rounded-2xl bg-[#111827] border border-zinc-800">
                <p className="text-slate-300 mb-0">Try searching for a different game title or username.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 sm:p-10 rounded-3xl bg-[#111827] border border-zinc-800 max-w-2xl">
            <p className="text-slate-400 mb-3 text-base">
              Use the search bar at the top to find games, users, and reviews.
            </p>
            <p className="text-slate-300 text-[0.95rem]">
              Start typing a game name or username and hit enter to see results here.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}