"use client";

import Link from 'next/link';
import { useMemo, useState } from 'react';

const PREVIEW_LIMIT = 8;

function Avatar({ profile, isMutual, small = false }) {
  const avatarUrl = profile.avatar_url || profile.avatar || profile.image_url || '';
  const initials = (profile.username || 'U').slice(0, 2).toUpperCase();

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={`${profile.username} avatar`}
        className={`${small ? 'h-8 w-8' : 'h-9 w-9'} rounded-full bg-zinc-800 object-cover transition ${
          isMutual
            ? 'border-2 border-[#00FF88]'
            : 'border border-zinc-700 hover:border-[#00FF88]/60'
        }`}
      />
    );
  }

  return (
    <div
      className={`flex ${small ? 'h-8 w-8 text-[9px]' : 'h-9 w-9 text-[10px]'} items-center justify-center rounded-full bg-zinc-800 font-black uppercase text-zinc-300 transition ${
        isMutual
          ? 'border-2 border-[#00FF88]'
          : 'border border-zinc-700 hover:border-[#00FF88]/60'
      }`}
    >
      {initials}
    </div>
  );
}

export default function FollowConnectionsSection({
  title,
  users = [],
  allUsers = [],
  emptyText,
  mutualUserIds = [],
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fullUsers = allUsers.length > 0 ? allUsers : users;
  const previewUsers = useMemo(() => fullUsers.slice(0, PREVIEW_LIMIT), [fullUsers]);
  const mutualSet = new Set(mutualUserIds || []);
  const canOpenFullList = fullUsers.length > PREVIEW_LIMIT;

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        {canOpenFullList ? (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 transition hover:text-[#00FF88]"
          >
            {title}
          </button>
        ) : (
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">{title}</h2>
        )}
        <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-600">{fullUsers.length}</span>
      </div>

      {fullUsers.length === 0 ? (
        <p className="text-xs uppercase tracking-widest text-zinc-600 italic">{emptyText}</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {previewUsers.map((profile) => {
            const isMutual = mutualSet.has(profile.id);

            return (
              <Link
                key={profile.id}
                href={`/profile/${profile.username}`}
                title={isMutual ? `${profile.username} (mutual follow)` : profile.username}
                aria-label={isMutual ? `${profile.username}, mutual follow` : profile.username}
                className={`relative transition ${
                  isMutual ? 'drop-shadow-[0_0_8px_rgba(0,255,136,0.25)]' : ''
                }`}
              >
                <Avatar profile={profile} isMutual={isMutual} small />

                {isMutual && (
                  <span
                    className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border border-zinc-950 bg-[#00FF88]"
                    aria-hidden="true"
                  />
                )}
              </Link>
            );
          })}
        </div>
      )}

      {canOpenFullList && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="rounded-full border border-zinc-700 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.18em] text-zinc-500 transition hover:border-[#00FF88]/50 hover:text-[#00FF88]"
          >
            View all
          </button>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
            aria-label="Close full list"
          />

          <div className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-300">
                {title} ({fullUsers.length})
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-full border border-zinc-700 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300 transition hover:border-[#00FF88] hover:text-[#00FF88]"
              >
                Close
              </button>
            </div>

            <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
              {fullUsers.map((profile) => {
                const isMutual = mutualSet.has(profile.id);

                return (
                  <Link
                    key={profile.id}
                    href={`/profile/${profile.username}`}
                    onClick={() => setIsModalOpen(false)}
                    className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 transition hover:border-[#00FF88]/60"
                  >
                    <Avatar profile={profile} isMutual={isMutual} />
                    <span className="truncate text-sm font-black uppercase tracking-wide text-zinc-100">
                      {profile.username}
                    </span>
                    {isMutual && (
                      <span className="ml-auto rounded-full border border-[#00FF88]/50 bg-[#00FF88]/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-[#00FF88]">
                        Mutual
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
