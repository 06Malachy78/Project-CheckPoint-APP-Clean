"use client";
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import LogModal from '../../../components/LogModal';
import AuthModal from '../../../components/AuthModal';

export default function GamePageClient({ game }) {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isAuthOpen, setAuthOpen] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');

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

  return (
    <>
      <button 
        onClick={handleOpenLog}
        disabled={isCheckingAuth}
        className="bg-[#00FF88] text-black font-black px-8 py-4 rounded-xl 
                   hover:bg-[#00cc6e] hover:scale-105 transition-all 
                   active:scale-95 shadow-lg shadow-[#00FF88]/20 disabled:opacity-60"
      >
        LOG CHECKPOINT
      </button>

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