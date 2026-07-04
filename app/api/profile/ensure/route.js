import { NextResponse } from 'next/server';
import { createClient } from '@/lib/server';
import { createAdminClient } from '@/lib/admin';

function normalizeUsername(value, fallbackEmail = '') {
  const raw = (value || '').toString().trim().toLowerCase();
  if (raw) {
    return raw.replace(/[^a-z0-9_]/g, '').slice(0, 20);
  }
  return (fallbackEmail.split('@')[0] || 'user').replace(/[^a-z0-9_]/g, '').slice(0, 20);
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

  const normalizedUsername = normalizeUsername(
    payload?.username || user.user_metadata?.username || user.user_metadata?.display_name,
    user.email || ''
  );

  const profileData = {
    id: user.id,
    username: normalizedUsername || 'user',
    avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
    updated_at: new Date().toISOString(),
  };

  const adminSupabase = createAdminClient();
  const writeClient = adminSupabase || supabase;

  const { error } = await writeClient
    .from('profiles')
    .upsert(profileData, { onConflict: 'id' });

  if (error) {
    return NextResponse.json({ error: error.message || 'Unable to ensure profile.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, username: profileData.username });
}