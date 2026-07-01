import { createClient } from '../lib/server';
import { fetchGameData } from '../lib/igdb';
import Navbar from '../components/Navbar';
import Link from 'next/link';
import GlobalActivityFeed from '@/components/GlobalActivityFeed';

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

        <GlobalActivityFeed feedItems={feedItems} />

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