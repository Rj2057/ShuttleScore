-- ShuttleScore Badminton Tournament - Initial Schema
-- Run this in Supabase SQL Editor

-- Tournaments
CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  season TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Groups (for group stage)
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Teams
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Matches
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  stage TEXT NOT NULL CHECK (stage IN ('group', 'quarter', 'semi', 'final')),
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  team1_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  team2_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  score1 INT DEFAULT 0,
  score2 INT DEFAULT 0,
  winner_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed')),
  sort_order INT DEFAULT 0,
  next_match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  next_match_slot INT CHECK (next_match_slot IN (1, 2)),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Admin users (links Supabase auth to admin role)
CREATE TABLE admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Public read for tournaments, groups, teams, matches
CREATE POLICY "Public read tournaments" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Public read groups" ON groups FOR SELECT USING (true);
CREATE POLICY "Public read teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Public read matches" ON matches FOR SELECT USING (true);

-- Admin full access (insert, update, delete)
CREATE POLICY "Admin all tournaments" ON tournaments FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

CREATE POLICY "Admin all groups" ON groups FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

CREATE POLICY "Admin all teams" ON teams FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

CREATE POLICY "Admin all matches" ON matches FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

-- Admin_users: only existing admins can add new admins
CREATE POLICY "Admin read admin_users" ON admin_users FOR SELECT
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

-- Enable Realtime for matches (so score updates broadcast)
ALTER PUBLICATION supabase_realtime ADD TABLE matches;

-- Trigger to auto-update updated_at
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

-- Function: Propagate winner to next match (TBD auto-fill)
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

-- ============================================
-- SEED: Create first tournament (optional)
-- ============================================
-- INSERT INTO tournaments (name, season, start_date, end_date)
-- VALUES ('ShuttleScore Badminton Tournament', 'Season 2', '2025-03-15', '2025-03-20');

-- ============================================
-- ADD FIRST ADMIN (run after creating user in Supabase Auth):
-- ============================================
-- INSERT INTO admin_users (id) 
-- SELECT id FROM auth.users WHERE email = 'your-admin@email.com';
