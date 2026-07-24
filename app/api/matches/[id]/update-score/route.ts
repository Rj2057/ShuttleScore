import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const matchId = params.id;
    const { score1, score2, status, winner_id, team1_id, team2_id, stage } = await req.json();

    const supabase = await createClient();
    
    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Build update payload dynamically
    const updatePayload: any = {};
    if (score1 !== undefined) updatePayload.score1 = score1;
    if (score2 !== undefined) updatePayload.score2 = score2;
    if (status !== undefined) updatePayload.status = status;
    if (winner_id !== undefined) updatePayload.winner_id = winner_id;
    if (team1_id !== undefined) updatePayload.team1_id = team1_id;
    if (team2_id !== undefined) updatePayload.team2_id = team2_id;
    if (stage !== undefined) updatePayload.stage = stage;
    updatePayload.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from("matches")
      .update(updatePayload)
      .eq("id", matchId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Score update error:", err);
    return NextResponse.json({ error: err.message || "Failed to update score" }, { status: 500 });
  }
}
