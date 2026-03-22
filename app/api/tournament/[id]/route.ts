/**
 * Tournament Operations API Routes
 */

import { NextRequest, NextResponse } from "next/server";
import { tournamentService } from "@/lib/tournament/service";
import { getTournamentSummary, exportTournamentAsJSON } from "@/lib/tournament/format";

/**
 * POST /api/tournament/[id]/start
 * Initialize tournament and generate initial matches
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { action } = await request.json();

    const tournament = tournamentService.getTournament(params.id);
    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    let updated;

    switch (action) {
      case "start":
        updated = tournamentService.startTournament(params.id);
        break;

      case "complete_initial":
        updated = tournamentService.completeInitialMatches(params.id);
        break;

      case "progress_to_loser":
        updated = tournamentService.progressToLoserRound(params.id);
        break;

      case "complete_loser":
        updated = tournamentService.completeLoserMatches(params.id);
        break;

      case "progress_to_group":
        updated = tournamentService.progressToGroupRound(params.id);
        break;

      case "complete_group":
        updated = tournamentService.completeGroupMatches(params.id);
        break;

      case "progress_to_knockout":
        updated = tournamentService.progressToKnockout(params.id);
        break;

      case "complete_quarterfinals":
        updated = tournamentService.completeQuarterfinals(params.id);
        break;

      case "progress_to_semifinals":
        updated = tournamentService.progressToSemifinals(params.id);
        break;

      case "complete_semifinals":
        updated = tournamentService.completeSemifinals(params.id);
        break;

      case "progress_to_final":
        updated = tournamentService.progressToFinal(params.id);
        break;

      case "complete_final":
        updated = tournamentService.completeFinal(params.id);
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json(getTournamentSummary(updated));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
