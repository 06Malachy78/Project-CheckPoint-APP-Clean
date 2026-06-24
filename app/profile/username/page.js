import { createClient } from '../../../lib/server';
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

  return (
    <main className="max-w-4xl mx-auto pt-32 px-6 pb-20">
      <h1 className="text-4xl font-black mb-2 uppercase tracking-tighter text-white">{profile.username}</h1>
      <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest mb-10">
        {profile.bio || 'No bio yet.'}
      </p>

      <section>
        <h2 className="text-lg font-black mb-6 uppercase tracking-widest text-zinc-400">Reviews</h2>
        <div className="space-y-4">
          {reviews.length > 0 ? (
            reviews.map((review) => <ReviewCard key={review.id} review={review} />)
          ) : (
            <p className="text-zinc-600 text-xs uppercase tracking-widest italic">No reviews yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}