-- =============================================================================
-- ShuttleScore — Complete Database Schema (single file)
-- Run ONCE in Supabase Dashboard → SQL Editor (fresh project recommended)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Profiles (linked to Supabase Auth — one row per registered user)
-- ---------------------------------------------------------------------------
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 2. Tournaments (multi-tenant: each organizer owns their tournaments)
-- ---------------------------------------------------------------------------
CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  season TEXT NOT NULL DEFAULT '',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_public BOOLEAN NOT NULL DEFAULT true,
  settings JSONB NOT NULL DEFAULT '{
    "points_to_win": 21,
    "win_margin": 2,
    "max_points": 30,
    "match_format": "bo1",
    "win_mode": "target_score"
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tournaments_organizer ON tournaments(organizer_id);
CREATE INDEX idx_tournaments_slug ON tournaments(slug);

-- ---------------------------------------------------------------------------
-- 3. Groups, Teams, Matches
-- ---------------------------------------------------------------------------
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_groups_tournament ON groups(tournament_id);

CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_teams_tournament ON teams(tournament_id);
CREATE INDEX idx_teams_group ON teams(group_id);

CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  stage TEXT NOT NULL CHECK (stage IN ('group', 'quarter', 'semi', 'final')),
  match_format TEXT NOT NULL DEFAULT 'bo1' CHECK (match_format IN ('bo1', 'bo3')),
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  team1_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  team2_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  score1 INT NOT NULL DEFAULT 0,
  score2 INT NOT NULL DEFAULT 0,
  winner_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed')),
  sort_order INT NOT NULL DEFAULT 0,
  next_match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  next_match_slot INT CHECK (next_match_slot IN (1, 2)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_matches_tournament_sort ON matches(tournament_id, sort_order);
CREATE INDEX idx_matches_group_status ON matches(group_id, status);

-- ---------------------------------------------------------------------------
-- 4. Per-game scores + group standings
-- ---------------------------------------------------------------------------
CREATE TABLE match_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  game_no INT NOT NULL CHECK (game_no IN (1, 2, 3)),
  team1_points INT NOT NULL CHECK (team1_points >= 0),
  team2_points INT NOT NULL CHECK (team2_points >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (match_id, game_no)
);

CREATE INDEX idx_match_games_match ON match_games(match_id, game_no);

CREATE TABLE group_standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  matches_played INT NOT NULL DEFAULT 0,
  matches_won INT NOT NULL DEFAULT 0,
  matches_lost INT NOT NULL DEFAULT 0,
  games_won INT NOT NULL DEFAULT 0,
  games_lost INT NOT NULL DEFAULT 0,
  points_scored INT NOT NULL DEFAULT 0,
  points_conceded INT NOT NULL DEFAULT 0,
  game_difference INT NOT NULL DEFAULT 0,
  point_difference INT NOT NULL DEFAULT 0,
  match_points INT NOT NULL DEFAULT 0,
  position INT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_id, team_id)
);

CREATE INDEX idx_group_standings_group_position ON group_standings(group_id, position);

