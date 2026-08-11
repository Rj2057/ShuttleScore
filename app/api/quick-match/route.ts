import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { team1Name, team2Name, format = 'bo1' } = await req.json();
    
    if (!team1Name || !team2Name) {
      return NextResponse.json({ error: "Team names are required" }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 1. Create a "hidden" quick match tournament
    const slug = `quick-match-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const { data: tournament, error: tError } = await supabase
      .from("tournaments")
      .insert({
        name: `Quick Match: ${team1Name} vs ${team2Name}`,
        slug: slug,
        organizer_id: user.id
      })
      .select("id")
      .single();

    if (tError || !tournament) throw tError || new Error("Failed to create tournament");

    // 2. Create the two teams
    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .insert([
        { tournament_id: tournament.id, name: team1Name, code: team1Name.substring(0, 3).toUpperCase() },
        { tournament_id: tournament.id, name: team2Name, code: team2Name.substring(0, 3).toUpperCase() }
      ])
      .select("id, name");

    if (teamsError || !teams || teams.length !== 2) throw teamsError || new Error("Failed to create teams");

    // 3. Create the match
    const team1 = teams.find(t => t.name === team1Name);
    const team2 = teams.find(t => t.name === team2Name);

    const { data: match, error: mError } = await supabase
      .from("matches")
      .insert({
        tournament_id: tournament.id,
        stage: "group",
        match_format: format,
        team1_id: team1?.id,
        team2_id: team2?.id,
        status: "scheduled"
      })
      .select("id")
      .single();

    if (mError || !match) throw mError || new Error("Failed to create match");

    return NextResponse.json({ 
      success: true, 
      tournamentId: tournament.id,
      matchId: match.id 
    });

  } catch (err: any) {
    console.error("Quick Match API Error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
