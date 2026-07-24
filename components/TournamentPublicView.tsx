"use client";

import { useRealtimeMatches } from "@/lib/hooks/use-realtime-matches";
import { useGroupStandings } from "@/lib/hooks/use-group-standings";
import { MatchCard } from "@/components/MatchCard";
import { PlayoffBracket } from "@/components/PlayoffBracket";
import { GroupStandingsTable } from "@/components/GroupStandingsTable";

interface TournamentPublicViewProps {
  tournamentId: string;
  tournamentName: string;
}

export function TournamentPublicView({ tournamentId }: TournamentPublicViewProps) {
  const { groups, standingsByGroup } = useGroupStandings(tournamentId);
  const { matches, teams, loading } = useRealtimeMatches(tournamentId);

  const leagueMatches = matches.filter((m) => m.stage === "group");
  const playoffMatches = matches.filter((m) => ["quarter", "semi", "final"].includes(m.stage));
  const exhibitionMatches = matches.filter((m) => !["group", "quarter", "semi", "final"].includes(m.stage));
  const liveMatches = matches.filter((m) => m.status === "live");

  const teamsByGroup = (groupId: string) =>
    Object.values(teams).filter((t) => t.group_id === groupId);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-2 border-court-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
      {liveMatches.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Live Now
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {liveMatches.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {groups.length > 0 && (
        <section>
          <h2 className="text-lg font-display font-semibold text-white mb-4">Groups</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {groups.map((g) => (
              <div key={g.id} className="rounded-xl border border-slate-700 bg-slate-800/70 p-4">
                <h3 className="text-sm font-semibold text-court-400 mb-3">{g.name}</h3>
                <ul className="space-y-1 mb-4">
                  {teamsByGroup(g.id).map((t) => (
                    <li key={t.id} className="text-sm text-slate-300">
                      {t.name}
                    </li>
                  ))}
                </ul>
                <GroupStandingsTable standings={standingsByGroup[g.id] || []} teamsMap={teams} />
              </div>
            ))}
          </div>
        </section>
      )}

      {leagueMatches.length > 0 && (
        <section>
          <h2 className="text-lg font-display font-semibold text-white mb-4">League Matches</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {leagueMatches.map((m) => (
              <MatchCard key={m.id} match={m} compact />
            ))}
          </div>
        </section>
      )}

      {playoffMatches.length > 0 && (
        <section>
          <h2 className="text-lg font-display font-semibold text-white mb-4">Playoffs</h2>
          <div className="rounded-xl border border-slate-600/80 bg-slate-900/30 p-4">
            <PlayoffBracket matches={playoffMatches} />
          </div>
        </section>
      )}

      {exhibitionMatches.length > 0 && (
        <section>
          <h2 className="text-lg font-display font-semibold text-white mb-4">Matches</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {exhibitionMatches.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {matches.length === 0 && groups.length === 0 && (
        <p className="text-slate-400 text-center py-12">No matches yet. Check back soon.</p>
      )}
    </div>
  );
}
