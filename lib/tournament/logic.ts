/**
 * Core Tournament Logic
 * Handles match generation, team assignments, and tournament progression
 */

import { Team, Match, MatchType, MatchStatus, Tournament, Group, TournamentConfig, DEFAULT_TOURNAMENT_CONFIG, Player, KnockoutStage, GroupStanding } from "./models";

/**
 * Random number generator utility
 * Uses Math.random() with seed option for reproducibility
 * For simple randomness, using standard Math.random()
 */
export class RandomGenerator {
  private seed?: number;

  constructor(seed?: number) {
    this.seed = seed;
  }

  /**
   * Get random integer between min (inclusive) and max (exclusive)
   */
  randomRange(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  /**
   * Fisher-Yates shuffle algorithm for true randomization
   */
  shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Randomly select n items from array without replacement
   */
  selectRandom<T>(array: T[], count: number): T[] {
    if (count > array.length) throw new Error("Cannot select more items than array length");
    const shuffled = this.shuffle(array);
    return shuffled.slice(0, count);
  }
}

export const randomGenerator = new RandomGenerator();

/**
 * Create a team object
 */
export function createTeam(id: string, name: string, player1: string, player2: string): Team {
  return {
    id,
    name,
    players: [
      { id: `${id}-p1`, name: player1 },
      { id: `${id}-p2`, name: player2 },
    ],
    status: "active",
    totalPoints: 0,
    matchesPlayed: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    pointDifference: 0,
  };
}

/**
 * Create initial match
 */
function createMatch(
  id: string,
  matchNumber: number,
  type: MatchType,
  team1: Team,
  team2: Team,
  pointTarget: number,
  bestOf: number = 1
): Match {
  return {
    id,
    type,
    matchNumber,
    team1,
    team2,
    status: MatchStatus.PENDING,
    bestOf,
    pointsPerSet: pointTarget,
  };
}

/**
 * Generate 10 initial matches from 20 teams
 * Round 1: Randomly pair teams
 */
export function generateInitialMatches(teams: Team[]): Match[] {
  if (teams.length !== 20) {
    throw new Error("Initial matches require exactly 20 teams");
  }

  const shuffled = randomGenerator.shuffle([...teams]);
  const matches: Match[] = [];

  for (let i = 0; i < 10; i++) {
    const team1 = shuffled[i * 2];
    const team2 = shuffled[i * 2 + 1];

    const match = createMatch(
      `M${i + 1}`,
      i + 1,
      MatchType.LEAGUE,
      team1,
      team2,
      15
    );

    matches.push(match);
  }

  return matches;
}

/**
 * Extract winners and losers from initial matches
 */
export function extractWinnersAndLosers(matches: Match[]): {
  winners: Team[];
  losers: Team[];
} {
  const winners: Team[] = [];
  const losers: Team[] = [];

  matches.forEach((match) => {
    if (!match.result) {
      throw new Error(`Match ${match.id} has no result`);
    }
    winners.push(match.result.winner);
    losers.push(match.result.loser);
  });

  return { winners, losers };
}

/**
 * Generate losers round matches from 10 losing teams
 * Losers Round: Randomly pair 10 losers into 5 matches
 */
export function generateLoserMatches(losingTeams: Team[]): Match[] {
  if (losingTeams.length !== 10) {
    throw new Error("Losers round requires exactly 10 teams");
  }

  const shuffled = randomGenerator.shuffle([...losingTeams]);
  const matches: Match[] = [];

  for (let i = 0; i < 5; i++) {
    const team1 = shuffled[i * 2];
    const team2 = shuffled[i * 2 + 1];

    const match = createMatch(
      `LM${i + 1}`,
      i + 11,
      MatchType.LOSER,
      team1,
      team2,
      11 // 11 points for losers round
    );

    matches.push(match);
  }

  return matches;
}

/**
 * Simulate match result with random winner
 */
export function simulateMatch(match: Match): Match {
  const isTeam1Winner = Math.random() > 0.5;
  
  const team1Score = isTeam1Winner 
    ? match.pointsPerSet 
    : Math.max(0, match.pointsPerSet - Math.floor(Math.random() * 3) - 1);
    
  const team2Score = !isTeam1Winner 
    ? match.pointsPerSet 
    : Math.max(0, match.pointsPerSet - Math.floor(Math.random() * 3) - 1);

  const updatedMatch = { ...match };
  updatedMatch.status = MatchStatus.COMPLETED;
  updatedMatch.result = {
    team1Score,
    team2Score,
    winner: isTeam1Winner ? match.team1 : match.team2,
    loser: isTeam1Winner ? match.team2 : match.team1,
  };
  updatedMatch.completedTime = new Date();

  return updatedMatch;
}

/**
 * Batch simulate multiple matches
 */
export function simulateMatches(matches: Match[]): Match[] {
  return matches.map((match) => {
    if (match.status === MatchStatus.PENDING) {
      return simulateMatch(match);
    }
    return match;
  });
}

/**
 * Create tournament object with initial setup
 */
export function createTournament(
  id: string,
  name: string,
  teams: Team[],
  config: TournamentConfig = DEFAULT_TOURNAMENT_CONFIG
): Tournament {
  return {
    id,
    name,
    startDate: new Date(),
    totalTeams: teams.length,
    teams,
    initialMatches: [],
    loserMatches: [],
    groups: [],
    quarterfinals: [],
    semifinals: [],
    final: [],
    thirdPlace: [],
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Initialize tournament: Generate initial matches
 */
export function initializeTournament(tournament: Tournament): Tournament {
  const updated = { ...tournament };
  
  if (updated.teams.length !== 20) {
    throw new Error("Tournament must have exactly 20 teams");
  }

  updated.initialMatches = generateInitialMatches(updated.teams);
  updated.status = "league_active";
  updated.updatedAt = new Date();

  return updated;
}

/**
 * Progress tournament to loser matches stage
 */
export function progressToLoserMatches(tournament: Tournament): Tournament {
  if (tournament.status !== "league_active") {
    throw new Error("Tournament must be in league_active status");
  }

  if (tournament.initialMatches.some((m) => m.status === MatchStatus.PENDING)) {
    throw new Error("All initial matches must be completed first");
  }

  const { winners: initialWinners, losers } = extractWinnersAndLosers(tournament.initialMatches);
  
  const updated = { ...tournament };
  updated.loserMatches = generateLoserMatches(losers);
  updated.status = "loser_active";
  updated.updatedAt = new Date();

  return updated;
}

/**
 * Progress tournament to group stage
 */
export function progressToGroupStage(tournament: Tournament): Tournament {
  if (tournament.status !== "loser_active") {
    throw new Error("Tournament must be in loser_active status");
  }

  if (tournament.loserMatches.some((m) => m.status === MatchStatus.PENDING)) {
    throw new Error("All loser matches must be completed first");
  }

  const { winners: initialWinners } = extractWinnersAndLosers(tournament.initialMatches);
  const { winners: loserWinners } = extractWinnersAndLosers(tournament.loserMatches);

  const updated = { ...tournament };
  updated.groups = formGroups(initialWinners, loserWinners);
  
  // Generate round-robin matches for each group
  updated.groups.forEach((group) => {
    group.matches = generateGroupMatches(group);
  });

  updated.status = "group_active";
  updated.updatedAt = new Date();

  return updated;
}

/**
 * Form 4 groups with constraints
 * Group A: 4 teams (3 winners + 1 loser winner)
 * Group B: 4 teams (3 winners + 1 loser winner)
 * Group C: 4 teams (2 winners + 2 loser winners)
 * Group D: 3 teams (2 winners + 1 loser winner)
 */
export function formGroups(winners: Team[], loserWinners: Team[]): Group[] {
  if (winners.length !== 10) {
    throw new Error("Must have exactly 10 winners");
  }
  if (loserWinners.length !== 5) {
    throw new Error("Must have exactly 5 loser winners");
  }

  const shuffledWinners = randomGenerator.shuffle([...winners]);
  const shuffledLoserWinners = randomGenerator.shuffle([...loserWinners]);

  // Assign winners to groups
  const groupAWinners = shuffledWinners.slice(0, 3);
  const groupBWinners = shuffledWinners.slice(3, 6);
  const groupCWinners = shuffledWinners.slice(6, 8);
  const groupDWinners = shuffledWinners.slice(8, 10);

  // Assign loser winners to groups (split: 1,1,2,1)
  const groupALoserWinners = shuffledLoserWinners.slice(0, 1);
  const groupBLoserWinners = shuffledLoserWinners.slice(1, 2);
  const groupCLoserWinners = shuffledLoserWinners.slice(2, 4);
  const groupDLoserWinners = shuffledLoserWinners.slice(4, 5);

  const groups: Group[] = [
    {
      id: "GA",
      name: "A",
      teams: [...groupAWinners, ...groupALoserWinners],
      matches: [],
      standings: [],
      roundNumber: 1,
    },
    {
      id: "GB",
      name: "B",
      teams: [...groupBWinners, ...groupBLoserWinners],
      matches: [],
      standings: [],
      roundNumber: 1,
    },
    {
      id: "GC",
      name: "C",
      teams: [...groupCWinners, ...groupCLoserWinners],
      matches: [],
      standings: [],
      roundNumber: 1,
    },
    {
      id: "GD",
      name: "D",
      teams: [...groupDWinners, ...groupDLoserWinners],
      matches: [],
      standings: [],
      roundNumber: 1,
    },
  ];

  // Assign group IDs and reset team status
  groups.forEach((group) => {
    group.teams.forEach((team, index) => {
      team.groupId = group.id;
      team.groupPosition = index + 1;
    });
  });

  return groups;
}

/**
 * Generate round-robin matches for a group
 * Each team plays every other team once
 */
export function generateGroupMatches(group: Group): Match[] {
  const matches: Match[] = [];
  let matchNumber = 20; // Matches start from 20 onwards (1-10 initial, 11-15 loser)

  for (let i = 0; i < group.teams.length; i++) {
    for (let j = i + 1; j < group.teams.length; j++) {
      const match = createMatch(
        `G${group.name}-M${matches.length + 1}`,
        matchNumber++,
        MatchType.GROUP,
        group.teams[i],
        group.teams[j],
        15 // 15 points for group stage
      );
      matches.push(match);
    }
  }

  return matches;
}

/**
 * Calculate standings for a group
 */
export function calculateGroupStandings(group: Group): GroupStanding[] {
  const standings: Map<string, GroupStanding> = new Map();

  // Initialize standings for each team
  group.teams.forEach((team) => {
    standings.set(team.id, {
      position: 0,
      team,
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      pointDifference: 0,
      totalPoints: 0,
      headToHeadRecord: new Map(),
    });
  });

  // Process completed matches
  group.matches.forEach((match) => {
    if (match.status === MatchStatus.COMPLETED && match.result) {
      const team1Standing = standings.get(match.team1.id)!;
      const team2Standing = standings.get(match.team2.id)!;

      team1Standing.matchesPlayed++;
      team2Standing.matchesPlayed++;

      if (match.result.winner.id === match.team1.id) {
        team1Standing.wins++;
        team1Standing.totalPoints++;
        team2Standing.losses++;
      } else {
        team2Standing.wins++;
        team2Standing.totalPoints++;
        team1Standing.losses++;
      }

      team1Standing.pointsFor += match.result.team1Score;
      team1Standing.pointsAgainst += match.result.team2Score;
      team2Standing.pointsFor += match.result.team2Score;
      team2Standing.pointsAgainst += match.result.team1Score;

      // Calculate point difference
      team1Standing.pointDifference = team1Standing.pointsFor - team1Standing.pointsAgainst;
      team2Standing.pointDifference = team2Standing.pointsFor - team2Standing.pointsAgainst;

      // Update head-to-head record
      if (!team1Standing.headToHeadRecord!.has(match.team2.id)) {
        team1Standing.headToHeadRecord!.set(match.team2.id, { pointsFor: 0, pointsAgainst: 0 });
      }
      if (!team2Standing.headToHeadRecord!.has(match.team1.id)) {
        team2Standing.headToHeadRecord!.set(match.team1.id, { pointsFor: 0, pointsAgainst: 0 });
      }

      const h2h1 = team1Standing.headToHeadRecord!.get(match.team2.id)!;
      const h2h2 = team2Standing.headToHeadRecord!.get(match.team1.id)!;

      h2h1.pointsFor += match.result.team1Score;
      h2h1.pointsAgainst += match.result.team2Score;
      h2h2.pointsFor += match.result.team2Score;
      h2h2.pointsAgainst += match.result.team1Score;
    }
  });

  // Sort standings by: total points > point difference > direct head-to-head
  const sortedStandings = Array.from(standings.values()).sort((a, b) => {
    // First: total points (descending)
    if (a.totalPoints !== b.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }

    // Second: point difference (descending)
    if (a.pointDifference !== b.pointDifference) {
      return b.pointDifference - a.pointDifference;
    }

    // Third: points for (descending)
    if (a.pointsFor !== b.pointsFor) {
      return b.pointsFor - a.pointsFor;
    }

    // If all else is equal, keep original order
    return 0;
  });

  // Assign positions
  sortedStandings.forEach((standing, index) => {
    standing.position = index + 1;
  });

  return sortedStandings;
}

/**
 * Get qualified teams from all groups (top 2 from each)
 */
export function getQualifiedTeams(groups: Group[]): Team[] {
  const qualified: Team[] = [];

  groups.forEach((group) => {
    const standings = calculateGroupStandings(group);
    qualified.push(standings[0].team);
    qualified.push(standings[1].team);
  });

  return qualified;
}

/**
 * Generate quarterfinal matches
 * A1 vs D2, A2 vs C1, B1 vs C2, B2 vs D1
 */
export function generateQuarterfinals(groups: Group[]): Match[] {
  const standings = groups.map((group) => ({
    name: group.name,
    standings: calculateGroupStandings(group),
  }));

  const standingsMap = new Map(standings.map((s) => [s.name, s.standings]));

  const A = standingsMap.get("A")!;
  const B = standingsMap.get("B")!;
  const C = standingsMap.get("C")!;
  const D = standingsMap.get("D")!;

  const matches: Match[] = [
    createMatch(`QF1`, 30, MatchType.QUARTERFINAL, A[0].team, D[1].team, 15),
    createMatch(`QF2`, 31, MatchType.QUARTERFINAL, A[1].team, C[0].team, 15),
    createMatch(`QF3`, 32, MatchType.QUARTERFINAL, B[0].team, C[1].team, 15),
    createMatch(`QF4`, 33, MatchType.QUARTERFINAL, B[1].team, D[0].team, 15),
  ];

  return matches;
}

/**
 * Generate semifinal matches from quarterfinal winners
 */
export function generateSemifinals(quarterFinalMatches: Match[]): Match[] {
  if (quarterFinalMatches.some((m) => m.status !== MatchStatus.COMPLETED)) {
    throw new Error("All quarterfinal matches must be completed");
  }

  const qfWinners = quarterFinalMatches.map((m) => m.result!.winner);

  const matches: Match[] = [
    createMatch(`SF1`, 34, MatchType.SEMIFINAL, qfWinners[0], qfWinners[3], 15),
    createMatch(`SF2`, 35, MatchType.SEMIFINAL, qfWinners[1], qfWinners[2], 15),
  ];

  return matches;
}

/**
 * Generate final and 3rd place match
 */
export function generateFinalStage(semiMatches: Match[]): {
  final: Match[];
  thirdPlace: Match[];
} {
  if (semiMatches.some((m) => m.status !== MatchStatus.COMPLETED)) {
    throw new Error("All semifinal matches must be completed");
  }

  const sf1Winner = semiMatches[0].result!.winner;
  const sf1Loser = semiMatches[0].result!.loser;
  const sf2Winner = semiMatches[1].result!.winner;
  const sf2Loser = semiMatches[1].result!.loser;

  const final = [createMatch(`F`, 36, MatchType.FINAL, sf1Winner, sf2Winner, 15)];

  const thirdPlace = [
    createMatch(`3P`, 37, MatchType.THIRD_PLACE, sf1Loser, sf2Loser, 15),
  ];

  return { final, thirdPlace };
}
