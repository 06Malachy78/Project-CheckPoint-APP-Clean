'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ReviewDetailClient({ review, game, profile }) {
  const [hasLiked, setHasLiked] = useState(false);
  const [likeId, setLikeId] = useState(null);
  const [likeCount, setLikeCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingLikeStatus, setIsLoadingLikeStatus] = useState(true);
  const [userId, setUserId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    const updateLikeStatus = async (user) => {
      if (!mounted) return;

      if (!user) {
        setUserId(null);
        setHasLiked(false);
        setLikeId(null);
        setErrorMessage('Log in to like this review.');
        await refreshLikeCount();
        setIsLoadingLikeStatus(false);
        return;
      }

      setErrorMessage('');
      setUserId(user.id);
      await refreshLikeState(user.id);
      setIsLoadingLikeStatus(false);
    };

    const loadLikeStatus = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Unable to load user session:', error.message);
      }

      await updateLikeStatus(data?.session?.user ?? null);
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      updateLikeStatus(session?.user ?? null);
    });

    loadLikeStatus();

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [review.id]);

  const refreshLikeCount = async () => {
    const { data: _, count, error: countError } = await supabase
      .from('review_likes')
      .select('*', { count: 'exact', head: true })
      .eq('review_id', review.id);

    if (countError) {
      console.error('Unable to refresh review like count:', countError.message);
    } else if (typeof count === 'number') {
      setLikeCount(count);
    }
  };

  const refreshLikeState = async (currentUserId) => {
    await refreshLikeCount();

    if (!currentUserId) {
      setHasLiked(false);
      setLikeId(null);
      return;
    }

    const { data: existingLike, error: existingLikeError } = await supabase
      .from('review_likes')
      .select('id')
      .match({ review_id: review.id, user_id: currentUserId })
      .maybeSingle();

    if (existingLikeError && existingLikeError.code !== 'PGRST116') {
      console.error('Unable to refresh user like status:', existingLikeError.message);
      return;
    }

    setHasLiked(Boolean(existingLike));
    setLikeId(existingLike?.id ?? null);
  };

  const handleUnlike = async () => {
    if (isSaving || !userId || !hasLiked) return;

    setErrorMessage('');
    setIsSaving(true);

    let deleteError = null;

    if (likeId) {
      const { error } = await supabase
        .from('review_likes')
        .delete()
        .eq('id', likeId)
        .eq('user_id', userId);

      deleteError = error;
    }

    if (!likeId || (deleteError && deleteError.code === 'PGRST116')) {
      const { error } = await supabase
        .from('review_likes')
        .delete()
        .eq('review_id', review.id)
        .eq('user_id', userId);

      deleteError = error;
    }

    if (deleteError) {
      const message = deleteError.message || 'Unable to remove your like. Please try again.';
      setErrorMessage(message);
      console.error('Unable to delete like row:', deleteError);
      setIsSaving(false);
      return;
    }

    // Refresh from DB so UI reflects confirmed state.
    await refreshLikeState(userId);
    setIsSaving(false);
  };

  const handleLike = async () => {
    if (isSaving || !userId) return;
    if (hasLiked) {
      await handleUnlike();
      return;
    }

    setErrorMessage('');
    setIsSaving(true);

    const { data: insertedLike, error: likeError } = await supabase
      .from('review_likes')
      .insert([{ review_id: review.id, user_id: userId }])
      .select('id')
      .maybeSingle();

    if (likeError) {
      if (likeError.message?.includes('unique constraint') || likeError.code === '23505') {
        setHasLiked(true);
        await refreshLikeState(userId);
        setIsSaving(false);
        return;
      }

      const message = likeError.message || 'Unable to record your like. Please try again.';
      setErrorMessage(message);
      console.error('Unable to save like row:', likeError);
      setIsSaving(false);
      return;
    }

    setHasLiked(true);
    setLikeId(insertedLike?.id ?? null);
    await refreshLikeState(userId);
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

            <div className="flex items-center justify-between gap-4 relative">
              <div className="min-w-0">
                <h1 className="text-3xl font-black tracking-tight text-zinc-100 break-words leading-tight">
                  {review.game_title}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-zinc-400">
                  <span className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-3 py-1 text-[#00FF88] font-black border border-zinc-800">
                    <span className="text-yellow-400">★</span>
                    {review.rating}/5
                  </span>
                  <span className="uppercase tracking-[0.3em] text-zinc-500">Rated review</span>
                </div>
                <p className="text-zinc-500 text-xs uppercase tracking-[0.3em] mt-2">
                  {new Date(review.created_at).toLocaleDateString('en-GB')}
                </p>
              </div>

              <button
                type="button"
                onClick={hasLiked ? handleUnlike : handleLike}
                disabled={isSaving || isLoadingLikeStatus || !userId}
                className={`absolute right-0 top-0 inline-flex h-11 w-11 items-center justify-center rounded-full border transition ${
                  hasLiked
                    ? 'bg-zinc-950 border-[#00FF88] text-[#00FF88]'
                    : 'bg-zinc-950 border-zinc-700 text-[#00FF88] hover:border-[#00FF88] hover:text-[#00FF88]'
                } ${isSaving || isLoadingLikeStatus ? 'opacity-60 cursor-not-allowed' : ''}`}
                aria-label={hasLiked ? 'Remove like' : 'Like review'}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  aria-hidden="true"
                  fill={hasLiked ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M12 20.4c-.3 0-.6-.1-.8-.3C6.5 16 3.5 13.2 3.5 9.8 3.5 7.1 5.6 5 8.3 5c1.5 0 2.9.7 3.7 1.9C12.8 5.7 14.2 5 15.7 5c2.7 0 4.8 2.1 4.8 4.8 0 3.4-3 6.2-7.7 10.3-.2.2-.5.3-.8.3z" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-3 text-sm text-zinc-400">
              <span className="inline-flex items-center gap-1 text-[#00FF88] font-bold">
                <svg
                  viewBox="0 0 24 24"
                  className="h-3.5 w-3.5"
                  aria-hidden="true"
                  fill="currentColor"
                >
                  <path d="M12 20.4c-.3 0-.6-.1-.8-.3C6.5 16 3.5 13.2 3.5 9.8 3.5 7.1 5.6 5 8.3 5c1.5 0 2.9.7 3.7 1.9C12.8 5.7 14.2 5 15.7 5c2.7 0 4.8 2.1 4.8 4.8 0 3.4-3 6.2-7.7 10.3-.2.2-.5.3-.8.3z" />
                </svg>
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
