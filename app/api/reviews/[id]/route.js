import { NextResponse } from 'next/server';
import { createClient } from '@/lib/server';

async function getOwnedReview(supabase, reviewId, userId) {
  const { data: review, error } = await supabase
    .from('reviews')
    .select('id, user_id')
    .eq('id', reviewId)
    .maybeSingle();

  if (error) {
    return { error: NextResponse.json({ error: error.message || 'Unable to load review.' }, { status: 500 }) };
  }

  if (!review) {
    return { error: NextResponse.json({ error: 'Review not found.' }, { status: 404 }) };
  }

  if (review.user_id !== userId) {
    return { error: NextResponse.json({ error: 'You can only modify your own reviews.' }, { status: 403 }) };
  }

  return { review };
}

export async function PATCH(request, { params }) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'You must be signed in to edit a checkpoint.' }, { status: 401 });
  }

  const { error: ownershipError } = await getOwnedReview(supabase, params.id, user.id);
  if (ownershipError) return ownershipError;

  let payload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const rating = Number(payload?.rating);
  const content = payload?.content?.trim() ?? '';

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be between 1 and 5.' }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from('reviews')
    .update({ content, rating })
    .eq('id', params.id)
    .eq('user_id', user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message || 'Unable to save changes.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request, { params }) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'You must be signed in to delete a checkpoint.' }, { status: 401 });
  }

  const { error: ownershipError } = await getOwnedReview(supabase, params.id, user.id);
  if (ownershipError) return ownershipError;

  const { error: deleteLikesError } = await supabase
    .from('review_likes')
    .delete()
    .eq('review_id', params.id);

  if (deleteLikesError) {
    return NextResponse.json({ error: deleteLikesError.message || 'Unable to delete related likes.' }, { status: 500 });
  }

  const { error: deleteReviewError } = await supabase
    .from('reviews')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id);

  if (deleteReviewError) {
    return NextResponse.json({ error: deleteReviewError.message || 'Unable to delete review.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}