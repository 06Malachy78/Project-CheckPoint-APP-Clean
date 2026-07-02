import Link from 'next/link';
import { createClient } from '../../lib/server';
import GameCard from '@/components/GameCard';
import TopGamesEditor from '@/components/TopGamesEditor';
import ReviewCard from '@/components/ReviewCard.jsx';
import ProfileGameStatusEditor from '@/components/ProfileGameStatusEditor';
import ReplayGamesSection from '@/components/ReplayGamesSection';
import { groupGameStatuses } from '@/lib/game-statuses';

export default async function ProfilePage() {
  const supabase = await createClient(); 
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <p className="pt-32 text-center text-zinc-500 uppercase tracking-widest text-xs">Please log in to view your profile.</p>;

  // Kick off both database queries simultaneously
  const [profileResponse, reviewsResponse] = await Promise.all([
  supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle(),
    
  supabase
    .from('reviews')
    .select('*')
    // ðŸŽ¯ FIX: Remove the .or() filter and target strictly by user.id
    .eq('user_id', user.id) 
    .order('created_at', { ascending: false })
]);

  const profile = profileResponse.data;
  const reviews = reviewsResponse.data || [];

  const { data: gameStatusRows, error: gameStatusError } = await supabase
    .from('game_statuses')
    .select('game_id, game_name, game_cover, status, replay_count, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (gameStatusError) {
    console.error('Unable to load profile game statuses:', gameStatusError.message);
  }

  const safeStatusRows = gameStatusRows || [];
  const groupedStatuses = groupGameStatuses(safeStatusRows);
  const replayGames = safeStatusRows
    .filter((row) => (row.replay_count || 0) > 0)
    .sort((a, b) => (b.replay_count || 0) - (a.replay_count || 0))
    .map((row) => ({
      id: row.game_id,
      name: row.game_name,
      cover: row.game_cover,
      replayCount: row.replay_count || 0,
    }));

  const totalGamesPlayed = new Set(
    safeStatusRows
      .filter((row) => ['playing', 'finished'].includes(row.status) || (row.replay_count || 0) > 0)
      .map((row) => row.game_id)
  ).size;
  const reviewIds = reviews.map((review) => review.id);
  const likesByReviewId = {};

  let totalLikesReceived = 0;
  if (reviewIds.length > 0) {
    const [{ count }, { data: likesRows }] = await Promise.all([
      supabase
      .from('review_likes')
      .select('*', { count: 'exact', head: true })
      .in('review_id', reviewIds),
      supabase
      .from('review_likes')
      .select('review_id')
      .in('review_id', reviewIds)
    ]);

    totalLikesReceived = typeof count === 'number' ? count : 0;

    for (const row of likesRows || []) {
      likesByReviewId[row.review_id] = (likesByReviewId[row.review_id] || 0) + 1;
    }
  }

  return (
    <>
      <main className="max-w-4xl mx-auto pt-32 px-6 pb-20">
        <section className="mb-16 border-b border-zinc-900 pb-10">
          <h1 className="text-4xl font-black mb-2 uppercase tracking-tighter text-white">My Profile</h1>
          <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">
            {profile?.username || user.email}
          </p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-zinc-300">
            <span className="text-[#00FF88]">❤</span>
            {totalLikesReceived} total {totalLikesReceived === 1 ? 'like' : 'likes'}
          </p>
          <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-zinc-300">
            <span className="text-[#00FF88]">GP</span>
            {totalGamesPlayed} total {totalGamesPlayed === 1 ? 'game played' : 'games played'}
          </p>
        </section>

      {/* Top 3 Games Section */}
      <section className="mb-16">
        <h2 className="text-lg font-black mb-6 uppercase tracking-widest text-zinc-400">
          Top 3 All-Time
        </h2>
        <TopGamesEditor profile={profile} userId={user.id} />
      </section>

      <section className="mb-16">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h2 className="text-lg font-black uppercase tracking-widest text-zinc-400">My Game Status</h2>
        </div>
        <ProfileGameStatusEditor groupedStatuses={groupedStatuses} />
      </section>

      <ReplayGamesSection replayGames={replayGames} />

      {/* User Reviews Section */}
      <section>
        <h2 className="text-lg font-black mb-6 uppercase tracking-widest text-zinc-400">My Reviews</h2>
        <div className="space-y-4">
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                showActions
                likesCount={likesByReviewId[review.id] || 0}
              />
            ))
          ) : (
            <p className="text-zinc-600 text-xs uppercase tracking-widest italic">You haven't reviewed any games yet.</p>
          )}
        </div>
      </section>
    </main>
    </>
  );
}
