'use client';

import { useMemo, useState } from 'react';
import GameReviewCard from './GameReviewCard';

const sortOptions = [
  { key: 'recent', label: 'Newest' },
  { key: 'liked', label: 'Most liked' },
  { key: 'friends', label: 'Friends' },
];

export default function GameReviewFeed({ reviews, followingUserIds = [], initialIsGuest = true }) {
  const [sortBy, setSortBy] = useState('recent');
  const isFriendsMode = sortBy === 'friends';

  const sortedReviews = useMemo(() => {
    const baseReviews = isFriendsMode
      ? reviews.filter((review) => review?.user_id && followingUserIds.includes(review.user_id))
      : reviews;

    return [...baseReviews].sort((a, b) => {
      if (sortBy === 'liked') {
        const aLikes = a.like_count ?? 0;
        const bLikes = b.like_count ?? 0;

        if (bLikes !== aLikes) {
          return bLikes - aLikes;
        }
      }

      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [followingUserIds, isFriendsMode, reviews, sortBy]);

  const friendsEmptyMessage = useMemo(() => {
    if (!isFriendsMode || sortedReviews.length > 0) {
      return '';
    }

    if (initialIsGuest) {
      return 'Sign in to filter checkpoints by friends.';
    }

    if ((followingUserIds || []).length === 0) {
      return "You're not following anyone yet.";
    }

    return "People you follow have not posted checkpoints for this game yet.";
  }, [followingUserIds, initialIsGuest, isFriendsMode, sortedReviews.length]);

  if (!reviews.length) {
    return (
      <div className="py-10 text-center border-2 border-dashed border-zinc-900 rounded-3xl">
        <p className="text-zinc-600 font-medium italic">
          No one has reached this checkpoint yet. Be the first to log it!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-zinc-500 text-sm font-medium">
          Showing {sortedReviews.length} checkpoint{sortedReviews.length === 1 ? '' : 's'}
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          <p className="text-zinc-400 text-xs uppercase tracking-[0.2em] font-black">Filter checkpoints</p>
          <div className="flex flex-wrap gap-2">
            {sortOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setSortBy(option.key)}
                className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] transition ${
                  sortBy === option.key
                    ? 'bg-[#00FF88] text-black'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isFriendsMode && sortedReviews.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 px-5 py-10 text-center">
          <p className="text-sm font-medium text-zinc-400">{friendsEmptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-6 max-w-5xl">
          {sortedReviews.map((review) => (
            <GameReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}