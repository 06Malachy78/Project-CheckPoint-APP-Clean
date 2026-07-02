import { createClient } from '@/lib/server';
import ReviewDetailClient from '@/components/ReviewDetailClient';
import { fetchGameData } from '@/lib/igdb';

export default async function ReviewDetailPage({ params }) {
  const { id } = params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: review } = await supabase
    .from('reviews')
    .select('*')
    .eq('id', id)
    .single();

  if (!review) {
    return (
      <main className="min-h-screen bg-[#09090b] text-white">
        <div className="max-w-4xl mx-auto pt-32 px-6 pb-20">
          <div className="text-center text-zinc-400">Review not found.</div>
        </div>
      </main>
    );
  }

  const game = review.game_id ? await fetchGameData(review.game_id) : null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', review.username)
    .maybeSingle();

  const isOwnReview = Boolean(user?.id && review.user_id && user.id === review.user_id);

  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      <div className="max-w-6xl mx-auto pt-32 px-6 pb-20">
        <div className="mb-8">
          <a href="/" className="text-[#00FF88] text-xs uppercase tracking-[0.3em] font-black hover:opacity-80">
            ← Back to dashboard
          </a>
        </div>

        <ReviewDetailClient
          review={review}
          game={game || { name: review.game_title, cover: { url: '' } }}
          profile={profile}
          isOwnReview={isOwnReview}
        />
      </div>
    </main>
  );
}
