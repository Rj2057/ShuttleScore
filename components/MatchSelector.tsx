/**
 * Match Selector Component
 * Add teams, add custom matches, then enter results by match type
 */
"use client";

import { useMemo, useState } from "react";

interface Match {
  matchNumber: number;
  matchId: string;
  team1Name: string;
  team2Name: string;
  team1Players: string;
  team2Players: string;
  team1Score?: number;
  team2Score?: number;
  winner?: string;
  status: string;
  type: string;
}

interface TeamOption {
  id: string;
  name: string;
  players: { id: string; name: string }[];
  groupId?: string;
}

interface GroupOption {
  id: string;
  name: "A" | "B" | "C" | "D";
  teams: TeamOption[];
}

type MatchTypeFilter = "league" | "loser" | "group" | "quarterfinal" | "semifinal" | "final";

interface MatchSelectorProps {
  allMatches: {
    league: Match[];
    loser: Match[];
    group: Match[];
    quarterfinal: Match[];
    semifinal: Match[];
    final: Match[];
  };
  teams: TeamOption[];
  groups: GroupOption[];
  onMatchUpdate?: (matchId: string, team1Score: number, team2Score: number) => void;
  onAddTeam?: (name: string, player1Name: string, player2Name: string) => Promise<void>;
  onAddMatch?: (payload: {
    type: MatchTypeFilter;
    team1Id: string;
    team2Id: string;
    groupId?: string;
    pointsPerSet: number;
    bestOf: number;
  }) => Promise<void>;
}

const MATCH_TYPE_LABEL: Record<MatchTypeFilter, string> = {
  league: "League",
  loser: "Loser",
  group: "Round Robin",
  quarterfinal: "Quarterfinal",
  semifinal: "Semifinal",
  final: "Final",
};

