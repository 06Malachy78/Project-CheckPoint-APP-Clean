'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import GuestLanding from '@/components/GuestLanding';
import GlobalActivityFeed from '@/components/GlobalActivityFeed';

export default function HomeContent({ initialFeedItems, totalCheckpoints, initialIsGuest, trendingGames = [] }) {
  const [isGuest, setIsGuest] = useState(initialIsGuest);

  useEffect(() => {
    let mounted = true;

    const updateUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (mounted) {
        setIsGuest(!user);
      }
    };

    updateUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      setIsGuest(!session?.user);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (isGuest) {
    return <GuestLanding totalCheckpoints={totalCheckpoints || 0} trendingGames={trendingGames} />;
  }

  return (
    <>
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter mb-2 text-zinc-100 uppercase">
            Global Activity
          </h1>
          <p className="text-zinc-500 font-medium">Recent checkpoints from the community.</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 px-4 py-2 rounded-full flex items-center gap-3 w-fit shadow-xl shadow-black/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FF88] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00FF88]"></span>
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.12em] sm:tracking-[0.2em] text-zinc-400">
            {totalCheckpoints || 0} Checkpoints Logged
          </span>
        </div>
      </header>

      <GlobalActivityFeed feedItems={initialFeedItems} />

      {initialFeedItems.length === 0 && (
        <div className="text-center py-20 border-2 border-dashed border-zinc-900 rounded-3xl">
          <p className="text-zinc-500 italic font-medium">The feed is quiet... go log a game!</p>
        </div>
      )}
    </>
  );
}
