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
