import { createClient } from '../../lib/server';
import TopGamesEditor from '@/components/TopGamesEditor';
import ReviewCard from '@/components/ReviewCard.jsx';
import ProfileGameStatusEditor from '@/components/ProfileGameStatusEditor';
import ReplayGamesSection from '@/components/ReplayGamesSection';
import FavoriteGamesSection from '@/components/FavoriteGamesSection';
import ProfileHeader from '@/components/ProfileHeader';
import FollowConnectionsSection from '@/components/FollowConnectionsSection';
import { groupGameStatuses } from '@/lib/game-statuses';
import { listFavoriteGames } from '@/lib/favorites';
import {
  listFollowers,
  listFollowing,
  getFollowStats,
  listMutualFollowerIds,
  listMutualFollowingIds,
} from '@/lib/follows';

const FOLLOW_PREVIEW_LIMIT = 8;
const FOLLOW_FULL_LIMIT_CAP = 1000;

export const metadata = {
  title: 'Your Profile',
  description: 'Manage your Checkpoint Hub profile, reviews, game statuses, favourites, and follow connections.',
  alternates: {
    canonical: '/profile',
  },
  robots: {
    index: false,
    follow: false,
  },
};

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
  const followStats = await getFollowStats(user.id);
  const followersFullLimit = Math.max(FOLLOW_PREVIEW_LIMIT, Math.min(followStats.followersCount, FOLLOW_FULL_LIMIT_CAP));
  const followingFullLimit = Math.max(FOLLOW_PREVIEW_LIMIT, Math.min(followStats.followingCount, FOLLOW_FULL_LIMIT_CAP));
  const [allFollowers, allFollowing] = await Promise.all([
    listFollowers(user.id, followersFullLimit),
    listFollowing(user.id, followingFullLimit),
  ]);
  const followers = allFollowers.slice(0, FOLLOW_PREVIEW_LIMIT);
  const following = allFollowing.slice(0, FOLLOW_PREVIEW_LIMIT);
  const [mutualFollowerIds, mutualFollowingIds] = await Promise.all([
    listMutualFollowerIds(user.id, allFollowers.map((profile) => profile.id)),
    listMutualFollowingIds(user.id, allFollowing.map((profile) => profile.id)),
  ]);
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

  const favoriteGames = await listFavoriteGames(user.id);

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
        <ProfileHeader
          profile={profile}
          user={user}
          totalGamesPlayed={totalGamesPlayed}
          followersCount={followStats.followersCount}
          followingCount={followStats.followingCount}
        />

      <section className="mb-16 grid grid-cols-1 gap-4 md:grid-cols-2">
        <FollowConnectionsSection
          title="Followers"
          users={followers}
          allUsers={allFollowers}
          emptyText="No followers yet."
          mutualUserIds={mutualFollowerIds}
        />
        <FollowConnectionsSection
          title="Following"
          users={following}
          allUsers={allFollowing}
          emptyText="You are not following anyone yet."
          mutualUserIds={mutualFollowingIds}
        />
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

      <FavoriteGamesSection favoriteGames={favoriteGames} />

      {/* User Reviews Section */}
      <section>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-black uppercase tracking-widest text-zinc-400">My Reviews</h2>
          <p className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-zinc-300">
            <span className="text-[#00FF88]">❤</span>
            {totalLikesReceived} total {totalLikesReceived === 1 ? 'like' : 'likes'}
          </p>
        </div>
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
