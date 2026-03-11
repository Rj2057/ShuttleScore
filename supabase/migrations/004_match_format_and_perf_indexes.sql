-- Match format support and performance indexes

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS match_format TEXT NOT NULL DEFAULT 'bo3'
  CHECK (match_format IN ('bo1', 'bo3'));

CREATE INDEX IF NOT EXISTS idx_matches_tournament_sort
  ON matches(tournament_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_matches_group_status
  ON matches(group_id, status);

CREATE INDEX IF NOT EXISTS idx_match_games_match
  ON match_games(match_id, game_no);

CREATE INDEX IF NOT EXISTS idx_group_standings_group_position
  ON group_standings(group_id, position);
