"use client";

import type { MatchWithTeams } from "@/lib/hooks/use-realtime-matches";

interface PlayoffBracketProps {
  matches: MatchWithTeams[];
}

function BracketMatch({
  match,
  isChampion,
}: {
  match: MatchWithTeams;
  isChampion?: boolean;
}) {
  const t1 = match.team1?.name ?? "TBD";
  const t2 = match.team2?.name ?? "TBD";
  const isCompleted = match.status === "completed";
  const isLive = match.status === "live";
  const t1Winner = isCompleted && match.winner_id === match.team1_id;
  const t2Winner = isCompleted && match.winner_id === match.team2_id;
  const t1Loser = isCompleted && match.winner_id && match.winner_id !== match.team1_id;
  const t2Loser = isCompleted && match.winner_id && match.winner_id !== match.team2_id;

  if (isChampion) {
    const champion = match.winner_id ? (match.team1_id === match.winner_id ? t1 : t2) : null;
    return (
      <div className="relative z-10 rounded-xl border-2 border-amber-400/60 bg-gradient-to-br from-amber-950/80 via-amber-900/40 to-slate-900 px-6 py-5 text-center shadow-xl shadow-amber-500/10">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-amber-500/5 to-transparent" />
        <p className="relative text-amber-400 text-xs font-bold uppercase tracking-[0.2em] mb-2">
          Champion
        </p>
        <p className="relative text-white font-bold text-xl">
          {champion ?? "—"}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`relative z-10 rounded-xl border overflow-hidden min-w-[150px] sm:min-w-[170px] max-w-[210px] transition-all duration-200 ${
        isLive
          ? "border-court-500 bg-court-900/50 shadow-lg shadow-court-500/25 ring-2 ring-court-500/40"
          : "border-slate-600/80 bg-slate-800/95 hover:border-slate-500/80 hover:shadow-md"
      }`}
    >
      <div className="divide-y divide-slate-600/60">
        <div
          className={`px-3.5 py-2.5 text-sm flex justify-between items-center gap-2 transition-colors ${
            t1Winner
              ? "bg-emerald-500/20 text-emerald-300 font-semibold border-l-2 border-emerald-500"
              : t1Loser
              ? "bg-red-500/10 text-red-400/90"
              : "text-slate-200"
          }`}
        >
          <span className="truncate">{t1}</span>
          {isCompleted && (
            <span className="font-mono text-sm shrink-0 font-bold tabular-nums">{match.score1}</span>
          )}
        </div>
        <div
          className={`px-3.5 py-2.5 text-sm flex justify-between items-center gap-2 transition-colors ${
            t2Winner
              ? "bg-emerald-500/20 text-emerald-300 font-semibold border-l-2 border-emerald-500"
              : t2Loser
              ? "bg-red-500/10 text-red-400/90"
              : "text-slate-200"
          }`}
        >
          <span className="truncate">{t2}</span>
          {isCompleted && (
            <span className="font-mono text-sm shrink-0 font-bold tabular-nums">{match.score2}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export function PlayoffBracket({ matches }: PlayoffBracketProps) {
  const quarterMatches = matches.filter((m) => m.stage === "quarter");
  const semiMatches = matches.filter((m) => m.stage === "semi");
  const finalMatch = matches.filter((m) => m.stage === "final")[0];

  if (quarterMatches.length === 0 && semiMatches.length === 0 && !finalMatch) {
    return (
      <p className="text-slate-500 text-center py-8 text-sm">
        No playoff bracket yet. Admin can create it from Tournament page.
      </p>
    );
  }

  const sortedQuarters = [...quarterMatches].sort((a, b) => {
    if (!a.next_match_id || !b.next_match_id) return 0;
    if (a.next_match_id !== b.next_match_id) {
      const semiOrder = semiMatches.map((s) => s.id);
      return semiOrder.indexOf(a.next_match_id) - semiOrder.indexOf(b.next_match_id);
    }
    return (a.next_match_slot ?? 0) - (b.next_match_slot ?? 0);
  });

  const qfPairs: MatchWithTeams[][] = [];
  for (let i = 0; i < sortedQuarters.length; i += 2) {
    qfPairs.push(sortedQuarters.slice(i, i + 2));
  }

  return (
    <div className="overflow-x-auto pb-6 -mx-2 px-2">
      <div className="bracket-wrapper relative min-w-full py-6">
        <div className="relative flex flex-col lg:flex-row items-center lg:items-stretch gap-6 lg:gap-4 xl:gap-8 justify-center">
          {/* Quarter Finals */}
          <div className="flex flex-col items-center bracket-column">
            <div className="mb-5 px-4 py-2 rounded-lg bg-slate-700/70 border border-slate-600/80 shadow-sm">
              <p className="text-slate-300 text-xs font-bold uppercase tracking-widest">
                Quarter Finals
              </p>
            </div>
            <div className="flex flex-col gap-6">
              {qfPairs.map((pair, i) => (
                <div key={i} className="flex flex-col gap-4 bracket-pair">
                  {pair.map((m) => (
                    <BracketMatch key={m.id} match={m} />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Connector: QF → SF */}
          <div className="hidden lg:flex flex-col justify-center items-center self-stretch min-w-[32px] connector-column">
            <div className="flex flex-col items-center justify-center gap-2 flex-1">
              <div className="w-full flex items-center justify-center">
                <div className="h-px flex-1 bg-slate-500/70 max-w-[12px]" />
                <div className="w-px h-6 bg-slate-500/70" />
                <div className="h-px flex-1 bg-slate-500/70 max-w-[12px]" />
              </div>
            </div>
          </div>

          {/* Semi Finals */}
          <div className="flex flex-col items-center bracket-column">
            <div className="mb-5 px-4 py-2 rounded-lg bg-slate-700/70 border border-slate-600/80 shadow-sm">
              <p className="text-slate-300 text-xs font-bold uppercase tracking-widest">
                Semi Finals
              </p>
            </div>
            <div className="flex flex-col gap-10">
              {semiMatches.map((m) => (
                <BracketMatch key={m.id} match={m} />
              ))}
            </div>
          </div>

          {/* Connector: SF → Final */}
          <div className="hidden lg:flex flex-col justify-center items-center self-stretch min-w-[32px] connector-column">
            <div className="flex flex-col items-center justify-center gap-2 flex-1">
              <div className="w-full flex items-center justify-center">
                <div className="h-px flex-1 bg-amber-500/50 max-w-[12px]" />
                <div className="w-px h-6 bg-amber-500/50" />
                <div className="h-px flex-1 bg-amber-500/50 max-w-[12px]" />
              </div>
            </div>
          </div>

          {/* Final & Champion */}
          <div className="flex flex-col items-center bracket-column">
            <div className="mb-5 px-4 py-2 rounded-lg bg-amber-900/50 border border-amber-500/50 shadow-sm">
              <p className="text-amber-400/90 text-xs font-bold uppercase tracking-widest">
                Final
              </p>
            </div>
            <div className="flex flex-col items-center gap-5">
              {finalMatch && (
                <>
                  <BracketMatch match={finalMatch} />
                  <div className="flex flex-col items-center champion-connector">
                    <div className="w-1 h-5 rounded-full bg-gradient-to-b from-amber-500/70 to-amber-400/90" />
                    <div className="w-10 h-px bg-amber-500/60" />
                    <div className="w-1 h-4 rounded-full bg-gradient-to-b from-amber-400/80 to-amber-300" />
                  </div>
                  <BracketMatch match={finalMatch} isChampion />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
