/**
 * Tournament Service
 * Manages tournament state and operations
 */

import {
  Tournament,
  Team,
  Match,
  MatchStatus,
  MatchType,
  Group,
  GroupStanding,
  Player,
} from "./models";
import {
  createTournament,
  initializeTournament,
  progressToLoserMatches,
  progressToGroupStage,
  generateQuarterfinals,
  generateSemifinals,
  generateFinalStage,
  calculateGroupStandings,
  simulateMatch,
  simulateMatches,
  createTeam,
  randomGenerator,
} from "./logic";

export class TournamentService {
  private tournaments: Map<string, Tournament> = new Map();

  private createTbdTeam(label: string): Team {
    const id = `TBD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    return {
      id,
      name: label,
      players: [],
      status: "active",
      totalPoints: 0,
      matchesPlayed: 0,
    };
  }

  private nextTeamId(tournament: Tournament): string {
    const maxId = tournament.teams.reduce((max, team) => {
      const num = Number(team.id.replace(/^T/, ""));
      return Number.isFinite(num) ? Math.max(max, num) : max;
    }, 0);

    return `T${maxId + 1}`;
  }

  private nextMatchNumber(tournament: Tournament): number {
    const allMatches = [
      ...tournament.initialMatches,
      ...tournament.loserMatches,
      ...tournament.groups.flatMap((g) => g.matches),
      ...tournament.quarterfinals,
      ...tournament.semifinals,
      ...tournament.final,
      ...tournament.thirdPlace,
    ];

    const maxMatchNo = allMatches.reduce((max, match) => Math.max(max, match.matchNumber), 0);
    return maxMatchNo + 1;
  }

  private findTeamById(tournament: Tournament, teamId: string, tbdLabel: string): Team {
    if (teamId.startsWith("__TBD")) {
      return this.createTbdTeam(tbdLabel);
    }

    const team = tournament.teams.find((t) => t.id === teamId);
    if (!team) {
      throw new Error(`Team ${teamId} not found`);
    }

    return team;
  }

  /**
   * Create a new tournament with 20 teams
   */
  createNewTournament(name: string, teams: Team[]): Tournament {
    if (teams.length !== 20) {
      throw new Error("Tournament must have exactly 20 teams");
    }

    const tournament = createTournament(`tour-${Date.now()}`, name, teams);
    this.tournaments.set(tournament.id, tournament);
    return tournament;
  }

  /**
   * Get tournament by ID
   */
  getTournament(tournamentId: string): Tournament | undefined {
    return this.tournaments.get(tournamentId);
  }

  /**
   * Start tournament (generate initial matches)
   */
  startTournament(tournamentId: string): Tournament {
    const tournament = this.getTournament(tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    const updated = initializeTournament(tournament);
    this.tournaments.set(tournamentId, updated);
    return updated;
  }

  /**
   * Simulate and complete all initial matches
   */
  completeInitialMatches(tournamentId: string): Tournament {
    const tournament = this.getTournament(tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    tournament.initialMatches = simulateMatches(tournament.initialMatches);
    this.tournaments.set(tournamentId, tournament);
    return tournament;
  }

  /**
   * Manually set match result
   */
  setMatchResult(
    tournamentId: string,
    matchId: string,
    team1Score: number,
    team2Score: number
  ): Tournament {
    const tournament = this.getTournament(tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    const allMatches = [
      ...tournament.initialMatches,
      ...tournament.loserMatches,
      ...tournament.groups.flatMap((g) => g.matches),
      ...tournament.quarterfinals,
      ...tournament.semifinals,
      ...tournament.final,
      ...tournament.thirdPlace,
    ];

    const match = allMatches.find((m) => m.id === matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    if (match.team1.id.startsWith("TBD-") || match.team2.id.startsWith("TBD-")) {
      throw new Error("Cannot set result when one team is TBD. Replace TBD with actual teams first.");
    }

    if (team1Score === team2Score) {
      throw new Error("Match score cannot be tied");
    }

    const isTeam1Winner = team1Score > team2Score;
    match.status = MatchStatus.COMPLETED;
    match.result = {
      team1Score,
      team2Score,
      winner: isTeam1Winner ? match.team1 : match.team2,
      loser: isTeam1Winner ? match.team2 : match.team1,
    };
    match.completedTime = new Date();

    this.tournaments.set(tournamentId, tournament);
    return tournament;
  }

  addTeam(
    tournamentId: string,
    name: string,
    player1Name: string,
    player2Name: string
  ): Tournament {
    const tournament = this.getTournament(tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    if (!name.trim() || !player1Name.trim() || !player2Name.trim()) {
      throw new Error("Team name and both player names are required");
    }

    const teamId = this.nextTeamId(tournament);
    const team = createTeam(teamId, name.trim(), player1Name.trim(), player2Name.trim());

    tournament.teams.push(team);
    tournament.totalTeams = tournament.teams.length;
    tournament.updatedAt = new Date();

    this.tournaments.set(tournamentId, tournament);
    return tournament;
  }

  addManualMatch(
    tournamentId: string,
    payload: {
      type: MatchType;
      team1Id: string;
      team2Id: string;
      groupId?: string;
      pointsPerSet?: number;
      bestOf?: number;
    }
  ): Tournament {
    const tournament = this.getTournament(tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    if (payload.team1Id === payload.team2Id) {
      throw new Error("Team 1 and Team 2 must be different");
    }

    const team1 = this.findTeamById(tournament, payload.team1Id, "TBD");
    const team2 = this.findTeamById(tournament, payload.team2Id, "TBD");

    if (payload.type === MatchType.GROUP) {
      if (!payload.groupId) {
        throw new Error("groupId is required for group matches");
      }

      const group = tournament.groups.find((g) => g.id === payload.groupId);
      if (!group) {
        throw new Error("Selected group not found");
      }

      const inGroupTeam1 = group.teams.some((t) => t.id === team1.id);
      const inGroupTeam2 = group.teams.some((t) => t.id === team2.id);
      if (!inGroupTeam1 || !inGroupTeam2) {
        throw new Error("For group matches, both teams must be selected from the same group");
      }

      const match: Match = {
        id: `G${group.name}-M${group.matches.length + 1}`,
        type: MatchType.GROUP,
        matchNumber: this.nextMatchNumber(tournament),
        team1,
        team2,
        status: MatchStatus.PENDING,
        bestOf: payload.bestOf || 1,
        pointsPerSet: payload.pointsPerSet || 15,
      };

      group.matches.push(match);
      tournament.updatedAt = new Date();
      this.tournaments.set(tournamentId, tournament);
      return tournament;
    }

    const pointsPerSetByType: Record<MatchType, number> = {
      [MatchType.LEAGUE]: 15,
      [MatchType.LOSER]: 11,
      [MatchType.GROUP]: 15,
      [MatchType.QUARTERFINAL]: 21,
      [MatchType.SEMIFINAL]: 21,
      [MatchType.FINAL]: 21,
      [MatchType.THIRD_PLACE]: 21,
    };

    const targetPoints = payload.pointsPerSet || pointsPerSetByType[payload.type] || 21;
    const matchNumber = this.nextMatchNumber(tournament);

    const getMatchId = () => {
      switch (payload.type) {
        case MatchType.LEAGUE:
          return `ML${tournament.initialMatches.length + 1}`;
        case MatchType.LOSER:
          return `LM${tournament.loserMatches.length + 1}`;
        case MatchType.QUARTERFINAL:
          return `QF${tournament.quarterfinals.length + 1}`;
        case MatchType.SEMIFINAL:
          return `SF${tournament.semifinals.length + 1}`;
        case MatchType.FINAL:
          return `F${tournament.final.length + 1}`;
        case MatchType.THIRD_PLACE:
          return `TP${tournament.thirdPlace.length + 1}`;
        default:
          return `M${matchNumber}`;
      }
    };

    const manualMatch: Match = {
      id: getMatchId(),
      type: payload.type,
      matchNumber,
      team1,
      team2,
      status: MatchStatus.PENDING,
      bestOf: payload.bestOf || 1,
      pointsPerSet: targetPoints,
    };

    switch (payload.type) {
      case MatchType.LEAGUE:
        tournament.initialMatches.push(manualMatch);
        break;
      case MatchType.LOSER:
        tournament.loserMatches.push(manualMatch);
        break;
      case MatchType.QUARTERFINAL:
        tournament.quarterfinals.push(manualMatch);
        break;
      case MatchType.SEMIFINAL:
        tournament.semifinals.push(manualMatch);
        break;
      case MatchType.FINAL:
        tournament.final.push(manualMatch);
        break;
      case MatchType.THIRD_PLACE:
        tournament.thirdPlace.push(manualMatch);
        break;
      default:
        throw new Error(`Unsupported match type: ${payload.type}`);
    }

    tournament.updatedAt = new Date();
    this.tournaments.set(tournamentId, tournament);
    return tournament;
  }

  /**
   * Progress to losers round
   */
  progressToLoserRound(tournamentId: string): Tournament {
    const tournament = this.getTournament(tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    const updated = progressToLoserMatches(tournament);
    this.tournaments.set(tournamentId, updated);
    return updated;
  }

  /**
   * Simulate and complete all loser matches
   */
  completeLoserMatches(tournamentId: string): Tournament {
    const tournament = this.getTournament(tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    tournament.loserMatches = simulateMatches(tournament.loserMatches);
    this.tournaments.set(tournamentId, tournament);
    return tournament;
  }

  /**
   * Progress to group stage
   */
  progressToGroupRound(tournamentId: string): Tournament {
    const tournament = this.getTournament(tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    const updated = progressToGroupStage(tournament);
    this.tournaments.set(tournamentId, updated);
    return updated;
  }

  /**
   * Simulate and complete all group stage matches
   */
  completeGroupMatches(tournamentId: string): Tournament {
    const tournament = this.getTournament(tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    tournament.groups.forEach((group) => {
      group.matches = simulateMatches(group.matches);
      group.standings = calculateGroupStandings(group);
    });

    this.tournaments.set(tournamentId, tournament);
    return tournament;
  }

  /**
   * Get group standings
   */
  getGroupStandings(tournamentId: string, groupName: string): GroupStanding[] {
    const tournament = this.getTournament(tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    const group = tournament.groups.find((g) => g.name === groupName as any);
    if (!group) {
      throw new Error("Group not found");
    }

    return calculateGroupStandings(group);
  }

  /**
   * Progress to knockout stage (quarterfinals)
   */
  progressToKnockout(tournamentId: string): Tournament {
    const tournament = this.getTournament(tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    if (tournament.status !== "group_active") {
      throw new Error("All group stage matches must be completed");
    }

    tournament.quarterfinals = generateQuarterfinals(tournament.groups);
    tournament.status = "knockout_active";
    tournament.updatedAt = new Date();

    this.tournaments.set(tournamentId, tournament);
    return tournament;
  }

  /**
   * Simulate quarterfinals
   */
  completeQuarterfinals(tournamentId: string): Tournament {
    const tournament = this.getTournament(tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    tournament.quarterfinals = simulateMatches(tournament.quarterfinals);
    this.tournaments.set(tournamentId, tournament);
    return tournament;
  }

  /**
   * Progress to semifinals
   */
  progressToSemifinals(tournamentId: string): Tournament {
    const tournament = this.getTournament(tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    tournament.semifinals = generateSemifinals(tournament.quarterfinals);
    this.tournaments.set(tournamentId, tournament);
    return tournament;
  }

  /**
   * Simulate semifinals
   */
  completeSemifinals(tournamentId: string): Tournament {
    const tournament = this.getTournament(tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    tournament.semifinals = simulateMatches(tournament.semifinals);
    this.tournaments.set(tournamentId, tournament);
    return tournament;
  }

  /**
   * Progress to final stage
   */
  progressToFinal(tournamentId: string): Tournament {
    const tournament = this.getTournament(tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    const { final, thirdPlace } = generateFinalStage(tournament.semifinals);
    tournament.final = final;
    tournament.thirdPlace = thirdPlace;
    this.tournaments.set(tournamentId, tournament);
    return tournament;
  }

  /**
   * Simulate final and 3rd place match
   */
  completeFinal(tournamentId: string): Tournament {
    const tournament = this.getTournament(tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    tournament.final = simulateMatches(tournament.final);
    tournament.thirdPlace = simulateMatches(tournament.thirdPlace);

    if (tournament.final[0].result) {
      tournament.champion = tournament.final[0].result.winner;
      tournament.runner_up = tournament.final[0].result.loser;
    }

    if (tournament.thirdPlace[0].result) {
      tournament.third_place = tournament.thirdPlace[0].result.winner;
    }

    tournament.status = "completed";
    tournament.endDate = new Date();
    tournament.updatedAt = new Date();

    this.tournaments.set(tournamentId, tournament);
    return tournament;
  }

  /**
   * Get all tournament stats
   */
  getTournamentStats(tournamentId: string) {
    const tournament = this.getTournament(tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    const initialCompleted = tournament.initialMatches.filter(
      (m) => m.status === MatchStatus.COMPLETED
    ).length;
    const loserCompleted = tournament.loserMatches.filter(
      (m) => m.status === MatchStatus.COMPLETED
    ).length;
    const groupCompleted = tournament.groups.flatMap((g) => g.matches).filter(
      (m) => m.status === MatchStatus.COMPLETED
    ).length;
    const knockoutCompleted =
      tournament.quarterfinals.filter((m) => m.status === MatchStatus.COMPLETED).length +
      tournament.semifinals.filter((m) => m.status === MatchStatus.COMPLETED).length +
      tournament.final.filter((m) => m.status === MatchStatus.COMPLETED).length;

    return {
      totalTeams: tournament.totalTeams,
      status: tournament.status,
      initialMatches: {
        total: tournament.initialMatches.length,
        completed: initialCompleted,
      },
      loserMatches: {
        total: tournament.loserMatches.length,
        completed: loserCompleted,
      },
      groupMatches: {
        total: tournament.groups.flatMap((g) => g.matches).length,
        completed: groupCompleted,
      },
      knockoutMatches: {
        total:
          tournament.quarterfinals.length +
          tournament.semifinals.length +
          tournament.final.length +
          tournament.thirdPlace.length,
        completed: knockoutCompleted,
      },
      champion: tournament.champion?.name,
      runner_up: tournament.runner_up?.name,
      third_place: tournament.third_place?.name,
    };
  }

  /**
   * Generate sample tournament with demo teams
   */
  createSampleTournament(): Tournament {
    const teams: Team[] = [
      createTeam("T1", "Team Ganesh", "Ganesh Hegde (Gani)", "Aditya (Adi boss)"),
      createTeam("T2", "Team Vijet", "Vijet Hegde", "Kowshik"),
      createTeam("T3", "Team Narasimha", "Narasimha", "Kartik"),
      createTeam("T4", "Team Darshan", "Darshan Hegde", "Naveen hegde"),
      createTeam("T5", "Team Shridhar", "Shridhar Hegde", "Guruprasanna Hegde"),
      createTeam("T6", "Team CATU", "CATU", "Karthik"),
      createTeam("T7", "Team Aditya", "Aditya Bhat", "Mayura"),
      createTeam("T8", "Team Abhishek", "Abhishek Hegde (dabbe)", "Sathwik hegde (maaka)"),
      createTeam("T9", "Team Shreecharan", "Shreecharan S Bhat", "Bharat hegde"),
      createTeam("T10", "Team Sarvajith", "Sarvajith", "Amar"),
      createTeam("T11", "Team Bharat", "Bharat Uppadike", "Vageesh Bhat"),
      createTeam("T12", "Team Dattu", "Dattu", "Satwik"),
      createTeam("T13", "Team Ganesh2", "Ganesh Hegde", "Niteesh Hegde"),
      createTeam("T14", "Team Shashank", "Shashank Hegde (shank)", "Rajat bhat (raju)"),
      createTeam("T15", "Team Shriram", "Shriram Bhat", "Vighnesh Bhat"),
      createTeam("T16", "Team Anant", "Anant", "Sabahita"),
      createTeam("T17", "Team Vinayak", "Vinayak V Hegde", "Preetham R Hegde"),
      createTeam("T18", "Team Pranav", "Pranav S B", "Sumanth bhat"),
      createTeam("T19", "Team Aneesh", "Aneesh V Hegde", "Akshay G Bhagwath"),
      createTeam("T20", "Team Akshay", "Akshay Hegde", "Gururaj"),
    ];

    return this.createNewTournament("Badminton Doubles Championship", teams);
  }
}

// Singleton instance
export const tournamentService = new TournamentService();
