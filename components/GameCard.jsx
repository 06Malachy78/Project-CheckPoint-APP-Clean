import Link from 'next/link';

export default function GameCard({ game, coverMode = 'cover' }) {
  const coverUrl = game.cover?.url?.replace('t_thumb', 't_cover_big') || 'https://via.placeholder.com/640x360?text=No+Cover';
  const finalUrl = coverUrl.startsWith('//') ? `https:${coverUrl}` : coverUrl;

  return (
    <Link href={`/game/${game.id}`} className="group block overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 shadow-sm transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="aspect-[3/4] w-full overflow-hidden bg-zinc-900">
        <img
          src={finalUrl}
          alt={game.name}
          className={`h-full w-full transition-transform duration-300 group-hover:scale-105 ${coverMode === 'contain' ? 'object-contain' : 'object-cover'}`}
        />
      </div>

      <div className="px-3 py-3">
        <p className="text-sm font-bold text-zinc-100 truncate">{game.name}</p>
      </div>
    </Link>
  );
}
