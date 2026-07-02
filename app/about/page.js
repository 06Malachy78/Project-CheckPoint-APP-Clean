import Link from 'next/link';

export default function AboutPage() {
  return (
    <>
      <main className="max-w-5xl mx-auto px-6 pt-32 pb-20 text-zinc-100">
        <Link href="/" className="inline-flex items-center gap-2 text-[#00FF88] hover:opacity-70 transition-opacity mb-10 text-xs font-bold uppercase tracking-widest">
        
      </Link>

      <section className="mb-12">
        <h1 className="text-4xl font-black uppercase tracking-tighter text-white mb-4">About CHECKPOINT</h1>
        <p className="text-zinc-400 max-w-3xl leading-8">
          CHECKPOINT is a community hub for gamers who want to discover new titles, save their favorite games, and share honest reviews.
          Whether you're exploring classics or the latest releases, the site helps you organize your top picks and keep a personal record.
        </p>
        <p className="text-zinc-500 mt-6 text-sm">
          Built by <a href="https://www.linkedin.com/in/malachy-hearnden-84a0aa282" target="_blank" rel="noopener noreferrer" className="text-[#00FF88] font-semibold hover:underline">Malachy Hearnden</a> as a personal gaming journal and review destination.
        </p>
        <p className="text-zinc-500 mt-3 text-sm">
          Game data is powered by <a href="https://www.igdb.com/" target="_blank" rel="noopener noreferrer" className="text-[#00FF88] font-semibold hover:underline">IGDB</a> (Internet Game Database).
        </p>
      </section>

      <section className="grid gap-8 md:grid-cols-2">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-sm">
          <h2 className="text-2xl font-black text-white mb-4">Discover</h2>
          <p className="text-zinc-400 leading-7">
            Search and browse game titles, view cover art, and learn more about each release. The search feature is designed to help you find the perfect game quickly.
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-sm">
          <h2 className="text-2xl font-black text-white mb-4">Review</h2>
          <p className="text-zinc-400 leading-7">
            Share your thoughts with the community by writing reviews for the games you love. Your reviews are stored to build your own gaming journal.
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-sm">
          <h2 className="text-2xl font-black text-white mb-4">Save Favorites</h2>
          <p className="text-zinc-400 leading-7">
            Keep track of your all-time favorite titles with a dedicated profile section for your top games and most-loved plays.
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-sm">
          <h2 className="text-2xl font-black text-white mb-4">Personalized</h2>
          <p className="text-zinc-400 leading-7">
            Your profile is your space to display your username, favorite games, and review history, making the site personal and fun.
          </p>
        </div>
      </section>
    </main>
    </>
  );
}
