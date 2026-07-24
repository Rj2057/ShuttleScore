import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { matchId, pin, score1, score2 } = await req.json();

    if (!matchId || !pin) {
      return NextResponse.json({ error: "Missing matchId or pin" }, { status: 400 });
    }

    // We must use the service role key to bypass RLS here, 
    // because the user is unauthenticated (a referee with a PIN).
    // The PIN acts as their authentication for this specific match.
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Verify PIN
    const { data: match, error: fetchError } = await supabase
      .from("matches")
      .select("referee_pin, status")
      .eq("id", matchId)
      .single();

    if (fetchError || !match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (match.referee_pin !== pin) {
      return NextResponse.json({ error: "Invalid PIN" }, { status: 403 });
    }

    if (match.status === "completed") {
      return NextResponse.json({ error: "Match is already completed" }, { status: 400 });
    }

    // 2. Update Score
    const { error: updateError } = await supabase
      .from("matches")
      .update({
        score1,
        score2,
        status: "live",
        updated_at: new Date().toISOString(),
      })
      .eq("id", matchId);

    if (updateError) {
      console.error(updateError);
      return NextResponse.json({ error: "Failed to update score" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
