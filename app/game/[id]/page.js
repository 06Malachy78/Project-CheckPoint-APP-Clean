import { fetchGameData } from '../../../lib/igdb';
import { createClient } from '../../../lib/server';
import GamePageClient from './GamePageClient';
import GameReviewCard from '../../../components/GameReviewCard';


export default async function GamePage({ params }) {
  const { id } = await params;
  const game = await fetchGameData(id);
  const supabase = await createClient();
//test

  // 2. Fetch reviews for this specific game ID from Supabaseee
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('game_id', id.toString())
    .order('created_at', { ascending: false });

  if (!game) return <div className="text-white p-20">Game not found</div>;

  const coverUrl = game.cover?.url?.replace('t_thumb', 't_cover_big') || '';
  const finalCover = coverUrl.startsWith('//') ? `https:${coverUrl}` : coverUrl;

  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#00FF88]/10 to-transparent -z-10" />

      <div className="max-w-6xl mx-auto pt-32 px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-12 items-start">
          
          {/* Left Column: Game Poster */}
          <div className="w-full sticky top-32">
            <img 
              src={finalCover} 
              alt={game.name} 
              className="w-full rounded-2xl shadow-2xl border border-zinc-800 shadow-black/50"
            />
          </div>

          {/* Right Column: Game Details */}
          <div className="space-y-8">
            <header>
              <h1 className="text-6xl font-black tracking-tighter mb-2 leading-tight">
                {game.name}
              </h1>
              <div className="flex items-center gap-3 text-zinc-500 font-bold text-sm tracking-widest uppercase">
                <span>{new Date(game.first_release_date * 1000).getFullYear()}</span>
                <span>•</span>
                <span className="text-[#00FF88]">Checkpoint Verified</span>
              </div>
            </header>

            <div className="py-2">
              <GamePageClient game={game} />
            </div>

            <div className="border-t border-zinc-800 pt-8">
              <h3 className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-black mb-4">
                About this game
              </h3>
              <p className="text-zinc-400 text-lg leading-relaxed max-w-3xl">
                {game.summary || "No description available for this checkpoint."}
              </p>
            </div>

            {/* 3. New Reviews Section */}
            <div className="border-t border-zinc-800 pt-12 mt-12">
              <h3 className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-black mb-8">
                Recent Checkpoints
              </h3>
              
              <div className="space-y-6">
                {reviews && reviews.length > 0 ? (
                  reviews.map((review) => <GameReviewCard key={review.id} review={review} />)
                ) : (
                  <div className="py-10 text-center border-2 border-dashed border-zinc-900 rounded-3xl">
                    <p className="text-zinc-600 font-medium italic">
                      No one has reached this checkpoint yet. Be the first to log it!
                    </p>  
                  </div>
                )}
              </div>
            </div>
            {/* End Reviews Section */}
            
          </div>
        </div>
      </div>
    </main>
  );
}