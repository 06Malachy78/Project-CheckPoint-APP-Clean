import { supabase } from './supabase';

export async function saveReview(reviewData) {
  const { data, error } = await supabase
    .from('reviews')
    .insert([
      {
        game_id: reviewData.gameId,
        game_title: reviewData.gameTitle,
        username: reviewData.username,
        rating: reviewData.rating,
        content: reviewData.content,
        cover_url: reviewData.coverUrl
      }
    ]);

  if (error) throw error;
  return data;
}