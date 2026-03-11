"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tournament, Group, Team } from "@/types/database";

export default function AdminTeamsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);
  const [newTeamName, setNewTeamName] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editTeamName, setEditTeamName] = useState("");
  const [editGroupName, setEditGroupName] = useState("");
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("tournaments")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setTournaments(data || []);
        if (data?.length && !selectedTournament) setSelectedTournament(data[0].id);
      });
  }, []);

  useEffect(() => {
    if (!selectedTournament) {
      setGroups([]);
      setTeams([]);
      return;
    }
    supabase
      .from("groups")
      .select("*")
      .eq("tournament_id", selectedTournament)
      .then(({ data }) => setGroups(data || []));
    supabase.from("teams").select("*").then(({ data }) => setTeams(data || []));
  }, [selectedTournament]);

  async function addGroup() {
    if (!selectedTournament || !newGroupName.trim()) return;
    const { data } = await supabase
      .from("groups")
      .insert({ tournament_id: selectedTournament, name: newGroupName.trim() })
      .select()
      .single();
    if (data) setGroups((g) => [...g, data]);
    setNewGroupName("");
  }

  async function addTeam() {
    if (!newTeamName.trim()) return;
    const { data } = await supabase
      .from("teams")
      .insert({ name: newTeamName.trim(), group_id: selectedGroup || null })
      .select()
      .single();
    if (data) setTeams((t) => [...t, data]);
    setNewTeamName("");
  }

  async function updateTeam(id: string) {
    if (!editTeamName.trim()) return;
    await supabase.from("teams").update({ name: editTeamName.trim() }).eq("id", id);
    setTeams((t) => t.map((x) => (x.id === id ? { ...x, name: editTeamName.trim() } : x)));
    setEditingTeam(null);
  }

  async function deleteTeam(id: string) {
    if (!confirm("Delete this team?")) return;
    await supabase.from("teams").delete().eq("id", id);
    setTeams((t) => t.filter((x) => x.id !== id));
  }

  async function updateGroup(id: string) {
    if (!editGroupName.trim()) return;
    await supabase.from("groups").update({ name: editGroupName.trim() }).eq("id", id);
    setGroups((g) => g.map((x) => (x.id === id ? { ...x, name: editGroupName.trim() } : x)));
    setEditingGroup(null);
  }

  async function deleteGroup(g: Group) {
    if (!confirm(`Delete "${g.name}"? Teams in this group will be unassigned.`)) return;
    await supabase.from("teams").update({ group_id: null }).eq("group_id", g.id);
    await supabase.from("groups").delete().eq("id", g.id);
    setGroups((list) => list.filter((x) => x.id !== g.id));
    setTeams((t) => t.map((x) => (x.group_id === g.id ? { ...x, group_id: null } : x)));
  }

  const teamsByGroup = (groupId: string) => teams.filter((t) => t.group_id === groupId);
  const teamsWithoutGroup = teams.filter((t) => !t.group_id);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold text-white">Manage Teams</h1>

      {tournaments.length > 0 && (
        <select
          value={selectedTournament || ""}
          onChange={(e) => setSelectedTournament(e.target.value || null)}
          className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white"
        >
          {tournaments.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} - {t.season}
            </option>
          ))}
        </select>
      )}

      {selectedTournament && (
        <>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-600/80 bg-gradient-to-br from-slate-800/90 to-slate-800/60 p-5 shadow-lg">
              <h2 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-court-500" />
                Add Group
              </h2>
              <div className="flex gap-3">
                <input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Group A"
                  className="flex-1 px-4 py-2.5 rounded-lg bg-slate-900/80 border border-slate-600 text-white placeholder-slate-500 focus:border-court-500 focus:ring-1 focus:ring-court-500/30 transition"
                />
                <button
                  onClick={addGroup}
                  disabled={!newGroupName.trim()}
                  className="px-5 py-2.5 rounded-lg bg-court-600 hover:bg-court-500 text-white font-medium disabled:opacity-50 transition match-btn"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-600/80 bg-gradient-to-br from-slate-800/90 to-slate-800/60 p-5 shadow-lg">
              <h2 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-court-500" />
                Add Team
              </h2>
              <select
                value={selectedGroup || ""}
                onChange={(e) => setSelectedGroup(e.target.value || null)}
                className="w-full mb-3 px-4 py-2.5 rounded-lg bg-slate-900/80 border border-slate-600 text-white text-sm focus:border-court-500 focus:ring-1 focus:ring-court-500/30"
              >
                <option value="">No group</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-3">
                <input
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="Team name"
                  className="flex-1 px-4 py-2.5 rounded-lg bg-slate-900/80 border border-slate-600 text-white placeholder-slate-500 focus:border-court-500 focus:ring-1 focus:ring-court-500/30 transition"
                />
                <button
                  onClick={addTeam}
                  disabled={!newTeamName.trim()}
                  className="px-5 py-2.5 rounded-lg bg-court-600 hover:bg-court-500 text-white font-medium disabled:opacity-50 transition match-btn"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-600/80 bg-slate-800/60 p-5">
            <h2 className="font-display font-semibold text-white mb-5 flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-court-500" />
              Teams by Group
            </h2>

            {groups.map((g) => (
              <div key={g.id} className="mb-6 last:mb-0">
                <div className="flex items-center gap-2 mb-3">
                  {editingGroup === g.id ? (
                    <>
                      <input
                        value={editGroupName}
                        onChange={(e) => setEditGroupName(e.target.value)}
                        className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white focus:border-court-500"
                      />
                      <button onClick={() => updateGroup(g.id)} className="px-3 py-2 rounded-lg bg-court-600 hover:bg-court-500 text-white text-sm match-btn">Save</button>
                      <button onClick={() => setEditingGroup(null)} className="px-3 py-2 rounded-lg bg-slate-600 hover:bg-slate-500 text-white text-sm">Cancel</button>
                    </>
                  ) : (
                    <>
                      <div className="inline-flex px-3 py-1.5 rounded-lg bg-court-900/40 border border-court-600/50">
                        <h3 className="text-court-400 font-semibold text-sm">{g.name}</h3>
                      </div>
                      <button onClick={() => { setEditingGroup(g.id); setEditGroupName(g.name); }} className="px-2 py-1 rounded text-slate-400 hover:text-white hover:bg-slate-600 text-xs transition">Edit</button>
                      <button onClick={() => deleteGroup(g)} className="px-2 py-1 rounded text-red-400 hover:text-red-300 hover:bg-red-900/30 text-xs transition">Delete</button>
                    </>
                  )}
                </div>
                <ul className="space-y-2 ml-2">
                  {teamsByGroup(g.id).map((t) => (
                    <li key={t.id} className="flex items-center gap-2 py-2 px-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition group">
                      {editingTeam === t.id ? (
                        <>
                          <input
                            value={editTeamName}
                            onChange={(e) => setEditTeamName(e.target.value)}
                            className="px-2 py-1 rounded bg-slate-900 border border-slate-600 text-white text-sm"
                          />
                          <button onClick={() => updateTeam(t.id)} className="px-2 py-1 rounded bg-court-600 text-white text-xs">Save</button>
                          <button onClick={() => setEditingTeam(null)} className="px-2 py-1 rounded bg-slate-600 text-white text-xs">Cancel</button>
                        </>
                      ) : (
                        <>
                          <span className="text-slate-200 flex-1">{t.name}</span>
                          <button onClick={() => { setEditingTeam(t.id); setEditTeamName(t.name); }} className="text-slate-500 hover:text-white text-xs px-2 py-1 rounded hover:bg-slate-600 transition">Edit</button>
                          <button onClick={() => deleteTeam(t.id)} className="text-slate-500 hover:text-red-400 text-xs px-2 py-1 rounded hover:bg-red-900/30 transition">Delete</button>
                        </>
                      )}
                    </li>
                  ))}
                  {teamsByGroup(g.id).length === 0 && <li className="text-slate-500 text-sm py-3">No teams</li>}
                </ul>
              </div>
            ))}

            {teamsWithoutGroup.length > 0 && (
              <div>
                <div className="inline-flex px-3 py-1.5 rounded-lg bg-slate-700/50 border border-slate-600/50 mb-3">
                  <h3 className="text-slate-400 font-medium text-sm">No group</h3>
                </div>
                <ul className="space-y-2 ml-2">
                  {teamsWithoutGroup.map((t) => (
                    <li key={t.id} className="flex items-center gap-2 py-2 px-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition group">
                      {editingTeam === t.id ? (
                        <>
                          <input
                            value={editTeamName}
                            onChange={(e) => setEditTeamName(e.target.value)}
                            className="px-2 py-1 rounded bg-slate-900 border border-slate-600 text-white text-sm"
                          />
                          <button onClick={() => updateTeam(t.id)} className="px-2 py-1 rounded bg-court-600 text-white text-xs">Save</button>
                          <button onClick={() => setEditingTeam(null)} className="px-2 py-1 rounded bg-slate-600 text-white text-xs">Cancel</button>
                        </>
                      ) : (
                        <>
                          <span className="text-slate-200 flex-1">{t.name}</span>
                          <button onClick={() => { setEditingTeam(t.id); setEditTeamName(t.name); }} className="text-slate-500 hover:text-white text-xs px-2 py-1 rounded hover:bg-slate-600 transition">Edit</button>
                          <button onClick={() => deleteTeam(t.id)} className="text-slate-500 hover:text-red-400 text-xs px-2 py-1 rounded hover:bg-red-900/30 transition">Delete</button>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {groups.length === 0 && teamsWithoutGroup.length === 0 && (
              <p className="text-slate-500 text-sm">Add groups and teams above.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
