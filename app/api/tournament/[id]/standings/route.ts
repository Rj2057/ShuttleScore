/**
 * Standings API Routes
 * GET /api/tournament/[id]/standings - Get all group standings
 * GET /api/tournament/[id]/standings/[group] - Get specific group standings
 */

import { NextRequest, NextResponse } from "next/server";
import { tournamentService } from "@/lib/tournament/service";
import {
  formatGroupStandings,
} from "@/lib/tournament/format";
import { calculateGroupStandings } from "@/lib/tournament/logic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; group?: string } }
) {
  try {
    const tournament = tournamentService.getTournament(params.id);
    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    if (params.group) {
      // Get specific group standings
      const standings = tournamentService.getGroupStandings(params.id, params.group);
      return NextResponse.json({
        group: params.group,
        standings: formatGroupStandings(standings),
      });
    } else {
      // Get all group standings
      const allStandings: Record<string, object> = {};
      tournament.groups.forEach((group) => {
        const standings = calculateGroupStandings(group);
        allStandings[`Group ${group.name}`] = formatGroupStandings(
          standings.sort((a, b) => a.position - b.position)
        );
      });

      return NextResponse.json(allStandings);
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
