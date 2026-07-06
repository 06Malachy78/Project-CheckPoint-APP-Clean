'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
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
      const hasRecoveryType =
        search.get('type') === 'recovery' ||
        window.location.hash.includes('type=recovery');

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      setCanReset(Boolean(session?.user) || hasRecoveryType);
      setChecking(false);
    };

    bootstrap();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setCanReset(Boolean(session?.user));
        setChecking(false);
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setMessage('');

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setErrorMessage(error.message || 'Unable to update password.');
      setLoading(false);
      return;
    }

    // End recovery session and let user sign in with new credentials.
    await supabase.auth.signOut();
    setMessage('Password updated successfully. You can now sign in with your new password.');
    setPassword('');
    setConfirmPassword('');
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      <div className="max-w-xl mx-auto pt-32 sm:pt-28 px-4 sm:px-6 pb-16 sm:pb-20">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 sm:p-8 shadow-[0_20px_70px_rgba(0,0,0,0.35)]">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight uppercase mb-2">Reset Password</h1>
          <p className="text-zinc-400 text-sm mb-6">
            Set a new password for your account.
          </p>

          {checking ? (
            <p className="text-zinc-500 text-sm">Checking recovery link...</p>
          ) : !canReset ? (
            <div className="space-y-4">
              <p className="text-zinc-400 text-sm">
                This reset link is invalid or has expired. Request a new password reset from sign in.
              </p>
              <Link
                href="/"
                className="inline-flex rounded-full border border-zinc-700 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-300 hover:border-[#00FF88] hover:text-[#00FF88] transition-colors"
              >
                Back to Home
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-white px-5 py-3.5 rounded-2xl outline-none border border-white/5 focus:border-[#00e054]/40 transition-all"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                  required
                  minLength={8}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full text-white px-5 py-3.5 rounded-2xl outline-none border border-white/5 focus:border-[#00e054]/40 transition-all"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                  required
                  minLength={8}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full font-black py-4 rounded-xl transition-all active:scale-[0.98] uppercase text-xs tracking-widest mt-2 disabled:opacity-60"
                style={{
                  backgroundColor: '#00e054',
                  color: '#000',
                  boxShadow: '0 10px 25px rgba(0, 224, 84, 0.3)',
                }}
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>

              {errorMessage && (
                <p className="text-[11px] text-red-400 font-black uppercase tracking-[0.14em] text-center">
                  {errorMessage}
                </p>
              )}

              {message && (
                <div className="space-y-3">
                  <p className="text-[11px] text-[#00FF88] font-black uppercase tracking-[0.14em] text-center">
                    {message}
                  </p>
                  <div className="text-center">
                    <Link
                      href="/"
                      className="text-[10px] text-zinc-500 hover:text-[#00FF88] transition-colors duration-200 font-black uppercase tracking-widest"
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
