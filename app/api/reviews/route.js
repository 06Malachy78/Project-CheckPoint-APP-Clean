import { NextResponse } from 'next/server';
import { createClient } from '@/lib/server';

export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'You must be signed in to create a checkpoint.' }, { status: 401 });
  }

  let payload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const rating = Number(payload?.rating);
  const gameId = payload?.gameId?.toString().trim();
  const gameTitle = payload?.gameTitle?.trim();
  const content = payload?.content?.trim() ?? '';
  const coverUrl = payload?.coverUrl?.trim() ?? '';

  if (!gameId || !gameTitle || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Missing or invalid review data.' }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .maybeSingle();

  const username =
    profile?.username ||
    user.user_metadata?.username ||
    user.user_metadata?.display_name ||
    user.email?.split('@')[0] ||
    'user';

  const { error: insertError } = await supabase.from('reviews').insert([
    {
      user_id: user.id,
      username,
      game_id: gameId,
      game_title: gameTitle,
      rating,
      content,
      cover_url: coverUrl,
    },
  ]);

  if (insertError) {
    return NextResponse.json({ error: insertError.message || 'Unable to create checkpoint.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}