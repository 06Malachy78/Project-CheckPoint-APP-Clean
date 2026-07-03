import { NextResponse } from 'next/server';
import { createClient } from '@/lib/server';

export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'You must be signed in to update your profile.' }, { status: 401 });
  }

  let payload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const slotNumber = Number(payload?.slotNumber);
  const game = payload?.game;

  if (![1, 2, 3].includes(slotNumber)) {
    return NextResponse.json({ error: 'Invalid top game selection.' }, { status: 400 });
  }

  const isRemovingGame = game === null;

  if (!isRemovingGame && (!game?.id || !game?.name)) {
    return NextResponse.json({ error: 'Invalid top game selection.' }, { status: 400 });
  }

  const updateField = `top_game_${slotNumber}`;
  const updateData = {
    id: user.id,
    [updateField]: isRemovingGame
      ? null
      : {
          id: game.id,
          name: game.name,
          cover: game.cover ?? null,
        },
    updated_at: new Date().toISOString(),
  };

  const { error: upsertError } = await supabase
    .from('profiles')
    .upsert(updateData, { onConflict: 'id' });

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message || 'Unable to update top games.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}