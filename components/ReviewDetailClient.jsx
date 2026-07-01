'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ReviewDetailClient({ review, game, profile }) {
  const [hasLiked, setHasLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(review.like_count ?? 0);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingLikeStatus, setIsLoadingLikeStatus] = useState(true);
  const [userId, setUserId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadLikeStatus = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error('Unable to load user session:', userError.message);
        setIsLoadingLikeStatus(false);
        return;
      }

      if (!user) {
        setErrorMessage('Log in to like this review.');
        setIsLoadingLikeStatus(false);
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from('review_likes')
        .select('id')
        .eq('review_id', review.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Unable to load like status:', error.message);
      }

      if (data) {
        setHasLiked(true);
      }

      setIsLoadingLikeStatus(false);
    };

    loadLikeStatus();
  }, [review.id]);

  const handleLike = async () => {
    if (isSaving || !userId || hasLiked) return;

    setErrorMessage('');
    setIsSaving(true);

    const { data: insertedLike, error: likeError } = await supabase
      .from('review_likes')
      .insert([{ review_id: review.id, user_id: userId }])
      .select('id')
      .single();

    if (likeError) {
      const message = likeError.message || 'Unable to record your like. Please try again.';
      setErrorMessage(message);
      console.error('Unable to save like row:', likeError);
      setIsSaving(false);
      return;
    }

    const { error: updateError } = await supabase
      .from('reviews')
      .update({ like_count: likeCount + 1 })
      .eq('id', review.id);

    if (updateError) {
      const message = updateError.message || 'Unable to update like count. Please try again.';
      setErrorMessage(message);
      console.error('Unable to update like count:', updateError);
      await supabase.from('review_likes').delete().eq('id', insertedLike.id);
      setIsSaving(false);
      return;
    }

    setHasLiked(true);
    setLikeCount((count) => count + 1);
    setIsSaving(false);
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

          <div className="flex-1 space-y-4 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 gap-2">
              <span className="text-zinc-400 text-xs uppercase tracking-[0.2em] font-black">{game.name}</span>
              <span className="text-zinc-500">•</span>
              <Link
                href={`/profile/${review.username}`}
                className="inline-flex items-center gap-3 group"
              >
                <span className="flex items-center justify-center w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 text-xs font-bold uppercase text-zinc-100 overflow-hidden">
                  {profile?.avatar_url || profile?.avatar || profile?.image_url ? (
                    <img
                      src={profile.avatar_url || profile.avatar || profile.image_url}
                      alt={`${review.username}'s avatar`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{review.username?.slice(0, 2).toUpperCase()}</span>
                  )}
                </span>
                <span className="text-zinc-300 text-sm font-semibold group-hover:text-[#00FF88]">
                  {review.username}
                </span>
              </Link>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-3xl font-black tracking-tight text-zinc-100 break-words leading-tight">
                  {review.game_title}
                </h1>
                <p className="text-zinc-500 text-xs uppercase tracking-[0.3em] mt-2">
                  {new Date(review.created_at).toLocaleDateString('en-GB')}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 gap-3">
                <span className="inline-flex items-center gap-2 text-[#00FF88] font-black text-xl">
                  <span className="text-yellow-400">★</span>
                  {review.rating}/5
                </span>
                <button
                  type="button"
                  onClick={handleLike}
                  disabled={isSaving || isLoadingLikeStatus || !userId || hasLiked}
                  className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] font-bold transition ${
                    hasLiked ? 'bg-[#00FF88] text-black border-[#00FF88]' : 'border-zinc-700 text-zinc-100 hover:border-[#00FF88] hover:text-[#00FF88]'
                  } ${isSaving || isLoadingLikeStatus ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {hasLiked ? '👍 Liked' : '👍 Like'}
                </button>
              </div>

              {hasLiked && (
                <p className="text-xs text-[#00FF88] uppercase tracking-[0.2em] font-bold">
                  You've already liked this review.
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 text-sm text-zinc-400">
              <span className="inline-flex items-center gap-1 text-[#00FF88] font-bold">
                <span>👍</span>
                {likeCount}
              </span>
              <span>{likeCount === 1 ? 'like' : 'likes'}</span>
            </div>

            {errorMessage && (
              <p className="text-xs text-red-400 uppercase tracking-[0.2em] font-bold mt-2">
                {errorMessage}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
        <h2 className="text-xl font-black tracking-tight text-zinc-100 mb-4">Review</h2>
        <p className="text-zinc-300 leading-8 break-words whitespace-pre-wrap">{review.content}</p>
      </div>
    </div>
  );
}
