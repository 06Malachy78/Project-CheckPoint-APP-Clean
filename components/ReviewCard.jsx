import Link from 'next/link';

export default function ReviewCard({ review }) {
  return (
    <Link href={`/profile/${review.username}`} className="block hover:opacity-80 transition">
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-white uppercase tracking-tighter text-sm">
            {review.game_title}
          </h3>
          <span className="text-[#00FF88] font-black text-xs">
            {review.rating} / 10
          </span>
        </div>
        <p className="text-zinc-400 text-sm italic">"{review.content}"</p>
        <p className="text-[10px] text-zinc-600 mt-2 uppercase tracking-widest">
          {new Date(review.created_at).toLocaleDateString()}
        </p>
      </div>
    </Link>
  );
}