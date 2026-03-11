"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeMatches } from "@/lib/hooks/use-realtime-matches";
import { useGroupStandings } from "@/lib/hooks/use-group-standings";
import { useSearchParams } from "next/navigation";
import { PlayoffBracket } from "@/components/PlayoffBracket";
import { GroupStandingsTable } from "@/components/GroupStandingsTable";
import { StandingsGuideCard } from "@/components/StandingsGuideCard";
import type { MatchFormat, MatchGame, Tournament } from "@/types/database";

interface EditableGameScore {
  team1: number;
  team2: number;
}

interface MatchSummary {
  totalPoints1: number;
  totalPoints2: number;
  winnerId: string | null;
  validationError: string | null;
}

const MIGRATION_HINT =
  "Database is missing new leaderboard tables. Run Supabase migrations 003_group_stage_standings.sql and 004_match_format_and_perf_indexes.sql, then refresh this page.";

function formatSupabaseError(error: { message?: string; code?: string } | null) {
  if (!error) {
    return null;
  }

  const msg = error.message || "Unknown database error.";

  if (
    msg.includes("Could not find the table 'public.match_games'") ||
    msg.includes("Could not find the function public.recompute_group_standings") ||
    msg.includes("column matches.match_format does not exist") ||
    error.code === "PGRST205"
  ) {
    return MIGRATION_HINT;
  }

  return msg;
}

function emptyGames(): EditableGameScore[] {
  return [
    { team1: 0, team2: 0 },
    { team1: 0, team2: 0 },
    { team1: 0, team2: 0 },
  ];
}

function gameWinner(game: EditableGameScore): "team1" | "team2" | null {
  if (game.team1 === game.team2) return null;
  return game.team1 > game.team2 ? "team1" : "team2";
}

function strictValidateCompletedGame(game: EditableGameScore): string | null {
  if (game.team1 === game.team2) {
    return "A game cannot end in a tie.";
  }

  const winnerPoints = Math.max(game.team1, game.team2);
  const loserPoints = Math.min(game.team1, game.team2);

  if (winnerPoints < 21) {
    return "Completed game winner must reach at least 21 points.";
  }

  if (winnerPoints - loserPoints < 2) {
    return "Completed game must have at least a 2-point margin.";
  }

  return null;
}

function gamesToPersist(
  status: "scheduled" | "live" | "completed",
  matchFormat: MatchFormat,
  gameScores: EditableGameScore[]
): EditableGameScore[] {
  if (status === "scheduled") {
    return [];
  }

  if (matchFormat === "bo1") {
    const g1 = gameScores[0];
    if (status === "live" && g1.team1 === 0 && g1.team2 === 0) {
      return [];
    }
    return [g1];
  }

  if (status === "live") {
    return gameScores.slice(0, 3).filter((g) => g.team1 > 0 || g.team2 > 0);
  }

  const g3HasPoints = gameScores[2].team1 > 0 || gameScores[2].team2 > 0;
  return g3HasPoints ? gameScores.slice(0, 3) : gameScores.slice(0, 2);
}

