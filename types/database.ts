export type MatchStage = "group" | "quarter" | "semi" | "final";
export type MatchStatus = "scheduled" | "live" | "completed";
export type MatchFormat = "bo1" | "bo3";

export interface Tournament {
  id: string;
  name: string;
  season: string;
  start_date: string;
  end_date: string;
  created_at: string;
}

export interface Group {
  id: string;
  tournament_id: string;
  name: string;
  created_at: string;
}

export interface Team {
  id: string;
  group_id: string | null;
  name: string;
  created_at: string;
}

export interface Match {
  id: string;
  tournament_id: string;
  stage: MatchStage;
  match_format: MatchFormat;
  group_id: string | null;
  team1_id: string | null;
  team2_id: string | null;
  score1: number;
  score2: number;
  winner_id: string | null;
  status: MatchStatus;
  sort_order: number;
  next_match_id: string | null;
  next_match_slot: 1 | 2 | null;
  created_at: string;
  updated_at: string;
}

export interface MatchWithTeams extends Match {
  team1?: Team | null;
  team2?: Team | null;
  winner?: Team | null;
}

export interface MatchGame {
  id: string;
  match_id: string;
  game_no: 1 | 2 | 3;
  team1_points: number;
  team2_points: number;
  created_at: string;
}

export interface GroupStanding {
  id: string;
  tournament_id: string;
  group_id: string;
  team_id: string;
  matches_played: number;
  matches_won: number;
  matches_lost: number;
  games_won: number;
  games_lost: number;
  points_scored: number;
  points_conceded: number;
  game_difference: number;
  point_difference: number;
  match_points: number;
  position: number | null;
  updated_at: string;
  team?: Team | null;
}
