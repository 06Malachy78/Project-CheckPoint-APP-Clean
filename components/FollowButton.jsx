'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { parseApiResponse } from '@/lib/api-client';

export default function FollowButton({
  targetUserId,
  initiallyFollowing = false,
  initiallyFollowersCount = 0,
  compact = false,
  showCount = true,
}) {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(Boolean(initiallyFollowing));
  const [followersCount, setFollowersCount] = useState(
    typeof initiallyFollowersCount === 'number' ? initiallyFollowersCount : 0
  );
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleToggleFollow = async () => {
    if (!targetUserId || isSaving) {
      return;
    }

    setErrorMessage('');
    setIsSaving(true);

    const method = isFollowing ? 'DELETE' : 'POST';
    const response = await fetch('/api/profile/follow', {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ targetUserId }),
    });

    const result = await parseApiResponse(response);

    if (!response.ok) {
      setErrorMessage(result.error || 'Unable to update follow state.');
      setIsSaving(false);
      return;
    }

    setIsFollowing(Boolean(result.isFollowing));
    if (typeof result.followersCount === 'number') {
      setFollowersCount(result.followersCount);
    }
    setIsSaving(false);
    router.refresh();
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleToggleFollow}
        disabled={isSaving}
        className={`rounded-full border font-black uppercase tracking-[0.2em] transition disabled:cursor-not-allowed disabled:opacity-70 ${
          compact ? 'px-3 py-1.5 text-[9px]' : 'px-4 py-2 text-[10px]'
        } ${
          isFollowing
            ? 'border-zinc-700 text-zinc-200 hover:border-red-400 hover:text-red-400'
            : 'border-[#00FF88] text-[#00FF88] hover:bg-[#00FF88] hover:text-black'
        }`}
      >
        {isSaving ? 'Saving…' : isFollowing ? 'Unfollow' : 'Follow'}
      </button>

      {showCount && !compact && (
        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          {followersCount} {followersCount === 1 ? 'follower' : 'followers'}
        </p>
      )}

      {errorMessage && (
        <p className="text-[10px] uppercase tracking-[0.2em] text-red-400">{errorMessage}</p>
      )}
    </div>
  );
}
