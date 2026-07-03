export const GAME_STATUS_ORDER = ['backlog', 'playing', 'finished'];

export const GAME_STATUS_META = {
  playing: {
    label: 'Playing',
    subtitle: 'Current run',
  },
  finished: {
    label: 'Finished',
    subtitle: 'Completed',
  },
  backlog: {
    label: 'Wishlist',
    subtitle: 'Up next',
  },
};

export function isValidGameStatus(status) {
  return GAME_STATUS_ORDER.includes(status);
}

export function groupGameStatuses(rows) {
  const grouped = {
    playing: [],
    finished: [],
    backlog: [],
  };

  for (const row of rows || []) {
    if (!isValidGameStatus(row?.status)) continue;

    grouped[row.status].push({
      id: row.game_id,
      name: row.game_name,
      cover: row.game_cover,
      replayCount: typeof row.replay_count === 'number' ? row.replay_count : 0,
      updated_at: row.updated_at,
    });
  }

  for (const statusKey of GAME_STATUS_ORDER) {
    grouped[statusKey].sort((a, b) => {
      const aTime = new Date(a.updated_at || 0).getTime();
      const bTime = new Date(b.updated_at || 0).getTime();
      return bTime - aTime;
    });
  }

  return grouped;
}
