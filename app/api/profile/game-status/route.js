import { NextResponse } from 'next/server';
import { createClient } from '@/lib/server';
import { isValidGameStatus } from '@/lib/game-statuses';

function normalizeGamePayload(payload) {
  const gameId = payload?.game?.id != null ? String(payload.game.id) : '';
  const gameName = typeof payload?.game?.name === 'string' ? payload.game.name.trim() : '';

  return {
    gameId,
    gameName,
    gameCover: payload?.game?.cover ?? null,
  };
}

export async function GET(request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'You must be signed in to view game status.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get('gameId')?.trim();

  if (gameId) {
    const { data, error } = await supabase
      .from('game_statuses')
      .select('status')
      .eq('user_id', user.id)
      .eq('game_id', gameId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message || 'Unable to load game status.' }, { status: 500 });
    }

    return NextResponse.json({ status: data?.status ?? null });
  }

  const { data, error } = await supabase
    .from('game_statuses')
    .select('game_id, game_name, game_cover, status, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message || 'Unable to load game statuses.' }, { status: 500 });
  }

  return NextResponse.json({ statuses: data || [] });
}

export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'You must be signed in to update game status.' }, { status: 401 });
  }

  let payload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { gameId, gameName, gameCover } = normalizeGamePayload(payload);
  const status = typeof payload?.status === 'string' ? payload.status.trim() : '';

  if (!gameId) {
    return NextResponse.json({ error: 'Missing game id.' }, { status: 400 });
  }

  if (!status) {
    const { error } = await supabase
      .from('game_statuses')
      .delete()
      .eq('user_id', user.id)
      .eq('game_id', gameId);

    if (error) {
      return NextResponse.json({ error: error.message || 'Unable to clear game status.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, status: null });
  }

  if (!isValidGameStatus(status) || !gameName) {
    return NextResponse.json({ error: 'Invalid game status selection.' }, { status: 400 });
  }

  const { error } = await supabase
    .from('game_statuses')
    .upsert(
      {
        user_id: user.id,
        game_id: gameId,
        game_name: gameName,
        game_cover: gameCover,
        status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,game_id' }
    );

  if (error) {
    return NextResponse.json({ error: error.message || 'Unable to save game status.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, status });
}
