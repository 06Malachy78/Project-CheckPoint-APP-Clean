export default function SkeletonCard() {
  return (
    <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-5 animate-pulse">
      {/* Game Poster Skeleton */}
      <div className="w-full sm:w-24 h-48 sm:h-32 flex-shrink-0 bg-zinc-800 rounded-lg"></div>

      {/* Content Skeleton */}
      <div className="flex flex-col justify-between py-1 flex-grow">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-3 w-20 bg-zinc-800 rounded"></div>
            <div className="h-3 w-12 bg-zinc-800 rounded"></div>
          </div>
          <div className="h-5 w-48 bg-zinc-800 rounded mb-3"></div>
          <div className="space-y-2">
            <div className="h-3 w-full bg-zinc-800 rounded"></div>
            <div className="h-3 w-2/3 bg-zinc-800 rounded"></div>
          </div>
        </div>
        <div className="h-2 w-16 bg-zinc-800 rounded mt-4"></div>
      </div>
    </div>
  );
}