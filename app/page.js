import { createClient } from '../lib/server';
import { fetchGameData } from '../lib/igdb';
import Navbar from '../components/Navbar';
import Link from 'next/link';

export default async function HomePage() {
  // Create the Supabase client FIRST
  const supabase = await createClient();

  // 1. Fetch the 10 most recent reviews
  const { data: latestReviews } = await supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  // Fetch total count for the badge
  const { count: totalCheckpoints } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true });

  // 2. Fetch IGDB data for each review
  const feedItems = latestReviews
    ? await Promise.all(
        latestReviews.map(async (review) => {
          const gameData = await fetchGameData(review.game_id);
          return { ...review, gameData };
        })
      )
    : [];

  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      <Navbar />

      <div className="max-w-6xl mx-auto pt-32 px-6 pb-20">
        {/* --- UPDATED HEADER START --- */}
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tighter mb-2 text-zinc-100 uppercase">
              Global Activity
            </h1>
            <p className="text-zinc-500 font-medium">
              Recent checkpoints from the community.
            </p>
          </div>

          {/* Live Pulse Badge */}
          <div className="bg-zinc-900/80 border border-zinc-800 px-4 py-2 rounded-full flex items-center gap-3 w-fit shadow-xl shadow-black/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FF88] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00FF88]"></span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
              {totalCheckpoints || 0} Checkpoints Logged
            </span>
          </div>
        </header>
        {/* --- UPDATED HEADER END --- */}

        {/* The Feed Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {feedItems.map((item) => (
            <Link
              href={`/game/${item.game_id}`}
              key={item.id}
              className="group bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-5 flex gap-5 hover:bg-zinc-800/60 transition-all duration-300 hover:border-[#00FF88]/30 hover:shadow-[0_0_30px_rgba(0,255,136,0.05)]"
            >
              {/* Game Poster Thumbnail */}
              <div className="w-24 h-32 flex-shrink-0 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
                <img
                  src={item.gameData?.cover?.url?.replace('t_thumb', 't_cover_big')}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  alt={item.gameData?.name}
                />
              </div>

              {/* Review Content */}
              <div className="flex flex-col justify-between py-1">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[#00FF88] font-black text-xs uppercase tracking-tight">
                      {item.username}
                    </span>
                    <span className="text-zinc-700 text-xs">•</span>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={
                            i < item.rating
                              ? 'text-yellow-500 text-[10px]'
                              : 'text-zinc-800 text-[10px]'
                          }
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  <h2 className="text-lg font-bold text-zinc-100 group-hover:text-[#00FF88] transition-colors line-clamp-1">
                    {item.gameData?.name}
                  </h2>
                  <p className="text-zinc-400 text-sm line-clamp-2 italic mt-2 leading-relaxed">
                    "{item.content}"
                  </p>
                </div>

                <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-black mt-4">
                  {new Date(item.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {feedItems.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed border-zinc-900 rounded-3xl">
            <p className="text-zinc-500 italic font-medium">
              The feed is quiet... go log a game!
            </p>
          </div>
        )}
      </div>
    </main>
  );
}