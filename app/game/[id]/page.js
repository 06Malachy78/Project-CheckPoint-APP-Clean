import { fetchGameData } from '../../../lib/igdb';
import { createClient } from '../../../lib/server';
import GamePageClient from './GamePageClient';
import GameReviewFeed from '../../../components/GameReviewFeed';
import GameCoverCard from '../../../components/GameCoverCard';
import { isGameFavorited } from '@/lib/favorites';

function buildAbsoluteCoverUrl(coverUrl) {
  if (!coverUrl) return '';

  const upgradedCover = coverUrl.replace('t_thumb', 't_cover_big');
  return upgradedCover.startsWith('//') ? `https:${upgradedCover}` : upgradedCover;
}

function trimDescription(text, fallback) {
  const source = (text || fallback || '').trim();
  return source.length > 160 ? `${source.slice(0, 157)}...` : source;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const game = await fetchGameData(id);

  if (!game) {
    return {
      title: 'Game Not Found',
      description: 'This game page could not be found on Checkpoint Hub.',
      alternates: {
        canonical: `/game/${id}`,
      },
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const releaseYear = game.first_release_date
    ? new Date(game.first_release_date * 1000).getFullYear()
    : null;
  const description = trimDescription(
    game.summary,
    `Explore ${game.name}${releaseYear ? ` (${releaseYear})` : ''} on Checkpoint Hub and read player reviews.`
  );
  const coverUrl = buildAbsoluteCoverUrl(game.cover?.url || '');
  const gameUrl = `https://checkpoint-hub.com/game/${id}`;

  return {
    title: game.name,
    description,
    alternates: {
      canonical: `/game/${id}`,
    },
    openGraph: {
      title: `${game.name} | Checkpoint Hub`,
      description,
      url: gameUrl,
      type: 'article',
      images: coverUrl
        ? [
            {
              url: coverUrl,
              alt: `${game.name} cover art`,
            },
          ]
        : undefined,
    },
    twitter: {
      card: coverUrl ? 'summary_large_image' : 'summary',
      title: `${game.name} | Checkpoint Hub`,
      description,
      images: coverUrl ? [coverUrl] : undefined,
    },
  };
}


export default async function GamePage({ params }) {
  const { id } = await params;
  const game = await fetchGameData(id);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialStatus = null;
  let initialReplayCount = 0;
  let initialIsFavorite = false;
  let followingUserIds = [];

  if (user) {
    const { data: statusRow, error: statusError } = await supabase
      .from('game_statuses')
      .select('status, replay_count')
      .eq('user_id', user.id)
      .eq('game_id', id.toString())
      .maybeSingle();

    if (statusError) {
      console.error('Unable to load game status:', statusError.message);
    } else {
      initialStatus = statusRow?.status ?? null;
      initialReplayCount = typeof statusRow?.replay_count === 'number' ? statusRow.replay_count : 0;
    }

    initialIsFavorite = await isGameFavorited(user.id, id.toString());

    const { data: followingRows, error: followingError } = await supabase
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', user.id);

    if (followingError) {
      console.error('Unable to load following ids for game feed filter:', followingError.message);
    } else {
      followingUserIds = (followingRows || []).map((row) => row.following_id).filter(Boolean);
    }
  }

  // 2. Fetch reviews for this specific game ID from Supabaseee
  const { data: rawReviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('game_id', id.toString())
    .order('created_at', { ascending: false });

  let avatarByUserId = {};
  let avatarByUsername = {};
  if ((rawReviews ?? []).length > 0) {
    const reviewerIds = Array.from(
      new Set(
        (rawReviews || [])
          .map((review) => review.user_id)
          .filter(Boolean)
      )
    );

    const usernames = Array.from(
      new Set(
        (rawReviews || [])
          .map((review) => review.username)
          .filter(Boolean)
      )
    );

    if (reviewerIds.length > 0) {
      const { data: profileRows, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', reviewerIds);

      if (profileError) {
        console.error('Unable to load reviewer avatars:', profileError.message);
      } else {
        const reduced = (profileRows || []).reduce(
          (acc, row) => {
            const avatar = row.avatar_url || '';
            if (row.id) {
              acc.byUserId[row.id] = avatar;
            }

            const usernameKey = (row.username || '').toLowerCase();
            if (usernameKey) {
              acc.byUsername[usernameKey] = avatar;
            }

            return acc;
          },
          { byUserId: {}, byUsername: {} }
        );

        avatarByUserId = reduced.byUserId;
        avatarByUsername = reduced.byUsername;
      }
    } else if (usernames.length > 0) {
      const { data: profileRows, error: profileError } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .in('username', usernames);

      if (profileError) {
        console.error('Unable to load reviewer avatars:', profileError.message);
      } else {
        avatarByUsername = (profileRows || []).reduce((acc, row) => {
          const key = (row.username || '').toLowerCase();
          if (key) {
            acc[key] = row.avatar_url || '';
          }
          return acc;
        }, {});
      }
    }
  }

  let reviewLikeCounts = {};

  if ((rawReviews ?? []).length > 0) {
    const reviewIds = rawReviews.map((review) => review.id);

    const { data: likeRows, error: likesError } = await supabase
      .from('review_likes')
      .select('review_id')
      .in('review_id', reviewIds);

    if (likesError) {
      console.error('Unable to load game page like counts:', likesError.message);
    } else {
      reviewLikeCounts = (likeRows ?? []).reduce((acc, row) => {
        acc[row.review_id] = (acc[row.review_id] ?? 0) + 1;
        return acc;
      }, {});
    }
  }

  const reviews = (rawReviews ?? []).map((review) => ({
    ...review,
    like_count: reviewLikeCounts[review.id] ?? 0,
    avatar_url:
      avatarByUserId[review.user_id] ||
      avatarByUsername[(review.username || '').toLowerCase()] ||
      review.avatar_url ||
      '',
  }));

  if (!game) return <div className="text-white p-20">Game not found</div>;

  const finalCover = buildAbsoluteCoverUrl(game.cover?.url || '');

  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#00FF88]/10 to-transparent -z-10" />

      <div className="max-w-6xl mx-auto pt-36 sm:pt-32 px-4 sm:px-6 pb-16 sm:pb-20">
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-12 items-start">
          
          {/* Left Column: Game Poster */}
          <div className="w-full md:sticky md:top-32">
            <GameCoverCard src={finalCover} alt={game.name} />
          </div>

          {/* Right Column: Game Details */}
          <div className="space-y-8">
            <header>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter mb-2 leading-tight break-words">
                {game.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-zinc-500 font-bold text-sm tracking-[0.12em] sm:tracking-widest uppercase">
                <span>{new Date(game.first_release_date * 1000).getFullYear()}</span>
                <span>•</span>
                <span className="text-[#00FF88]">Checkpoint Verified</span>
              </div>
            </header>

            <div className="py-2">
              <GamePageClient game={game} initialStatus={initialStatus} initialReplayCount={initialReplayCount} initialIsFavorite={initialIsFavorite} />
            </div>

            <div className="border-t border-zinc-800 pt-8">
              <h3 className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-black mb-4">
                About this game
              </h3>
              <p className="text-zinc-400 text-lg leading-relaxed max-w-3xl">
                {game.summary || "No description available for this checkpoint."}
              </p>
            </div>

            {/* 3. New Reviews Section */}
            <div className="border-t border-zinc-800 pt-12 mt-12">
              <h3 className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-black mb-8">
                Recent Checkpoints
              </h3>
              
              <GameReviewFeed reviews={reviews} followingUserIds={followingUserIds} initialIsGuest={!user} />
            </div>
            {/* End Reviews Section */}
            
          </div>
        </div>
      </div>
    </main>
  );
}