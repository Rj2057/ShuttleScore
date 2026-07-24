import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function PublicTournamentsPage() {
  const supabase = await createClient();

  // Fetch recent tournaments. 
  // Note: For privacy, we could filter by a "is_public" flag, but currently all tournaments are public by default.
  // We'll exclude the "Quick Match" auto-generated tournaments for cleaner display
  const { data: tournaments, error } = await supabase
    .from("tournaments")
    .select("id, name, slug, season, created_at")
    .not("name", "ilike", "Quick Match:%")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-12 font-display">
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="flex justify-between items-center border-b border-slate-800 pb-8">
          <div>
            <Link href="/" className="text-court-500 font-bold hover:text-court-400 mb-4 inline-block">
              ← Back Home
            </Link>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              Public Tournaments
            </h1>
            <p className="text-slate-400 mt-2 text-lg">
              Find and follow live scoreboards from around the world.
            </p>
          </div>
        </div>

        {error ? (
          <div className="text-red-400 p-4 bg-red-400/10 rounded-xl border border-red-500/20">
            Failed to load tournaments. Please try again later.
          </div>
        ) : !tournaments || tournaments.length === 0 ? (
          <div className="text-center p-16 border border-dashed border-slate-800 rounded-3xl">
            <p className="text-slate-500 text-xl font-medium">No public tournaments found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((t) => (
              <Link 
                key={t.id} 
                href={`/t/${t.slug}`}
                className="group bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-court-500/50 hover:shadow-2xl hover:shadow-court-500/10 transition flex flex-col h-full"
              >
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white group-hover:text-court-400 transition mb-2">
                    {t.name}
                  </h2>
                  {t.season && (
                    <span className="inline-block px-3 py-1 bg-slate-800 text-slate-300 text-xs font-bold rounded-full mb-4">
                      {t.season}
                    </span>
                  )}
                </div>
                
                <div className="mt-6 pt-4 border-t border-slate-800/50 flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-mono">/t/{t.slug}</span>
                  <span className="text-court-500 font-bold group-hover:translate-x-1 transition-transform">
                    View →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
