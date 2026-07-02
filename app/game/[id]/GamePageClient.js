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

export default function GamePageClient({ game, initialStatus = null }) {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isAuthOpen, setAuthOpen] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [isSavingStatus, setIsSavingStatus] = useState(false);

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

  return (
    <>
      <div className="flex flex-col gap-4 max-w-3xl">
        <button 
          onClick={handleOpenLog}
          disabled={isCheckingAuth}
          className="bg-[#00FF88] text-black font-black px-8 py-4 rounded-xl 
                     hover:bg-[#00cc6e] hover:scale-105 transition-all 
                     active:scale-95 shadow-lg shadow-[#00FF88]/20 disabled:opacity-60"
        >
          LOG CHECKPOINT
        </button>

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
    </>
  );
}