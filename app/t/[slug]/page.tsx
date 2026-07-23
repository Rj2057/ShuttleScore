import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TournamentPublicView } from "@/components/TournamentPublicView";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PublicTournamentPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("*")
    .eq("slug", slug)
    .eq("is_public", true)
    .single();

  if (!tournament) {
    notFound();
  }

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <Link href="/" className="text-court-400 hover:text-court-300 font-display font-semibold text-sm">
            ShuttleScore
          </Link>
          <h1 className="font-display text-lg font-bold text-white truncate">{tournament.name}</h1>
        </div>
      </header>
      <TournamentPublicView tournamentId={tournament.id} tournamentName={tournament.name} />
    </main>
  );
}
