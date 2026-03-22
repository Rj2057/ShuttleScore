/**
 * Match Selector Component
 * Filter matches by type, then select and enter scores
 */
"use client";

import { useState } from "react";

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
  onMatchUpdate?: (matchId: string, team1Score: number, team2Score: number) => void;
}

const MATCH_TYPE_CONFIG = {
  league: { label: "🏆 League Matches", color: "blue", icon: "M" },
  loser: { label: "🔴 Loser Matches", color: "orange", icon: "L" },
  group: { label: "📊 Group/Round Robin", color: "green", icon: "G" },
  quarterfinal: { label: "🥇 Quarterfinals", color: "purple", icon: "QF" },
  semifinal: { label: "🥈 Semifinals", color: "red", icon: "SF" },
  final: { label: "🏅 Final & 3rd Place", color: "yellow", icon: "F" },
};

export default function MatchSelector({
  allMatches,
  onMatchUpdate,
}: MatchSelectorProps) {
  const [selectedType, setSelectedType] = useState<MatchTypeFilter>("league");
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [scores, setScores] = useState<{
    [key: string]: { team1Score: number; team2Score: number };
  }>({});

  const currentMatches = allMatches[selectedType];
  const pendingMatches = currentMatches.filter((m) => m.status === "pending");
  const completedMatches = currentMatches.filter((m) => m.status !== "pending");

  const handleSelectMatch = (matchId: string) => {
    setSelectedMatch(matchId);
    const match = currentMatches.find((m) => m.matchId === matchId);
    if (match) {
      setScores((prev) => ({
        ...prev,
        [matchId]: {
          team1Score: match.team1Score || 0,
          team2Score: match.team2Score || 0,
        },
      }));
    }
  };

  const handleScoreChange = (matchId: string, team: 1 | 2, score: number) => {
    setScores((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [team === 1 ? "team1Score" : "team2Score"]: score,
      },
    }));
  };

  const handleSaveScore = (matchId: string) => {
    const matchScores = scores[matchId];
    if (matchScores && onMatchUpdate) {
      onMatchUpdate(matchId, matchScores.team1Score, matchScores.team2Score);
      setSelectedMatch(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 my-4">
      <h2 className="text-2xl font-bold mb-6">Match Management</h2>

      {/* Match Type Selector */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Select Match Type</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {(Object.entries(MATCH_TYPE_CONFIG) as Array<[MatchTypeFilter, any]>).map(
            ([type, config]) => {
              const typeMatches = allMatches[type];
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
                      ? `border-${config.color}-500 bg-${config.color}-100 text-${config.color}-900`
                      : `border-gray-300 hover:border-${config.color}-400 bg-white`
                  }`}
                >
                  <div className="text-sm">{config.label}</div>
                  <div className="text-xs mt-1">
                    <span className="text-blue-600">{pending}</span>
                    {pending > 0 && <span className="text-gray-400">|</span>}
                    <span className="text-green-600">{completed}✓</span>
                  </div>
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* Match Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Pending Matches List */}
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

        {/* Score Entry Form */}
        <div className="lg:col-span-2">
          {selectedMatch ? (
            (() => {
              const match = currentMatches.find((m) => m.matchId === selectedMatch)!;
              const matchScores = scores[selectedMatch];

              return (
                <div className="border-2 border-blue-500 rounded-lg p-6 bg-blue-50 shadow-lg">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="text-2xl font-bold text-blue-700 mb-1">
                        {match.matchId}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {MATCH_TYPE_CONFIG[selectedType].label}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedMatch(null)}
                      className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-5">
                    {/* Team 1 */}
                    <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        {match.team1Name}
                      </label>
                      <p className="text-xs text-gray-600 mb-3">
                        {match.team1Players}
                      </p>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg font-semibold"
                        value={matchScores?.team1Score || ""}
                        onChange={(e) =>
                          handleScoreChange(
                            selectedMatch,
                            1,
                            parseInt(e.target.value) || 0
                          )
                        }
                        placeholder="Enter score"
                      />
                    </div>

                    {/* VS Divider */}
                    <div className="flex items-center justify-center py-2">
                      <div className="border-t-2 border-gray-400 flex-grow"></div>
                      <span className="px-4 font-bold text-lg text-gray-700">VS</span>
                      <div className="border-t-2 border-gray-400 flex-grow"></div>
                    </div>

                    {/* Team 2 */}
                    <div className="bg-white p-4 rounded-lg border-l-4 border-orange-500">
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        {match.team2Name}
                      </label>
                      <p className="text-xs text-gray-600 mb-3">
                        {match.team2Players}
                      </p>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none text-lg font-semibold"
                        value={matchScores?.team2Score || ""}
                        onChange={(e) =>
                          handleScoreChange(
                            selectedMatch,
                            2,
                            parseInt(e.target.value) || 0
                          )
                        }
                        placeholder="Enter score"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => handleSaveScore(selectedMatch)}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-3 rounded-lg transition shadow-md"
                      >
                        ✓ Save Result
                      </button>
                      <button
                        onClick={() => setSelectedMatch(null)}
                        className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold px-6 py-3 rounded-lg transition shadow-md"
                      >
                        ✕ Cancel
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="border-4 border-dashed border-gray-300 rounded-lg p-12 text-center bg-gray-50">
              <p className="text-gray-500 text-lg font-semibold">
                👈 Select a match to enter scores
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Completed Matches */}
      {completedMatches.length > 0 && (
        <div className="mt-8 pt-8 border-t-2">
          <h3 className="text-lg font-semibold mb-4 text-green-600">
            ✓ Completed Matches ({completedMatches.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {completedMatches.map((match) => (
              <div
                key={match.matchId}
                className="border-2 border-green-300 bg-green-50 p-4 rounded-lg shadow-sm"
              >
                <div className="text-sm font-bold text-green-700 mb-2">
                  {match.matchId}
                </div>
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
                  🏆 {match.winner}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
