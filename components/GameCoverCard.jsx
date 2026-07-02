'use client';

import { useState } from 'react';

export default function GameCoverCard({ src, alt }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative w-full max-w-sm mx-auto md:max-w-none overflow-hidden rounded-2xl border border-zinc-800 shadow-2xl shadow-black/50 transition-all duration-300"
      style={{
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: isHovered
          ? '0 30px 70px rgba(0,0,0,0.55)'
          : undefined,
        borderColor: isHovered ? 'rgb(63 63 70)' : undefined,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img
        src={src}
        alt={alt}
        className="w-full rounded-2xl transition-transform duration-500"
        style={{
          transform: isHovered ? 'scale(1.035)' : 'scale(1)',
          filter: isHovered ? 'brightness(1.1)' : 'brightness(1)',
        }}
      />

      <div
        className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05) 24%, rgba(255,255,255,0) 45%)',
        }}
      />

      <div
        className="pointer-events-none absolute inset-y-[-10%] z-20 w-[40%] rotate-[18deg] blur-md transition-all duration-1000 ease-out"
        style={{
          left: isHovered ? '115%' : '-45%',
          opacity: isHovered ? 1 : 0,
          background:
            'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.72), rgba(255,255,255,0))',
        }}
      />
    </div>
  );
}