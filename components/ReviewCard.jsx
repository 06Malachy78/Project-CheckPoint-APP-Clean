'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function ReviewCard({ review }) {
  const [expanded, setExpanded] = useState(false);
  const isLongReview = review.content?.length > 220;

  return (
    <Link href={`/review/${review.id}`} className="block hover:opacity-80 transition">
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
        <div className="flex justify-between items-start mb-2 gap-4">
          <div className="min-w-0">
            <h3 className="font-bold text-white uppercase tracking-tighter text-sm truncate">
              {review.game_title}
            </h3>
          </div>
          <span className="inline-flex items-center gap-2 text-[#00FF88] font-black text-xs">
            <span className="text-yellow-400">★</span>
            {review.rating} / 5
          </span>
        </div>

        <p className={`text-zinc-400 text-sm italic leading-6 transition-all duration-200 break-words ${expanded ? '' : 'line-clamp-3'}`}>
          "{review.content}"
        </p>

        {isLongReview && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setExpanded((current) => !current);
            }}
            className="mt-3 text-xs uppercase tracking-widest text-[#00FF88] font-semibold hover:text-[#7CFFB8]"
          >
            {expanded ? 'Show less' : 'Read full review'}
          </button>
        )}

        <p className="text-[10px] text-zinc-600 mt-2 uppercase tracking-widest">
          {new Date(review.created_at).toLocaleDateString('en-GB')}
        </p>
      </div>
    </Link>
  );
}