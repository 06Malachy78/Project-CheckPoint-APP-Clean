'use client';

import { useState } from 'react';
import Link from 'next/link';
import AuthModal from './AuthModal';

export default function GuestLanding({ totalCheckpoints }) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <>
      <section className="mb-12 rounded-[32px] border border-zinc-800 bg-zinc-900/80 p-10 shadow-[0_25px_80px_rgba(0,0,0,0.35)]">
        <div className="max-w-3xl">
          <p className="text-sm uppercase tracking-[0.3em] font-black text-[#00FF88] mb-4">Welcome to CHECKPOINT</p>
          <h1 className="text-5xl font-black tracking-tight text-white leading-tight mb-6">
            Track the games you love, write the reviews that matter, and keep your own gaming history.
          </h1>
          <p className="text-zinc-400 text-lg leading-8 mb-8">
            CHECKPOINT helps you discover new titles, save favorites, and connect your playthroughs with honest community reviews. Create an account to personalize your profile, save top games, and join the conversation.
          </p>

          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="inline-flex items-center justify-center rounded-full bg-[#00FF88] px-8 py-4 text-sm font-black uppercase tracking-[0.2em] text-black shadow-[0_20px_50px_rgba(0,255,136,0.18)] transition hover:opacity-90"
            >
              Create Account
            </button>
            <Link
              href="/search"
              className="inline-flex items-center justify-center rounded-full border border-zinc-700 px-8 py-4 text-sm font-black uppercase tracking-[0.2em] text-zinc-300 hover:border-[#00FF88] hover:text-[#00FF88] transition"
            >
              Browse games
            </Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-6">
              <h2 className="text-sm uppercase tracking-[0.3em] font-black text-zinc-400 mb-3">Find new games</h2>
              <p className="text-zinc-500 text-sm leading-6">Search the latest releases and discover community favorites all in one place.</p>
            </div>
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-6">
              <h2 className="text-sm uppercase tracking-[0.3em] font-black text-zinc-400 mb-3">Write reviews</h2>
              <p className="text-zinc-500 text-sm leading-6">Keep a running journal of your thoughts and ratings for every game you play.</p>
            </div>
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-6">
              <h2 className="text-sm uppercase tracking-[0.3em] font-black text-zinc-400 mb-3">Join the community</h2>
              <p className="text-zinc-500 text-sm leading-6">Save favorites, follow activity, and build your profile with a personal touch.</p>
            </div>
          </div>

          <div className="mt-10 text-zinc-500 text-sm font-medium uppercase tracking-[0.2em]">
            {totalCheckpoints || 0} checkpoints logged by the community
          </div>
        </div>
      </section>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode="signup"
      />
    </>
  );
}
