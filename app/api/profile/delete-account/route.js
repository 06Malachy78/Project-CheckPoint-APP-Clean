import { NextResponse } from 'next/server';
import { createClient } from '@/lib/server';
import { createAdminClient } from '@/lib/admin';

function isIgnorableDeleteError(error) {
  const code = error?.code || '';
  const message = String(error?.message || '').toLowerCase();

  if (code === '42P01' || code === '42703') {
    return true;
  }

  // PostgREST schema-cache misses for tables/columns that are optional across environments.
  if (code.startsWith('PGRST') && message.includes('schema cache')) {
    return true;
  }

  if (message.includes('could not find the table') || message.includes('relation') && message.includes('does not exist')) {
    return true;
  }

  return false;
}

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  const adminSupabase = createAdminClient();
  if (!adminSupabase) {
    return NextResponse.json(
      { error: 'Delete account is unavailable. Missing SUPABASE_SERVICE_ROLE_KEY.' },
      { status: 500 }
    );
  }

  // Delete records that may not be linked by cascade constraints in all environments.
  const cleanupOps = [
    adminSupabase.from('favorite_games').delete().eq('user_id', user.id),
    adminSupabase.from('game_statuses').delete().eq('user_id', user.id),
    adminSupabase.from('user_follows').delete().eq('follower_id', user.id),
    adminSupabase.from('user_follows').delete().eq('following_id', user.id),
    adminSupabase.from('user_search_clicks').delete().eq('actor_user_id', user.id),
    adminSupabase.from('review_likes').delete().eq('user_id', user.id),
  ];

  const cleanupResults = await Promise.all(cleanupOps);
  for (const result of cleanupResults) {
    if (result.error && !isIgnorableDeleteError(result.error)) {
      return NextResponse.json(
        { error: result.error.message || 'Unable to remove account data.' },
        { status: 500 }
      );
    }
  }

  const { data: userReviews, error: reviewsReadError } = await adminSupabase
    .from('reviews')
    .select('id')
    .eq('user_id', user.id);

  if (reviewsReadError && !isIgnorableDeleteError(reviewsReadError)) {
    return NextResponse.json(
      { error: reviewsReadError.message || 'Unable to prepare account removal.' },
      { status: 500 }
    );
  }

  const reviewIds = (userReviews || []).map((row) => row.id).filter(Boolean);
  if (reviewIds.length > 0) {
    const { error: likesByReviewDeleteError } = await adminSupabase
      .from('review_likes')
      .delete()
      .in('review_id', reviewIds);

    if (likesByReviewDeleteError && !isIgnorableDeleteError(likesByReviewDeleteError)) {
      return NextResponse.json(
        { error: likesByReviewDeleteError.message || 'Unable to remove account likes.' },
        { status: 500 }
      );
    }
  }

  const { error: reviewsDeleteError } = await adminSupabase
    .from('reviews')
    .delete()
    .eq('user_id', user.id);

  if (reviewsDeleteError && !isIgnorableDeleteError(reviewsDeleteError)) {
    return NextResponse.json(
      { error: reviewsDeleteError.message || 'Unable to remove reviews.' },
      { status: 500 }
    );
  }

  const { error: profileDeleteError } = await adminSupabase
    .from('profiles')
    .delete()
    .eq('id', user.id);

  if (profileDeleteError && !isIgnorableDeleteError(profileDeleteError)) {
    return NextResponse.json(
      { error: profileDeleteError.message || 'Unable to remove profile.' },
      { status: 500 }
    );
  }

  const { data: avatarObjects, error: avatarsListError } = await adminSupabase.storage.from('avatars').list(user.id, {
    limit: 100,
    offset: 0,
  });

  if (!avatarsListError && Array.isArray(avatarObjects) && avatarObjects.length > 0) {
    const paths = avatarObjects.map((item) => `${user.id}/${item.name}`);
    await adminSupabase.storage.from('avatars').remove(paths);
  }

  const { error: authDeleteError } = await adminSupabase.auth.admin.deleteUser(user.id);
  if (authDeleteError) {
    return NextResponse.json(
      { error: authDeleteError.message || 'Unable to delete account.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}