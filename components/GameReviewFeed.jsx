'use client';

import { useMemo, useState } from 'react';
import GameReviewCard from './GameReviewCard';

const sortOptions = [
  { key: 'recent', label: 'Newest' },
  { key: 'liked', label: 'Most liked' },
];

export default function GameReviewFeed({ reviews }) {
  const [sortBy, setSortBy] = useState('recent');

  const sortedReviews = useMemo(() => {
    return [...reviews].sort((a, b) => {
      if (sortBy === 'liked') {
        const aLikes = a.like_count ?? 0;
        const bLikes = b.like_count ?? 0;

        if (bLikes !== aLikes) {
          return bLikes - aLikes;
        }
      }

      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [reviews, sortBy]);

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

      <div className="space-y-6 max-w-5xl">
        {sortedReviews.map((review) => (
          <GameReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
}