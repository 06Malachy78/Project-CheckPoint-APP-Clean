// Inside your Profile Page or a Modal component
const saveTopGame = async (game, slotNumber) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const updateData = {};
  updateData[`top_game_${slotNumber}`] = {
    id: game.id,
    name: game.name,
    cover: game.cover?.url
  };

  const { error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, ...updateData });

  if (!error) window.location.reload(); // Refresh to show new top game
};