import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const matchId = params.id;
    const body = await req.json();
    const { pin } = body;

    const supabase = await createClient();
    
    // Auth check (must be admin or organizer)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { error } = await supabase
      .from("matches")
      .update({ referee_pin: pin })
      .eq("id", matchId);

    if (error) throw error;

    return NextResponse.json({ success: true, pin });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
