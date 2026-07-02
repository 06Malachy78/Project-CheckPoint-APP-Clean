'use client';

import Link from 'next/link';
import { useState } from 'react';

const PREVIEW_LIMIT = 7;

function getCoverUrl(game) {
  const coverUrl =
    game?.cover?.url?.replace('t_thumb', 't_cover_big') ||
    'https://via.placeholder.com/264x352?text=No+Cover';

  return coverUrl.startsWith('//') ? `https:${coverUrl}` : coverUrl;
}

export default function ReplayGamesSection({ replayGames }) {
  const [isOpen, setIsOpen] = useState(false);

  const previewGames = (replayGames || []).slice(0, PREVIEW_LIMIT);
  const hiddenCount = Math.max(0, (replayGames || []).length - PREVIEW_LIMIT);

  return (
    <section className="mb-16">
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="text-lg font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          Replays
        </button>
        <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-black">
          {(replayGames || []).length} {(replayGames || []).length === 1 ? 'game' : 'games'}
        </span>
      </div>

      {(replayGames || []).length > 0 ? (
        <>
          <div className="grid justify-items-start gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7">
            {previewGames.map((game) => (
              <Link
                key={`replay-${game.id}`}
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
                <span className="absolute bottom-1 right-1 rounded-full border border-zinc-700 bg-black/80 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#00FF88]">
                  x{game.replayCount}
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
        <p className="text-zinc-600 text-xs uppercase tracking-widest italic">No replayed games tracked yet.</p>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsOpen(false)} />
          <div className="relative bg-zinc-950 border border-zinc-800 w-full max-w-4xl rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4 mb-5">
              <h3 className="text-[#00FF88] text-[10px] font-black uppercase tracking-[0.2em]">Replays</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 rounded-full border border-zinc-800 text-zinc-400 hover:text-white"
                aria-label="Close replay list"
              >
                ×
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
              {(replayGames || []).length > 0 ? (
                <div className="grid justify-items-start gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7">
                  {(replayGames || []).map((game) => (
                    <Link
                      key={`replay-expanded-${game.id}`}
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
                      <span className="absolute bottom-1 right-1 rounded-full border border-zinc-700 bg-black/80 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#00FF88]">
                        x{game.replayCount}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-600 text-xs uppercase tracking-widest italic">No replayed games tracked yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