function summarize(
  games: EditableGameScore[],
  status: "scheduled" | "live" | "completed",
  matchFormat: MatchFormat,
  team1Id: string | null,
  team2Id: string | null
): MatchSummary {
  const totalPoints1 = games.reduce((sum, g) => sum + g.team1, 0);
  const totalPoints2 = games.reduce((sum, g) => sum + g.team2, 0);

  if (status !== "completed") {
    return {
      totalPoints1,
      totalPoints2,
      winnerId: null,
      validationError: null,
    };
  }

  if (matchFormat === "bo1") {
    if (games.length !== 1) {
      return {
        totalPoints1,
        totalPoints2,
        winnerId: null,
        validationError: "Best of 1 must contain exactly one game.",
      };
    }

    const error = strictValidateCompletedGame(games[0]);
    if (error) {
      return {
        totalPoints1,
        totalPoints2,
        winnerId: null,
        validationError: error,
      };
    }

    const winner = gameWinner(games[0]);
    return {
      totalPoints1,
      totalPoints2,
      winnerId: winner === "team1" ? team1Id : team2Id,
      validationError: null,
    };
  }

  if (games.length < 2 || games.length > 3) {
    return {
      totalPoints1,
      totalPoints2,
      winnerId: null,
      validationError: "Best of 3 must have 2 or 3 completed games.",
    };
  }

  let wins1 = 0;
  let wins2 = 0;

  for (let i = 0; i < games.length; i += 1) {
    const game = games[i];
    const error = strictValidateCompletedGame(game);

    if (error) {
      return {
        totalPoints1,
        totalPoints2,
        winnerId: null,
        validationError: `Game ${i + 1}: ${error}`,
      };
    }

    const winner = gameWinner(game);
    if (winner === "team1") wins1 += 1;
    if (winner === "team2") wins2 += 1;

    if ((wins1 === 2 || wins2 === 2) && i < games.length - 1) {
      return {
        totalPoints1,
        totalPoints2,
        winnerId: null,
        validationError: "Best of 3 should stop once a side reaches 2 game wins.",
      };
    }
  }

  if (wins1 !== 2 && wins2 !== 2) {
    return {
      totalPoints1,
      totalPoints2,
      winnerId: null,
      validationError: "Completed Best of 3 must end with 2 game wins by one side.",
    };
  }

  return {
    totalPoints1,
    totalPoints2,
    winnerId: wins1 === 2 ? team1Id : team2Id,
    validationError: null,
  };
}

