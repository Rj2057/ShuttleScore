/**
 * Tournament API Routes
 * GET /api/tournament/create - Create new tournament
 * GET /api/tournament/[id] - Get tournament details
 * POST /api/tournament/[id]/start - Start tournament
 * POST /api/tournament/[id]/match-result - Set match result
 * GET /api/tournament/[id]/standings - Get standings
 */

import { NextRequest, NextResponse } from "next/server";
import { tournamentService } from "@/lib/tournament/service";
import { exportTournamentAsJSON, getTournamentSummary } from "@/lib/tournament/format";

/**
 * POST /api/tournament/create
 * Create a new tournament
 */
export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Tournament name is required" },
        { status: 400 }
      );
    }

    const tournament = tournamentService.createSampleTournament();
    tournament.name = name;

    return NextResponse.json(
      {
        success: true,
        tournament: getTournamentSummary(tournament),
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tournament/[id]
 * Get tournament details
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tournament = tournamentService.getTournament(params.id);

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(exportTournamentAsJSON(tournament));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
