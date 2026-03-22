/**
 * Tournament Formatting & Export Utilities
 * Format tournament data for display and export
 */

import { Tournament, Match, Group, GroupStanding, MatchType, MatchStatus } from "./models";

export interface FormattedMatch {
  matchNumber: number;
  matchId: string;
  team1Name: string;
  team2Name: string;
  team1Players: string;
  team2Players: string;
  team1Score?: number;
  team2Score?: number;
  winner?: string;
  status: string;
  type: string;
  note?: string;
}

export interface FormattedGroupStanding {
  position: number;
  teamName: string;
  teamId: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifference: number;
  totalPoints: number;
}

/**
 * Format match for display
 */
export function formatMatch(match: Match): FormattedMatch {
  const team1Players = match.team1.players.map((p) => p.name).join(" & ");
  const team2Players = match.team2.players.map((p) => p.name).join(" & ");

  return {
    matchNumber: match.matchNumber,
    matchId: match.id,
    team1Name: match.team1.name,
    team2Name: match.team2.name,
    team1Players,
    team2Players,
    team1Score: match.result?.team1Score,
    team2Score: match.result?.team2Score,
    winner: match.result?.winner.name,
    status: match.status,
    type: match.type,
    note: match.note,
  };
}

/**
 * Format group standings
 */
export function formatGroupStandings(standings: GroupStanding[]): FormattedGroupStanding[] {
  return standings.map((standing) => ({
    position: standing.position,
    teamName: standing.team.name,
    teamId: standing.team.id,
    matchesPlayed: standing.matchesPlayed,
    wins: standing.wins,
    losses: standing.losses,
    pointsFor: standing.pointsFor,
    pointsAgainst: standing.pointsAgainst,
    pointDifference: standing.pointDifference,
    totalPoints: standing.totalPoints,
  }));
}

/**
 * Get tournament summary as formatted object for API responses
 */
export function getTournamentSummary(tournament: Tournament) {
  return {
    id: tournament.id,
    name: tournament.name,
    status: tournament.status,
    totalTeams: tournament.totalTeams,
    startDate: tournament.startDate,
    endDate: tournament.endDate,
    stages: {
      initialMatches: {
        total: tournament.initialMatches.length,
        completed: tournament.initialMatches.filter((m) => m.status === MatchStatus.COMPLETED)
          .length,
      },
      loserMatches: {
        total: tournament.loserMatches.length,
        completed: tournament.loserMatches.filter((m) => m.status === MatchStatus.COMPLETED)
          .length,
      },
      groupMatches: {
        total: tournament.groups.flatMap((g) => g.matches).length,
        completed: tournament.groups
          .flatMap((g) => g.matches)
          .filter((m) => m.status === MatchStatus.COMPLETED).length,
      },
      knockout: {
        quarterfinals: tournament.quarterfinals.length,
        semifinals: tournament.semifinals.length,
        final: tournament.final.length,
        thirdPlace: tournament.thirdPlace.length,
      },
    },
    results: {
      champion: tournament.champion?.name,
      runner_up: tournament.runner_up?.name,
      third_place: tournament.third_place?.name,
    },
  };
}

/**
 * Get league matches formatted
 */
export function getFormattedLeagueMatches(tournament: Tournament): FormattedMatch[] {
  return tournament.initialMatches.map((match, index) => ({
    ...formatMatch(match),
    note: match.result
      ? `${match.result.winner.name} (${match.result.team1Score}-${match.result.team2Score})`
      : "Pending",
  }));
}

/**
 * Get loser matches formatted
 */
export function getFormattedLoserMatches(tournament: Tournament): FormattedMatch[] {
  return tournament.loserMatches.map((match) => ({
    ...formatMatch(match),
    note: match.result
      ? `${match.result.winner.name} (${match.result.team1Score}-${match.result.team2Score})`
      : "Pending",
  }));
}

/**
 * Get group matches formatted by group
 */
export function getFormattedGroupMatches(tournament: Tournament): Record<string, FormattedMatch[]> {
  const result: Record<string, FormattedMatch[]> = {};

  tournament.groups.forEach((group) => {
    result[`Group ${group.name}`] = group.matches.map((match) => ({
      ...formatMatch(match),
      note: match.result
        ? `${match.result.winner.name} (${match.result.team1Score}-${match.result.team2Score})`
        : "Pending",
    }));
  });

  return result;
}

