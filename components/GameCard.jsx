import Link from 'next/link';

export default function GameCard({ game }) {
  // IGDB specific: replace 't_thumb' with 't_cover_big' for better quality
  const coverUrl = game.cover?.url?.replace('t_thumb', 't_cover_big') || 'https://via.placeholder.com/264x352?text=No+Cover';
  const finalUrl = coverUrl.startsWith('//') ? `https:${coverUrl}` : coverUrl;

  return (
    <Link href={`/game/${game.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{ 
        width: '100%', 
        borderRadius: '10px', 
        overflow: 'hidden', 
        border: '1px solid #27272a',
        transition: 'transform 0.2s'
      }}>
        <img 
          src={finalUrl} 
          alt={game.name} 
          style={{ 
            width: '100%', 
            height: '250px', // Forces all posters to be the same height
            objectFit: 'cover', // Crops them neatly instead of stretching
            display: 'block' 
          }}
        />
        <div style={{ padding: '10px', backgroundColor: '#18181b' }}>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {game.name}
          </p>
        </div>
      </div>
    </Link>
  );
}