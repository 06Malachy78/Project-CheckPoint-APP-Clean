'use client';

import Link from 'next/link';
import { useState } from 'react';

const PREVIEW_LIMIT = 7;

function getCoverUrl(game) {
  const coverUrl =
    game?.cover?.url?.replace('t_thumb', 't_cover_big') ||
    '/no-cover.svg';

  return coverUrl.startsWith('//') ? `https:${coverUrl}` : coverUrl;
}

export default function FavoriteGamesSection({ favoriteGames }) {
  const [isOpen, setIsOpen] = useState(false);

  const safeFavorites = favoriteGames || [];
  const previewGames = safeFavorites.slice(0, PREVIEW_LIMIT);
  const hiddenCount = Math.max(0, safeFavorites.length - PREVIEW_LIMIT);

  return (
    <section className="mb-16">
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="text-lg font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          Favourites
        </button>
        <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-black">
          {safeFavorites.length} {safeFavorites.length === 1 ? 'game' : 'games'}
        </span>
      </div>

      {safeFavorites.length > 0 ? (
        <>
          <div className="grid justify-items-start gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7">
            {previewGames.map((game) => (
              <Link
                key={`favorite-${game.id}`}
                href={`/game/${game.id}`}
                className="group relative block w-full max-w-[100px] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 transition-transform duration-300 hover:-translate-y-0.5"
              >
                <div className="aspect-[3/4] overflow-hidden bg-zinc-900">
                  <img
                    src={getCoverUrl(game)}
                    alt={game.name || 'Game cover'}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <span className="absolute bottom-1 right-1 rounded-full border border-zinc-700 bg-black/80 px-1.5 py-1 text-[#00FF88]">
                  <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="currentColor" aria-hidden="true">
                    <path d="M12 20.4c-.3 0-.6-.1-.8-.3C6.5 16 3.5 13.2 3.5 9.8 3.5 7.1 5.6 5 8.3 5c1.5 0 2.9.7 3.7 1.9C12.8 5.7 14.2 5 15.7 5c2.7 0 4.8 2.1 4.8 4.8 0 3.4-3 6.2-7.7 10.3-.2.2-.5.3-.8.3z" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>

          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="mt-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-200"
            >
              +{hiddenCount} more
            </button>
          )}
        </>
      ) : (
        <p className="text-zinc-600 text-xs uppercase tracking-widest italic">No favourited games yet.</p>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsOpen(false)} />
          <div className="relative bg-zinc-950 border border-zinc-800 w-full max-w-4xl rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4 mb-5">
              <h3 className="text-[#00FF88] text-[10px] font-black uppercase tracking-[0.2em]">Favourites</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 rounded-full border border-zinc-800 text-zinc-400 hover:text-white"
                aria-label="Close favourites list"
              >
                x
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
              {safeFavorites.length > 0 ? (
                <div className="grid justify-items-start gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7">
                  {safeFavorites.map((game) => (
                    <Link
                      key={`favorite-expanded-${game.id}`}
                      href={`/game/${game.id}`}
                      className="group relative block w-full max-w-[100px] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 transition-transform duration-300 hover:-translate-y-0.5"
                    >
                      <div className="aspect-[3/4] overflow-hidden bg-zinc-900">
                        <img
                          src={getCoverUrl(game)}
                          alt={game.name || 'Game cover'}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <span className="absolute bottom-1 right-1 rounded-full border border-zinc-700 bg-black/80 px-1.5 py-1 text-[#00FF88]">
                        <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="currentColor" aria-hidden="true">
                          <path d="M12 20.4c-.3 0-.6-.1-.8-.3C6.5 16 3.5 13.2 3.5 9.8 3.5 7.1 5.6 5 8.3 5c1.5 0 2.9.7 3.7 1.9C12.8 5.7 14.2 5 15.7 5c2.7 0 4.8 2.1 4.8 4.8 0 3.4-3 6.2-7.7 10.3-.2.2-.5.3-.8.3z" />
                        </svg>
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-600 text-xs uppercase tracking-widest italic">No favourited games yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}