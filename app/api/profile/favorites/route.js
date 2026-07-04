import { NextResponse } from 'next/server';
import { createClient } from '@/lib/server';
import { isGameFavorited, listFavoriteGames, setFavoriteGame } from '@/lib/favorites';

export async function GET(request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'You must be signed in to view favorites.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get('gameId')?.trim();

  if (gameId) {
    const isFavorite = await isGameFavorited(user.id, gameId);
    return NextResponse.json({ isFavorite });
  }

  const favorites = await listFavoriteGames(user.id);
  return NextResponse.json({ favorites });
}

export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'You must be signed in to update favorites.' }, { status: 401 });
  }

  let payload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const isFavorite = Boolean(payload?.isFavorite);
  const game = payload?.game;

  if (!game?.id || !game?.name) {
    return NextResponse.json({ error: 'Missing game details.' }, { status: 400 });
  }

  const result = await setFavoriteGame(user.id, game, isFavorite);

  if (!result.ok) {
    return NextResponse.json({ error: result.error || 'Unable to update favorites.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, isFavorite: result.isFavorite });
}