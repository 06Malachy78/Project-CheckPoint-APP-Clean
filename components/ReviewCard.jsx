'use client';

import Link from 'next/link';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ReviewCard({ review, showActions = false }) {
  const [expanded, setExpanded] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(review.content || '');
  const [editedRating, setEditedRating] = useState(review.rating || 0);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const isLongReview = (review.content || '').length > 220;

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const confirmed = window.confirm('Delete this review? This cannot be undone.');
    if (!confirmed) return;

    setErrorMessage('');
    setIsDeleting(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setErrorMessage('Unable to confirm your session. Please sign in again.');
      setIsDeleting(false);
      return;
    }

    if (user.id !== review.user_id) {
      setErrorMessage('You can only delete your own reviews.');
      setIsDeleting(false);
      return;
    }

    const { error: deleteLikesError } = await supabase
      .from('review_likes')
      .delete()
      .eq('review_id', review.id);

    if (deleteLikesError) {
      setErrorMessage(deleteLikesError.message || 'Unable to delete related like records. Please try again.');
      setIsDeleting(false);
      return;
    }

    const { error: reviewError } = await supabase.from('reviews').delete().eq('id', review.id);

    if (reviewError) {
      setErrorMessage(reviewError.message || 'Unable to delete review.');
      setIsDeleting(false);
      return;
    }

    setIsDeleted(true);
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    setErrorMessage('');
    setIsSavingEdit(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setErrorMessage('Unable to confirm your session. Please sign in again.');
      setIsSavingEdit(false);
      return;
    }

    if (user.id !== review.user_id) {
      setErrorMessage('You can only edit your own reviews.');
      setIsSavingEdit(false);
      return;
    }

    const { error: reviewError } = await supabase
      .from('reviews')
      .update({ content: editedContent, rating: editedRating })
      .eq('id', review.id);

    if (reviewError) {
      setErrorMessage(reviewError.message || 'Unable to save changes.');
      setIsSavingEdit(false);
      return;
    }

    setIsEditing(false);
    setIsMenuOpen(false);
    setIsSavingEdit(false);
  };

  if (isDeleted) return null;

  return (
    <div className="relative group">
      {showActions && (
        <div className="absolute right-3 top-3 z-10">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsMenuOpen((current) => !current);
            }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-950 border border-zinc-800 text-zinc-300 hover:text-white transition"
          >
            ⋯
          </button>

          {isMenuOpen && (
            <div className="mt-2 w-40 rounded-2xl border border-zinc-800 bg-zinc-950 p-1 shadow-xl shadow-black/30">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsEditing(true);
                  setIsMenuOpen(false);
                }}
                className="w-full text-left rounded-xl px-3 py-2 text-xs uppercase tracking-[0.2em] font-bold text-zinc-100 hover:bg-zinc-900"
              >
                Edit review
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full text-left rounded-xl px-3 py-2 text-xs uppercase tracking-[0.2em] font-bold text-red-400 hover:bg-zinc-900 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting…' : 'Delete review'}
              </button>
            </div>
          )}
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleEditSave} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl transition-all duration-200">
          <div className="flex flex-col gap-4">
            <label className="text-xs uppercase tracking-[0.3em] text-zinc-500 font-black">
              Edit review
            </label>
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              rows={5}
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white focus:border-[#00FF88]/70 focus:outline-none"
            />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <label className="text-xs uppercase tracking-[0.3em] text-zinc-500 font-black">
                  Rating
                </label>
                <select
                  value={editedRating}
                  onChange={(e) => setEditedRating(Number(e.target.value))}
                  className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-[#00FF88]/70 focus:outline-none"
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsEditing(false);
                    setIsMenuOpen(false);
                    setEditedContent(review.content || '');
                    setEditedRating(review.rating || 0);
                    setErrorMessage('');
                  }}
                  className="rounded-full border border-zinc-700 px-4 py-2 text-xs uppercase tracking-[0.2em] font-bold text-zinc-100 hover:border-[#00FF88] hover:text-[#00FF88]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="rounded-full bg-[#00FF88] px-4 py-2 text-xs uppercase tracking-[0.2em] font-bold text-black disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSavingEdit ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
            {errorMessage && (
              <p className="text-xs text-red-400 uppercase tracking-[0.2em] font-bold">
                {errorMessage}
              </p>
            )}
          </div>
        </form>
      ) : (
        <Link href={`/review/${review.id}`} className="block transition-all duration-200 hover:opacity-90">
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl transition-all duration-200 hover:border-[#00FF88]/50 hover:shadow-[0_0_0_1px_rgba(0,255,136,0.22)]">
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
                  e.stopPropagation();
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
      )}

      {errorMessage && (
        <p className="text-xs text-red-400 mt-2 uppercase tracking-[0.2em] font-bold">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