/**
 * Get quarterfinal matches formatted
 */
export function getFormattedQuarterfinals(tournament: Tournament): FormattedMatch[] {
  return tournament.quarterfinals.map((match) => ({
    ...formatMatch(match),
    note: match.result
      ? `${match.result.winner.name} (${match.result.team1Score}-${match.result.team2Score})`
      : "Pending",
  }));
}

/**
 * Get semifinal matches formatted
 */
export function getFormattedSemifinals(tournament: Tournament): FormattedMatch[] {
  return tournament.semifinals.map((match) => ({
    ...formatMatch(match),
    note: match.result
      ? `${match.result.winner.name} (${match.result.team1Score}-${match.result.team2Score})`
      : "Pending",
  }));
}

/**
 * Get final and 3rd place matches formatted
 */
export function getFormattedFinal(tournament: Tournament) {
  return {
    final: tournament.final.map((match) => ({
      ...formatMatch(match),
      note: match.result
        ? `${match.result.winner.name} (${match.result.team1Score}-${match.result.team2Score})`
        : "Pending",
    })),
    thirdPlace: tournament.thirdPlace.map((match) => ({
      ...formatMatch(match),
      note: match.result
        ? `${match.result.winner.name} (${match.result.team1Score}-${match.result.team2Score})`
        : "Pending",
    })),
  };
}

/**
 * Export tournament data as CSV format
 */
export function exportTournamentAsCSV(tournament: Tournament): string {
  let csv = `Tournament: ${tournament.name}\n`;
  csv += `Status: ${tournament.status}\n`;
  csv += `Generated: ${new Date().toISOString()}\n\n`;

  // League Matches
  csv += `League Matches\n`;
  csv += `SR.NO,Team 1,vs,Team 2,Matches,Position\n`;
  getFormattedLeagueMatches(tournament).forEach((match, index) => {
    csv += `${index + 1},"${match.team1Name} (${match.team1Players})","vs","${match.team2Name} (${match.team2Players})","${match.matchId}","${match.winner || "Pending"}"\n`;
  });

  csv += `\n\nLoser Matches\n`;
  csv += `SR.NO,Team 1,vs,Team 2,Matches,Position\n`;
  getFormattedLoserMatches(tournament).forEach((match, index) => {
    csv += `${index + 1},"${match.team1Name}","vs","${match.team2Name}","${match.matchId}","${match.winner || "Pending"}"\n`;
  });

  // Group Standings
  csv += `\n\nGroup Stage Standings\n`;
  tournament.groups.forEach((group) => {
    csv += `\nGroup ${group.name}\n`;
    csv += `Position,Team,Matches,Wins,Losses,Points For,Points Against,Point Difference,Total Points\n`;
    const standings = tournament.groups
      .find((g) => g.id === group.id)
      ?.standings.sort((a, b) => a.position - b.position);
    standings?.forEach((standing) => {
      csv += `${standing.position},"${standing.team.name}",${standing.matchesPlayed},${standing.wins},${standing.losses},${standing.pointsFor},${standing.pointsAgainst},${standing.pointDifference},${standing.totalPoints}\n`;
    });
  });

  return csv;
}

/**
 * Export as JSON for API responses
 */
export function exportTournamentAsJSON(tournament: Tournament) {
  return {
    tournament: getTournamentSummary(tournament),
    leagueMatches: getFormattedLeagueMatches(tournament),
    loserMatches: getFormattedLoserMatches(tournament),
    groupMatches: getFormattedGroupMatches(tournament),
    groupStandings: Object.fromEntries(
      tournament.groups.map((group) => [
        `Group ${group.name}`,
        formatGroupStandings(
          group.standings.sort((a, b) => a.position - b.position)
        ),
      ])
    ),
    knockoutMatches: {
      quarterfinals: getFormattedQuarterfinals(tournament),
      semifinals: getFormattedSemifinals(tournament),
      final: getFormattedFinal(tournament),
    },
  };
}
