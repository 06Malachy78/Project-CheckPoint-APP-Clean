'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { parseApiResponse } from '@/lib/api-client';

export default function ReviewCard({ review, showActions = false, likesCount = null }) {
  const router = useRouter();
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

    const response = await fetch(`/api/reviews/${review.id}`, {
      method: 'DELETE',
    });

    const result = await parseApiResponse(response);

    if (!response.ok) {
      setErrorMessage(result.error || 'Unable to delete review.');
      setIsDeleting(false);
      return;
    }

    setIsDeleted(true);
    router.refresh();
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    setErrorMessage('');
    setIsSavingEdit(true);

    const response = await fetch(`/api/reviews/${review.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: editedContent,
        rating: editedRating,
      }),
    });

    const result = await parseApiResponse(response);

    if (!response.ok) {
      setErrorMessage(result.error || 'Unable to save changes.');
      setIsSavingEdit(false);
      return;
    }

    setIsEditing(false);
    setIsMenuOpen(false);
    setIsSavingEdit(false);
    router.refresh();
  };

  if (isDeleted) return null;

  return (
    <div className="relative group">
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
            <div className="mb-2 flex items-start justify-between gap-3">
              <div className="min-w-0 flex flex-col items-start gap-1.5 pr-1 sm:flex-row sm:items-center sm:gap-3">
                <h3 className="font-bold text-white uppercase tracking-tighter text-sm break-words sm:truncate">
                  {review.game_title}
                </h3>
                <span className="inline-flex items-center gap-1.5 text-[#00FF88] font-black text-xs sm:shrink-0">
                  <span className="text-yellow-400">★</span>
                  {review.rating} / 5
                </span>
                {typeof likesCount === 'number' && (
                  <span className="inline-flex items-center gap-1 text-zinc-400 font-bold text-xs sm:shrink-0">
                    <span className="text-[#00FF88]">❤</span>
                    {likesCount}
                  </span>
                )}
              </div>

              {showActions && (
                <div className="flex items-center gap-2 shrink-0">
                  <div
                    className={`overflow-hidden transition-all duration-200 ease-out ${isMenuOpen ? 'max-w-44 opacity-100' : 'max-w-0 opacity-0 pointer-events-none'}`}
                    aria-hidden={!isMenuOpen}
                  >
                    <div className="inline-flex items-center gap-1 rounded-2xl border border-zinc-800 bg-zinc-950 p-1 shadow-xl shadow-black/30">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsEditing(true);
                          setIsMenuOpen(false);
                        }}
                        className="rounded-xl px-3 py-2 text-xs uppercase tracking-[0.16em] font-bold text-zinc-100 hover:bg-zinc-900 whitespace-nowrap"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="rounded-xl px-3 py-2 text-xs uppercase tracking-[0.16em] font-bold text-red-400 hover:bg-zinc-900 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {isDeleting ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsMenuOpen((current) => !current);
                    }}
                    aria-expanded={isMenuOpen}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-950 border border-zinc-800 text-zinc-300 hover:text-white transition"
                  >
                    ⋯
                  </button>
                </div>
              )}
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
