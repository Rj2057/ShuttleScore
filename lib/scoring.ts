import type { TournamentSettings } from "@/types/database";

export interface ScoreResult {
  winnerId: string | null;
  completed: boolean;
  reason: string;
}

export function resolveWinner(
  score1: number,
  score2: number,
  team1Id: string | null,
  team2Id: string | null,
  settings: TournamentSettings,
  mode: "target_score" | "force_end"
): ScoreResult {
  if (!team1Id || !team2Id) {
    return { winnerId: null, completed: false, reason: "Both teams must be assigned" };
  }

  if (mode === "force_end") {
    if (score1 === score2) {
      return { winnerId: null, completed: false, reason: "Scores are tied — cannot force end" };
    }
    return {
      winnerId: score1 > score2 ? team1Id : team2Id,
      completed: true,
      reason: "Match ended — highest score wins",
    };
  }

  const { points_to_win, win_margin, max_points = 30 } = settings;
  if (score1 === score2) {
    return { winnerId: null, completed: false, reason: "Match in progress" };
  }

  const leaderScore = Math.max(score1, score2);
  const trailerScore = Math.min(score1, score2);
  const margin = leaderScore - trailerScore;
  const leaderIsTeam1 = score1 > score2;

  const winsAtTarget = leaderScore >= points_to_win && margin >= win_margin;
  const winsAtCap = leaderScore >= max_points && margin >= 1;

  if (winsAtTarget || winsAtCap) {
    return {
      winnerId: leaderIsTeam1 ? team1Id : team2Id,
      completed: true,
      reason: winsAtCap ? "Maximum points reached" : "Target score reached",
    };
  }

  return { winnerId: null, completed: false, reason: "Match in progress" };
}
