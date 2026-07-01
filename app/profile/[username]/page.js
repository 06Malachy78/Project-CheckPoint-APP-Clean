import { createClient } from '../../../lib/server';
import GameCard from '@/components/GameCard';
import ReviewCard from '@/components/ReviewCard';

export default async function UserProfilePage({ params }) {
  const supabase = await createClient();
  const { username } = params;

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

  const reviewIds = (reviews ?? []).map((review) => review.id);
  let totalLikes = 0;

  if (reviewIds.length > 0) {
    const { data: likeRows, error: likesError } = await supabase
      .from('review_likes')
      .select('review_id')
      .in('review_id', reviewIds);

    if (likesError) {
      console.error('Unable to load total likes for profile:', likesError.message);
    } else {
      totalLikes = likeRows?.length ?? 0;
    }
  }

  if (!profile)
    return <p className="pt-32 text-center text-zinc-500 uppercase tracking-widest text-xs">User not found.</p>;

  const topGames = [profile.top_game_1, profile.top_game_2, profile.top_game_3].filter(Boolean);

  return (
    <>
      <main className="max-w-5xl mx-auto pt-28 px-6 pb-20">
        <div className="mb-14">
          <h1 className="text-5xl font-black mb-3 uppercase tracking-tighter text-white">{profile.username}</h1>
          <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest mb-4">
            {profile.bio || 'No bio yet.'}
          </p>
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
        </div>

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

        <section>
          <div className="flex items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-black uppercase tracking-widest text-zinc-400">Reviews</h2>
            {reviews.length === 0 && (
              <span className="text-zinc-600 text-xs uppercase tracking-widest italic">No reviews yet.</span>
            )}
          </div>
          <div className="space-y-4">
            {reviews.length > 0 && reviews.map((review) => <ReviewCard key={review.id} review={review} />)}
          </div>
        </section>
      </main>
    </>
  );
}
