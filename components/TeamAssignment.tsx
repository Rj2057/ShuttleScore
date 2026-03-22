/**
 * Team Assignment Component
 * Assign teams to groups before playing matches
 */
"use client";

interface Team {
  id: string;
  name: string;
  players: { id: string; name: string }[];
  groupId?: string;
  groupPosition?: number;
  status: string;
}

interface Group {
  id: string;
  name: "A" | "B" | "C" | "D";
  teams: Team[];
}

interface TeamAssignmentProps {
  allTeams: Team[];
  groups: Group[];
  onTeamsAssigned?: (updatedGroups: Group[]) => void;
}

export default function TeamAssignment({
  allTeams,
  groups,
  onTeamsAssigned,
}: TeamAssignmentProps) {
  const assignedTeamIds = groups.flatMap((g) => g.teams.map((t) => t.id));
  const unassignedTeams = allTeams.filter((t) => !assignedTeamIds.includes(t.id));

  const handleAssignTeam = (teamId: string, groupId: string) => {
    const team = allTeams.find((t) => t.id === teamId)!;
    const group = groups.find((g) => g.id === groupId)!;

    if (group.teams.length >= (groupId === "GD" ? 3 : 4)) {
      alert(`Group ${group.name} is full!`);
      return;
    }

    team.groupId = groupId;
    team.groupPosition = group.teams.length + 1;
    group.teams.push(team);
    onTeamsAssigned?.(groups);
  };

  const handleRemoveTeam = (teamId: string, groupId: string) => {
    const group = groups.find((g) => g.id === groupId)!;
    group.teams = group.teams.filter((t) => t.id !== teamId);
    const team = allTeams.find((t) => t.id === teamId)!;
    team.groupId = undefined;
    onTeamsAssigned?.(groups);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 my-4">
      <h2 className="text-2xl font-bold mb-6">Assign Teams to Groups</h2>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Unassigned Teams */}
        <div className="lg:col-span-1">
          <h3 className="font-semibold text-blue-600 mb-3">
            Unassigned Teams ({unassignedTeams.length})
          </h3>
          <div className="border-2 border-blue-300 bg-blue-50 rounded p-3 min-h-96 max-h-96 overflow-y-auto">
            {unassignedTeams.length === 0 ? (
              <p className="text-gray-500 text-sm">All teams assigned ✓</p>
            ) : (
              <div className="space-y-2">
                {unassignedTeams.map((team) => (
                  <div key={team.id} className="bg-white p-2 rounded border text-xs">
                    <div className="font-semibold">{team.name}</div>
                    <div className="text-gray-600">
                      {team.players.map((p) => p.name).join(" & ")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Groups */}
        {groups.map((group) => (
          <div key={group.id} className="lg:col-span-1">
            <h3 className="font-semibold text-center mb-3 text-lg text-purple-600">
              Group {group.name}
            </h3>
            <div className="border-2 border-purple-300 bg-purple-50 rounded p-3 min-h-96 max-h-96 overflow-y-auto">
              {group.teams.length === 0 ? (
                <p className="text-gray-500 text-xs text-center py-40">No teams</p>
              ) : (
                <div className="space-y-2">
                  {group.teams.map((team) => (
                    <div
                      key={team.id}
                      className="bg-white p-2 rounded border border-purple-200 text-xs"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-semibold">{team.name}</div>
                          <div className="text-gray-600 text-xs">
                            {team.players.map((p) => p.name).join(" & ")}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveTeam(team.id, group.id)}
                          className="text-red-500 hover:text-red-700 font-bold ml-2"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Team Dropdown */}
              {unassignedTeams.length > 0 && group.teams.length < (group.id === "GD" ? 3 : 4) && (
                <div className="mt-3 pt-3 border-t">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAssignTeam(e.target.value, group.id);
                        e.target.value = "";
                      }
                    }}
                    className="w-full px-2 py-1 text-xs border rounded bg-white"
                  >
                    <option value="">Add team...</option>
                    {unassignedTeams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Group Capacity */}
              <div className="mt-3 pt-3 border-t text-xs text-center text-gray-600">
                {group.teams.length}/{group.id === "GD" ? 3 : 4}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
