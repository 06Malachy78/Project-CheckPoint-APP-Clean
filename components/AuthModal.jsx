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
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setIsSignUp(initialMode === 'signup');
      setEmail('');
      setPassword('');
      setUsername('');
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: username.trim(),
            username: username.toLowerCase().trim(),
          },
        },
      });

      if (error) {
        alert(error.message);
      } else {
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
        alert(error.message);
      } else {
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
      </div>
    </div>
  );
}