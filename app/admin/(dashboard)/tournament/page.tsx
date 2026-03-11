"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tournament, Group, Team, Match } from "@/types/database";

export default function AdminTournamentPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newName, setNewName] = useState("Lakshmi Hegde Pg Badminton Tournament");
  const [newSeason, setNewSeason] = useState("Season 2");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [editingTournament, setEditingTournament] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSeason, setEditSeason] = useState("");
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("tournaments")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setTournaments(data || []);
        if (data?.length && !selectedId) setSelectedId(data[0].id);
      });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    supabase.from("groups").select("*").eq("tournament_id", selectedId).then(({ data }) => setGroups(data || []));
    supabase.from("teams").select("*").then(({ data }) => setTeams(data || []));
    supabase.from("matches").select("*").eq("tournament_id", selectedId).order("sort_order").then(({ data }) => setMatches(data || []));
  }, [selectedId]);

  async function createTournament() {
    if (!newName.trim()) return;
    const { data } = await supabase
      .from("tournaments")
      .insert({
        name: newName.trim(),
        season: newSeason.trim() || "Season 2",
        start_date: startDate || new Date().toISOString().slice(0, 10),
        end_date: endDate || new Date().toISOString().slice(0, 10),
      })
      .select()
      .single();
    if (data) {
      setTournaments((t) => [data, ...t]);
      setSelectedId(data.id);
      setNewName("");
    }
  }

  async function renameTournament(t: Tournament) {
    if (!editName.trim()) return;
    await supabase.from("tournaments").update({ name: editName.trim(), season: editSeason.trim() }).eq("id", t.id);
    setTournaments((list) => list.map((x) => (x.id === t.id ? { ...x, name: editName.trim(), season: editSeason.trim() } : x)));
    setEditingTournament(null);
  }

  async function deleteTournament(t: Tournament) {
    if (!confirm(`Delete "${t.name}"? This will remove all groups, teams, and matches.`)) return;
    await supabase.from("tournaments").delete().eq("id", t.id);
    const remaining = tournaments.filter((x) => x.id !== t.id);
    setTournaments(remaining);
    if (selectedId === t.id) setSelectedId(remaining[0]?.id ?? null);
  }

  async function deleteMatch(m: Match) {
    if (!confirm("Delete this match?")) return;
    await supabase.from("matches").delete().eq("id", m.id);
    setMatches((list) => list.filter((x) => x.id !== m.id));
  }

  async function createKnockoutBracket() {
    if (!selectedId) return;
    const stages: Array<{ stage: Match["stage"]; count: number }> = [
      { stage: "quarter", count: 4 },
      { stage: "semi", count: 2 },
      { stage: "final", count: 1 },
    ];
    const toInsert: Partial<Match>[] = [];
    let sortOrder = 0;

    for (const { stage, count } of stages) {
      for (let i = 0; i < count; i++) {
        toInsert.push({
          tournament_id: selectedId,
          stage,
          score1: 0,
          score2: 0,
          status: "scheduled",
          sort_order: sortOrder++,
        });
      }
    }

    const { data: inserted } = await supabase.from("matches").insert(toInsert).select("id, stage, sort_order");
    if (!inserted?.length) return;

    const byStage = {
      quarter: inserted.filter((m) => m.stage === "quarter"),
      semi: inserted.filter((m) => m.stage === "semi"),
      final: inserted.filter((m) => m.stage === "final"),
    };

    for (let i = 0; i < 2; i++) {
      const semi = byStage.semi[i];
      const q1 = byStage.quarter[i * 2];
      const q2 = byStage.quarter[i * 2 + 1];
      if (semi && q1) await supabase.from("matches").update({ next_match_id: semi.id, next_match_slot: 1 }).eq("id", q1.id);
      if (semi && q2) await supabase.from("matches").update({ next_match_id: semi.id, next_match_slot: 2 }).eq("id", q2.id);
    }
    const finalMatch = byStage.final[0];
    if (finalMatch && byStage.semi[0]) await supabase.from("matches").update({ next_match_id: finalMatch.id, next_match_slot: 1 }).eq("id", byStage.semi[0].id);
    if (finalMatch && byStage.semi[1]) await supabase.from("matches").update({ next_match_id: finalMatch.id, next_match_slot: 2 }).eq("id", byStage.semi[1].id);

    const { data: updated } = await supabase.from("matches").select("*").eq("tournament_id", selectedId).order("sort_order");
    setMatches(updated || []);
  }

  async function addGroupMatch(groupId: string, t1: string, t2: string) {
    if (!selectedId) return;
    const maxOrder = matches.length ? Math.max(...matches.map((m) => m.sort_order)) : 0;
    await supabase.from("matches").insert({
      tournament_id: selectedId,
      group_id: groupId,
      stage: "group",
      team1_id: t1,
      team2_id: t2,
      score1: 0,
      score2: 0,
      status: "scheduled",
      sort_order: maxOrder + 1,
    });
    const { data } = await supabase.from("matches").select("*").eq("tournament_id", selectedId).order("sort_order");
    setMatches(data || []);
  }

  const teamsMap = Object.fromEntries(teams.map((t) => [t.id, t]));
  const stageLabels: Record<string, string> = { group: "Group", quarter: "QF", semi: "SF", final: "Final" };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold text-white">Tournament Setup</h1>

      <div className="rounded-xl border border-slate-700 bg-slate-800/80 p-4">
        <h2 className="font-display font-semibold text-white mb-3">Create Tournament</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Tournament name"
            className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white"
          />
          <input
            value={newSeason}
            onChange={(e) => setNewSeason(e.target.value)}
            placeholder="Season"
            className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white"
          />
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white" />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white" />
        </div>
        <button
          onClick={createTournament}
          disabled={!newName.trim()}
          className="mt-3 px-4 py-2 rounded-lg bg-court-600 hover:bg-court-500 text-white font-medium disabled:opacity-50"
        >
          Create Tournament
        </button>
      </div>

      {tournaments.length > 0 && (
        <div className="rounded-xl border border-slate-700 bg-slate-800/80 p-4">
          <h2 className="font-display font-semibold text-white mb-3">Tournaments</h2>
          <div className="space-y-2">
            {tournaments.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-2 py-2 border-b border-slate-700 last:border-0">
                {editingTournament === t.id ? (
                  <div className="flex gap-2 flex-1">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 px-3 py-1 rounded bg-slate-900 border border-slate-600 text-white text-sm"
                      placeholder="Name"
                    />
                    <input
                      value={editSeason}
                      onChange={(e) => setEditSeason(e.target.value)}
                      className="w-24 px-3 py-1 rounded bg-slate-900 border border-slate-600 text-white text-sm"
                      placeholder="Season"
                    />
                    <button onClick={() => renameTournament(t)} className="px-3 py-1 rounded bg-court-600 text-white text-sm">Save</button>
                    <button onClick={() => setEditingTournament(null)} className="px-3 py-1 rounded bg-slate-600 text-white text-sm">Cancel</button>
                  </div>
                ) : (
                  <>
                    <span className="text-slate-200">{t.name} - {t.season}</span>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingTournament(t.id); setEditName(t.name); setEditSeason(t.season); }} className="px-2 py-1 rounded bg-slate-600 text-slate-200 text-xs">Rename</button>
                      <button onClick={() => deleteTournament(t)} className="px-2 py-1 rounded bg-red-900/50 text-red-400 text-xs">Delete</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedId && (
        <>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white"
          >
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>{t.name} - {t.season}</option>
            ))}
          </select>

          <div className="rounded-xl border border-slate-700 bg-slate-800/80 p-4">
            <h2 className="font-display font-semibold text-white mb-3">Knockout Bracket (QF → SF → Final)</h2>
            <p className="text-slate-400 text-sm mb-3">Creates 4 Quarter Finals, 2 Semi Finals, 1 Final. TBD slots auto-fill when you set winners.</p>
            <button onClick={createKnockoutBracket} className="px-4 py-2 rounded-lg bg-court-600 hover:bg-court-500 text-white font-medium">
              Create Knockout Bracket
            </button>
          </div>

          {groups.length > 0 && (
            <div className="rounded-xl border border-slate-700 bg-slate-800/80 p-5">
              <h2 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-court-500" />
                Add Group Matches
              </h2>
              {groups.map((g) => {
                const groupTeams = teams.filter((t) => t.group_id === g.id);
                return (
                  <div key={g.id} className="mb-6 last:mb-0">
                    <div className="inline-flex px-3 py-1 rounded-full bg-court-900/40 border border-court-600/50 mb-3">
                      <h3 className="text-court-400 font-semibold text-sm">{g.name}</h3>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {groupTeams.flatMap((t1, i) =>
                        groupTeams.slice(i + 1).map((t2) => (
                          <button
                            key={`${t1.id}-${t2.id}`}
                            onClick={() => addGroupMatch(g.id, t1.id, t2.id)}
                            className="group flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-700/80 hover:bg-court-600/30 border border-slate-600 hover:border-court-500/50 text-sm text-slate-200 hover:text-white transition-all duration-200 hover:shadow-md hover:shadow-court-500/10"
                          >
                            <span className="font-medium">{t1.name}</span>
                            <span className="text-slate-500 group-hover:text-court-400">vs</span>
                            <span className="font-medium">{t2.name}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="rounded-xl border border-slate-700 bg-slate-800/80 p-4">
            <h2 className="font-display font-semibold text-white mb-3">Matches</h2>
            <div className="space-y-2">
              {matches.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0 text-sm">
                  <span className="text-slate-300">
                    {stageLabels[m.stage] ?? m.stage} • {(m.team1_id && teamsMap[m.team1_id]?.name) ?? "TBD"} vs {(m.team2_id && teamsMap[m.team2_id]?.name) ?? "TBD"} ({m.score1}-{m.score2}) {m.status}
                  </span>
                  <div className="flex gap-2">
                    <a href={`/admin/matches?tournament=${selectedId}`} className="px-2 py-1 rounded bg-slate-600 text-slate-200 text-xs">Edit</a>
                    <button onClick={() => deleteMatch(m)} className="px-2 py-1 rounded bg-red-900/50 text-red-400 text-xs">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
