import { createClient } from '@/lib/server';
import { createAdminClient } from '@/lib/admin';

function pickUsername(user) {
  const metadata = user?.user_metadata || {};
  const raw = metadata.username || metadata.display_name || user?.email?.split('@')[0] || '';
  return raw.toString().trim().toLowerCase();
}

function pickAvatar(user) {
  const metadata = user?.user_metadata || {};
  return metadata.avatar_url || metadata.picture || metadata.avatar || '';
}

export async function searchUsers(query, limit = 18) {
  const trimmedQuery = (query || '').trim();
  if (!trimmedQuery) {
    return [];
  }

  const safeLimit = Math.max(1, Math.min(limit, 50));
  const normalizedQuery = trimmedQuery.toLowerCase();

  const adminSupabase = createAdminClient();
  const supabase = adminSupabase || await createClient();

  const { data: profileRows, error: profileError } = await supabase
    .from('profiles')
    .select('id, username, bio, avatar_url')
    .ilike('username', `%${trimmedQuery}%`)
    .order('username', { ascending: true })
    .limit(safeLimit);

  if (profileError) {
    console.error('User profile search failed:', profileError.message);
  }

  const combined = Array.isArray(profileRows) ? [...profileRows] : [];
  const ids = new Set(combined.map((row) => row.id));
  const usernames = new Set(
    combined
      .map((row) => (row.username || '').toLowerCase())
      .filter(Boolean)
  );

  if (adminSupabase && combined.length < safeLimit) {
    const rowsToBackfill = [];
    const perPage = Math.max(100, safeLimit * 6);
    const { data: authData, error: authError } = await adminSupabase.auth.admin.listUsers({
      page: 1,
      perPage,
    });

    if (authError) {
      console.error('Auth user fallback search failed:', authError.message);
    } else {
      const users = authData?.users || [];

      for (const authUser of users) {
        if (combined.length >= safeLimit) {
          break;
        }

        const username = pickUsername(authUser);
        if (!username || !username.includes(normalizedQuery)) {
          continue;
        }

        if (ids.has(authUser.id) || usernames.has(username)) {
          continue;
        }

        combined.push({
          id: authUser.id,
          username,
          bio: '',
          avatar_url: pickAvatar(authUser),
        });

        rowsToBackfill.push({
          id: authUser.id,
          username,
          bio: null,
          avatar_url: pickAvatar(authUser) || null,
          updated_at: new Date().toISOString(),
        });

        ids.add(authUser.id);
        usernames.add(username);
      }

      for (const row of rowsToBackfill) {
        const { error: upsertError } = await adminSupabase
          .from('profiles')
          .upsert(row, { onConflict: 'id' });

        if (upsertError) {
          console.error('Profile backfill failed for searched user:', upsertError.message);
        }
      }
    }
  }

  return combined.slice(0, safeLimit);
}