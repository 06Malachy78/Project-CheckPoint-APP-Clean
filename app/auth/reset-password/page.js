'use client';

import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default function ResetPasswordPage() {
  const [supabase] = useState(() =>
    createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  );
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [canReset, setCanReset] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      const search = new URLSearchParams(window.location.search);
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));

      const accessToken = search.get('access_token') || hash.get('access_token');
      const refreshToken = search.get('refresh_token') || hash.get('refresh_token');
      const recoveryType = search.get('type') === 'recovery' || hash.get('type') === 'recovery';

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error && mounted) {
          setErrorMessage(error.message || 'Unable to open the reset link.');
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      if (accessToken || refreshToken || recoveryType) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      setCanReset(Boolean(session?.user));
      setChecking(false);
    };

    bootstrap();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setMessage('');

    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setErrorMessage(error.message || 'Unable to update password.');
      setLoading(false);
      return;
    }

    setMessage('Password updated successfully. You stay signed in with your new password.');
    setNewPassword('');
    setConfirmPassword('');
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      <div className="mx-auto max-w-xl px-4 pb-16 pt-32 sm:px-6 sm:pt-28 sm:pb-20">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)] sm:p-8">
          <h1 className="mb-2 text-2xl font-black tracking-tight uppercase sm:text-3xl">Reset Password</h1>
          <p className="mb-6 text-sm text-zinc-400">Set a new password for your account.</p>

          {checking ? (
            <p className="text-sm text-zinc-500">Checking recovery link...</p>
          ) : !canReset ? (
            <div className="space-y-4">
              <p className="text-sm text-zinc-400">
                This reset link is invalid or has expired. Request a new password reset from sign in.
              </p>
              <Link
                href="/"
                className="inline-flex rounded-full border border-zinc-700 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-300 transition-colors hover:border-[#00FF88] hover:text-[#00FF88]"
              >
                Back to Home
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-2xl border border-white/5 px-5 py-3.5 text-white outline-none transition-all focus:border-[#00e054]/40"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                  required
                  minLength={8}
                />
              </div>

              <div className="space-y-2">
                <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-2xl border border-white/5 px-5 py-3.5 text-white outline-none transition-all focus:border-[#00e054]/40"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                  required
                  minLength={8}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-xl py-4 text-xs font-black uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-60"
                style={{
                  backgroundColor: '#00e054',
                  color: '#000',
                  boxShadow: '0 10px 25px rgba(0, 224, 84, 0.3)',
                }}
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>

              {errorMessage && (
                <p className="text-center text-[11px] font-black uppercase tracking-[0.14em] text-red-400">
                  {errorMessage}
                </p>
              )}

              {message && (
                <div className="space-y-3">
                  <p className="text-center text-[11px] font-black uppercase tracking-[0.14em] text-[#00FF88]">
                    {message}
                  </p>
                  <div className="text-center">
                    <Link
                      href="/"
                      className="text-[10px] font-black uppercase tracking-widest text-zinc-500 transition-colors duration-200 hover:text-[#00FF88]"
                    >
                      Back to Home
                    </Link>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </main>
  );
}