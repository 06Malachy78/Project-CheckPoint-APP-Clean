import { NextResponse } from 'next/server';
import { createClient } from '@/lib/server';

function normalizeGamePayload(payload) {
  const gameId = payload?.game?.id != null ? String(payload.game.id) : '';
  const gameName = typeof payload?.game?.name === 'string' ? payload.game.name.trim() : '';

  return {
    gameId,
    gameName,
    gameCover: payload?.game?.cover ?? null,
  };
}

export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'You must be signed in to update replay tracking.' }, { status: 401 });
  }

  let payload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { gameId, gameName, gameCover } = normalizeGamePayload(payload);
  const parsedReplayCount = Number(payload?.replayCount);
  const replayCount = Number.isInteger(parsedReplayCount) ? parsedReplayCount : NaN;

  if (!gameId || !gameName) {
    return NextResponse.json({ error: 'Missing game details.' }, { status: 400 });
  }

  if (!Number.isInteger(replayCount) || replayCount < 0) {
    return NextResponse.json({ error: 'Replay count must be a whole number.' }, { status: 400 });
  }

  const { data: existingRow, error: existingError } = await supabase
    .from('game_statuses')
    .select('status')
    .eq('user_id', user.id)
    .eq('game_id', gameId)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message || 'Unable to update replay tracking.' }, { status: 500 });
  }

  const statusForUpsert = existingRow?.status || 'finished';

  const { error } = await supabase
    .from('game_statuses')
    .upsert(
      {
        user_id: user.id,
        game_id: gameId,
        game_name: gameName,
        game_cover: gameCover,
        status: statusForUpsert,
        replay_count: replayCount,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,game_id' }
    );

  if (error) {
    return NextResponse.json({ error: error.message || 'Unable to save replay tracking.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, replayCount });
}
