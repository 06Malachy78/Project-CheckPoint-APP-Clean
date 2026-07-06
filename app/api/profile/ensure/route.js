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

  const adminSupabase = createAdminClient();
  const writeClient = adminSupabase || supabase;

  const { data: existingProfile } = await writeClient
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  const metadataAvatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
  const resolvedUsername = normalizeUsername(
    payload?.username || existingProfile?.username || user.user_metadata?.username || user.user_metadata?.display_name,
    user.email || ''
  );

  const { error } = await writeClient
    .from('profiles')
    .upsert(
      {
        id: user.id,
        updated_at: new Date().toISOString(),
        username: resolvedUsername || 'user',
        avatar_url: metadataAvatarUrl || existingProfile?.avatar_url || null,
      },
      { onConflict: 'id' }
    );

  if (error) {
    return NextResponse.json({ error: error.message || 'Unable to ensure profile.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, username: resolvedUsername || 'user' });
}