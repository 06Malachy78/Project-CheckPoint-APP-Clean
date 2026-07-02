'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { parseApiResponse } from '@/lib/api-client';
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

function cloneGroupedStatuses(groupedStatuses) {
  return {
    playing: [...(groupedStatuses?.playing || [])],
    finished: [...(groupedStatuses?.finished || [])],
    backlog: [...(groupedStatuses?.backlog || [])],
  };
}

export default function ProfileGameStatusEditor({ groupedStatuses }) {
  const PREVIEW_LIMIT = 7;
  const [localGroupedStatuses, setLocalGroupedStatuses] = useState(() => cloneGroupedStatuses(groupedStatuses));
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [expandedStatus, setExpandedStatus] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [removingGameId, setRemovingGameId] = useState(null);

  const hasVisibleStates = useMemo(() => GAME_STATUS_ORDER.length > 0, []);

  const closeModal = () => {
    setSelectedStatus(null);
    setSearchQuery('');
    setSearchResults([]);
    setIsSaving(false);
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Search failed', error);
      setSearchResults([]);
    }
  };

  const assignGameToStatus = async (game) => {
    if (!selectedStatus || isSaving) return;

    setIsSaving(true);

    const response = await fetch('/api/profile/game-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: selectedStatus,
        game: {
          id: game.id,
          name: game.name,
          cover: game.cover ?? null,
        },
      }),
    });

    const result = await parseApiResponse(response);

    if (!response.ok) {
      alert(result.error || 'Unable to set game status.');
      setIsSaving(false);
      return;
    }

    setLocalGroupedStatuses((current) => {
      const next = cloneGroupedStatuses(current);

      for (const key of GAME_STATUS_ORDER) {
        next[key] = next[key].filter((row) => String(row.id) !== String(game.id));
      }

      next[selectedStatus] = [
        {
          id: game.id,
          name: game.name,
          cover: game.cover ?? null,
          updated_at: new Date().toISOString(),
        },
        ...next[selectedStatus],
      ];

      return next;
    });

    closeModal();
  };

  const removeGameFromStatus = async (game) => {
    if (removingGameId) return;

    setRemovingGameId(String(game.id));

    const response = await fetch('/api/profile/game-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: '',
        game: {
          id: game.id,
          name: game.name,
          cover: game.cover ?? null,
        },
      }),
    });

    const result = await parseApiResponse(response);

    if (!response.ok) {
      alert(result.error || 'Unable to clear game status.');
      setRemovingGameId(null);
      return;
    }

    setLocalGroupedStatuses((current) => {
      const next = cloneGroupedStatuses(current);

      for (const key of GAME_STATUS_ORDER) {
        next[key] = next[key].filter((row) => String(row.id) !== String(game.id));
      }

      return next;
    });

    setRemovingGameId(null);
  };

  if (!hasVisibleStates) {
    return (
      <p className="text-zinc-600 text-xs uppercase tracking-widest italic">
        No status sections available.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-10">
        {GAME_STATUS_ORDER.map((statusKey) => {
          const games = localGroupedStatuses[statusKey] || [];
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
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-black">
                    {games.length} {games.length === 1 ? 'game' : 'games'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedStatus(statusKey)}
                    className="h-7 w-7 rounded-full border border-zinc-800 bg-zinc-950 text-[#00FF88] text-lg leading-none font-black hover:border-[#00FF88]/50"
                    aria-label={`Add game to ${GAME_STATUS_META[statusKey].label}`}
                    title={`Add game to ${GAME_STATUS_META[statusKey].label}`}
                  >
                    +
                  </button>
                </div>
              </div>

              {games.length > 0 ? (
                <>
                  <div className="grid justify-items-start gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7">
                    {previewGames.map((game) => (
                      <div
                        key={`${statusKey}-${game.id}`}
                        className="group relative w-full max-w-[100px] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 transition-transform duration-300 hover:-translate-y-0.5"
                      >
                        <Link href={`/game/${game.id}`} className="block">
                          <div className="aspect-[3/4] overflow-hidden bg-zinc-900">
                            <img
                              src={getCoverUrl(game)}
                              alt={game.name || 'Game cover'}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          </div>
                        </Link>

                        <button
                          type="button"
                          onClick={() => removeGameFromStatus(game)}
                          disabled={removingGameId === String(game.id)}
                          className="absolute top-2 right-2 h-6 w-6 rounded-full border border-zinc-700 bg-black/75 text-zinc-100 text-xs font-black leading-none hover:border-red-400 hover:text-red-300 disabled:opacity-60"
                          aria-label={`Remove ${game.name || 'game'} from ${GAME_STATUS_META[statusKey].label}`}
                          title="Remove from status"
                        >
                          ×
                        </button>
                      </div>
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
      </div>

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
              {(localGroupedStatuses[expandedStatus] || []).length > 0 ? (
                <div className="grid justify-items-start gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7">
                  {(localGroupedStatuses[expandedStatus] || []).map((game) => (
                    <div
                      key={`expanded-${expandedStatus}-${game.id}`}
                      className="group relative w-full max-w-[100px] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 transition-transform duration-300 hover:-translate-y-0.5"
                    >
                      <Link href={`/game/${game.id}`} className="block">
                        <div className="aspect-[3/4] overflow-hidden bg-zinc-900">
                          <img
                            src={getCoverUrl(game)}
                            alt={game.name || 'Game cover'}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                      </Link>

                      <button
                        type="button"
                        onClick={() => removeGameFromStatus(game)}
                        disabled={removingGameId === String(game.id)}
                        className="absolute top-2 right-2 h-6 w-6 rounded-full border border-zinc-700 bg-black/75 text-zinc-100 text-xs font-black leading-none hover:border-red-400 hover:text-red-300 disabled:opacity-60"
                          aria-label={`Remove ${game.name || 'game'} from ${GAME_STATUS_META[expandedStatus].label}`}
                        title="Remove from status"
                      >
                        ×
                      </button>
                    </div>
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

      {selectedStatus && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={closeModal} />
          <div className="relative bg-zinc-950 border border-zinc-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl">
            <h3 className="text-[#00FF88] text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-center">
              Add to {GAME_STATUS_META[selectedStatus].label}
            </h3>
            <input
              autoFocus
              className="w-full bg-black border border-zinc-800 p-2.5 rounded-lg text-xs focus:border-[#00FF88] outline-none mb-4 text-white placeholder:text-zinc-700"
              placeholder="Search games..."
              value={searchQuery}
              onChange={(event) => handleSearch(event.target.value)}
            />
            <div className="max-h-64 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {searchResults.map((game) => (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => assignGameToStatus(game)}
                  disabled={isSaving}
                  className="w-full flex items-center gap-3 p-2 hover:bg-zinc-900 rounded-lg transition-colors text-left group disabled:opacity-60"
                >
                  <img
                    src={game.cover?.url?.replace('t_thumb', 't_cover_small')}
                    className="w-8 h-10 object-cover rounded bg-zinc-800"
                    alt={game.name || 'Game cover'}
                  />
                  <span className="text-xs font-bold text-zinc-300 group-hover:text-white truncate">
                    {game.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
