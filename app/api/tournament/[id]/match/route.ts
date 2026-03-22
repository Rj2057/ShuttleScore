/**
 * Match Result API Routes
 * POST /api/tournament/[id]/match - Set match result
 */

import { NextRequest, NextResponse } from "next/server";
import { tournamentService } from "@/lib/tournament/service";
import { getTournamentSummary } from "@/lib/tournament/format";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { matchId, team1Score, team2Score } = await request.json();

    if (!matchId || team1Score === undefined || team2Score === undefined) {
      return NextResponse.json(
        { error: "matchId, team1Score, and team2Score are required" },
        { status: 400 }
      );
    }

    const tournament = tournamentService.getTournament(params.id);
    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    const updated = tournamentService.setMatchResult(
      params.id,
      matchId,
      team1Score,
      team2Score
    );

    return NextResponse.json({
      success: true,
      tournament: getTournamentSummary(updated),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