-- ---------------------------------------------------------------------------
-- 5. Legacy admin table (optional super-admin; organizer_id is primary)
-- ---------------------------------------------------------------------------
CREATE TABLE admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 6. Helper: is current user organizer of a tournament?
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_tournament_organizer(p_tournament_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM tournaments t
    WHERE t.id = p_tournament_id
      AND t.organizer_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION can_manage_tournament(p_tournament_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT is_tournament_organizer(p_tournament_id) OR is_admin();
$$;

-- ---------------------------------------------------------------------------
-- 7. Triggers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION propagate_winner_to_next_match()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.winner_id IS NOT NULL AND NEW.next_match_id IS NOT NULL AND NEW.next_match_slot IS NOT NULL THEN
    IF NEW.next_match_slot = 1 THEN
      UPDATE matches SET team1_id = NEW.winner_id WHERE id = NEW.next_match_id;
    ELSE
      UPDATE matches SET team2_id = NEW.winner_id WHERE id = NEW.next_match_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_match_winner_set
  AFTER UPDATE OF winner_id ON matches
  FOR EACH ROW
  WHEN (OLD.winner_id IS DISTINCT FROM NEW.winner_id)
  EXECUTE FUNCTION propagate_winner_to_next_match();

-- Auto-create profile when user registers
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ---------------------------------------------------------------------------
-- 8. Group standings recompute
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION recompute_group_standings(p_group_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_tournament_id UUID;
BEGIN
  SELECT g.tournament_id
    INTO v_tournament_id
  FROM groups g
  WHERE g.id = p_group_id;

  IF v_tournament_id IS NULL THEN
    RAISE EXCEPTION 'Group % does not exist', p_group_id;
  END IF;

  WITH group_teams AS (
    SELECT t.id AS team_id
    FROM teams t
    WHERE t.group_id = p_group_id
  ),
  match_details AS (
    SELECT
      m.id,
      m.team1_id,
      m.team2_id,
      m.winner_id,
      COALESCE(mg.team1_points_total, 0) AS team1_points_total,
      COALESCE(mg.team2_points_total, 0) AS team2_points_total,
      COALESCE(mg.team1_games_won, 0) AS team1_games_won,
      COALESCE(mg.team2_games_won, 0) AS team2_games_won
    FROM matches m
    LEFT JOIN (
      SELECT
        x.match_id,
        SUM(x.team1_points) AS team1_points_total,
        SUM(x.team2_points) AS team2_points_total,
        SUM(CASE WHEN x.team1_points > x.team2_points THEN 1 ELSE 0 END) AS team1_games_won,
        SUM(CASE WHEN x.team2_points > x.team1_points THEN 1 ELSE 0 END) AS team2_games_won
      FROM match_games x
      GROUP BY x.match_id
    ) mg ON mg.match_id = m.id
    WHERE m.group_id = p_group_id
      AND m.status = 'completed'
      AND m.team1_id IS NOT NULL
      AND m.team2_id IS NOT NULL
  ),
  per_team_match_rows AS (
    SELECT
      md.team1_id AS team_id,
      1 AS matches_played,
      CASE WHEN md.winner_id = md.team1_id THEN 1 ELSE 0 END AS matches_won,
      CASE WHEN md.winner_id = md.team1_id THEN 0 ELSE 1 END AS matches_lost,
      md.team1_games_won AS games_won,
      md.team2_games_won AS games_lost,
      md.team1_points_total AS points_scored,
      md.team2_points_total AS points_conceded
    FROM match_details md

    UNION ALL

    SELECT
      md.team2_id AS team_id,
      1 AS matches_played,
      CASE WHEN md.winner_id = md.team2_id THEN 1 ELSE 0 END AS matches_won,
      CASE WHEN md.winner_id = md.team2_id THEN 0 ELSE 1 END AS matches_lost,
      md.team2_games_won AS games_won,
      md.team1_games_won AS games_lost,
      md.team2_points_total AS points_scored,
      md.team1_points_total AS points_conceded
    FROM match_details md
  ),
  base_stats AS (
    SELECT
      gt.team_id,
      COALESCE(SUM(r.matches_played), 0) AS matches_played,
      COALESCE(SUM(r.matches_won), 0) AS matches_won,
      COALESCE(SUM(r.matches_lost), 0) AS matches_lost,
      COALESCE(SUM(r.games_won), 0) AS games_won,
      COALESCE(SUM(r.games_lost), 0) AS games_lost,
      COALESCE(SUM(r.points_scored), 0) AS points_scored,
      COALESCE(SUM(r.points_conceded), 0) AS points_conceded
    FROM group_teams gt
    LEFT JOIN per_team_match_rows r ON r.team_id = gt.team_id
    GROUP BY gt.team_id
  ),
  enriched_stats AS (
    SELECT
      bs.team_id,
      bs.matches_played,
      bs.matches_won,
      bs.matches_lost,
      bs.games_won,
      bs.games_lost,
      bs.points_scored,
      bs.points_conceded,
      (bs.games_won - bs.games_lost) AS game_difference,
      (bs.points_scored - bs.points_conceded) AS point_difference,
      bs.matches_won AS match_points
    FROM base_stats bs
  ),
  two_team_ties AS (
    SELECT
      es.match_points,
      es.game_difference,
      es.point_difference
    FROM enriched_stats es
    GROUP BY es.match_points, es.game_difference, es.point_difference
    HAVING COUNT(*) = 2
  ),
  tied_members AS (
    SELECT es.*
    FROM enriched_stats es
    JOIN two_team_ties tt
      ON tt.match_points = es.match_points
     AND tt.game_difference = es.game_difference
     AND tt.point_difference = es.point_difference
  ),
  head_to_head AS (
    SELECT
      tm1.team_id,
      SUM(CASE WHEN m.winner_id = tm1.team_id THEN 1 ELSE 0 END) AS head_to_head_wins
    FROM tied_members tm1
    JOIN tied_members tm2
      ON tm1.team_id <> tm2.team_id
     AND tm1.match_points = tm2.match_points
     AND tm1.game_difference = tm2.game_difference
     AND tm1.point_difference = tm2.point_difference
    JOIN matches m
      ON m.group_id = p_group_id
     AND m.status = 'completed'
     AND (
       (m.team1_id = tm1.team_id AND m.team2_id = tm2.team_id)
       OR
       (m.team1_id = tm2.team_id AND m.team2_id = tm1.team_id)
     )
    GROUP BY tm1.team_id
  ),
  ranked AS (
    SELECT
      es.team_id,
      es.matches_played,
      es.matches_won,
      es.matches_lost,
      es.games_won,
      es.games_lost,
      es.points_scored,
      es.points_conceded,
      es.game_difference,
      es.point_difference,
      es.match_points,
      ROW_NUMBER() OVER (
        ORDER BY
          es.match_points DESC,
          es.game_difference DESC,
          es.point_difference DESC,
          COALESCE(h2h.head_to_head_wins, 0) DESC,
          es.team_id ASC
      ) AS position
    FROM enriched_stats es
    LEFT JOIN head_to_head h2h ON h2h.team_id = es.team_id
  )
  INSERT INTO group_standings (
    tournament_id,
    group_id,
    team_id,
    matches_played,
    matches_won,
    matches_lost,
    games_won,
    games_lost,
    points_scored,
    points_conceded,
    game_difference,
    point_difference,
    match_points,
    position,
    updated_at
  )
  SELECT
    v_tournament_id,
    p_group_id,
    r.team_id,
    r.matches_played,
    r.matches_won,
    r.matches_lost,
    r.games_won,
    r.games_lost,
    r.points_scored,
    r.points_conceded,
    r.game_difference,
    r.point_difference,
    r.match_points,
    r.position,
    now()
  FROM ranked r
  ON CONFLICT (group_id, team_id)
  DO UPDATE SET
    tournament_id = EXCLUDED.tournament_id,
    matches_played = EXCLUDED.matches_played,
    matches_won = EXCLUDED.matches_won,
    matches_lost = EXCLUDED.matches_lost,
    games_won = EXCLUDED.games_won,
    games_lost = EXCLUDED.games_lost,
    points_scored = EXCLUDED.points_scored,
    points_conceded = EXCLUDED.points_conceded,
    game_difference = EXCLUDED.game_difference,
    point_difference = EXCLUDED.point_difference,
    match_points = EXCLUDED.match_points,
    position = EXCLUDED.position,
    updated_at = now();

  DELETE FROM group_standings gs
  WHERE gs.group_id = p_group_id
    AND NOT EXISTS (
      SELECT 1
      FROM teams t
      WHERE t.id = gs.team_id
        AND t.group_id = p_group_id
    );
END;
$$;

GRANT EXECUTE ON FUNCTION recompute_group_standings(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- 9. Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Tournaments: public read if is_public; organizer/admin write
CREATE POLICY "Public read public tournaments" ON tournaments
  FOR SELECT USING (is_public = true OR organizer_id = auth.uid() OR is_admin());

CREATE POLICY "Organizer insert tournaments" ON tournaments
  FOR INSERT WITH CHECK (organizer_id = auth.uid() OR is_admin());

CREATE POLICY "Organizer update tournaments" ON tournaments
  FOR UPDATE USING (can_manage_tournament(id));

CREATE POLICY "Organizer delete tournaments" ON tournaments
  FOR DELETE USING (can_manage_tournament(id));

-- Groups
CREATE POLICY "Public read groups of public tournaments" ON groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tournaments t
      WHERE t.id = groups.tournament_id
        AND (t.is_public = true OR t.organizer_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "Organizer manage groups" ON groups
  FOR ALL USING (can_manage_tournament(tournament_id))
  WITH CHECK (can_manage_tournament(tournament_id));

-- Teams
CREATE POLICY "Public read teams of public tournaments" ON teams
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tournaments t
      WHERE t.id = teams.tournament_id
        AND (t.is_public = true OR t.organizer_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "Organizer manage teams" ON teams
  FOR ALL USING (can_manage_tournament(tournament_id))
  WITH CHECK (can_manage_tournament(tournament_id));

-- Matches
CREATE POLICY "Public read matches of public tournaments" ON matches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tournaments t
      WHERE t.id = matches.tournament_id
        AND (t.is_public = true OR t.organizer_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "Organizer manage matches" ON matches
  FOR ALL USING (can_manage_tournament(tournament_id))
  WITH CHECK (can_manage_tournament(tournament_id));

-- Match games
CREATE POLICY "Public read match_games" ON match_games
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM matches m
      JOIN tournaments t ON t.id = m.tournament_id
      WHERE m.id = match_games.match_id
        AND (t.is_public = true OR t.organizer_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "Organizer manage match_games" ON match_games
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = match_games.match_id
        AND can_manage_tournament(m.tournament_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = match_games.match_id
        AND can_manage_tournament(m.tournament_id)
    )
  );

-- Group standings
CREATE POLICY "Public read group_standings" ON group_standings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tournaments t
      WHERE t.id = group_standings.tournament_id
        AND (t.is_public = true OR t.organizer_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "Organizer manage group_standings" ON group_standings
  FOR ALL USING (can_manage_tournament(tournament_id))
  WITH CHECK (can_manage_tournament(tournament_id));

-- Admin users
CREATE POLICY "Users read own admin status" ON admin_users
  FOR SELECT USING (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- 10. Realtime (live score updates for public viewers)
-- ---------------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE match_games;
ALTER PUBLICATION supabase_realtime ADD TABLE group_standings;
ALTER PUBLICATION supabase_realtime ADD TABLE teams;

-- ---------------------------------------------------------------------------
-- AFTER RUNNING THIS FILE:
-- 1. Enable Email auth in Supabase → Authentication → Providers
-- 2. Register your first user via the app (or add in Auth → Users)
-- 3. Optional super-admin:
--    INSERT INTO admin_users (id)
--    SELECT id FROM auth.users WHERE email = 'your@email.com';
-- =============================================================================
