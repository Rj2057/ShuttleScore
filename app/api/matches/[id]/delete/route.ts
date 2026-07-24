import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const matchId = params.id;
    const supabase = await createClient();
    
    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("matches")
      .delete()
      .eq("id", matchId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Match delete error:", err);
    return NextResponse.json({ error: err.message || "Failed to delete match" }, { status: 500 });
  }
}
