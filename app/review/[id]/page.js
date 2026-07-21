import { createClient } from '@/lib/server';
import ReviewDetailClient from '@/components/ReviewDetailClient';
import { fetchGameData } from '@/lib/igdb';

function trimDescription(text, fallback) {
  const cleaned = (text || fallback || '').replace(/\s+/g, ' ').trim();
  return cleaned.length > 160 ? `${cleaned.slice(0, 157)}...` : cleaned;
}

function buildAbsoluteCoverUrl(coverUrl) {
  if (!coverUrl) return '';

  const upgradedCover = coverUrl.replace('t_thumb', 't_cover_big');
  return upgradedCover.startsWith('//') ? `https:${upgradedCover}` : upgradedCover;
}

export async function generateMetadata({ params }) {
  const { id } = params;
  const supabase = await createClient();

  const { data: review } = await supabase
    .from('reviews')
    .select('id, username, game_id, game_title, rating, content')
    .eq('id', id)
    .maybeSingle();

  if (!review) {
    return {
      title: 'Review Not Found',
      description: 'This review could not be found on Checkpoint Hub.',
      alternates: {
        canonical: `/review/${id}`,
      },
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const game = review.game_id ? await fetchGameData(review.game_id) : null;
  const coverUrl = buildAbsoluteCoverUrl(game?.cover?.url || '');
  const description = trimDescription(
    review.content,
    `${review.username} rated ${review.game_title} ${review.rating}/5 on Checkpoint Hub.`
  );
  const reviewUrl = `https://checkpoint-hub.com/review/${id}`;
  const title = `${review.game_title} Review by ${review.username}`;

  return {
    title,
    description,
    alternates: {
      canonical: `/review/${id}`,
    },
    openGraph: {
      title: `${title} | Checkpoint Hub`,
      description,
      url: reviewUrl,
      type: 'article',
      images: coverUrl
        ? [
            {
              url: coverUrl,
              alt: `${review.game_title} cover art`,
            },
          ]
        : undefined,
    },
    twitter: {
      card: coverUrl ? 'summary_large_image' : 'summary',
      title: `${title} | Checkpoint Hub`,
      description,
      images: coverUrl ? [coverUrl] : undefined,
    },
  };
}

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
