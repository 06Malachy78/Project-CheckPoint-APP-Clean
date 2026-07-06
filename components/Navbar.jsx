
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AuthModal from './AuthModal';

const NOTIFICATION_STORAGE_KEY = 'checkpoint.notifications.lastSeen';

function formatRelativeTime(timestamp) {
  if (!timestamp) return '';

  const value = new Date(timestamp).getTime();
  if (Number.isNaN(value)) return '';

  const diffMs = Date.now() - value;
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default function Navbar({ initialUser = null }) {
  const [query, setQuery] = useState('');
  const [gameResults, setGameResults] = useState([]);
  const [userResults, setUserResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(initialUser);
  const [notifications, setNotifications] = useState([]);
  const [notificationsError, setNotificationsError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(false);
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); 
  
  const dropdownRef = useRef(null);
  const notificationsRef = useRef(null);
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
    const currentQuery = query;
    const delayDebounceFn = setTimeout(async () => {
      if (currentQuery.length >= 2) {
        setIsSearching(true);
        setIsOpen(true);
        setGameResults([]);
        setUserResults([]);

        try {
          const [gamesRes, usersRes] = await Promise.all([
            fetch(`/api/search?q=${encodeURIComponent(currentQuery)}`),
            fetch(`/api/search/users?q=${encodeURIComponent(currentQuery)}`),
          ]);

          const [gamesData, usersData] = await Promise.all([
            gamesRes.json(),
            usersRes.json(),
          ]);

          const safeGames = Array.isArray(gamesData) ? gamesData : [];
          const safeUsers = Array.isArray(usersData) ? usersData : [];

          setGameResults(safeGames);
          setUserResults(safeUsers);
          setIsOpen(safeGames.length > 0 || safeUsers.length > 0);
        } catch (error) {
          console.error("Search error:", error);
          setGameResults([]);
          setUserResults([]);
          setIsOpen(false);
        } finally {
          setIsSearching(false);
        }
      } else {
        setIsSearching(false);
        setGameResults([]);
        setUserResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const trackUserResultClick = (username) => {
    if (!username) return;

    void fetch('/api/analytics/user-search-click', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        source: 'navbar',
        query,
      }),
      keepalive: true,
    }).catch(() => {});
  };

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      setNotificationsError('');
      setIsNotificationsLoading(false);
      return;
    }

    setIsNotificationsLoading(true);
    setNotificationsError('');

    try {
      const response = await fetch('/api/notifications?limit=20');
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setNotifications([]);
        setUnreadCount(0);
        setNotificationsError(payload?.error || 'Unable to load notifications.');
        return;
      }

      const safeNotifications = Array.isArray(payload?.notifications) ? payload.notifications : [];
      setNotifications(safeNotifications);

      const key = `${NOTIFICATION_STORAGE_KEY}.${user.id}`;
      const lastSeenRaw = window.localStorage.getItem(key) || '';
      const lastSeen = Date.parse(lastSeenRaw);
      const baseline = Number.isNaN(lastSeen) ? 0 : lastSeen;

      const unread = safeNotifications.filter((entry) => {
        const createdAt = Date.parse(entry?.createdAt || '');
        return !Number.isNaN(createdAt) && createdAt > baseline;
      }).length;

      setUnreadCount(unread);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
      setNotificationsError('Unable to load notifications.');
    } finally {
      setIsNotificationsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const intervalId = window.setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [fetchNotifications, user?.id]);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }

      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleNotificationsToggle = () => {
    const willOpen = !isNotificationsOpen;
    setIsNotificationsOpen(willOpen);

    if (willOpen && user?.id) {
      const key = `${NOTIFICATION_STORAGE_KEY}.${user.id}`;
      window.localStorage.setItem(key, new Date().toISOString());
      setUnreadCount(0);
      fetchNotifications();
    }
  };

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
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex flex-wrap items-center gap-2 sm:gap-6">
          
          <Link href="/" className="text-[#00FF88] font-black text-base sm:text-xl tracking-tight transition-colors duration-200 hover:text-[#7CFFBF] hover:opacity-90">
            CHECKPOINT
          </Link>

          <div className="relative order-3 basis-full sm:order-2 sm:basis-auto sm:flex-grow sm:max-w-md" ref={dropdownRef}>
            <form onSubmit={handleSearchSubmit}>
              <input
                type="text"
                placeholder="Search games or users..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => query.length >= 2 && setIsOpen(true)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-full px-4 sm:px-5 py-2 text-sm text-white focus:outline-none focus:border-[#00FF88]/50 transition-all shadow-inner"
              />
            </form>

            {isOpen && (isSearching || userResults.length > 0 || gameResults.length > 0) && (
              <div className="absolute top-full left-0 mt-2 w-full bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,1)] z-[100] max-h-[70vh] overflow-y-auto">
                {isSearching && (
                  <div>
                    <div className="border-b border-zinc-800/70">
                      <p className="px-3 pt-3 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Users</p>
                      {[1, 2, 3].map((item) => (
                        <div key={item} className="flex items-center gap-3 p-3 animate-pulse">
                          <div className="w-10 h-10 rounded-full bg-zinc-800 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="h-3 bg-zinc-800 rounded w-2/5 mb-2" />
                            <div className="h-2.5 bg-zinc-800 rounded w-3/5" />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div>
                      <p className="px-3 pt-3 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Games</p>
                      {[1, 2].map((item) => (
                        <div key={item} className="flex items-center gap-4 p-3 animate-pulse border-b border-zinc-800/50 last:border-0">
                          <div className="w-10 h-14 rounded bg-zinc-800 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="h-3 bg-zinc-800 rounded w-2/3 mb-2" />
                            <div className="h-2.5 bg-zinc-800 rounded w-1/3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {userResults.length > 0 && (
                  <div className="border-b border-zinc-800/70">
                    <p className="px-3 pt-3 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Users</p>
                    {userResults.map((profile) => {
                      const avatarUrl = profile.avatar_url || profile.avatar || profile.image_url || '';
                      const initials = (profile.username || 'U').slice(0, 2).toUpperCase();

                      return (
                        <Link
                          key={profile.id}
                          href={`/profile/${profile.username}`}
                          onClick={() => {
                            trackUserResultClick(profile.username);
                            setIsOpen(false);
                            setQuery('');
                          }}
                          className="flex items-center gap-3 p-3 hover:bg-zinc-800 transition-colors"
                        >
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={`${profile.username} avatar`}
                              className="w-10 h-10 rounded-full object-cover bg-zinc-800 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-zinc-800 text-zinc-300 font-black text-xs flex items-center justify-center flex-shrink-0">
                              {initials}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="block font-bold text-sm text-zinc-100 truncate">{profile.username}</span>
                            <span className="block text-xs text-zinc-500 truncate">{profile.bio || 'View profile'}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}

                {gameResults.length > 0 && (
                  <div>
                    <p className="px-3 pt-3 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Games</p>
                    {gameResults.map((game) => (
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
                          src={game.cover?.url?.replace('t_thumb', 't_cover_small') || '/no-cover.svg'}
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
            )}
          </div>

          <div className="ml-auto order-2 sm:order-3 flex items-center gap-2 sm:gap-5 flex-wrap justify-end">
            {/* 🔥 2. ALTERED AUTHENTICATED LINKS BLOCK */}
            {user ? (
              <>
                <div className="relative" ref={notificationsRef}>
                  <button
                    type="button"
                    onClick={handleNotificationsToggle}
                    aria-label="Notifications"
                    aria-expanded={isNotificationsOpen}
                    className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-[#00FF88]/50 hover:text-[#00FF88] transition-colors"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
                      <path d="M15 17h5l-1.4-1.4c-.4-.4-.6-.9-.6-1.5V11a6 6 0 10-12 0v3.1c0 .6-.2 1.1-.6 1.5L4 17h5" />
                      <path d="M9 17a3 3 0 006 0" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#00FF88] text-black text-[10px] leading-[18px] font-black">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {isNotificationsOpen && (
                    <div className="absolute right-0 mt-2 w-[320px] max-w-[85vw] rounded-2xl border border-zinc-800 bg-zinc-950 shadow-[0_20px_50px_rgba(0,0,0,0.75)] z-[110] overflow-hidden">
                      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
                        <p className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-400">Notifications</p>
                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600">
                          {notifications.length} items
                        </span>
                      </div>

                      <div className="max-h-[360px] overflow-y-auto">
                        {isNotificationsLoading ? (
                          <p className="px-4 py-4 text-xs uppercase tracking-[0.16em] text-zinc-500">Loading...</p>
                        ) : notificationsError ? (
                          <p className="px-4 py-4 text-xs uppercase tracking-[0.16em] text-red-400">{notificationsError}</p>
                        ) : notifications.length === 0 ? (
                          <p className="px-4 py-4 text-xs uppercase tracking-[0.16em] text-zinc-500">No recent friend activity.</p>
                        ) : (
                          notifications.map((item) => {
                            const initials = (item.actorUsername || 'U').slice(0, 2).toUpperCase();
                            return (
                              <Link
                                key={item.id}
                                href={item.href || '/profile'}
                                onClick={() => setIsNotificationsOpen(false)}
                                className="flex items-start gap-3 border-b border-zinc-900 px-4 py-3 hover:bg-zinc-900/80 transition-colors"
                              >
                                {item.actorAvatarUrl ? (
                                  <img
                                    src={item.actorAvatarUrl}
                                    alt={`${item.actorUsername || 'User'} avatar`}
                                    className="h-9 w-9 rounded-full object-cover bg-zinc-900 border border-zinc-800"
                                  />
                                ) : (
                                  <div className="h-9 w-9 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-black flex items-center justify-center">
                                    {initials}
                                  </div>
                                )}

                                <div className="min-w-0">
                                  <p className="text-sm text-zinc-100 leading-snug break-words">{item.title}</p>
                                  <p className="mt-1 text-xs text-zinc-500 truncate">{item.subtitle}</p>
                                  <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-zinc-600">
                                    {formatRelativeTime(item.createdAt)}
                                  </p>
                                </div>
                              </Link>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Link 
                  href="/profile" 
                  className={`text-[10px] sm:text-xs font-black uppercase tracking-[0.14em] sm:tracking-[0.2em] transition-colors ${pathname === '/profile' ? 'text-[#00FF88]' : 'text-zinc-400 hover:text-[#00FF88]'}`}
                >
                  Profile
                </Link>
                
                <button 
                  onClick={handleLogOut}
                  className="text-zinc-500 hover:text-red-400 text-[10px] sm:text-xs font-black uppercase tracking-[0.14em] sm:tracking-[0.2em] transition-colors cursor-pointer bg-transparent border-none outline-none"
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                {/* CREATE ACCOUNT with Hover Glow */}
                <button 
                  onClick={() => openAuth('signup')}
                  className="text-zinc-400 hover:text-[#00FF88] text-[10px] sm:text-xs font-black uppercase tracking-[0.14em] sm:tracking-[0.2em] transition-all duration-300"
                >
                  Create Account
                </button>

                {/* SIGN IN  ... */} 
                <button 
                  onClick={() => openAuth('login')}
                  className="bg-[#00FF88] text-black px-3.5 sm:px-8 py-2 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-[0.14em] sm:tracking-[0.2em] transition-all shadow-[0_0_20px_rgba(0,255,136,0.15)]"
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