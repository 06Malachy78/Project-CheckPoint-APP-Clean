import { NextResponse } from 'next/server';
import { createClient } from '@/lib/server';

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return { supabase, user, error };
}

async function parseRequestBody(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function readFollowersCount(supabase, userId) {
  const { count, error } = await supabase
    .from('user_follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', userId);

  if (error) {
    return { count: 0, error: error.message || 'Unable to read follower count.' };
  }

  return {
    count: typeof count === 'number' ? count : 0,
    error: null,
  };
}

export async function POST(request) {
  const { supabase, user, error: authError } = await getAuthenticatedUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'You must be signed in to follow users.' }, { status: 401 });
  }

  const payload = await parseRequestBody(request);
  const targetUserId = payload?.targetUserId ? String(payload.targetUserId).trim() : '';

  if (!targetUserId) {
    return NextResponse.json({ error: 'Missing target user id.' }, { status: 400 });
  }

  if (targetUserId === user.id) {
    return NextResponse.json({ error: 'You cannot follow yourself.' }, { status: 400 });
  }

  const { error: writeError } = await supabase
    .from('user_follows')
    .upsert(
      {
        follower_id: user.id,
        following_id: targetUserId,
      },
      { onConflict: 'follower_id,following_id' }
    );

  if (writeError) {
    return NextResponse.json({ error: writeError.message || 'Unable to follow this user.' }, { status: 500 });
  }

  const { count, error } = await readFollowersCount(supabase, targetUserId);

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, isFollowing: true, followersCount: count });
}

export async function DELETE(request) {
  const { supabase, user, error: authError } = await getAuthenticatedUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'You must be signed in to unfollow users.' }, { status: 401 });
  }

  const payload = await parseRequestBody(request);
  const targetUserId = payload?.targetUserId ? String(payload.targetUserId).trim() : '';

  if (!targetUserId) {
    return NextResponse.json({ error: 'Missing target user id.' }, { status: 400 });
  }

  const { error: writeError } = await supabase
    .from('user_follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', targetUserId);

  if (writeError) {
    return NextResponse.json({ error: writeError.message || 'Unable to unfollow this user.' }, { status: 500 });
  }

  const { count, error } = await readFollowersCount(supabase, targetUserId);

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, isFollowing: false, followersCount: count });
}
