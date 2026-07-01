'use client';

import { useState } from 'react';
import GameCard from './GameCard';
import { supabase } from '@/lib/supabase'; 
import { useRouter } from 'next/navigation';

export default function TopGamesEditor({ profile, userId }) {
  const [editingSlot, setEditingSlot] = useState(null); 
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const router = useRouter();

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) return setSearchResults([]);
    
    try {
      const res = await fetch(`/api/search?q=${query}`);
      const data = await res.json();
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Search failed", err);
    }
  };

  const selectGame = async (game) => {
    const gameData = {
      id: game.id,
      name: game.name,
      cover: game.cover
    };

    const updateField = `top_game_${editingSlot}`;
    
    const { error } = await supabase
      .from('profiles')
      .upsert({ 
        id: userId, 
        [updateField]: gameData,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      alert(error.message);
    } else {
      setEditingSlot(null);
      setSearchQuery('');
      setSearchResults([]);
      router.refresh(); 
    }
  };

  const slots = [profile?.top_game_1, profile?.top_game_2, profile?.top_game_3];

  return (
    <div className="relative">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {slots.map((game, i) => (
          <div key={i} className="group relative aspect-[3/4] rounded-2xl border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center bg-zinc-900/20 overflow-hidden transition-all hover:border-[#00FF88]/50">
            {game ? (
              <>
                <GameCard game={game} fit="contain" />
                <button 
                  onClick={() => setEditingSlot(i + 1)}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] font-black tracking-widest text-[#00FF88] uppercase"
                >
                  Change Game
                </button>
              </>
            ) : (
              <button 
                onClick={() => setEditingSlot(i + 1)}
                className="flex flex-col items-center gap-2 text-zinc-600 hover:text-[#00FF88] transition-colors"
              >
                <span className="text-3xl">+</span>
                <span className="text-[10px] font-black uppercase tracking-widest">Slot {i + 1}</span>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Search Modal Overlay */}
      {editingSlot && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setEditingSlot(null)} />
          <div className="relative bg-zinc-950 border border-zinc-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl">
            <h3 className="text-[#00FF88] text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-center">
              Select Top Game {editingSlot}
            </h3>
            <input 
              autoFocus
              className="w-full bg-black border border-zinc-800 p-2.5 rounded-lg text-xs focus:border-[#00FF88] outline-none mb-4 text-white placeholder:text-zinc-700"
              placeholder="Search games..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <div className="max-h-64 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {searchResults.map(game => (
                <button 
                  key={game.id}
                  onClick={() => selectGame(game)}
                  className="w-full flex items-center gap-3 p-2 hover:bg-zinc-900 rounded-lg transition-colors text-left group"
                >
                  <img 
                    src={game.cover?.url?.replace('t_thumb', 't_cover_small')} 
                    className="w-8 h-10 object-cover rounded bg-zinc-800" 
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
    </div>
  );
}

