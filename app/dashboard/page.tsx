import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Tournament } from "@/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("*")
    .eq("organizer_id", user!.id)
    .order("created_at", { ascending: false });

  const list = (tournaments || []) as Tournament[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">My Tournaments</h1>
          <p className="text-slate-400 mt-1">Create, manage, and share live scoreboards</p>
        </div>
        <Link
          href="/dashboard/create"
          className="px-5 py-2.5 rounded-lg bg-court-600 hover:bg-court-500 text-white font-display font-semibold transition"
        >
          + New Tournament
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-600 p-12 text-center">
          <p className="text-slate-400 mb-4">No tournaments yet</p>
          <Link href="/dashboard/create" className="text-court-400 hover:text-court-300 font-medium">
            Create your first tournament →
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {list.map((t) => (
            <div
              key={t.id}
              className="rounded-xl border border-slate-700 bg-slate-800/80 p-5 flex flex-col gap-3"
            >
              <div>
                <h2 className="font-display text-lg font-semibold text-white">{t.name}</h2>
                {t.season && <p className="text-sm text-slate-400">{t.season}</p>}
              </div>
              <p className="text-xs text-slate-500 font-mono truncate">/t/{t.slug}</p>
              <div className="flex flex-wrap gap-2 mt-auto pt-2">
                <Link
                  href={`/t/${t.slug}`}
                  className="px-3 py-1.5 rounded-lg bg-court-600/20 text-court-400 hover:bg-court-600/30 text-sm font-medium"
                >
                  Public view
                </Link>
                <Link
                  href={`/dashboard/${t.id}/scores`}
                  className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm"
                >
                  Enter scores
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
