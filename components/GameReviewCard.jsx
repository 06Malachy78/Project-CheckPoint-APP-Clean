'use client';

import Link from 'next/link';

export default function GameReviewCard({ review }) {
  return (
    <Link href={`/review/${review.id}`} className="block hover:opacity-80 transition">
      <div className="bg-zinc-900/40 border border-zinc-800/50 p-6 rounded-2xl backdrop-blur-sm h-[260px] overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#00FF88]/20 flex items-center justify-center text-[#00FF88] text-xs font-bold border border-[#00FF88]/30">
              {review.username?.charAt(0) || 'U'}
            </div>
            <span className="text-zinc-100 font-bold truncate">{review.username}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-950 border border-zinc-800 px-2 py-1 text-[10px] font-semibold text-zinc-300">
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5 text-[#00FF88]"
                aria-hidden="true"
                fill="currentColor"
              >
                <path d="M12 20.4c-.3 0-.6-.1-.8-.3C6.5 16 3.5 13.2 3.5 9.8 3.5 7.1 5.6 5 8.3 5c1.5 0 2.9.7 3.7 1.9C12.8 5.7 14.2 5 15.7 5c2.7 0 4.8 2.1 4.8 4.8 0 3.4-3 6.2-7.7 10.3-.2.2-.5.3-.8.3z" />
              </svg>
              {review.like_count ?? 0}
            </span>
          </div>

          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <span key={i} className={i < review.rating ? 'text-yellow-500' : 'text-zinc-700'}>
                ★
              </span>
            ))}
          </div>
        </div>

        <div className="text-zinc-400 leading-relaxed break-words whitespace-pre-wrap text-sm overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical' }}>
          {review.content}
        </div>

        <div className="mt-4 text-[10px] uppercase tracking-widest text-zinc-600 font-bold">
          Logged on {new Date(review.created_at).toLocaleDateString('en-GB')}
        </div>
      </div>
    </Link>
  );
}
