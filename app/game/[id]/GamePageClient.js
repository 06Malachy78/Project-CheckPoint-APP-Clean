"use client";
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import LogModal from '../../../components/LogModal';
import AuthModal from '../../../components/AuthModal';
import { parseApiResponse } from '@/lib/api-client';

const STATUS_OPTIONS = [
  { value: 'backlog', label: 'Wishlist' },
  { value: 'playing', label: 'Playing' },
  { value: 'finished', label: 'Finished' },
];

export default function GamePageClient({ game, initialStatus = null, initialReplayCount = 0, initialIsFavorite = false }) {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isAuthOpen, setAuthOpen] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [replayCount, setReplayCount] = useState(initialReplayCount);
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [isSavingReplay, setIsSavingReplay] = useState(false);
  const [isSavingFavorite, setIsSavingFavorite] = useState(false);
  const [showFavoriteToast, setShowFavoriteToast] = useState(false);

  const handleOpenLog = useCallback(async () => {
    setIsCheckingAuth(true);
    const { data: { user }, error } = await supabase.auth.getUser();
    setIsCheckingAuth(false);

    if (error) {
      console.warn('Auth check failed, opening signup for guest:', error);
      setAuthMode('signup');
      setAuthOpen(true);
      return;
    }

    if (!user) {
      setAuthMode('signup');
      setAuthOpen(true);
      return;
    }

    setModalOpen(true);
  }, []);

  const handleLoginSuccess = useCallback(() => {
    setAuthOpen(false);
    setModalOpen(true);
  }, []);

  const handleSetStatus = useCallback(async (statusValue) => {
    if (isSavingStatus) return;

    setIsSavingStatus(true);

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      setIsSavingStatus(false);
      setAuthMode('signup');
      setAuthOpen(true);
      return;
    }

    const response = await fetch('/api/profile/game-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: statusValue,
        game: {
          id: game.id,
          name: game.name,
          cover: game.cover ?? null,
        },
      }),
    });

    const result = await parseApiResponse(response);

    if (!response.ok) {
      alert(result.error || 'Unable to update your game status.');
    } else {
      setSelectedStatus(result.status ?? null);
    }

    setIsSavingStatus(false);
  }, [game.cover, game.id, game.name, isSavingStatus]);

  const handleReplayChange = useCallback(async (nextReplayCount) => {
    if (isSavingReplay || nextReplayCount < 0) return;

    setIsSavingReplay(true);

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      setIsSavingReplay(false);
      setAuthMode('signup');
      setAuthOpen(true);
      return;
    }

    const response = await fetch('/api/profile/game-replay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        replayCount: nextReplayCount,
        game: {
          id: game.id,
          name: game.name,
          cover: game.cover ?? null,
        },
      }),
    });

    const result = await parseApiResponse(response);

    if (!response.ok) {
      alert(result.error || 'Unable to update replay tracking.');
    } else {
      setReplayCount(result.replayCount ?? nextReplayCount);
    }

    setIsSavingReplay(false);
  }, [game.cover, game.id, game.name, isSavingReplay]);

  const handleToggleFavorite = useCallback(async () => {
    if (isSavingFavorite) return;

    setIsSavingFavorite(true);

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      setIsSavingFavorite(false);
      setAuthMode('signup');
      setAuthOpen(true);
      return;
    }

    const nextFavorite = !isFavorite;

    const response = await fetch('/api/profile/favorites', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        isFavorite: nextFavorite,
        game: {
          id: game.id,
          name: game.name,
          cover: game.cover ?? null,
        },
      }),
    });

    const result = await parseApiResponse(response);

    if (!response.ok) {
      alert(result.error || 'Unable to update favorites.');
    } else {
      const nextState = Boolean(result.isFavorite);
      setIsFavorite(nextState);

      if (nextState) {
        setShowFavoriteToast(true);
        setTimeout(() => setShowFavoriteToast(false), 1800);
      }
    }

    setIsSavingFavorite(false);
  }, [game.cover, game.id, game.name, isFavorite, isSavingFavorite]);

  return (
    <>
      <div className="flex flex-col gap-4 max-w-3xl">
        <div className="flex items-center gap-3">
          <button 
            onClick={handleOpenLog}
            disabled={isCheckingAuth}
            className="flex-1 bg-[#00FF88] text-black font-black px-8 py-4 rounded-xl 
                       hover:bg-[#00cc6e] hover:scale-[1.01] transition-all 
                       active:scale-[0.99] shadow-lg shadow-[#00FF88]/20 disabled:opacity-60"
          >
            LOG CHECKPOINT
          </button>

          <button
            type="button"
            onClick={handleToggleFavorite}
            disabled={isSavingFavorite}
            className={`h-11 w-11 rounded-full border transition-colors flex items-center justify-center ${
              isFavorite
                ? 'border-[#00FF88]/60 bg-[#00FF88]/10 text-[#00FF88]'
                : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white'
            } disabled:opacity-60`}
            aria-label={isFavorite ? 'Remove from favourites' : 'Add to favourites'}
            title={isFavorite ? 'Remove from favourites' : 'Add to favourites'}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M12 20.4c-.3 0-.6-.1-.8-.3C6.5 16 3.5 13.2 3.5 9.8 3.5 7.1 5.6 5 8.3 5c1.5 0 2.9.7 3.7 1.9C12.8 5.7 14.2 5 15.7 5c2.7 0 4.8 2.1 4.8 4.8 0 3.4-3 6.2-7.7 10.3-.2.2-.5.3-.8.3z" />
            </svg>
          </button>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500 mb-3">
            Add to your profile status
          </p>

          <div className="flex flex-wrap gap-2 mb-2">
            {STATUS_OPTIONS.map((option) => {
              const active = selectedStatus === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSetStatus(option.value)}
                  disabled={isSavingStatus}
                  className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${
                    active
                      ? 'border-[#00FF88]/40 bg-[#00FF88]/10 text-[#00FF88]'
                      : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
                  } disabled:opacity-60`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-600">
            {selectedStatus
              ? `Current status: ${STATUS_OPTIONS.find((option) => option.value === selectedStatus)?.label || selectedStatus}`
              : 'No status set yet'}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500 mb-3">
            Replay tracking
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleReplayChange(Math.max(0, replayCount - 1))}
              disabled={isSavingReplay || replayCount === 0}
              className="h-7 w-7 rounded-full border border-zinc-800 bg-zinc-900 text-zinc-300 font-black hover:text-white disabled:opacity-50"
              aria-label="Decrease replay count"
            >
              -
            </button>

            <span className="min-w-[80px] text-center text-[11px] font-black uppercase tracking-[0.2em] text-zinc-200">
              {replayCount} {replayCount === 1 ? 'Replay' : 'Replays'}
            </span>

            <button
              type="button"
              onClick={() => handleReplayChange(replayCount + 1)}
              disabled={isSavingReplay}
              className="h-7 w-7 rounded-full border border-zinc-800 bg-zinc-900 text-zinc-300 font-black hover:text-white disabled:opacity-50"
              aria-label="Increase replay count"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <LogModal 
        game={game} 
        isOpen={isModalOpen} 
        onClose={() => setModalOpen(false)} 
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setAuthOpen(false)}
        initialMode={authMode}
        onSuccess={handleLoginSuccess}
      />

      {showFavoriteToast && (
        <div className="fixed bottom-6 right-6 z-[130] rounded-full border border-[#00FF88]/40 bg-zinc-950/95 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#00FF88] shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          Added to favourites
        </div>
      )}
    </>
  );
}