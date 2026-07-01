import Link from 'next/link';
import { createClient } from '../../lib/server';
import GameCard from '@/components/GameCard';
import TopGamesEditor from '@/components/TopGamesEditor';
import ReviewCard from '@/components/ReviewCard.jsx';

export default async function ProfilePage() {
  const supabase = await createClient(); 
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <p className="pt-32 text-center text-zinc-500 uppercase tracking-widest text-xs">Please log in to view your profile.</p>;

  // Kick off both database queries simultaneously
  const [profileResponse, reviewsResponse] = await Promise.all([
  supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle(),
    
  supabase
    .from('reviews')
    .select('*')
    // 🎯 FIX: Remove the .or() filter and target strictly by user.id
    .eq('user_id', user.id) 
    .order('created_at', { ascending: false })
]);

  const profile = profileResponse.data;
  const reviews = reviewsResponse.data || [];

  return (
    <main className="max-w-4xl mx-auto pt-32 px-6 pb-20">
      <Link href="/" className="inline-flex items-center gap-2 text-[#00FF88] hover:opacity-70 transition-opacity mb-8 text-xs font-bold uppercase tracking-widest">
        ← Back to Dashboard
      </Link>
      
      <section className="mb-16 border-b border-zinc-900 pb-10">
        <h1 className="text-4xl font-black mb-2 uppercase tracking-tighter text-white">My Profile</h1>
        <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">
           {profile?.username || user.email}
        </p>
      </section>

      {/* Top 3 Games Section */}
      <section className="mb-16">
        <h2 className="text-lg font-black mb-6 flex items-center gap-2 uppercase tracking-widest text-zinc-400">
          <span className="text-[#00FF88]">★</span> Top 3 All-Time
        </h2>
        <TopGamesEditor profile={profile} userId={user.id} />
      </section>

      {/* User Reviews Section */}
      <section>
        <h2 className="text-lg font-black mb-6 uppercase tracking-widest text-zinc-400">My Reviews</h2>
        <div className="space-y-4">
          {reviews.length > 0 ? (
            reviews.map((review) => <ReviewCard key={review.id} review={review} />)
          ) : (
            <p className="text-zinc-600 text-xs uppercase tracking-widest italic">You haven't reviewed any games yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}