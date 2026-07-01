import { createClient } from '../lib/server';
import { fetchGameData } from '../lib/igdb';
import Navbar from '../components/Navbar';
import HomeContent from '@/components/HomeContent';

export default async function HomePage() {
  // Create the Supabase client FIRST
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isGuest = !user;

  // Fetch total count for the badge and guest landing stats
  const { count: totalCheckpoints } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true });

  const rawFeedItems = isGuest
    ? []
    : (await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
      )?.data ?? [];

  const feedItems = isGuest
    ? []
    : await Promise.all(
        rawFeedItems.map(async (review) => {
          const gameData = await fetchGameData(review.game_id);
          return { ...review, gameData };
        })
      );

  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      <Navbar />

      <div className="max-w-6xl mx-auto pt-32 px-6 pb-20">
        <HomeContent
          initialFeedItems={feedItems}
          totalCheckpoints={totalCheckpoints || 0}
          initialIsGuest={isGuest}
        />
      </div>
    </main>
  );
}