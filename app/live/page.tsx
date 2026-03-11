"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeMatches } from "@/lib/hooks/use-realtime-matches";
import { useGroupStandings } from "@/lib/hooks/use-group-standings";
import { MatchCard } from "@/components/MatchCard";
import { PlayoffBracket } from "@/components/PlayoffBracket";
import { GroupStandingsTable } from "@/components/GroupStandingsTable";
import { StandingsGuideCard } from "@/components/StandingsGuideCard";
import Link from "next/link";
import type { Tournament } from "@/types/database";

export default function LivePage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("tournaments")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const list = data || [];
        setTournaments(list);
        if (list.length > 0) {
          setSelectedId((prev) => prev || list[0].id);
        }
      });
  }, []);

  const activeTournamentId = selectedId || tournaments[0]?.id || null;

  const { groups, standingsByGroup } = useGroupStandings(activeTournamentId);

  const { matches, teams, loading } = useRealtimeMatches(activeTournamentId);

  const leagueMatches = matches.filter((m) => m.stage === "group");
  const playoffMatches = matches.filter((m) => ["quarter", "semi", "final"].includes(m.stage));
  const liveMatches = leagueMatches.filter((m) => m.status === "live");
  const upcomingLeague = leagueMatches.filter((m) => m.status === "scheduled");
  const completedLeague = leagueMatches.filter((m) => m.status === "completed");

  const teamsByGroup = (groupId: string) =>
    Object.values(teams).filter((t) => t.group_id === groupId);

  const currentTournament = tournaments.find((t) => t.id === activeTournamentId);

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/" className="text-court-400 hover:text-court-300 font-display font-semibold text-sm sm:text-base order-2 sm:order-1">
              ← Home
            </Link>
            <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-row sm:items-center order-1 sm:order-2">
              <select
                value={activeTournamentId || ""}
                onChange={(e) => setSelectedId(e.target.value || null)}
                className="w-full sm:min-w-[220px] bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 sm:py-2 text-white text-base"
              >
                {tournaments.length === 0 && <option value="">No tournaments available</option>}
                {tournaments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} - {t.season}
                  </option>
                ))}
              </select>
              {currentTournament && (
                <h1 className="font-display text-lg sm:text-xl font-bold text-white truncate">
                  {currentTournament.name}
                </h1>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        {loading && activeTournamentId ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-2 border-court-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !activeTournamentId ? (
          <div className="text-center py-16">
            <p className="text-slate-400 text-lg mb-2">No tournament found yet</p>
            <p className="text-slate-500 text-sm">Create a tournament from the admin panel to start live scoring.</p>
          </div>
        ) : (
          <>
            {groups.length > 0 && (
              <section>
                <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                  <h2 className="text-base sm:text-lg font-display font-semibold text-slate-300 flex items-center gap-2">
                    <span className="w-1 h-5 rounded-full bg-court-500" />
                    Groups & Teams
                  </h2>
                  <div className="w-full sm:w-auto sm:max-w-md">
                    <StandingsGuideCard compact />
                  </div>
                </div>
                <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2">
                  {groups.map((g, idx) => {
                    const standings = standingsByGroup[g.id] || [];
                    const colors = [
                      "from-court-900/30 to-slate-800/80 border-court-500/30",
                      "from-blue-900/20 to-slate-800/80 border-blue-500/30",
                      "from-amber-900/20 to-slate-800/80 border-amber-500/30",
                      "from-purple-900/20 to-slate-800/80 border-purple-500/30",
                    ];
                    const accent = colors[idx % colors.length];
                    return (
                      <div
                        key={g.id}
                        className={`rounded-xl border bg-gradient-to-br ${accent} p-4 shadow-lg group-card-hover`}
                      >
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-slate-800/80 border border-slate-600/60 mb-3">
                          <span className="font-bold text-court-400 text-sm">{g.name}</span>
                        </div>
                        <ul className="space-y-2">
                          {teamsByGroup(g.id).map((t, i) => (
                            <li
                              key={t.id}
                              className="flex items-center gap-2 text-sm text-slate-200 py-1.5 px-2 rounded-lg bg-slate-800/40 hover:bg-slate-700/50 transition-colors"
                            >
                              <span className="w-5 h-5 rounded-full bg-slate-600 flex items-center justify-center text-xs font-medium text-slate-300">
                                {i + 1}
                              </span>
                              {t.name}
                            </li>
                          ))}
                          {teamsByGroup(g.id).length === 0 && (
                            <li className="text-slate-500 text-sm py-2 italic">No teams</li>
                          )}
                        </ul>

                        <div className="mt-4">
                          <h3 className="text-xs uppercase tracking-wide text-slate-400 mb-2">
                            Group Standings
                          </h3>
                          <GroupStandingsTable standings={standings} teamsMap={teams} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* League Stage Section */}
            <section className="space-y-4">
              <h2 className="text-lg font-display font-bold text-slate-200 border-b border-slate-600 pb-2">
                League Stage
              </h2>
              {liveMatches.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    Live Now
                  </h3>
                  <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                    {liveMatches.map((m) => (
                      <MatchCard key={m.id} match={m} />
                    ))}
                  </div>
                </div>
              )}
              {upcomingLeague.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-2">Upcoming</h3>
                  <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                    {upcomingLeague.map((m) => (
                      <MatchCard key={m.id} match={m} compact />
                    ))}
                  </div>
                </div>
              )}
              {completedLeague.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 mb-2">Completed</h3>
                  <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                    {completedLeague.map((m) => (
                      <MatchCard key={m.id} match={m} compact />
                    ))}
                  </div>
                </div>
              )}
              {leagueMatches.length === 0 && (
                <p className="text-slate-500 text-sm py-4">No league matches yet.</p>
              )}
            </section>

            {/* Playoffs Section */}
            <section className="space-y-4">
              <h2 className="text-lg font-display font-bold text-slate-200 border-b border-slate-600 pb-2 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-amber-500/80" />
                Playoffs
              </h2>
              <div className="rounded-xl border border-slate-600/80 bg-gradient-to-br from-slate-900/50 to-slate-800/30 p-4 sm:p-6 shadow-inner">
                <PlayoffBracket matches={playoffMatches} />
              </div>
            </section>

            {matches.length === 0 && groups.length === 0 && (
              <p className="text-slate-400 text-center py-12">
                No matches or groups yet. Admin can add them from the Admin panel.
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
