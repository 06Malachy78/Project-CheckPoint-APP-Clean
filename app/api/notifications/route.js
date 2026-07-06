import { NextResponse } from 'next/server';
import { createClient } from '@/lib/server';
import { createAdminClient } from '@/lib/admin';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function isIgnorableMissingTableError(error) {
  const code = String(error?.code || '');
  const message = String(error?.message || '').toLowerCase();

  if (code === '42P01') {
    return true;
  }

  if (message.includes('could not find the table') || message.includes('does not exist')) {
    return true;
  }

  if (code.startsWith('PGRST') && message.includes('schema cache')) {
    return true;
  }

  return false;
}

function toStatusNotification(statusRow, profileById) {
  const actorProfile = profileById[statusRow.user_id] || {};
  const actorName = actorProfile.username || statusRow.username || 'A friend';
  const gameName = statusRow.game_name || 'a game';
  const status = (statusRow.status || '').toLowerCase();

  let title = `${actorName} updated their game status`;
  if (status === 'playing') {
    title = `${actorName} started playing ${gameName}`;
  } else if (status === 'finished') {
    title = `${actorName} finished ${gameName}`;
  } else if (status === 'backlog') {
    title = `${actorName} added ${gameName} to their wishlist`;
  }

  return {
    id: `status:${statusRow.user_id}:${statusRow.game_id}:${statusRow.updated_at}`,
    type: 'status',
    actorId: statusRow.user_id,
    actorUsername: actorProfile.username || statusRow.username || 'user',
    actorAvatarUrl: actorProfile.avatar_url || '',
    createdAt: statusRow.updated_at,
    title,
    subtitle: gameName,
    href: statusRow.game_id ? `/game/${statusRow.game_id}` : `/profile/${actorProfile.username || ''}`,
  };
}

function toFavoriteNotification(favoriteRow, profileById) {
  const actorProfile = profileById[favoriteRow.user_id] || {};
  const actorName = actorProfile.username || 'A friend';
  const gameName = favoriteRow.game_name || 'a game';

  return {
    id: `favorite:${favoriteRow.user_id}:${favoriteRow.game_id}:${favoriteRow.updated_at}`,
    type: 'favorite',
    actorId: favoriteRow.user_id,
    actorUsername: actorProfile.username || 'user',
    actorAvatarUrl: actorProfile.avatar_url || '',
    createdAt: favoriteRow.updated_at,
    title: `${actorName} added ${gameName} to favorites`,
    subtitle: gameName,
    href: favoriteRow.game_id ? `/game/${favoriteRow.game_id}` : `/profile/${actorProfile.username || ''}`,
  };
}

export async function GET(request) {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();
  const readClient = adminSupabase || supabase;
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const requestedLimit = Number(searchParams.get('limit'));
  const safeLimit = Number.isFinite(requestedLimit)
    ? Math.max(1, Math.min(Math.floor(requestedLimit), MAX_LIMIT))
    : DEFAULT_LIMIT;

  const { data: followRows, error: followError } = await supabase
    .from('user_follows')
    .select('following_id')
    .eq('follower_id', user.id);

  if (followError) {
    return NextResponse.json({ error: followError.message || 'Unable to load follows.' }, { status: 500 });
  }

  const followingIds = Array.from(new Set((followRows || []).map((row) => row.following_id).filter(Boolean)));
  if (followingIds.length === 0) {
    return NextResponse.json({ ok: true, notifications: [] });
  }

  const [
    { data: profileRows, error: profileError },
    { data: reviewRows, error: reviewError },
    { data: statusRows, error: statusError },
    { data: favoriteRows, error: favoriteError },
  ] = await Promise.all([
    readClient
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', followingIds),
    readClient
      .from('reviews')
      .select('id, user_id, username, game_id, game_title, created_at')
      .in('user_id', followingIds)
      .order('created_at', { ascending: false })
      .limit(safeLimit * 2),
    readClient
      .from('game_statuses')
      .select('user_id, game_id, game_name, status, updated_at')
      .in('user_id', followingIds)
      .order('updated_at', { ascending: false })
      .limit(safeLimit * 2),
    readClient
      .from('favorite_games')
      .select('user_id, game_id, game_name, updated_at')
      .in('user_id', followingIds)
      .order('updated_at', { ascending: false })
      .limit(safeLimit * 2),
  ]);

  if (profileError) {
    return NextResponse.json({ error: profileError.message || 'Unable to load profile notifications.' }, { status: 500 });
  }

  if (reviewError) {
    return NextResponse.json({ error: reviewError.message || 'Unable to load review notifications.' }, { status: 500 });
  }

  if (statusError && !isIgnorableMissingTableError(statusError)) {
    return NextResponse.json({ error: statusError.message || 'Unable to load status notifications.' }, { status: 500 });
  }

  if (favoriteError && !isIgnorableMissingTableError(favoriteError)) {
    return NextResponse.json({ error: favoriteError.message || 'Unable to load favorites notifications.' }, { status: 500 });
  }

  const profileById = (profileRows || []).reduce((acc, profile) => {
    if (profile?.id) {
      acc[profile.id] = profile;
    }
    return acc;
  }, {});

  const reviewNotifications = (reviewRows || []).map((review) => {
    const actorProfile = profileById[review.user_id] || {};
    return {
      id: `review:${review.id}`,
      type: 'review',
      actorId: review.user_id,
      actorUsername: actorProfile.username || review.username || 'user',
      actorAvatarUrl: actorProfile.avatar_url || '',
      createdAt: review.created_at,
      title: `${actorProfile.username || review.username || 'A friend'} logged a new checkpoint`,
      subtitle: review.game_title || 'New game review',
      href: `/review/${review.id}`,
    };
  });

  const safeStatusRows = statusError ? [] : (statusRows || []);
  const safeFavoriteRows = favoriteError ? [] : (favoriteRows || []);

  const statusNotifications = safeStatusRows
    .filter((row) => row?.updated_at)
    .map((row) => toStatusNotification(row, profileById));

  const favoriteNotifications = safeFavoriteRows
    .filter((row) => row?.updated_at)
    .map((row) => toFavoriteNotification(row, profileById));

  const notifications = [...reviewNotifications, ...statusNotifications, ...favoriteNotifications]
    .filter((item) => item.createdAt)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, safeLimit);

  return NextResponse.json({ ok: true, notifications });
}