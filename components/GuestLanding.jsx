'use client';

import { useState } from 'react';
import Link from 'next/link';
import AuthModal from './AuthModal';

export default function GuestLanding({ totalCheckpoints, trendingGames = [] }) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const fallbackTrendingGames = [
    {
      name: 'Neon Outlaw',
      summary: 'High-speed city combat with pulse-pounding score streaks.',
      cover: { url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80' },
    },
    {
      name: 'Starward Quest',
      summary: 'Explore alien worlds and build your team for cosmic battles.',
      cover: { url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80' },
    },
    {
      name: 'Shadow Protocol',
      summary: 'Sneak through high-security zones and uncover hidden secrets.',
      cover: { url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80' },
    },
  ];

  const displayGames = (trendingGames?.length > 0 ? trendingGames : fallbackTrendingGames).slice(0, 3);

  const getCoverUrl = (cover) => {
    const rawUrl = cover?.url || '';
    const resized = rawUrl.replace('t_thumb', 't_cover_big');
    const finalUrl = resized.startsWith('//') ? `https:${resized}` : resized;
    return finalUrl || '/no-cover.svg';
  };

  const getSummary = (summary) => summary ? summary.slice(0, 100).trim() : 'Trending now on CHECKPOINT.';

  return (
    <>
      <section className="mb-10 sm:mb-12 rounded-[32px] border border-zinc-800 bg-zinc-900/80 p-5 sm:p-8 lg:p-10 shadow-[0_25px_80px_rgba(0,0,0,0.35)]">
        <div className="grid gap-10 lg:grid-cols-[1.45fr_0.82fr] items-stretch">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.18em] sm:tracking-[0.3em] font-black text-[#00FF88] mb-4">Welcome to CHECKPOINT</p>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight mb-5 sm:mb-6">
              Track the games you love, write the reviews that matter, and keep your own gaming history.
            </h1>
            <p className="text-zinc-400 text-base sm:text-lg leading-7 sm:leading-8 mb-7 sm:mb-8">
              CHECKPOINT helps you discover new titles, save favourites, and connect your playthroughs with honest community reviews. Create an account to personalise your profile, save top games, and join the conversation.
            </p>

            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="inline-flex items-center justify-center rounded-full bg-[#00FF88] px-6 sm:px-8 py-4 text-sm font-black uppercase tracking-[0.12em] sm:tracking-[0.2em] text-black shadow-[0_20px_50px_rgba(0,255,136,0.18)] transition hover:opacity-90"
              >
                Create Account
              </button>
              <Link
                href="/search"
                className="inline-flex items-center justify-center rounded-full border border-zinc-700 px-6 sm:px-8 py-4 text-sm font-black uppercase tracking-[0.12em] sm:tracking-[0.2em] text-zinc-300 hover:border-[#00FF88] hover:text-[#00FF88] transition"
              >
                Browse games
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-6">
                <h2 className="text-sm uppercase tracking-[0.15em] sm:tracking-[0.3em] font-black text-zinc-400 mb-3">Find new games</h2>
                <p className="text-zinc-500 text-sm leading-6">Search the latest releases and discover community favourites all in one place.</p>
              </div>
              <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-6">
                <h2 className="text-sm uppercase tracking-[0.15em] sm:tracking-[0.3em] font-black text-zinc-400 mb-3">Write reviews</h2>
                <p className="text-zinc-500 text-sm leading-6">Keep a running journal of your thoughts and ratings for every game you play.</p>
              </div>
              <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-6">
                <h2 className="text-sm uppercase tracking-[0.15em] sm:tracking-[0.3em] font-black text-zinc-400 mb-3">Join the community</h2>
                <p className="text-zinc-500 text-sm leading-6">Save favourites, follow activity, and build your profile with a personal touch.</p>
              </div>
            </div>

            <div className="mt-10 text-zinc-500 text-sm font-medium uppercase tracking-[0.12em] sm:tracking-[0.2em]">
              {totalCheckpoints || 0} checkpoints logged by the community
            </div>
          </div>

          <aside className="relative hidden lg:block h-full">
            <div className="flex h-full flex-col rounded-[36px] border border-zinc-800 bg-black/30 p-5 shadow-[0_30px_100px_rgba(0,0,0,0.4)]">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] font-black text-zinc-400">Most reviewed on CHECKPOINT</p>
                  <p className="text-xs text-zinc-500">The games with the most reviews right now on CheckPoint.</p>
                </div>
                <span className="inline-flex rounded-full bg-zinc-950/80 px-3 py-1 text-[11px] font-black uppercase tracking-[0.3em] text-zinc-400">Live</span>
              </div>

              <div className="relative flex-1 overflow-hidden rounded-[30px] border border-zinc-800 bg-zinc-950/70 p-3">
                <div className="absolute inset-0 animate-scroll-y">
                  {[...Array(2)].map((_, index) => (
                    <div key={index} className="flex flex-col gap-3 pb-3">
                      {displayGames.map((game, gameIndex) => (
                        <Link
                          key={`${game.name}-${index}-${gameIndex}`}
                          href={game.id ? `/game/${game.id}` : '#'}
                          className="group h-85 overflow-hidden rounded-[24px] border border-zinc-800 bg-gradient-to-br from-slate-900 via-slate-950 to-zinc-950 shadow-[0_18px_50px_rgba(0,0,0,0.28)] transition duration-200 hover:-translate-y-1 hover:border-[#00FF88] hover:ring hover:ring-[#00FF88]/30"
                        >
                          <div className="relative h-full w-full">
                            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${getCoverUrl(game.cover)})` }}></div>
                            <div className="absolute inset-0 rounded-[24px] bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-3">
                              <h3 className="text-base font-black text-white">{game.name}</h3>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
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
