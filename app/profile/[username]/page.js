import Navbar from '@/components/Navbar';
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

  if (!profile)
    return <p className="pt-32 text-center text-zinc-500 uppercase tracking-widest text-xs">User not found.</p>;

  const topGames = [profile.top_game_1, profile.top_game_2, profile.top_game_3].filter(Boolean);

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto pt-28 px-6 pb-20">
        <div className="mb-14">
          <h1 className="text-5xl font-black mb-3 uppercase tracking-tighter text-white">{profile.username}</h1>
          <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest mb-4">
            {profile.bio || 'No bio yet.'}
          </p>
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
