"use client";

import Link from 'next/link';
import { useState } from 'react';
import {
  GAME_STATUS_ORDER,
  GAME_STATUS_META,
} from '@/lib/game-statuses';

function getCoverUrl(game) {
  const coverUrl =
    game?.cover?.url?.replace('t_thumb', 't_cover_big') ||
    'https://via.placeholder.com/264x352?text=No+Cover';

  return coverUrl.startsWith('//') ? `https:${coverUrl}` : coverUrl;
}

export default function ProfileGameStatusSections({ groupedStatuses, visibility }) {
  const PREVIEW_LIMIT = 7;
  const [expandedStatus, setExpandedStatus] = useState(null);
  const visibleStates = GAME_STATUS_ORDER.filter((key) => visibility[key] !== false);

  if (visibleStates.length === 0) {
    return (
      <p className="text-zinc-600 text-xs uppercase tracking-widest italic">
        All status sections are hidden.
      </p>
    );
  }

  return (
    <div className="space-y-10">
      {visibleStates.map((statusKey) => {
        const games = groupedStatuses[statusKey] || [];
        const previewGames = games.slice(0, PREVIEW_LIMIT);
        const hiddenCount = Math.max(0, games.length - PREVIEW_LIMIT);

        return (
          <section key={statusKey}>
            <div className="flex items-center justify-between gap-4 mb-4">
              <button
                type="button"
                onClick={() => setExpandedStatus(statusKey)}
                className="text-xs uppercase tracking-[0.22em] text-zinc-500 font-black hover:text-zinc-200 transition-colors"
                aria-label={`View all ${GAME_STATUS_META[statusKey].label} games`}
              >
                {GAME_STATUS_META[statusKey].label}
              </button>
              <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-black">
                {games.length} {games.length === 1 ? 'game' : 'games'}
              </span>
            </div>

            {games.length > 0 ? (
              <>
                <div className="grid justify-items-start gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7">
                  {previewGames.map((game) => (
                    <Link
                      key={`${statusKey}-${game.id}`}
                      href={`/game/${game.id}`}
                      className="group block w-full max-w-[100px] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 transition-transform duration-300 hover:-translate-y-0.5"
                    >
                      <div className="aspect-[3/4] overflow-hidden bg-zinc-900">
                        <img
                          src={getCoverUrl(game)}
                          alt={game.name || 'Game cover'}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    </Link>
                  ))}
                </div>

                {hiddenCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setExpandedStatus(statusKey)}
                    className="mt-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-200"
                  >
                    +{hiddenCount} more
                  </button>
                )}
              </>
            ) : (
              <p className="text-zinc-600 text-xs uppercase tracking-widest italic">
                No games in {GAME_STATUS_META[statusKey].label.toLowerCase()} yet.
              </p>
            )}
          </section>
        );
      })}

      {expandedStatus && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setExpandedStatus(null)} />
          <div className="relative bg-zinc-950 border border-zinc-800 w-full max-w-4xl rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4 mb-5">
              <h3 className="text-[#00FF88] text-[10px] font-black uppercase tracking-[0.2em]">
                {GAME_STATUS_META[expandedStatus].label}
              </h3>
              <button
                type="button"
                onClick={() => setExpandedStatus(null)}
                className="h-8 w-8 rounded-full border border-zinc-800 text-zinc-400 hover:text-white"
                aria-label="Close full status list"
              >
                ×
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
              {(groupedStatuses[expandedStatus] || []).length > 0 ? (
                <div className="grid justify-items-start gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7">
                  {(groupedStatuses[expandedStatus] || []).map((game) => (
                    <Link
                      key={`expanded-${expandedStatus}-${game.id}`}
                      href={`/game/${game.id}`}
                      className="group block w-full max-w-[100px] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 transition-transform duration-300 hover:-translate-y-0.5"
                    >
                      <div className="aspect-[3/4] overflow-hidden bg-zinc-900">
                        <img
                          src={getCoverUrl(game)}
                          alt={game.name || 'Game cover'}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-600 text-xs uppercase tracking-widest italic">
                  No games in {GAME_STATUS_META[expandedStatus].label.toLowerCase()} yet.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
