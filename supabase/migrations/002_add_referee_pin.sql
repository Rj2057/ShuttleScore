-- Add a referee PIN column to the matches table to allow unauthenticated but authorized users to score specific matches
ALTER TABLE matches ADD COLUMN IF NOT EXISTS referee_pin TEXT;
