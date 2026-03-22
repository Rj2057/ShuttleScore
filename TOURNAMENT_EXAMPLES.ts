/**
 * Example: How to Use the Tournament Management System
 * This file demonstrates practical usage patterns
 */

import { tournamentService } from "@/lib/tournament/service";
import { Team, Tournament } from "@/lib/tournament/models";
import {
  exportTournamentAsJSON,
  exportTournamentAsCSV,
  getTournamentSummary,
} from "@/lib/tournament/format";

/**
 * EXAMPLE 1: Create and run a complete tournament
 */
export async function completetournamentExample() {
  console.log("=== Complete Tournament Example ===\n");

  // Step 1: Create tournament with sample teams
  const tournament = tournamentService.createSampleTournament();
  const id = tournament.id;
  console.log(`✓ Created tournament: ${tournament.name} (ID: ${id})`);

  // Step 2: Start league matches
  let currentTournament = tournamentService.startTournament(id);
  console.log(`✓ League matches generated: ${currentTournament.initialMatches.length} matches`);

  // Step 3: Simulate league matches
  currentTournament = tournamentService.completeInitialMatches(id);
  const leagueCompleted = currentTournament.initialMatches.filter(
    (m) => m.status === "completed"
  ).length;
  console.log(`✓ League completed: ${leagueCompleted}/${currentTournament.initialMatches.length}`);

  // Step 4: Progress to losers round
  currentTournament = tournamentService.progressToLoserRound(id);
  console.log(`✓ Losers round started: ${currentTournament.loserMatches.length} matches`);

  // Step 5: Simulate losers round
  currentTournament = tournamentService.completeLoserMatches(id);
  console.log(`✓ Losers round completed`);

  // Step 6: Progress to group stage
  currentTournament = tournamentService.progressToGroupRound(id);
  console.log(`✓ Group stage started: ${currentTournament.groups.length} groups`);
  currentTournament.groups.forEach((group) => {
    console.log(`  - Group ${group.name}: ${group.teams.length} teams, ${group.matches.length} matches`);
  });

  // Step 7: Simulate group matches
  currentTournament = tournamentService.completeGroupMatches(id);
  console.log(`✓ Group stage completed`);

  // Step 8: Get standings
  console.log("\n--- Group Standings ---");
  currentTournament.groups.forEach((group) => {
    console.log(`\nGroup ${group.name}:`);
    group.standings
      .sort((a, b) => a.position - b.position)
      .forEach((standing) => {
        const qualified = standing.position <= 2 ? "→ QUALIFIED" : "";
        console.log(
          `  ${standing.position}. ${standing.team.name}: ${standing.totalPoints}pts (${standing.wins}W-${standing.losses}L) ${qualified}`
        );
      });
  });

  // Step 9: Progress to knockout
  currentTournament = tournamentService.progressToKnockout(id);
  console.log(`\n✓ Knockout stage started: ${currentTournament.quarterfinals.length} quarterfinals`);

  // Step 10: Simulate remaining stages
  currentTournament = tournamentService.completeQuarterfinals(id);
  currentTournament = tournamentService.progressToSemifinals(id);
  currentTournament = tournamentService.completeSemifinals(id);
  currentTournament = tournamentService.progressToFinal(id);
  currentTournament = tournamentService.completeFinal(id);

  console.log("\n--- Final Results ---");
  console.log(`🏆 Champion: ${currentTournament.champion?.name}`);
  console.log(`🥈 Runner-up: ${currentTournament.runner_up?.name}`);
  console.log(`🥉 3rd Place: ${currentTournament.third_place?.name}`);

  return currentTournament;
}

/**
 * EXAMPLE 2: Manual score entry during tournament
 */
export async function manualScoringExample() {
  console.log("\n=== Manual Scoring Example ===\n");

  // Create and start tournament
  const tournament = tournamentService.createSampleTournament();
  const id = tournament.id;
  tournamentService.startTournament(id);

  const t = tournamentService.getTournament(id)!;

  // Manually set scores for league matches
  console.log("Setting league match scores...");

  // Match M1: Team 1 wins 15-10
  tournamentService.setMatchResult(id, "M1", 15, 10);
  console.log('✓ M1: ${t.initialMatches[0].team1.name} defeated ${t.initialMatches[0].team2.name} 15-10');

  // Match M2: Team 2 wins 15-12
  tournamentService.setMatchResult(id, "M2", 12, 15);
  console.log('✓ M2: ${t.initialMatches[1].team2.name} defeated ${t.initialMatches[1].team1.name} 15-12');

  // Simulate rest
  console.log("\nSimulating remaining matches...");
  tournamentService.completeInitialMatches(id);

  const completed = tournamentService.getTournament(id)!.initialMatches.filter(
    (m) => m.status === "completed"
  ).length;
  console.log(`✓ Total matches completed: ${completed}`);
}

/**
 * EXAMPLE 3: Export tournament data
 */
