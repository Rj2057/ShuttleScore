/**
 * Tournament Matches API Routes
 * GET /api/tournament/[id]/matches/league
 * GET /api/tournament/[id]/matches/loser
 * GET /api/tournament/[id]/matches/group
 * GET /api/tournament/[id]/matches/quarterfinal
 * GET /api/tournament/[id]/matches/semifinal
 * GET /api/tournament/[id]/matches/final
 */

import { NextRequest, NextResponse } from "next/server";
import { tournamentService } from "@/lib/tournament/service";
import {
  getFormattedLeagueMatches,
  getFormattedLoserMatches,
  getFormattedGroupMatches,
  getFormattedQuarterfinals,
  getFormattedSemifinals,
  getFormattedFinal,
} from "@/lib/tournament/format";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; type: string } }
) {
  try {
    const tournament = tournamentService.getTournament(params.id);
    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    let matches;

    switch (params.type) {
      case "league":
        matches = getFormattedLeagueMatches(tournament);
        break;

      case "loser":
        matches = getFormattedLoserMatches(tournament);
        break;

      case "group":
        matches = getFormattedGroupMatches(tournament);
        break;

      case "quarterfinal":
        matches = getFormattedQuarterfinals(tournament);
        break;

      case "semifinal":
        matches = getFormattedSemifinals(tournament);
        break;

      case "final":
        matches = getFormattedFinal(tournament);
        break;

      default:
        return NextResponse.json({ error: "Invalid match type" }, { status: 400 });
    }

    return NextResponse.json({ type: params.type, matches });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
