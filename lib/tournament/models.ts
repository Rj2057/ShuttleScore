/**
 * Tournament Management System Models
 * Badminton Doubles Tournament Structure
 */

export enum MatchStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum MatchType {
  LEAGUE = "league",
  LOSER = "loser",
  GROUP = "group",
  QUARTERFINAL = "quarterfinal",
  SEMIFINAL = "semifinal",
  FINAL = "final",
  THIRD_PLACE = "third_place",
}

export interface Player {
  id: string;
  name: string;
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
  groupId?: string;
  groupPosition?: number;
  status: "active" | "eliminated" | "qualified";
  totalPoints?: number;
  matchesPlayed?: number;
}

export interface MatchResult {
  teamId: string;
  score: number;
  points: number;
}

export interface Match {
  id: string;
  type: MatchType;
  matchNumber: number;
  team1: Team;
  team2: Team;
  result?: {
    team1Score: number;
    team2Score: number;
    winner: Team;
    loser: Team;
  };
  status: MatchStatus;
  venue?: string;
  scheduledTime?: Date;
  completedTime?: Date;
  bestOf: number; // Number of sets
  pointsPerSet: number;
  note?: string;
}

export interface GroupStanding {
  position: number;
  team: Team;
  matchesPlayed: number;
  wins: number;
  losses: number;
  totalPoints: number;
}

export interface Group {
  id: string;
  name: "A" | "B" | "C" | "D";
  teams: Team[];
  matches: Match[];
  standings: GroupStanding[];
  roundNumber: number;
}

export interface KnockoutStage {
  type: "quarterfinal" | "semifinal" | "final" | "third_place";
  matches: Match[];
}

export interface TournamentStage {
  name: string;
  matches: Match[];
  completed: boolean;
}

export interface Tournament {
  id: string;
  name: string;
  startDate: Date;
  endDate?: Date;
  totalTeams: number;
  teams: Team[];
  
  // Tournament stages
  initialMatches: Match[]; // Round 1: 10 matches from 20 teams
  loserMatches: Match[]; // Losers round: 5 matches from 10 losers
  
  // Group stage
  groups: Group[];
  
  // Knockout stage
  quarterfinals: Match[];
  semifinals: Match[];
  final: Match[];
  thirdPlace: Match[];
  
  // Winners
  champion?: Team;
  runner_up?: Team;
  third_place?: Team;
  
  status: "pending" | "league_active" | "loser_active" | "group_active" | "knockout_active" | "completed";
  createdAt: Date;
  updatedAt: Date;
}

export interface TournamentConfig {
  totalTeams: number;
  initialMatchPointTarget: number; // 15 points
  loserMatchPointTarget: number; // 11 points
  groupMatchPointTarget: number; // 15 points
  groupA_winners: number; // 3 winners + 1 loser round winner
  groupA_losers: number;
  groupB_winners: number;
  groupB_losers: number;
  groupC_winners: number; // 2 winners + 2 loser round winners
  groupC_losers: number;
  groupD_winners: number;
  groupD_losers: number;
}

export const DEFAULT_TOURNAMENT_CONFIG: TournamentConfig = {
  totalTeams: 20,
  initialMatchPointTarget: 15,
  loserMatchPointTarget: 11,
  groupMatchPointTarget: 15,
  groupA_winners: 3,
  groupA_losers: 1,
  groupB_winners: 3,
  groupB_losers: 1,
  groupC_winners: 2,
  groupC_losers: 2,
  groupD_winners: 2,
  groupD_losers: 1,
};
