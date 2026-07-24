import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import RefereeScorer from "./RefereeScorer";

export default async function RefereePage({
  params,
  searchParams,
}: {
  params: { matchId: string };
  searchParams: { pin?: string };
}) {
  const supabase = await createClient();
  const { matchId } = params;
  const pin = searchParams.pin;

  if (!pin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <div className="bg-slate-900 p-8 rounded-2xl max-w-sm w-full border border-slate-800 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Referee Access</h1>
          <p className="text-slate-400 mb-6">A valid PIN is required to score this match.</p>
          <form className="flex flex-col gap-4">
            <input 
              type="text" 
              name="pin"
              placeholder="Enter PIN" 
              className="px-4 py-3 bg-slate-800 rounded-lg text-white text-center font-mono text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-court-500"
            />
            <button type="submit" className="w-full py-3 bg-court-600 hover:bg-court-500 rounded-lg text-white font-bold transition">
              Verify
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Verify match and pin
  const { data: match } = await supabase
    .from("matches")
    .select(`
      *,
      team1:team1_id ( id, name ),
      team2:team2_id ( id, name )
    `)
    .eq("id", matchId)
    .single();

  if (!match || match.referee_pin !== pin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="bg-red-500/10 border border-red-500 p-6 rounded-xl text-center">
          <h2 className="text-red-500 font-bold text-xl mb-2">Invalid PIN</h2>
          <p className="text-red-400/80">The PIN provided is incorrect for this match.</p>
        </div>
      </div>
    );
  }

  return <RefereeScorer initialMatch={match} pin={pin} />;
}
