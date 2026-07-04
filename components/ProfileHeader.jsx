'use client';

import { useMemo, useState } from 'react';
import EditProfileModal from '@/components/EditProfileModal';

export default function ProfileHeader({ profile, user, totalGamesPlayed }) {
  const [isEditing, setIsEditing] = useState(false);
  const metadata = user?.user_metadata || {};

  const avatarUrl = profile?.avatar_url || profile?.avatar || profile?.image_url || metadata?.avatar_url || metadata?.picture || '';
  const sharpAvatarUrl = avatarUrl
    ? avatarUrl
        .replace(/=s\d+-c$/i, '=s256-c')
        .replace(/=s\d+$/i, '=s256')
    : '';
  const username = profile?.username || (user?.email ? user.email.split('@')[0] : 'user');

  const initials = useMemo(() => {
    const seed = (username || user?.email || 'U').trim();
    return seed.slice(0, 2).toUpperCase();
  }, [username, user?.email]);

  return (
    <section className="mb-16 border-b border-zinc-900 pb-10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="h-[72px] w-[72px] overflow-hidden rounded-full border border-zinc-600 bg-zinc-900 ring-1 ring-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
            {sharpAvatarUrl ? (
              <img src={sharpAvatarUrl} alt={`${username} avatar`} className="h-full w-full object-cover object-center" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-black text-zinc-300">
                {initials}
              </div>
            )}
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-white">My Profile</h1>
            <p className="text-zinc-400 font-mono text-xs uppercase tracking-widest mt-1">{username}</p>
            <p className="text-zinc-500 text-xs mt-1">{user?.email}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="rounded-full border border-zinc-700 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-200 transition hover:border-[#00FF88] hover:text-[#00FF88]"
        >
          Edit Profile
        </button>
      </div>

      <p className="mt-4 max-w-2xl text-zinc-400 text-sm leading-relaxed">{profile?.bio || metadata?.bio || 'No bio yet.'}</p>

      <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-zinc-300">
        {totalGamesPlayed} total {totalGamesPlayed === 1 ? 'game played' : 'games played'}
      </p>

      <EditProfileModal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        profile={profile}
        user={user}
      />
    </section>
  );
}