export default function AdminMatchesPage() {
  const searchParams = useSearchParams();
  const tournamentParam = searchParams.get("tournament");
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingMatch, setEditingMatch] = useState<string | null>(null);
  const [status, setStatus] = useState<"scheduled" | "live" | "completed">("scheduled");
  const [matchFormat, setMatchFormat] = useState<MatchFormat>("bo3");
  const [gameScores, setGameScores] = useState<EditableGameScore[]>(emptyGames());
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("tournaments")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setTournaments(data || []);
        setSelectedId((tournamentParam || data?.[0]?.id) ?? null);
      });
  }, [tournamentParam]);

  const { matches, refreshMatches } = useRealtimeMatches(selectedId);
  const { groups, standingsByGroup } = useGroupStandings(selectedId);
  const leagueMatches = matches.filter((m) => m.stage === "group");
  const playoffMatches = matches.filter((m) => ["quarter", "semi", "final"].includes(m.stage));

  const formatLabel = useMemo(() => (matchFormat === "bo1" ? "Best of 1" : "Best of 3"), [matchFormat]);

  function updateGame(index: number, side: "team1" | "team2", value: number) {
    setGameScores((current) => {
      const next = [...current];
      next[index] = { ...next[index], [side]: value };
      return next;
    });
  }

  async function startEdit(m: (typeof matches)[0]) {
    setSaveError(null);
    setEditingMatch(m.id);
    setStatus(m.status as "scheduled" | "live" | "completed");
    setMatchFormat((m.match_format as MatchFormat) || "bo3");

    const { data: existingGames, error: existingGamesError } = await supabase
      .from("match_games")
      .select("game_no, team1_points, team2_points")
      .eq("match_id", m.id)
      .order("game_no", { ascending: true });

    if (existingGamesError) {
      setSaveError(formatSupabaseError(existingGamesError));
      setGameScores(emptyGames());
      return;
    }

    const next = emptyGames();
    (existingGames || []).forEach((g) => {
      const idx = g.game_no - 1;
      if (idx >= 0 && idx <= 2) {
        next[idx] = { team1: g.team1_points, team2: g.team2_points };
      }
    });

    setGameScores(next);
  }

  async function saveMatch(m: (typeof matches)[0]) {
    setSaveError(null);
    setSaving(true);

    const games = gamesToPersist(status, matchFormat, gameScores);
    const summary = summarize(games, status, matchFormat, m.team1_id, m.team2_id);

    if (summary.validationError) {
      setSaving(false);
      setSaveError(summary.validationError);
      return;
    }

    const { error: deleteError } = await supabase.from("match_games").delete().eq("match_id", m.id);
    if (deleteError) {
      setSaving(false);
      setSaveError(formatSupabaseError(deleteError));
      return;
    }

    if (games.length > 0) {
      const gameRows: Array<Pick<MatchGame, "match_id" | "game_no" | "team1_points" | "team2_points">> = games.map((g, idx) => ({
        match_id: m.id,
        game_no: (idx + 1) as 1 | 2 | 3,
        team1_points: g.team1,
        team2_points: g.team2,
      }));

      const { error: insertError } = await supabase.from("match_games").insert(gameRows);
      if (insertError) {
        setSaving(false);
        setSaveError(formatSupabaseError(insertError));
        return;
      }
    }

    const { error: matchUpdateError } = await supabase
      .from("matches")
      .update({
        match_format: matchFormat,
        score1: summary.totalPoints1,
        score2: summary.totalPoints2,
        status,
        winner_id: summary.winnerId,
      })
      .eq("id", m.id);

    if (matchUpdateError) {
      setSaving(false);
      setSaveError(formatSupabaseError(matchUpdateError));
      return;
    }

    if (m.stage === "group" && m.group_id) {
      const { error: standingsError } = await supabase.rpc("recompute_group_standings", {
        p_group_id: m.group_id,
      });

      if (standingsError) {
        setSaving(false);
        setSaveError(formatSupabaseError(standingsError));
        return;
      }
    }

    setSaving(false);
    setEditingMatch(null);
    refreshMatches();
  }

  function renderCard(m: (typeof matches)[0]) {
    const isEditing = editingMatch === m.id;
    const preview = summarize(
      gamesToPersist(status, matchFormat, gameScores),
      status,
      matchFormat,
      m.team1_id,
      m.team2_id
    );

    return (
      <div key={m.id} className="rounded-xl border border-slate-700 bg-slate-800/80 p-4">
        {isEditing ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-slate-300 flex-wrap gap-2">
              <span>{m.team1?.name ?? "TBD"}</span>
              <span className="font-mono">vs</span>
              <span>{m.team2?.name ?? "TBD"}</span>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <select
                value={matchFormat}
                onChange={(e) => setMatchFormat(e.target.value as MatchFormat)}
                className="bg-slate-900 border border-slate-600 rounded px-3 py-1 text-white text-sm"
              >
                <option value="bo1">Best of 1</option>
                <option value="bo3">Best of 3</option>
              </select>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
                className="bg-slate-900 border border-slate-600 rounded px-3 py-1 text-white text-sm"
              >
                <option value="scheduled">Scheduled</option>
                <option value="live">Live</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[0, 1, 2].map((idx) => {
                const disabled = matchFormat === "bo1" && idx > 0;
                return (
                  <div key={idx} className={`rounded border border-slate-700 p-2 ${disabled ? "opacity-40" : ""}`}>
                    <p className="text-xs text-slate-400 mb-1">Game {idx + 1}</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        disabled={disabled}
                        value={gameScores[idx].team1}
                        onChange={(e) => updateGame(idx, "team1", parseInt(e.target.value) || 0)}
                        className="w-16 px-2 py-1 rounded bg-slate-900 border border-slate-600 text-white text-center disabled:opacity-50"
                      />
                      <span className="text-slate-500">-</span>
                      <input
                        type="number"
                        min={0}
                        disabled={disabled}
                        value={gameScores[idx].team2}
                        onChange={(e) => updateGame(idx, "team2", parseInt(e.target.value) || 0)}
                        className="w-16 px-2 py-1 rounded bg-slate-900 border border-slate-600 text-white text-center disabled:opacity-50"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {status === "completed" && (
              <p className="text-sm text-slate-300">
                Winner preview: {preview.winnerId === m.team1_id ? (m.team1?.name ?? "TBD") : preview.winnerId === m.team2_id ? (m.team2?.name ?? "TBD") : "Not decided"}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => saveMatch(m)}
                disabled={saving}
                className="px-4 py-1 rounded bg-court-600 hover:bg-court-500 text-white text-sm font-medium disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setEditingMatch(null)}
                disabled={saving}
                className="px-4 py-1 rounded bg-slate-600 hover:bg-slate-500 text-white text-sm disabled:opacity-60"
              >
                Cancel
              </button>
            </div>

            {saveError && <p className="text-sm text-red-400">{saveError}</p>}
          </div>
        ) : (
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-slate-200">
              <span className={m.winner_id === m.team1_id ? "text-court-400 font-semibold" : ""}>{m.team1?.name ?? "TBD"}</span>
              {" vs "}
              <span className={m.winner_id === m.team2_id ? "text-court-400 font-semibold" : ""}>{m.team2?.name ?? "TBD"}</span>
              <span className="ml-2 text-slate-500 text-sm">
                {m.score1} - {m.score2} - {(m.match_format || "bo3").toUpperCase()}
                {m.status === "live" && <span className="ml-1 text-red-400">- LIVE</span>}
              </span>
            </div>
            <button
              onClick={() => void startEdit(m)}
              className="px-3 py-1 rounded bg-slate-600 hover:bg-slate-500 text-white text-sm"
            >
              Edit
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <h1 className="font-display text-3xl font-bold text-white">Manage Matches</h1>
        <div className="w-full lg:w-[420px]">
          <StandingsGuideCard />
        </div>
      </div>

      {tournaments.length > 0 && (
        <select
          value={selectedId || ""}
          onChange={(e) => setSelectedId(e.target.value || null)}
          className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white"
        >
          {tournaments.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} - {t.season}
            </option>
          ))}
        </select>
      )}

      {groups.length > 0 && (
        <section>
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4 border-b border-slate-600 pb-2">
            <h2 className="text-xl font-display font-semibold text-white">Group Tables</h2>
            <p className="text-sm text-slate-400">Auto-calculated from completed group matches.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {groups.map((group) => (
              <div key={group.id} className="rounded-xl border border-slate-700 bg-slate-800/70 p-4 space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h3 className="text-sm font-semibold text-court-400">{group.name}</h3>
                  <a href="/standings-guide" className="text-xs text-slate-300 hover:text-white underline underline-offset-2">
                    Full forms and formulas
                  </a>
                </div>
                <GroupStandingsTable standings={standingsByGroup[group.id] || []} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xl font-display font-semibold text-white mb-4 border-b border-slate-600 pb-2">League Stage</h2>
        <p className="text-xs text-slate-400 mb-3">Strict validation: winner must reach at least 21 with 2-point margin. Format can be Best of 1 or Best of 3.</p>
        <div className="space-y-4">
          {leagueMatches.map((m) => renderCard(m))}
          {leagueMatches.length === 0 && selectedId && <p className="text-slate-400">No league matches. Add from Tournament page.</p>}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-display font-semibold text-white mb-4 border-b border-slate-600 pb-2">Playoffs</h2>
        <div className="rounded-xl border border-slate-600/80 bg-slate-900/30 p-4 mb-4">
          <PlayoffBracket matches={playoffMatches} />
        </div>
        <div className="space-y-4">
          {playoffMatches.map((m) => renderCard(m))}
          {playoffMatches.length === 0 && selectedId && <p className="text-slate-400 text-sm">No playoff bracket. Create from Tournament page.</p>}
        </div>
      </section>

      <p className="text-xs text-slate-500">Current edit format: {formatLabel}</p>
    </div>
  );
}