export default function MatchSelector({
  allMatches,
  teams,
  groups,
  onMatchUpdate,
  onAddTeam,
  onAddMatch,
}: MatchSelectorProps) {
  const [selectedType, setSelectedType] = useState<MatchTypeFilter>("league");
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, { team1Score: number; team2Score: number }>>({});

  const [newTeamName, setNewTeamName] = useState("");
  const [newPlayer1, setNewPlayer1] = useState("");
  const [newPlayer2, setNewPlayer2] = useState("");

  const [newMatchType, setNewMatchType] = useState<MatchTypeFilter>("league");
  const [sourceGroup, setSourceGroup] = useState<string>("all");
  const [newTeam1Id, setNewTeam1Id] = useState("");
  const [newTeam2Id, setNewTeam2Id] = useState("");
  const [bestOf, setBestOf] = useState(1);
  const [pointsPerSet, setPointsPerSet] = useState(21);

  const currentMatches = allMatches[selectedType] || [];
  const pendingMatches = currentMatches.filter((m) => m.status === "pending");
  const completedMatches = currentMatches.filter((m) => m.status !== "pending");

  const availableTeams = useMemo(() => {
    if (newMatchType === "group" && sourceGroup !== "all") {
      const group = groups.find((g) => g.id === sourceGroup);
      return group?.teams || [];
    }

    return teams;
  }, [newMatchType, sourceGroup, groups, teams]);

  const teamOptions = useMemo(() => {
    const base = availableTeams.map((team) => ({ id: team.id, name: team.name }));
    if (newMatchType === "quarterfinal" || newMatchType === "semifinal" || newMatchType === "final") {
      return [
        ...base,
        { id: "__TBD1", name: "TBD" },
        { id: "__TBD2", name: "TBD" },
      ];
    }
    return base;
  }, [availableTeams, newMatchType]);

  const handleSelectMatch = (matchId: string) => {
    setSelectedMatch(matchId);
    const match = currentMatches.find((m) => m.matchId === matchId);
    if (!match) {
      return;
    }

    setScores((prev) => ({
      ...prev,
      [matchId]: {
        team1Score: match.team1Score || 0,
        team2Score: match.team2Score || 0,
      },
    }));
  };

  const handleScoreChange = (matchId: string, team: 1 | 2, score: number) => {
    setScores((prev) => ({
      ...prev,
      [matchId]: {
        team1Score: team === 1 ? score : prev[matchId]?.team1Score || 0,
        team2Score: team === 2 ? score : prev[matchId]?.team2Score || 0,
      },
    }));
  };

  const applyScorePreset = (matchId: string, team1Score: number, team2Score: number) => {
    setScores((prev) => ({
      ...prev,
      [matchId]: { team1Score, team2Score },
    }));
  };

  const handleSaveScore = async (matchId: string) => {
    const matchScores = scores[matchId];
    if (!matchScores || !onMatchUpdate) {
      return;
    }

    if (matchScores.team1Score === matchScores.team2Score) {
      alert("Score cannot be tied.");
      return;
    }

    await onMatchUpdate(matchId, matchScores.team1Score, matchScores.team2Score);
    setSelectedMatch(null);
  };

  const handleAddTeam = async () => {
    if (!onAddTeam) {
      return;
    }

    if (!newTeamName.trim() || !newPlayer1.trim() || !newPlayer2.trim()) {
      alert("Please enter team name and both player names.");
      return;
    }

    await onAddTeam(newTeamName.trim(), newPlayer1.trim(), newPlayer2.trim());
    setNewTeamName("");
    setNewPlayer1("");
    setNewPlayer2("");
  };

  const handleAddMatch = async () => {
    if (!onAddMatch) {
      return;
    }

    if (!newTeam1Id || !newTeam2Id) {
      alert("Please select both teams.");
      return;
    }

    if (newTeam1Id === newTeam2Id) {
      alert("Please select two different teams.");
      return;
    }

    if (newMatchType === "group" && sourceGroup === "all") {
      alert("Please choose a group for round robin match.");
      return;
    }

    await onAddMatch({
      type: newMatchType,
      team1Id: newTeam1Id,
      team2Id: newTeam2Id,
      groupId: newMatchType === "group" ? sourceGroup : undefined,
      pointsPerSet,
      bestOf,
    });

    setNewTeam1Id("");
    setNewTeam2Id("");
    setSelectedType(newMatchType);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 my-4 space-y-6">
      <h2 className="text-2xl font-bold">Match Management</h2>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="border rounded-lg p-4 bg-slate-50 space-y-3">
          <h3 className="text-lg font-semibold">Add Team To Tournament</h3>
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Team Name"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
          />
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Player 1"
            value={newPlayer1}
            onChange={(e) => setNewPlayer1(e.target.value)}
          />
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Player 2"
            value={newPlayer2}
            onChange={(e) => setNewPlayer2(e.target.value)}
          />
          <button
            onClick={handleAddTeam}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded font-semibold"
          >
            Add Team
          </button>
        </div>

        <div className="border rounded-lg p-4 bg-amber-50 space-y-3">
          <h3 className="text-lg font-semibold">Add Match</h3>
          <select
            className="w-full border rounded px-3 py-2"
            value={newMatchType}
            onChange={(e) => {
              const value = e.target.value as MatchTypeFilter;
              setNewMatchType(value);
              setSourceGroup(value === "group" ? "GA" : "all");
              setNewTeam1Id("");
              setNewTeam2Id("");
            }}
          >
            <option value="league">League</option>
            <option value="loser">Loser</option>
            <option value="group">Round Robin</option>
            <option value="quarterfinal">Quarterfinal</option>
            <option value="semifinal">Semifinal</option>
            <option value="final">Final</option>
          </select>

          {newMatchType === "group" && (
            <select
              className="w-full border rounded px-3 py-2"
              value={sourceGroup}
              onChange={(e) => {
                setSourceGroup(e.target.value);
                setNewTeam1Id("");
                setNewTeam2Id("");
              }}
            >
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  Group {group.name}
                </option>
              ))}
            </select>
          )}

          <select
            className="w-full border rounded px-3 py-2"
            value={newTeam1Id}
            onChange={(e) => setNewTeam1Id(e.target.value)}
          >
            <option value="">Select Team 1</option>
            {teamOptions.map((team) => (
              <option key={`t1-${team.id}`} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>

          <select
            className="w-full border rounded px-3 py-2"
            value={newTeam2Id}
            onChange={(e) => setNewTeam2Id(e.target.value)}
          >
            <option value="">Select Team 2</option>
            {teamOptions.map((team) => (
              <option key={`t2-${team.id}`} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>

          <div className="text-sm font-semibold text-gray-700">Set Score Target</div>
          <div className="flex gap-2">
            <button
              className={`px-3 py-1 rounded border ${pointsPerSet === 21 ? "bg-emerald-600 text-white" : "bg-white"}`}
              onClick={() => setPointsPerSet(21)}
            >
              21
            </button>
            <button
              className={`px-3 py-1 rounded border ${pointsPerSet === 15 ? "bg-emerald-600 text-white" : "bg-white"}`}
              onClick={() => setPointsPerSet(15)}
            >
              15
            </button>
            <button
              className={`px-3 py-1 rounded border ${pointsPerSet === 11 ? "bg-emerald-600 text-white" : "bg-white"}`}
              onClick={() => setPointsPerSet(11)}
            >
              11
            </button>
            <input
              type="number"
              min={1}
              className="w-24 border rounded px-2 py-1"
              value={pointsPerSet}
              onChange={(e) => setPointsPerSet(Number(e.target.value) || 21)}
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold">Best Of</span>
            <select
              className="border rounded px-3 py-1"
              value={bestOf}
              onChange={(e) => setBestOf(Number(e.target.value))}
            >
              <option value={1}>1 Set</option>
              <option value={3}>3 Sets</option>
            </select>
          </div>

          <button
            onClick={handleAddMatch}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded font-semibold"
          >
            Add Match Button
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Select Match Type</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {(Object.keys(MATCH_TYPE_LABEL) as MatchTypeFilter[]).map((type) => {
            const typeMatches = allMatches[type] || [];
            const pending = typeMatches.filter((m) => m.status === "pending").length;
            const completed = typeMatches.filter((m) => m.status !== "pending").length;

            return (
              <button
                key={type}
                onClick={() => {
                  setSelectedType(type);
                  setSelectedMatch(null);
                }}
                className={`p-3 rounded-lg border-2 transition font-semibold ${
                  selectedType === type
                    ? "border-indigo-600 bg-indigo-100 text-indigo-900"
                    : "border-gray-300 hover:border-indigo-400 bg-white"
                }`}
              >
                <div className="text-sm">{MATCH_TYPE_LABEL[type]}</div>
                <div className="text-xs mt-1 text-gray-700">{pending} pending | {completed} done</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-1">
          <h3 className="text-lg font-semibold mb-3 text-blue-600">
            Pending Matches ({pendingMatches.length})
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-3 bg-blue-50">
            {pendingMatches.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-20">No pending matches</p>
            ) : (
              pendingMatches.map((match) => (
                <button
                  key={match.matchId}
                  onClick={() => handleSelectMatch(match.matchId)}
                  className={`w-full text-left p-3 rounded border-2 transition ${
                    selectedMatch === match.matchId
                      ? "border-blue-500 bg-blue-100 shadow-md"
                      : "border-gray-300 hover:border-blue-400 bg-white"
                  }`}
                >
                  <div className="font-bold text-sm text-blue-700">{match.matchId}</div>
                  <div className="text-xs text-gray-700 mt-1">
                    <div>{match.team1Name}</div>
                    <div className="text-gray-500">vs</div>
                    <div>{match.team2Name}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedMatch ? (
            (() => {
              const match = currentMatches.find((m) => m.matchId === selectedMatch)!;
              const matchScores = scores[selectedMatch] || { team1Score: 0, team2Score: 0 };

              return (
                <div className="border-2 border-blue-500 rounded-lg p-6 bg-blue-50 shadow-lg">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="text-2xl font-bold text-blue-700 mb-1">{match.matchId}</h4>
                      <p className="text-sm text-gray-600">{MATCH_TYPE_LABEL[selectedType]}</p>
                    </div>
                    <button
                      onClick={() => setSelectedMatch(null)}
                      className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                    >
                      x
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    <button
                      onClick={() => applyScorePreset(selectedMatch, 21, 15)}
                      className="bg-white border rounded py-2 hover:bg-gray-100"
                    >
                      21-15
                    </button>
                    <button
                      onClick={() => applyScorePreset(selectedMatch, 21, 18)}
                      className="bg-white border rounded py-2 hover:bg-gray-100"
                    >
                      21-18
                    </button>
                    <button
                      onClick={() => applyScorePreset(selectedMatch, 15, 11)}
                      className="bg-white border rounded py-2 hover:bg-gray-100"
                    >
                      15-11
                    </button>
                  </div>

                  <div className="space-y-5">
                    <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
                      <label className="block text-sm font-bold text-gray-700 mb-2">{match.team1Name}</label>
                      <p className="text-xs text-gray-600 mb-3">{match.team1Players}</p>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg font-semibold"
                        value={matchScores.team1Score}
                        onChange={(e) => handleScoreChange(selectedMatch, 1, Number(e.target.value) || 0)}
                        placeholder="Enter score"
                      />
                    </div>

                    <div className="flex items-center justify-center py-2">
                      <div className="border-t-2 border-gray-400 flex-grow" />
                      <span className="px-4 font-bold text-lg text-gray-700">VS</span>
                      <div className="border-t-2 border-gray-400 flex-grow" />
                    </div>

                    <div className="bg-white p-4 rounded-lg border-l-4 border-orange-500">
                      <label className="block text-sm font-bold text-gray-700 mb-2">{match.team2Name}</label>
                      <p className="text-xs text-gray-600 mb-3">{match.team2Players}</p>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none text-lg font-semibold"
                        value={matchScores.team2Score}
                        onChange={(e) => handleScoreChange(selectedMatch, 2, Number(e.target.value) || 0)}
                        placeholder="Enter score"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => void handleSaveScore(selectedMatch)}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-3 rounded-lg transition shadow-md"
                      >
                        Save Result
                      </button>
                      <button
                        onClick={() => setSelectedMatch(null)}
                        className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold px-6 py-3 rounded-lg transition shadow-md"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="border-4 border-dashed border-gray-300 rounded-lg p-12 text-center bg-gray-50">
              <p className="text-gray-500 text-lg font-semibold">Select a match to enter scores</p>
            </div>
          )}
        </div>
      </div>

      {completedMatches.length > 0 && (
        <div className="mt-8 pt-8 border-t-2">
          <h3 className="text-lg font-semibold mb-4 text-green-600">
            Completed Matches ({completedMatches.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {completedMatches.map((match) => (
              <div
                key={match.matchId}
                className="border-2 border-green-300 bg-green-50 p-4 rounded-lg shadow-sm"
              >
                <div className="text-sm font-bold text-green-700 mb-2">{match.matchId}</div>
                <div className="text-xs mb-3 space-y-1">
                  <div className="font-semibold text-gray-800">{match.team1Name}</div>
                  <div className="text-gray-600 text-xs">{match.team1Players}</div>
                </div>
                <div className="text-center font-bold text-2xl my-2 text-green-700">
                  {match.team1Score} - {match.team2Score}
                </div>
                <div className="text-xs space-y-1">
                  <div className="font-semibold text-gray-800">{match.team2Name}</div>
                  <div className="text-gray-600 text-xs">{match.team2Players}</div>
                </div>
                <div className="mt-3 pt-3 border-t text-xs text-center text-green-700 font-bold">
                  Winner: {match.winner}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
