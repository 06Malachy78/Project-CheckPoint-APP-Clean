import SkeletonCard from '../components/SkeletonCard';

export default function Loading() {
  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      {/* We keep the layout structure the same so it doesn't jump */}
      <div className="max-w-6xl mx-auto pt-32 px-6 pb-20">
        
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4 animate-pulse">
          <div>
            <div className="h-10 w-64 bg-zinc-800 rounded-lg mb-4"></div>
            <div className="h-4 w-48 bg-zinc-800 rounded"></div>
          </div>
          <div className="h-10 w-40 bg-zinc-800 rounded-full"></div>
        </header>

        {/* Show a grid of 6 skeleton cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </main>
  );
}