export async function exportDataExample() {
  console.log("\n=== Export Example ===\n");

  const tournament = tournamentService.createSampleTournament();
  const id = tournament.id;

  // Run quick tournament
  tournamentService.startTournament(id);
  tournamentService.completeInitialMatches(id);
  tournamentService.progressToLoserRound(id);
  tournamentService.completeLoserMatches(id);
  tournamentService.progressToGroupRound(id);
  tournamentService.completeGroupMatches(id);

  const finalTournament = tournamentService.getTournament(id)!;

  // Export as JSON
  const jsonData = exportTournamentAsJSON(finalTournament);
  console.log("✓ JSON export ready");
  console.log(`  - Tournament summary: ${JSON.stringify(jsonData.tournament, null, 2)}`);

  // Export as CSV
  const csvData = exportTournamentAsCSV(finalTournament);
  console.log("\n✓ CSV export ready");
  console.log("  - Can be imported into Excel/Sheets");

  // Get summary
  const summary = getTournamentSummary(finalTournament);
  console.log("\n--- Tournament Summary ---");
  console.log(`Status: ${summary.status}`);
  console.log(`League Matches: ${summary.stages.initialMatches.completed}/${summary.stages.initialMatches.total}`);
  console.log(`Loser Matches: ${summary.stages.loserMatches.completed}/${summary.stages.loserMatches.total}`);
  console.log(`Group Matches: ${summary.stages.groupMatches.completed}/${summary.stages.groupMatches.total}`);
}

/**
 * EXAMPLE 4: Check tournament stats
 */
export async function statsExample() {
  console.log("\n=== Tournament Stats Example ===\n");

  const tournament = tournamentService.createSampleTournament();
  const id = tournament.id;

  // Progress tournament through all stages
  tournamentService.startTournament(id);
  tournamentService.completeInitialMatches(id);
  tournamentService.progressToLoserRound(id);
  tournamentService.completeLoserMatches(id);
  tournamentService.progressToGroupRound(id);
  tournamentService.completeGroupMatches(id);

  const stats = tournamentService.getTournamentStats(id);
  console.log(`Tournament: ${stats.champion ? "RUNNING" : "PENDING"}`);
  console.log(`Total Teams: ${stats.totalTeams}`);
  console.log(`\nLeague Matches: ${stats.initialMatches.completed}/${stats.initialMatches.total} ✓`);
  console.log(`Loser Matches: ${stats.loserMatches.completed}/${stats.loserMatches.total} ✓`);
  console.log(`Group Matches: ${stats.groupMatches.completed}/${stats.groupMatches.total} ✓`);
  console.log(`Knockout Matches: ${stats.knockoutMatches.completed}/${stats.knockoutMatches.total}`);
}

/**
 * EXAMPLE 5: Random team distribution in groups
 */
export async function randomGroupAssignmentExample() {
  console.log("\n=== Random Group Assignment Example ===\n");

  const tournament = tournamentService.createSampleTournament();
  const id = tournament.id;

  // Setup
  tournamentService.startTournament(id);
  tournamentService.completeInitialMatches(id);
  tournamentService.progressToLoserRound(id);
  tournamentService.completeLoserMatches(id);

  // Progress to groups (this triggers random assignment)
  tournamentService.progressToGroupRound(id);

  const finalTournament = tournamentService.getTournament(id)!;

  console.log("Random Group Assignments:\n");
  finalTournament.groups.forEach((group) => {
    console.log(`Group ${group.name}:`);
    group.teams
      .sort((a, b) => (a.groupPosition || 0) - (b.groupPosition || 0))
      .forEach((team) => {
        console.log(`  ${team.groupPosition}. ${team.name}`);
      });
    console.log();
  });

  // Verify constraints
  console.log("Constraint Verification:");
  finalTournament.groups.forEach((group) => {
    const winnerCount = group.teams.filter((t) => t.id.match(/^T[1-9]$/)).length;
    const loserWinnerCount = group.teams.length - winnerCount;
    console.log(`Group ${group.name}: ${winnerCount} Winners + ${loserWinnerCount} Loser Winners`);
  });
}

/**
 * EXAMPLE 6: Group standings demonstration
 */
export async function headToHeadExample() {
  console.log("\n=== Group Standings Example ===\n");

  const tournament = tournamentService.createSampleTournament();
  const id = tournament.id;

  // Run to group stage
  tournamentService.startTournament(id);
  tournamentService.completeInitialMatches(id);
  tournamentService.progressToLoserRound(id);
  tournamentService.completeLoserMatches(id);
  tournamentService.progressToGroupRound(id);
  tournamentService.completeGroupMatches(id);

  const finalTournament = tournamentService.getTournament(id)!;

  console.log("Group Standings (wins-based ranking):\n");
  finalTournament.groups.forEach((group) => {
    console.log(`Group ${group.name}:`);
    group.standings
      .sort((a, b) => a.position - b.position)
      .forEach((standing) => {
        console.log(
          `${standing.position}. ${standing.team.name}: ${standing.totalPoints}pts | W: ${standing.wins}, L: ${standing.losses}`
        );
      });
    console.log();
  });
}

// Run examples
if (require.main === module) {
  console.log("🏸 TOURNAMENT MANAGEMENT SYSTEM - EXAMPLES\n");
  console.log("========================================\n");

  completetournamentExample()
    .then(() => manualScoringExample())
    .then(() => exportDataExample())
    .then(() => statsExample())
    .then(() => randomGroupAssignmentExample())
    .then(() => headToHeadExample())
    .then(() => console.log("\n✓ All examples completed!"))
    .catch(console.error);
}
