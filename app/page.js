import { createClient } from '../lib/server';
import { fetchGameData } from '../lib/igdb';
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
        .select('id, created_at, username, rating, content, game_id, game_title, cover_url')
        .order('created_at', { ascending: false })
        .limit(10)
      )?.data ?? [];

  let feedLikeCounts = {};

  if (!isGuest && rawFeedItems.length > 0) {
    const reviewIds = rawFeedItems.map((review) => review.id);

    const { data: likeRows, error: likesError } = await supabase
      .from('review_likes')
      .select('review_id')
      .in('review_id', reviewIds);

    if (likesError) {
      console.error('Unable to load dashboard like counts:', likesError.message);
    } else {
      feedLikeCounts = (likeRows ?? []).reduce((acc, row) => {
        acc[row.review_id] = (acc[row.review_id] ?? 0) + 1;
        return acc;
      }, {});
    }
  }

  const feedItems = isGuest
    ? []
    : rawFeedItems.map((review) => {
        const coverUrl = review.cover_url?.startsWith('//')
          ? `https:${review.cover_url}`
          : review.cover_url;

        const calculatedLikeCount = feedLikeCounts[review.id] ?? 0;

        return {
          ...review,
          like_count: calculatedLikeCount,
          gameData: {
            name: review.game_title || 'Untitled Game',
            cover: {
              url: coverUrl || 'https://via.placeholder.com/640x360?text=No+Cover',
            },
          },
        };
      });

  const { data: reviewRows } = await supabase
    .from('reviews')
    .select('game_id, game_title, cover_url');

  const reviewGames = (reviewRows ?? []).reduce((acc, review) => {
    const key = review.game_id || review.game_title || review.cover_url;
    if (!key) return acc;

    if (!acc[key]) {
      acc[key] = {
        game_id: review.game_id,
        name: review.game_title || 'Untitled Game',
        coverUrl: review.cover_url,
        count: 0,
      };
    }

    acc[key].count += 1;
    return acc;
  }, {});

  const topReviewedGames = await Promise.all(
    Object.values(reviewGames)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(async (game) => {
        let summary = '';
        let coverUrl = game.coverUrl;

        if (game.game_id) {
          const gameData = await fetchGameData(game.game_id);
          if (gameData) {
            summary = gameData.summary || summary;
            if (!coverUrl && gameData.cover?.url) {
              coverUrl = gameData.cover.url.replace('t_thumb', 't_cover_big');
            }
          }
        }

        if (coverUrl?.startsWith('//')) {
          coverUrl = `https:${coverUrl}`;
        }

        return {
          id: game.game_id,
          name: game.name,
          summary,
          cover: { url: coverUrl || 'https://via.placeholder.com/640x360?text=No+Cover' },
        };
      })
  );

  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      <div className="max-w-6xl mx-auto pt-36 sm:pt-32 px-4 sm:px-6 pb-16 sm:pb-20">
        <HomeContent
          initialFeedItems={feedItems}
          totalCheckpoints={totalCheckpoints || 0}
          initialIsGuest={isGuest}
          trendingGames={topReviewedGames}
        />
      </div>
    </main>
  );
}