
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AuthModal from './AuthModal';

export default function Navbar({ initialUser = null }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(initialUser);
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); 
  
  const dropdownRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let isMounted = true;
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (isMounted) setUser(user);
    };

    if (!initialUser) {
      getUser();
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [initialUser]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length >= 2) {
        try {
          const res = await fetch(`/api/search?q=${query}`);
          const data = await res.json();
          setResults(Array.isArray(data) ? data : []);
          setIsOpen(true);
        } catch (error) {
          console.error("Search error:", error);
          setResults([]);
        }
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const formatReleaseDate = (timestamp) => {
    if (!timestamp) return 'TBA';

    const date = new Date(timestamp * 1000);
    if (Number.isNaN(date.getTime())) return 'TBA';

    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const openAuth = (mode) => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  // 🔥 1. NEW LOGOUT FUNCTION
  const handleLogOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        alert(error.message);
      } else {
        router.refresh(); // Destroys server cookies instantly
        router.push('/');  // Redirects home
      }
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center gap-3 sm:gap-6">
          
          <Link href="/" className="text-[#00FF88] font-black text-lg sm:text-xl tracking-tighter transition-colors duration-200 hover:text-[#7CFFBF] hover:opacity-90">
            CHECKPOINT
          </Link>

          <div className="relative order-3 basis-full sm:order-2 sm:basis-auto sm:flex-grow sm:max-w-md" ref={dropdownRef}>
            <form onSubmit={handleSearchSubmit}>
              <input
                type="text"
                placeholder="Search games..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => query.length >= 2 && setIsOpen(true)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-full px-4 sm:px-5 py-2 text-sm text-white focus:outline-none focus:border-[#00FF88]/50 transition-all shadow-inner"
              />
            </form>

            {isOpen && results.length > 0 && (
              <div className="absolute top-full left-0 mt-2 w-full bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,1)] z-[100]">
                {results.map((game) => (
                  <Link
                    key={game.id}
                    href={`/game/${game.id}`}
                    onClick={() => {
                      setIsOpen(false);
                      setQuery('');
                    }}
                    className="flex items-center gap-4 p-3 hover:bg-zinc-800 transition-colors border-b border-zinc-800/50 last:border-0"
                  >
                    <img
                      src={game.cover?.url?.replace('t_thumb', 't_cover_small') || 'https://via.placeholder.com/40x54'}
                      alt={game.name}
                      className="w-10 h-14 rounded object-cover bg-zinc-800 flex-shrink-0"
                    />
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-zinc-100 line-clamp-1">{game.name}</span>
                      <span className="text-xs text-zinc-500">
                        {formatReleaseDate(game.first_release_date)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="ml-auto sm:ml-0 order-2 sm:order-3 flex items-center gap-3 sm:gap-6">
            {/* 🔥 2. ALTERED AUTHENTICATED LINKS BLOCK */}
            {user ? (
              <>
                <Link 
                  href="/profile" 
                  className={`text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] sm:tracking-widest transition-colors ${pathname === '/profile' ? 'text-[#00FF88]' : 'text-zinc-400 hover:text-[#00FF88]'}`}
                >
                  Profile
                </Link>
                
                <button 
                  onClick={handleLogOut}
                  className="text-zinc-500 hover:text-red-400 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] sm:tracking-widest transition-colors cursor-pointer bg-transparent border-none outline-none"
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                {/* CREATE ACCOUNT with Hover Glow */}
                <button 
                  onClick={() => openAuth('signup')}
                  className="text-zinc-400 hover:text-[#00FF88] text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] sm:tracking-widest transition-all duration-300"
                >
                  Create Account
                </button>

                {/* SIGN IN  ... */} 
                <button 
                  onClick={() => openAuth('login')}
                  className="bg-[#00FF88] text-black px-4 sm:px-8 py-2 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] sm:tracking-widest transition-all shadow-[0_0_20px_rgba(0,255,136,0.15)]"
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        initialMode={authMode} 
      />
    </>
  );
}