import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const tournamentId = params.id;
    const body = await req.json();
    const { tournamentData } = body;

    if (!tournamentData) {
      return NextResponse.json({ error: "No tournament data provided" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Optional: We rely on RLS, but we can verify ownership just in case
    const { data: tourney, error: tErr } = await supabase
      .from("tournaments")
      .select("id")
      .eq("id", tournamentId)
      .single();

    if (tErr || !tourney) {
      return NextResponse.json({ error: "Tournament not found or you lack permission" }, { status: 403 });
    }

    // 1. Delete existing data for this tournament (clean slate)
    // RLS allows this if we own the tournament. Matches, teams, and groups will be deleted.
    // Deleting groups cascades to teams and matches (if ON DELETE CASCADE is set up right, but we can be explicit)
    await supabase.from("matches").delete().eq("tournament_id", tournamentId);
    await supabase.from("teams").delete().eq("tournament_id", tournamentId);
    await supabase.from("groups").delete().eq("tournament_id", tournamentId);

    // 2. Insert Groups
    const groupMap = new Map(); // maps AI group id -> real DB UUID
    if (tournamentData.groups && tournamentData.groups.length > 0) {
      const groupsToInsert = tournamentData.groups.map((g: any) => ({
        tournament_id: tournamentId,
        name: g.name
      }));
      
      const { data: insertedGroups, error: gErr } = await supabase
        .from("groups")
        .insert(groupsToInsert)
        .select();

      if (gErr) throw new Error(`Failed to insert groups: ${gErr.message}`);

      // Map them by name
      insertedGroups.forEach((g: any) => {
        const aiGroup = tournamentData.groups.find((ag: any) => ag.name === g.name);
        if (aiGroup) {
          groupMap.set(aiGroup.id, g.id);
        }
      });
    }

    // 3. Insert Teams
    const teamMap = new Map(); // maps AI team id -> real DB UUID
    if (tournamentData.teams && tournamentData.teams.length > 0) {
      const teamsToInsert = tournamentData.teams.map((t: any) => ({
        tournament_id: tournamentId,
        name: t.name,
        code: t.code || t.name.substring(0, 3).toUpperCase(),
        group_id: t.group_id ? groupMap.get(t.group_id) || null : null
      }));

      const { data: insertedTeams, error: tErr2 } = await supabase
        .from("teams")
        .insert(teamsToInsert)
        .select();

      if (tErr2) throw new Error(`Failed to insert teams: ${tErr2.message}`);

      insertedTeams.forEach((t: any) => {
        const aiTeam = tournamentData.teams.find((at: any) => at.name === t.name);
        if (aiTeam) {
          teamMap.set(aiTeam.id, t.id);
        }
      });
    }

    // 4. Insert Matches (First Pass: No next_match_id)
    const matchMap = new Map(); // maps AI match id -> real DB UUID
    let sortOrder = 1;
    
    // Flatten all matches from all stages
    const allAiMatches: any[] = [];
    if (tournamentData.stages) {
      tournamentData.stages.forEach((stage: any) => {
        if (stage.matches) {
          stage.matches.forEach((m: any) => {
            allAiMatches.push({
              ...m,
              stage_name: stage.id || stage.name || 'custom'
            });
          });
        }
      });
    }

    if (allAiMatches.length > 0) {
      const matchesToInsert = allAiMatches.map((m: any) => ({
        tournament_id: tournamentId,
        stage: m.stage_name, // Note: The strict check constraint must be removed in DB for this!
        team1_id: m.team1_id ? teamMap.get(m.team1_id) || null : null,
        team2_id: m.team2_id ? teamMap.get(m.team2_id) || null : null,
        group_id: m.group_id ? groupMap.get(m.group_id) || null : null,
        status: "scheduled",
        sort_order: sortOrder++
      }));

      const { data: insertedMatches, error: mErr } = await supabase
        .from("matches")
        .insert(matchesToInsert)
        .select();

      if (mErr) throw new Error(`Failed to insert matches: ${mErr.message}`);

      // We rely on order because we inserted them in order
      insertedMatches.forEach((m: any, index: number) => {
        matchMap.set(allAiMatches[index].id, m.id);
      });

      // 5. Update Matches (Second Pass: Link next_match_id)
      for (let i = 0; i < allAiMatches.length; i++) {
        const aiMatch = allAiMatches[i];
        const realMatchId = matchMap.get(aiMatch.id);
        
        let updatePayload: any = {};
        
        // If winner goes to another match (e.g. stage_2_m1)
        if (aiMatch.winner_goes_to && matchMap.has(aiMatch.winner_goes_to)) {
          updatePayload.next_match_id = matchMap.get(aiMatch.winner_goes_to);
          updatePayload.next_match_slot = 1; // Default to slot 1, in a real advanced setup we'd parse this
        }
        
        if (Object.keys(updatePayload).length > 0) {
          await supabase
            .from("matches")
            .update(updatePayload)
            .eq("id", realMatchId);
        }
      }
    }

    return NextResponse.json({ success: true, message: "Architecture applied successfully" });
  } catch (error: any) {
    console.error("Apply Architecture Error:", error);
    return NextResponse.json({ error: error.message || "Failed to apply architecture" }, { status: 500 });
  }
}
