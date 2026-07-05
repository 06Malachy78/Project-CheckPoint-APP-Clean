import { createClient } from '@/lib/server';
import { createAdminClient } from '@/lib/admin';

function normalizeProfile(profile) {
  if (!profile?.id || !profile?.username) {
    return null;
  }

  return {
    id: profile.id,
    username: profile.username,
    bio: profile.bio || '',
    avatar_url: profile.avatar_url || profile.avatar || profile.image_url || '',
  };
}

function mapProfilesById(rows) {
  const map = new Map();

  for (const row of rows || []) {
    const normalized = normalizeProfile(row);
    if (normalized) {
      map.set(normalized.id, normalized);
    }
  }

  return map;
}

async function listConnections(sourceUserId, column, limit = 40, offset = 0) {
  const safeLimit = Math.max(1, Math.min(limit, 1000));
  const safeOffset = Math.max(0, Number.isFinite(offset) ? Math.floor(offset) : 0);
  const adminSupabase = createAdminClient();
  const supabase = adminSupabase || await createClient();

  const { data: relationRows, error: relationError } = await supabase
    .from('user_follows')
    .select(`id_column:${column}`)
    .eq(column === 'following_id' ? 'follower_id' : 'following_id', sourceUserId)
    .order('created_at', { ascending: false })
    .range(safeOffset, safeOffset + safeLimit - 1);

  if (relationError) {
    console.error('Unable to load follow connections:', relationError.message);
    return [];
  }

  const ids = (relationRows || []).map((row) => row.id_column).filter(Boolean);
  if (ids.length === 0) {
    return [];
  }

  const { data: profileRows, error: profileError } = await supabase
    .from('profiles')
    .select('id, username, bio, avatar_url')
    .in('id', ids);

  if (profileError) {
    console.error('Unable to load follow profile rows:', profileError.message);
    return [];
  }

  const profilesById = mapProfilesById(profileRows || []);
  return ids.map((id) => profilesById.get(id)).filter(Boolean);
}

export async function listFollowers(userId, limit = 40, offset = 0) {
  return listConnections(userId, 'follower_id', limit, offset);
}

export async function listFollowing(userId, limit = 40, offset = 0) {
  return listConnections(userId, 'following_id', limit, offset);
}

export async function getFollowStats(userId) {
  const adminSupabase = createAdminClient();
  const supabase = adminSupabase || await createClient();

  const [followersResult, followingResult] = await Promise.all([
    supabase
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId),
    supabase
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId),
  ]);

  if (followersResult.error) {
    console.error('Unable to count followers:', followersResult.error.message);
  }
  if (followingResult.error) {
    console.error('Unable to count following:', followingResult.error.message);
  }

  return {
    followersCount: typeof followersResult.count === 'number' ? followersResult.count : 0,
    followingCount: typeof followingResult.count === 'number' ? followingResult.count : 0,
  };
}

export async function isFollowingUser(followerId, followingId) {
  if (!followerId || !followingId || followerId === followingId) {
    return false;
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_follows')
    .select('follower_id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();

  if (error) {
    console.error('Unable to check follow state:', error.message);
    return false;
  }

  return Boolean(data?.follower_id);
}

export async function listMutualFollowerIds(userId, candidateIds = []) {
  const ids = Array.from(new Set((candidateIds || []).filter(Boolean)));
  if (!userId || ids.length === 0) {
    return [];
  }

  const adminSupabase = createAdminClient();
  const supabase = adminSupabase || await createClient();

  const { data, error } = await supabase
    .from('user_follows')
    .select('following_id')
    .eq('follower_id', userId)
    .in('following_id', ids);

  if (error) {
    console.error('Unable to load mutual follower ids:', error.message);
    return [];
  }

  return (data || []).map((row) => row.following_id).filter(Boolean);
}

export async function listMutualFollowingIds(userId, candidateIds = []) {
  const ids = Array.from(new Set((candidateIds || []).filter(Boolean)));
  if (!userId || ids.length === 0) {
    return [];
  }

  const adminSupabase = createAdminClient();
  const supabase = adminSupabase || await createClient();

  const { data, error } = await supabase
    .from('user_follows')
    .select('follower_id')
    .eq('following_id', userId)
    .in('follower_id', ids);

  if (error) {
    console.error('Unable to load mutual following ids:', error.message);
    return [];
  }

  return (data || []).map((row) => row.follower_id).filter(Boolean);
}
