import { promises as fs } from 'fs';
import path from 'path';
import { createAdminClient } from '@/lib/admin';

const ANALYTICS_FILE = path.join(process.cwd(), 'tmp_user_search_analytics.json');

async function readLocalAnalytics() {
  try {
    const raw = await fs.readFile(ANALYTICS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }
    return parsed;
  } catch {
    return {};
  }
}

async function writeLocalAnalytics(data) {
  await fs.writeFile(ANALYTICS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

async function incrementLocal(username) {
  const data = await readLocalAnalytics();
  const key = username.toLowerCase();
  const current = Number(data[key]?.click_count || 0);
  const nextCount = current + 1;

  data[key] = {
    username: key,
    click_count: nextCount,
    updated_at: new Date().toISOString(),
  };

  await writeLocalAnalytics(data);
  return nextCount;
}

export async function trackUserSearchClick({ username, source = 'unknown', query = '' }) {
  const normalizedUsername = (username || '').trim().toLowerCase();
  if (!normalizedUsername) {
    return { ok: false, reason: 'missing_username' };
  }

  const adminSupabase = createAdminClient();

  if (adminSupabase) {
    const now = new Date().toISOString();
    const { data: existing, error: existingError } = await adminSupabase
      .from('user_search_clicks')
      .select('click_count')
      .eq('username', normalizedUsername)
      .maybeSingle();

    if (!existingError) {
      const nextCount = Number(existing?.click_count || 0) + 1;
      const { error: upsertError } = await adminSupabase
        .from('user_search_clicks')
        .upsert(
          {
            username: normalizedUsername,
            click_count: nextCount,
            last_source: source,
            last_query: (query || '').trim() || null,
            updated_at: now,
          },
          { onConflict: 'username' }
        );

      if (!upsertError) {
        return { ok: true, provider: 'supabase', count: nextCount };
      }

      console.error('Unable to upsert user_search_clicks:', upsertError.message);
    } else {
      console.error('Unable to load user_search_clicks row:', existingError.message);
    }
  }

  try {
    const localCount = await incrementLocal(normalizedUsername);
    return { ok: true, provider: 'file', count: localCount };
  } catch (error) {
    console.error('Unable to persist local search analytics:', error);
    return { ok: false, reason: 'write_failed' };
  }
}

export async function getUserSearchClickCount(username) {
  const normalizedUsername = (username || '').trim().toLowerCase();
  if (!normalizedUsername) {
    return 0;
  }

  const adminSupabase = createAdminClient();
  if (adminSupabase) {
    const { data, error } = await adminSupabase
      .from('user_search_clicks')
      .select('click_count')
      .eq('username', normalizedUsername)
      .maybeSingle();

    if (!error) {
      return Number(data?.click_count || 0);
    }
  }

  const localData = await readLocalAnalytics();
  return Number(localData[normalizedUsername]?.click_count || 0);
}