'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AuthModal({ isOpen, onClose, initialMode = 'login', onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [loading, setLoading] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const router = useRouter();

  const toFriendlyAuthMessage = (rawMessage, fallbackMessage) => {
    const safeMessage = String(rawMessage || '').trim();
    const lowered = safeMessage.toLowerCase();

    if (lowered.includes('email rate limit exceeded') || lowered.includes('rate limit')) {
      return 'Too many auth emails were sent recently. Please wait a minute and try again.';
    }

    return safeMessage || fallbackMessage;
  };

  useEffect(() => {
    if (isOpen) {
      setIsSignUp(initialMode === 'signup');
      setEmail('');
      setPassword('');
      setUsername('');
      setPendingVerificationEmail('');
      setResendLoading(false);
      setAuthMessage('');
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const ensureProfile = async (normalizedUsername = '') => {
    const ensureResponse = await fetch('/api/profile/ensure', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: normalizedUsername }),
    });

    if (!ensureResponse.ok) {
      throw new Error('Ensure profile request failed');
    }
  };

  const getEmailRedirectUrl = () => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    return `${window.location.origin}/`;
  };

  const handleResendVerification = async () => {
    const safeEmail = pendingVerificationEmail || email.trim();
    if (!safeEmail) {
      return;
    }

    setResendLoading(true);
    setAuthMessage('');
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: safeEmail,
      options: {
        emailRedirectTo: getEmailRedirectUrl(),
      },
    });

    if (error) {
      setAuthMessage(toFriendlyAuthMessage(error.message, 'Unable to resend verification email.'));
    } else {
      setAuthMessage('Verification email sent.');
    }

    setResendLoading(false);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAuthMessage('');

    if (isSignUp) {
      const normalizedUsername = username.toLowerCase().trim();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: getEmailRedirectUrl(),
          data: {
            display_name: username.trim(),
            username: normalizedUsername,
          },
        },
      });

      if (error) {
        setAuthMessage(toFriendlyAuthMessage(error.message, 'Unable to create account.'));
      } else {
        if (!data?.session) {
          setPendingVerificationEmail(email.trim());
          setLoading(false);
          return;
        }

        try {
          await ensureProfile(normalizedUsername);
        } catch {
          // Fallback attempt through client session if server cookies are not ready yet.
          const signedInUser = data?.user;
          if (signedInUser?.id) {
            await supabase.from('profiles').upsert(
              {
                id: signedInUser.id,
                username: normalizedUsername,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'id' }
            );
          }
        }

        alert('Account created successfully! You are now logged in.');
        onClose();
        onSuccess?.();
        router.refresh();
      }
    } else {
      // Clean, native email sign-in
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        setAuthMessage(toFriendlyAuthMessage(error.message, 'Unable to sign in.'));
      } else {
        try {
          await ensureProfile();
        } catch {
          // If profile ensure fails we still keep user signed in.
        }
        onClose();
        onSuccess?.();
        router.refresh();
      }
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
      <div className="absolute inset-0" onClick={onClose} />

      <div 
        className="relative z-10 w-full flex flex-col shadow-[0_20px_80px_rgba(0,0,0,0.8)]"
        style={{ 
          maxWidth: '400px', 
          backgroundColor: 'rgba(15, 18, 22, 0.9)', 
          padding: '48px', 
          borderRadius: '32px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
        }}
      >
        <div className="text-center mb-10">
          <h2 className="text-white text-3xl font-black italic tracking-tighter uppercase leading-none">
            {isSignUp ? 'Join' : 'Sign In'}
          </h2>
          <div className="h-1.5 w-10 bg-[#00e054] mx-auto mt-3 rounded-full shadow-[0_0_15px_rgba(0,224,84,0.4)]" />
        </div>

        {pendingVerificationEmail ? (
          <div className="w-full flex flex-col gap-5">
            <p className="text-sm text-zinc-300 leading-relaxed">
              We sent a verification link to <span className="text-[#00e054] font-bold">{pendingVerificationEmail}</span>.
              Confirm your email to finish signing in.
            </p>

            <button
              type="button"
              onClick={handleResendVerification}
              disabled={resendLoading}
              className="w-full font-black py-4 rounded-xl transition-all active:scale-[0.98] uppercase text-xs tracking-widest mt-1 disabled:opacity-60"
              style={{
                backgroundColor: '#00e054',
                color: '#000',
                boxShadow: '0 10px 25px rgba(0, 224, 84, 0.3)'
              }}
            >
              {resendLoading ? 'Sending...' : 'Resend Verification Email'}
            </button>

            <button
              type="button"
              onClick={() => {
                setPendingVerificationEmail('');
                setIsSignUp(false);
              }}
              className="text-[10px] text-zinc-500 hover:text-[#00FF88] transition-colors duration-200 font-black uppercase tracking-widest text-center w-full cursor-pointer"
            >
              Back to login
            </button>

            {authMessage && (
              <p className="text-[10px] text-red-400 font-black uppercase tracking-[0.14em]">{authMessage}</p>
            )}
          </div>
        ) : (
        <>
        <form onSubmit={handleAuth} className="w-full flex flex-col gap-5">
          
          {/* USERNAME: Only renders on Sign Up */}
          {isSignUp && (
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Username</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. dave"
                className="w-full text-white px-5 py-3.5 rounded-2xl outline-none border border-white/5 focus:border-[#00e054]/40 transition-all placeholder:text-zinc-700 text-sm"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}  
                required={isSignUp}
              />
            </div>
          )}

          {/* EMAIL ADDRESS: Rendered for both Login and Signup */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full text-white px-5 py-3.5 rounded-2xl outline-none border border-white/5 focus:border-[#00e054]/40 transition-all placeholder:text-zinc-700 text-sm"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
              required
            />
          </div>

          {/* PASSWORD */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-white px-5 py-3.5 rounded-2xl outline-none border border-white/5 focus:border-[#00e054]/40 transition-all hover:border-white/10"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
              required
            />
          </div>

          <button   
            disabled={loading}
            className="w-full font-black py-4 rounded-xl transition-all active:scale-[0.98] uppercase text-xs tracking-widest mt-4 hover:border-white/10"
            style={{ 
              backgroundColor: '#00e054', 
              color: '#000',
              boxShadow: '0 10px 25px rgba(0, 224, 84, 0.3)' 
            }}
          >
            {loading ? '...' : isSignUp ? 'Create Account' : 'Log In'}
          </button>
        </form>

        <button 
          onClick={() => setIsSignUp(!isSignUp)}
          className="mt-8 text-[10px] text-zinc-500 hover:text-[#00FF88] transition-colors duration-200 font-black uppercase tracking-widest text-center w-full cursor-pointer"
        >
          {isSignUp ? 'Already a member? Log in' : 'No account? Sign up'}
        </button>

        {authMessage && (
          <p className="mt-4 text-[10px] text-red-400 font-black uppercase tracking-[0.14em] text-center">{authMessage}</p>
        )}
        </>
        )}
      </div>
    </div>
  );
}