"use client";
import { useState } from 'react';
import { parseApiResponse } from '@/lib/api-client';

export default function LogModal({ game, isOpen, onClose }) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  

  if (!isOpen) return null;

  const handleSave = async () => {
    if (rating === 0) return alert("Please select a star rating!");
    
    setIsSaving(true);
    
    try {
      const rawUrl = game.cover?.url || '';
      const cleanCoverUrl = rawUrl.startsWith('//') ? `https:${rawUrl}` : rawUrl;

      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId: game.id,
          gameTitle: game.name,
          rating,
          content: review,
          coverUrl: cleanCoverUrl,
        }),
      });

      const result = await parseApiResponse(response);

      if (!response.ok) {
        alert("Checkpoint save failed: " + (result.error || 'Unknown error'));
      } else {
        alert("Checkpoint Logged!");
        onClose();
        window.location.reload(); 
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold text-zinc-100">Log {game?.name}</h2>
            <p className="text-zinc-500 text-sm">What did you think of this checkpoint?</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-100 text-2xl">&times;</button>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button 
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`text-2xl transition ${rating >= star ? 'text-yellow-500' : 'text-zinc-700'}`}
              >
                ★
              </button>
            ))}
          </div>

          <textarea 
            className="w-full h-32 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-zinc-200 focus:outline-none focus:border-[#00FF88] transition"
            placeholder="Write your review here..."
            value={review}
            onChange={(e) => setReview(e.target.value)}
          />

          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-[#00FF88] text-black font-bold py-3 rounded-xl hover:bg-green-400 transition transform active:scale-95 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Checkpoint"}
          </button>
        </div>
      </div>
    </div>
  );
}