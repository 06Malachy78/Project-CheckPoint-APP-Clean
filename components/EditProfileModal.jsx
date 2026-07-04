'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

export default function EditProfileModal({ isOpen, onClose, profile, user }) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const initials = useMemo(() => {
    const seed = (username || profile?.username || user?.email || 'U').trim();
    return seed.slice(0, 2).toUpperCase();
  }, [profile?.username, user?.email, username]);

  useEffect(() => {
    if (!isOpen) return;

    const metadata = user?.user_metadata || {};

    setUsername((profile?.username || '').toLowerCase());
    setEmail(user?.email || '');
    setBio(profile?.bio || metadata?.bio || '');
    setAvatarUrl(profile?.avatar_url || profile?.avatar || profile?.image_url || metadata?.avatar_url || metadata?.picture || '');
    setMessage('');
    setErrorMessage('');
  }, [isOpen, profile, user]);

  if (!isOpen) return null;

  const uploadAvatar = async (file) => {
    if (!file || !user?.id) return;

    setErrorMessage('');
    setMessage('Uploading avatar...');

    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeExtension = extension.replace(/[^a-z0-9]/g, '') || 'jpg';
    const filePath = `${user.id}/${Date.now()}.${safeExtension}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true, cacheControl: '3600' });

    if (uploadError) {
      setMessage('');
      setErrorMessage(uploadError.message || 'Unable to upload avatar image.');
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('avatars').getPublicUrl(filePath);

    setAvatarUrl(publicUrl || '');
    setMessage('Avatar uploaded. Save profile to apply changes.');
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!user?.id || isSaving) return;

    setIsSaving(true);
    setMessage('');
    setErrorMessage('');

    const normalizedUsername = username.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedBio = bio.trim();
    const normalizedAvatarUrl = avatarUrl.trim();

    if (!USERNAME_PATTERN.test(normalizedUsername)) {
      setErrorMessage('Username must be 3-20 characters and use only letters, numbers, or underscores.');
      setIsSaving(false);
      return;
    }

    if (!normalizedEmail) {
      setErrorMessage('Email is required.');
      setIsSaving(false);
      return;
    }

    const { data: existingUsername, error: usernameCheckError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', normalizedUsername)
      .neq('id', user.id)
      .maybeSingle();

    if (usernameCheckError) {
      setErrorMessage(usernameCheckError.message || 'Unable to validate username.');
      setIsSaving(false);
      return;
    }

    if (existingUsername) {
      setErrorMessage('That username is already taken.');
      setIsSaving(false);
      return;
    }

    const baseProfileUpdate = {
      id: user.id,
      username: normalizedUsername,
      avatar_url: normalizedAvatarUrl || null,
      updated_at: new Date().toISOString(),
    };

    let { error: profileError } = await supabase.from('profiles').upsert(
      {
        ...baseProfileUpdate,
        bio: normalizedBio || null,
      },
      { onConflict: 'id' }
    );

    if (profileError?.message?.toLowerCase().includes("'bio' column")) {
      const retryResult = await supabase
        .from('profiles')
        .upsert(baseProfileUpdate, { onConflict: 'id' });
      profileError = retryResult.error;
    }

    if (profileError) {
      setErrorMessage(profileError.message || 'Unable to update profile details.');
      setIsSaving(false);
      return;
    }

    const profileUsername = (profile?.username || '').toLowerCase();
    if (normalizedUsername !== profileUsername) {
      const { error: reviewUsernameError } = await supabase
        .from('reviews')
        .update({ username: normalizedUsername })
        .eq('user_id', user.id);

      if (reviewUsernameError) {
        console.error('Unable to sync username in previous reviews:', reviewUsernameError.message);
      }
    }

    const authPayload = {
      data: {
        username: normalizedUsername,
        display_name: normalizedUsername,
        bio: normalizedBio || null,
        avatar_url: normalizedAvatarUrl || null,
      },
    };

    if (normalizedEmail !== (user.email || '').toLowerCase()) {
      authPayload.email = normalizedEmail;
    }

    const { error: authError } = await supabase.auth.updateUser(authPayload);
    if (authError) {
      setErrorMessage(authError.message || 'Profile saved, but auth details could not be updated.');
      setIsSaving(false);
      return;
    }

    setMessage(
      normalizedEmail !== (user.email || '').toLowerCase()
        ? 'Profile updated. Check your inbox to confirm your new email address.'
        : 'Profile updated successfully.'
    );

    setIsSaving(false);
    router.refresh();
    setTimeout(() => {
      onClose();
    }, 350);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      <form
        onSubmit={handleSave}
        className="relative z-10 w-full max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-950 p-5 sm:p-8 shadow-[0_35px_80px_rgba(0,0,0,0.65)]"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] font-black text-zinc-500">Profile Settings</p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-white">Edit Profile</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
          >
            Close
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-[220px_1fr]">
          <div className="space-y-3">
            <div className="mx-auto h-36 w-36 overflow-hidden rounded-full border-2 border-zinc-700 bg-zinc-900">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile avatar preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-black text-zinc-300">{initials}</div>
              )}
            </div>

            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
              Upload Avatar
              <div className="mt-2 flex justify-center rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2">
                <label className="cursor-pointer rounded-lg bg-[#00FF88] px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-black">
                  Choose File
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) => {
                      const selectedFile = event.target.files?.[0];
                      uploadAvatar(selectedFile);
                    }}
                  />
                </label>
              </div>
            </label>

            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
              Or Avatar URL
              <input
                type="url"
                value={avatarUrl}
                onChange={(event) => setAvatarUrl(event.target.value)}
                placeholder="https://..."
                className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-[#00FF88]/60"
              />
            </label>
          </div>

          <div className="space-y-4">
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
              Username
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="yourname"
                className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-[#00FF88]/60"
                required
              />
            </label>

            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-[#00FF88]/60"
                required
              />
            </label>

            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
              Bio
              <textarea
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                rows={6}
                maxLength={220}
                placeholder="Tell everyone what you are currently playing..."
                className="mt-2 w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-[#00FF88]/60"
              />
              <span className="mt-1 inline-block text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600">
                {bio.length}/220
              </span>
            </label>
          </div>
        </div>

        {(errorMessage || message) && (
          <p className={`mt-5 text-xs uppercase tracking-[0.16em] font-bold ${errorMessage ? 'text-red-400' : 'text-[#00FF88]'}`}>
            {errorMessage || message}
          </p>
        )}

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-700 px-5 py-2.5 text-xs font-black uppercase tracking-[0.16em] text-zinc-300 hover:border-zinc-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-xl bg-[#00FF88] px-6 py-2.5 text-xs font-black uppercase tracking-[0.16em] text-black shadow-[0_10px_25px_rgba(0,255,136,0.25)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
