import { createClient } from '../../../lib/server';
import { createAdminClient } from '../../../lib/admin';
import GameCard from '@/components/GameCard';
import ReviewCard from '@/components/ReviewCard';
import ProfileGameStatusSections from '@/components/ProfileGameStatusSections';
import ReplayGamesSection from '@/components/ReplayGamesSection';
import FavoriteGamesSection from '@/components/FavoriteGamesSection';
import FollowButton from '@/components/FollowButton';
import FollowConnectionsSection from '@/components/FollowConnectionsSection';
import { groupGameStatuses } from '@/lib/game-statuses';
import { listFavoriteGames } from '@/lib/favorites';
import {
  getFollowStats,
  isFollowingUser,
  listFollowers,
  listFollowing,
  listMutualFollowerIds,
  listMutualFollowingIds,
} from '@/lib/follows';

const FOLLOW_PREVIEW_LIMIT = 8;
const FOLLOW_FULL_LIMIT_CAP = 1000;

export default async function UserProfilePage({ params }) {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();
  const { username } = params;

  const {
    data: { user: viewerUser },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .maybeSingle();

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('username', username)
    .order('created_at', { ascending: false });

  let gameStatusRows = [];
  if (profile?.id) {
    const canUseAdminForPublicRead = Boolean(adminSupabase) && viewerUser?.id !== profile.id;
    const statusClient = canUseAdminForPublicRead ? adminSupabase : supabase;

    const { data, error: gameStatusError } = await statusClient
      .from('game_statuses')
      .select('game_id, game_name, game_cover, status, replay_count, updated_at')
      .eq('user_id', profile.id)
      .order('updated_at', { ascending: false });

    if (gameStatusError) {
      console.error('Unable to load public profile game statuses:', gameStatusError.message);
    } else {
      gameStatusRows = data || [];
    }
  }

  const reviewIds = (reviews ?? []).map((review) => review.id);
  let totalLikes = 0;
  const likesByReviewId = {};

  if (reviewIds.length > 0) {
    const { data: likeRows, error: likesError } = await supabase
      .from('review_likes')
      .select('review_id')
      .in('review_id', reviewIds);

    if (likesError) {
      console.error('Unable to load total likes for profile:', likesError.message);
    } else {
      totalLikes = likeRows?.length ?? 0;
      for (const row of likeRows || []) {
        likesByReviewId[row.review_id] = (likesByReviewId[row.review_id] || 0) + 1;
      }
    }
  }

  if (!profile)
    return <p className="pt-32 text-center text-zinc-500 uppercase tracking-widest text-xs">User not found.</p>;

  const isOwnProfile = viewerUser?.id === profile.id;

  const [followStats, initialIsFollowing] = await Promise.all([
    getFollowStats(profile.id),
    !isOwnProfile && viewerUser?.id ? isFollowingUser(viewerUser.id, profile.id) : Promise.resolve(false),
  ]);
  const followersFullLimit = Math.max(FOLLOW_PREVIEW_LIMIT, Math.min(followStats.followersCount, FOLLOW_FULL_LIMIT_CAP));
  const followingFullLimit = Math.max(FOLLOW_PREVIEW_LIMIT, Math.min(followStats.followingCount, FOLLOW_FULL_LIMIT_CAP));
  const [allFollowers, allFollowing] = await Promise.all([
    listFollowers(profile.id, followersFullLimit),
    listFollowing(profile.id, followingFullLimit),
  ]);
  const followers = allFollowers.slice(0, FOLLOW_PREVIEW_LIMIT);
  const following = allFollowing.slice(0, FOLLOW_PREVIEW_LIMIT);
  const [mutualFollowerIds, mutualFollowingIds] = await Promise.all([
    listMutualFollowerIds(profile.id, allFollowers.map((entry) => entry.id)),
    listMutualFollowingIds(profile.id, allFollowing.map((entry) => entry.id)),
  ]);

  const safeStatusRows = gameStatusRows || [];
  const topGames = [profile.top_game_1, profile.top_game_2, profile.top_game_3].filter(Boolean);
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
  const favoriteGames = profile?.id ? await listFavoriteGames(profile.id) : [];

  const totalGamesPlayed = new Set(
    safeStatusRows
      .filter((row) => ['playing', 'finished'].includes(row.status) || (row.replay_count || 0) > 0)
      .map((row) => row.game_id)
  ).size;

  const avatarUrl = profile.avatar_url || profile.avatar || profile.image_url || '';
  const sharpAvatarUrl = avatarUrl
    ? avatarUrl
        .replace(/=s\d+-c$/i, '=s256-c')
        .replace(/=s\d+$/i, '=s256')
    : '';
  const initials = (profile.username || 'U').slice(0, 2).toUpperCase();

  return (
    <>
      <main className="max-w-5xl mx-auto pt-28 px-6 pb-20">
        <div className="mb-14">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="h-[72px] w-[72px] overflow-hidden rounded-full border border-zinc-600 bg-zinc-900 ring-1 ring-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
                {sharpAvatarUrl ? (
                  <img src={sharpAvatarUrl} alt={`${profile.username} avatar`} className="h-full w-full object-cover object-center" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg font-black text-zinc-300">
                    {initials}
                  </div>
                )}
              </div>

              <div>
                <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter text-white">{profile.username}</h1>
                <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest mt-2">
                  {profile.bio || 'No bio yet.'}
                </p>
              </div>
            </div>

            {!isOwnProfile && viewerUser?.id && (
              <FollowButton
                targetUserId={profile.id}
                initiallyFollowing={initialIsFollowing}
                initiallyFollowersCount={followStats.followersCount}
              />
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2">
              <span className="text-xs uppercase tracking-[0.2em] font-black text-zinc-300">
                {followStats.followersCount} followers
              </span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2">
              <span className="text-xs uppercase tracking-[0.2em] font-black text-zinc-300">
                {followStats.followingCount} following
              </span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2">
            <span className="text-xs uppercase tracking-[0.2em] font-black text-zinc-300">
              {totalGamesPlayed} total {totalGamesPlayed === 1 ? 'game played' : 'games played'}
            </span>
            </div>
          </div>
        </div>

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
            emptyText="Not following anyone yet."
            mutualUserIds={mutualFollowingIds}
          />
        </section>

        <section className="mb-16">
          <div className="flex items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-black uppercase tracking-widest text-zinc-400">Top Games</h2>
            {topGames.length === 0 && (
              <span className="text-zinc-600 text-xs uppercase tracking-widest italic">No top games yet.</span>
            )}
          </div>

          {topGames.length > 0 && (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
              {topGames.map((game, index) => (
                <div key={index} className="rounded-3xl border border-zinc-800 overflow-hidden bg-zinc-950 shadow-sm">
                  <GameCard game={game} coverMode="contain" />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mb-16">
          <div className="flex items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-black uppercase tracking-widest text-zinc-400">Game Status</h2>
          </div>
          <ProfileGameStatusSections groupedStatuses={groupedStatuses} />
        </section>

        <ReplayGamesSection replayGames={replayGames} />

        <FavoriteGamesSection favoriteGames={favoriteGames} />

        <section>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <h2 className="text-lg font-black uppercase tracking-widest text-zinc-400">Reviews</h2>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2">
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 text-[#00FF88]"
                  aria-hidden="true"
                  fill="currentColor"
                >
                  <path d="M12 20.4c-.3 0-.6-.1-.8-.3C6.5 16 3.5 13.2 3.5 9.8 3.5 7.1 5.6 5 8.3 5c1.5 0 2.9.7 3.7 1.9C12.8 5.7 14.2 5 15.7 5c2.7 0 4.8 2.1 4.8 4.8 0 3.4-3 6.2-7.7 10.3-.2.2-.5.3-.8.3z" />
                </svg>
                <span className="text-xs uppercase tracking-[0.2em] font-black text-zinc-300">
                  {totalLikes} total {totalLikes === 1 ? 'like' : 'likes'}
                </span>
              </div>

              {reviews.length === 0 && (
                <span className="text-zinc-600 text-xs uppercase tracking-widest italic">No reviews yet.</span>
              )}
            </div>
          </div>
          <div className="space-y-4">
            {reviews.length > 0 && reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                likesCount={likesByReviewId[review.id] || 0}
              />
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
