import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import DashboardTabs from "@/components/tournament/DashboardTabs";

export default async function TournamentDashboardPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: tournament } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!tournament) return notFound();

  // Fetch all matches for the tournament (with team details)
  const { data: matches } = await supabase
    .from("matches")
    .select(`
      id, stage, score1, score2, status, referee_pin, team1_id, team2_id,
      team1:teams!matches_team1_id_fkey(name),
      team2:teams!matches_team2_id_fkey(name)
    `)
    .eq("tournament_id", params.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const { data: teams } = await supabase
    .from("teams")
    .select("id, name")
    .eq("tournament_id", params.id)
    .order("name", { ascending: true });

  return (
    <div className="space-y-8 font-display">
      <div className="flex justify-between items-end pb-4">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">{tournament.name}</h1>
          <p className="text-slate-400">Manage your tournament, create matches, and generate referee links.</p>
        </div>
        <Link 
          href={`/t/${tournament.slug}`} 
          target="_blank"
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center gap-2 transition"
        >
          View Public Page ↗
        </Link>
      </div>

      <DashboardTabs tournamentId={tournament.id} initialMatches={matches || []} teams={teams || []} />
    </div>
  );
}
