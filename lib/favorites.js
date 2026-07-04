import { promises as fs } from 'fs';
import path from 'path';
import { createAdminClient } from '@/lib/admin';
import { createClient } from '@/lib/server';

const FAVORITES_FILE = path.join(process.cwd(), 'tmp_favorite_games.json');

function toGameRecord(gameLike) {
  const gameId = gameLike?.game_id != null ? String(gameLike.game_id) : String(gameLike?.id || '');
  const gameName = gameLike?.game_name || gameLike?.name || '';
  const gameCover = gameLike?.game_cover ?? gameLike?.cover ?? null;

  return {
    id: gameId,
    name: gameName,
    cover: gameCover,
    updated_at: gameLike?.updated_at || new Date().toISOString(),
  };
}

async function readLocalFavorites() {
  try {
    const raw = await fs.readFile(FAVORITES_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }
    return parsed;
  } catch {
    return {};
  }
}

async function writeLocalFavorites(data) {
  await fs.writeFile(FAVORITES_FILE, JSON.stringify(data, null, 2), 'utf8');
}

async function listFromLocal(userId) {
  const store = await readLocalFavorites();
  const userGames = store[userId] || {};

  return Object.values(userGames)
    .map((row) => toGameRecord(row))
    .sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime());
}

async function setInLocal(userId, game, isFavorite) {
  const store = await readLocalFavorites();
  const gameId = String(game?.id || '');

  if (!store[userId]) {
    store[userId] = {};
  }

  if (isFavorite) {
    store[userId][gameId] = {
      game_id: gameId,
      game_name: game.name,
      game_cover: game.cover ?? null,
      updated_at: new Date().toISOString(),
    };
  } else {
    delete store[userId][gameId];
  }

  await writeLocalFavorites(store);
}

async function getReadClient() {
  const adminSupabase = createAdminClient();
  if (adminSupabase) return adminSupabase;
  return await createClient();
}

export async function listFavoriteGames(userId) {
  if (!userId) return [];

  const supabase = await getReadClient();
  const { data, error } = await supabase
    .from('favorite_games')
    .select('game_id, game_name, game_cover, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (!error) {
    return (data || []).map((row) => toGameRecord(row));
  }

  return await listFromLocal(userId);
}

export async function isGameFavorited(userId, gameId) {
  if (!userId || !gameId) return false;

  const gameIdString = String(gameId);
  const supabase = await getReadClient();
  const { data, error } = await supabase
    .from('favorite_games')
    .select('game_id')
    .eq('user_id', userId)
    .eq('game_id', gameIdString)
    .maybeSingle();

  if (!error) {
    return Boolean(data?.game_id);
  }

  const favorites = await listFromLocal(userId);
  return favorites.some((game) => String(game.id) === gameIdString);
}

export async function setFavoriteGame(userId, game, isFavorite) {
  if (!userId || !game?.id || !game?.name) {
    return { ok: false, error: 'Missing favorite game details.' };
  }

  const gameId = String(game.id);
  const payload = {
    user_id: userId,
    game_id: gameId,
    game_name: game.name,
    game_cover: game.cover ?? null,
    updated_at: new Date().toISOString(),
  };

  const supabase = await getReadClient();

  if (isFavorite) {
    const { error } = await supabase
      .from('favorite_games')
      .upsert(payload, { onConflict: 'user_id,game_id' });

    if (!error) {
      return { ok: true, isFavorite: true };
    }
  } else {
    const { error } = await supabase
      .from('favorite_games')
      .delete()
      .eq('user_id', userId)
      .eq('game_id', gameId);

    if (!error) {
      return { ok: true, isFavorite: false };
    }
  }

  try {
    await setInLocal(userId, game, isFavorite);
    return { ok: true, isFavorite };
  } catch (error) {
    console.error('Unable to write favorite game fallback:', error);
    return { ok: false, error: 'Unable to update favorites.' };
  }
}