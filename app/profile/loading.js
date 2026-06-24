export default function ProfileLoading() {
  return (
    <main className="max-w-4xl mx-auto pt-32 px-6 pb-20 animate-pulse">
      {/* Profile Header Skeleton */}
      <section className="mb-16 border-b border-zinc-900 pb-10">
        <div className="h-10 w-52 bg-zinc-800/80 rounded-lg mb-3" />
        <div className="h-3 w-36 bg-zinc-900 rounded font-mono" />
      </section>

      {/* Top 3 Games Section Skeletonnn */}
      <section className="mb-16">
        <div className="h-5 w-40 bg-zinc-800/60 rounded mb-6" />
        <div className="grid grid-cols-3 gap-4">
          <div className="h-48 bg-zinc-900/40 rounded-2xl border border-zinc-800/30" />
          <div className="h-48 bg-zinc-900/40 rounded-2xl border border-zinc-800/30" />
          <div className="h-48 bg-zinc-900/40 rounded-2xl border border-zinc-800/30" />
        </div>
      </section>

      {/* Reviews Section Skeleton */}
      <section>
        <div className="h-5 w-32 bg-zinc-800/60 rounded mb-6" />
        <div className="space-y-4">
          <div className="h-20 w-full bg-zinc-900/30 rounded-xl border border-zinc-800/20" />
          <div className="h-20 w-full bg-zinc-900/30 rounded-xl border border-zinc-800/20" />
        </div>
      </section>
    </main>
  );
}