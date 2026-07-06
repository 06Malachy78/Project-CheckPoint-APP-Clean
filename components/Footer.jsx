export default function Footer() {
  return (
    <footer className="w-full border-t border-zinc-800 bg-zinc-950/95 text-zinc-500 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] sm:text-xs uppercase tracking-[0.16em] sm:tracking-widest text-zinc-500 text-center sm:text-left">
          CHECKPOINT · Game discovery, reviews, and highlights
        </p>

        <div className="flex flex-row items-center justify-center sm:justify-end gap-5 sm:gap-6 text-xs text-zinc-400">
          <a href="/about" className="hover:text-white transition-colors">
            About
          </a>
          <span className="hidden sm:inline">|</span>
          <span>2026</span>
        </div>
      </div>
    </footer>
  );
}
