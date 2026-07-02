'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

const sortOptions = [
  { key: 'recent', label: 'Newest' },
  { key: 'liked', label: 'Most liked' },
];

export default function GlobalActivityFeed({ feedItems }) {
  const [sortBy, setSortBy] = useState('recent');

  const sortedItems = useMemo(() => {
    return [...feedItems].sort((a, b) => {
      if (sortBy === 'liked') {
        const aLikes = a.like_count ?? 0;
        const bLikes = b.like_count ?? 0;
        if (bLikes !== aLikes) return bLikes - aLikes;
      }
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [feedItems, sortBy]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <p className="text-zinc-400 text-sm uppercase tracking-[0.12em] sm:tracking-[0.2em] font-black">Sort by</p>
          <div className="flex flex-wrap gap-2">
            {sortOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setSortBy(option.key)}
                className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.1em] sm:tracking-[0.18em] transition ${
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

        <div className="text-zinc-500 text-sm font-medium">
          Showing {sortedItems.length} checkpoint{sortedItems.length === 1 ? '' : 's'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sortedItems.map((item) => (
          <Link
            href={`/review/${item.id}`}
            key={item.id}
            className="group bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-5 hover:bg-zinc-800/60 transition-all duration-300 hover:border-[#00FF88]/30 hover:shadow-[0_0_30px_rgba(0,255,136,0.05)]"
          >
            <div className="w-full sm:w-24 h-48 sm:h-32 flex-shrink-0 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
              <img
                src={item.gameData?.cover?.url?.replace('t_thumb', 't_cover_big')}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                alt={item.gameData?.name}
              />
            </div>

            <div className="flex flex-col justify-between py-1 min-w-0">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2 text-xs uppercase tracking-[0.18em] text-zinc-400 font-black">
                  <span className="text-[#00FF88] truncate">{item.username}</span>
                  <span className="text-zinc-700">•</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-zinc-900 border border-zinc-800 px-2 py-1 text-[10px] font-semibold text-zinc-300">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-3.5 w-3.5 text-[#00FF88]"
                      aria-hidden="true"
                      fill="currentColor"
                    >
                      <path d="M12 20.4c-.3 0-.6-.1-.8-.3C6.5 16 3.5 13.2 3.5 9.8 3.5 7.1 5.6 5 8.3 5c1.5 0 2.9.7 3.7 1.9C12.8 5.7 14.2 5 15.7 5c2.7 0 4.8 2.1 4.8 4.8 0 3.4-3 6.2-7.7 10.3-.2.2-.5.3-.8.3z" />
                    </svg>
                    {item.like_count ?? 0}
                  </span>
                  {typeof item.rating === 'number' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-900 border border-zinc-800 px-2 py-1 text-[10px] font-semibold text-zinc-300">
                      <span className="text-yellow-400">★</span>
                      {item.rating}/5
                    </span>
                  )}
                </div>

                <h2 className="text-lg font-bold text-zinc-100 group-hover:text-[#00FF88] transition-colors line-clamp-1 truncate">
                  {item.gameData?.name}
                </h2>
                <p className="text-zinc-400 text-sm line-clamp-2 italic mt-2 leading-relaxed break-words whitespace-pre-wrap">
                  "{item.content}"
                </p>
              </div>

              <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-black mt-4">
                {new Date(item.created_at).toLocaleDateString('en-GB', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
