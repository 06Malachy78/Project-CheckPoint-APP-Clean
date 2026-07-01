'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ReviewDetailClient({ review, game }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(review.like_count ?? 0);
  const [isSaving, setIsSaving] = useState(false);

  const toggleLike = async () => {
    if (isSaving) return;

    const previousLiked = liked;
    const previousCount = likeCount;
    const nextLiked = !previousLiked;
    const nextCount = nextLiked ? previousCount + 1 : Math.max(previousCount - 1, 0);

    setLiked(nextLiked);
    setLikeCount(nextCount);
    setIsSaving(true);

    const { error } = await supabase
      .from('reviews')
      .update({ like_count: nextCount })
      .eq('id', review.id);

    setIsSaving(false);

    if (error) {
      setLiked(previousLiked);
      setLikeCount(previousCount);
      console.error('Unable to save like:', error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <div className="w-full md:w-60 flex-shrink-0 rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-950">
            <img
              src={game.cover?.url?.replace('t_thumb', 't_cover_big')}
              alt={game.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-zinc-400 text-xs uppercase tracking-[0.2em] font-black">
              <span>{game.name}</span>
              <span>•</span>
              <span>{review.username}</span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-zinc-100">
                  {review.game_title}
                </h1>
                <p className="text-zinc-500 text-xs uppercase tracking-[0.3em] mt-2">
                  {new Date(review.created_at).toLocaleDateString('en-GB')}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[#00FF88] font-black text-xl">{review.rating}/10</span>
                <button
                  type="button"
                  onClick={toggleLike}
                  disabled={isSaving}
                  className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] font-bold transition ${
                    liked ? 'bg-[#00FF88] text-black border-[#00FF88]' : 'border-zinc-700 text-zinc-100 hover:border-[#00FF88] hover:text-[#00FF88]'
                  } ${isSaving ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {liked ? 'Liked' : 'Like'}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm text-zinc-400">
              <span className="text-[#00FF88] font-bold">{likeCount}</span>
              <span>{likeCount === 1 ? 'like' : 'likes'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
        <h2 className="text-xl font-black tracking-tight text-zinc-100 mb-4">Review</h2>
        <p className="text-zinc-300 leading-8 whitespace-pre-wrap">{review.content}</p>
      </div>
    </div>
  );
}
