import { NextResponse } from 'next/server';
import { createClient } from '@/lib/server';
import { createAdminClient } from '@/lib/admin';

function pickMostRecentAvatar(objects) {
  if (!Array.isArray(objects) || objects.length === 0) {
    return null;
  }

  const toTime = (value) => {
    const timestamp = Date.parse(value || '');
    return Number.isNaN(timestamp) ? 0 : timestamp;
  };

  const ranked = [...objects].sort((a, b) => {
    const aTime = toTime(a.updated_at || a.created_at || a.last_accessed_at);
    const bTime = toTime(b.updated_at || b.created_at || b.last_accessed_at);

    if (aTime !== bTime) {
      return bTime - aTime;
    }

    return String(b.name || '').localeCompare(String(a.name || ''));
  });

  return ranked[0] || null;
}

export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  let payload = {};
  try {
    payload = await request.json();
  } catch {
    payload = {};
  }

  const force = Boolean(payload?.force);
  const adminSupabase = createAdminClient();
  const writeClient = adminSupabase || supabase;

  const { data: profile, error: profileReadError } = await writeClient
    .from('profiles')
    .select('avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  if (profileReadError) {
    return NextResponse.json({ error: profileReadError.message || 'Unable to read profile.' }, { status: 500 });
  }

  if (profile?.avatar_url && !force) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: 'Profile already has an avatar. Send { force: true } to overwrite.',
      avatar_url: profile.avatar_url,
    });
  }

  const storageClient = adminSupabase || supabase;
  const { data: avatarObjects, error: avatarsListError } = await storageClient.storage
    .from('avatars')
    .list(user.id, { limit: 100, offset: 0 });

  if (avatarsListError) {
    return NextResponse.json({ error: avatarsListError.message || 'Unable to list avatar files.' }, { status: 500 });
  }

  const latestAvatar = pickMostRecentAvatar(avatarObjects || []);
  if (!latestAvatar?.name) {
    return NextResponse.json({ error: 'No avatar files found to recover.' }, { status: 404 });
  }

  const avatarPath = `${user.id}/${latestAvatar.name}`;
  const {
    data: { publicUrl },
  } = storageClient.storage.from('avatars').getPublicUrl(avatarPath);

  if (!publicUrl) {
    return NextResponse.json({ error: 'Unable to derive avatar public URL.' }, { status: 500 });
  }

  const { error: updateError } = await writeClient
    .from('profiles')
    .upsert(
      {
        id: user.id,
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

  if (updateError) {
    return NextResponse.json({ error: updateError.message || 'Unable to update profile avatar.' }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    recovered: true,
    avatar_url: publicUrl,
    storage_path: avatarPath,
  });
}