-- Add optional team code column for quick match and team display identifiers
ALTER TABLE teams
ADD COLUMN IF NOT EXISTS code TEXT;

-- Backfill existing teams with a short code derived from the team name
UPDATE teams
SET code = UPPER(LEFT(REGEXP_REPLACE(name, '[^A-Za-z0-9]', '', 'g'), 3))
WHERE code IS NULL;