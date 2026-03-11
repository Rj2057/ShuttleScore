"use client";

import type { MatchWithTeams } from "@/lib/hooks/use-realtime-matches";

interface MatchCardProps {
  match: MatchWithTeams;
  compact?: boolean;
}

export function MatchCard({ match, compact }: MatchCardProps) {
  const t1 = match.team1?.name ?? "TBD";
  const t2 = match.team2?.name ?? "TBD";
  const isLive = match.status === "live";
  const isCompleted = match.status === "completed";

  const stageLabels: Record<string, string> = {
    group: "Group",
    quarter: "Quarter Final",
    semi: "Semi Final",
    final: "Final",
  };
  const stageLabel = stageLabels[match.stage] ?? match.stage;

  return (
    <div
      className={`
        rounded-xl border overflow-hidden min-w-0
        ${isLive ? "border-court-500 bg-court-900/30 shadow-lg shadow-court-500/20" : "border-slate-700 bg-slate-800/50"}
        ${compact ? "p-3" : "p-4"}
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          {stageLabel}
        </span>
        {isLive && (
          <span className="flex items-center gap-1.5 text-red-400 text-xs font-semibold live-pulse">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            LIVE
          </span>
        )}
      </div>

      <div className="space-y-2">
        <div
          className={`flex items-center justify-between gap-2 min-w-0 ${compact ? "text-sm" : "text-base"}`}
        >
          <span
            className={`truncate ${
              isCompleted && match.winner_id === match.team1_id
                ? "text-emerald-400 font-semibold"
                : isCompleted && match.winner_id && match.winner_id !== match.team1_id
                ? "text-red-400/90"
                : "text-slate-200"
            }`}
          >
            {t1}
          </span>
          {isCompleted ? (
            <span className="font-mono font-bold tabular-nums">
              {match.score1} - {match.score2}
            </span>
          ) : (
            <span className="font-mono font-bold tabular-nums text-slate-400">
              {match.score1} - {match.score2}
            </span>
          )}
        </div>
        <div
          className={`flex items-center justify-between gap-2 min-w-0 ${compact ? "text-sm" : "text-base"}`}
        >
          <span
            className={`truncate ${
              isCompleted && match.winner_id === match.team2_id
                ? "text-emerald-400 font-semibold"
                : isCompleted && match.winner_id && match.winner_id !== match.team2_id
                ? "text-red-400/90"
                : "text-slate-200"
            }`}
          >
            {t2}
          </span>
          <span className="opacity-0">-</span>
        </div>
      </div>
    </div>
  );
}
