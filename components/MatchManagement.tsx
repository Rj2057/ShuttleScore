/**
 * Match Management Component
 * Select matches, add scores, manage tournament flow
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

interface MatchManagementProps {
  matches: Match[];
  title: string;
  matchType: "league" | "loser" | "group" | "quarterfinal" | "semifinal" | "final";
  onMatchUpdate?: (matchId: string, team1Score: number, team2Score: number) => void;
}

export default function MatchManagement({
  matches,
  title,
  matchType,
  onMatchUpdate,
}: MatchManagementProps) {
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [scores, setScores] = useState<{
    [key: string]: { team1Score: number; team2Score: number };
  }>({});

  const pendingMatches = matches.filter((m) => m.status === "pending");
  const completedMatches = matches.filter((m) => m.status !== "pending");

  const handleSelectMatch = (matchId: string) => {
    setSelectedMatch(matchId);
    const match = matches.find((m) => m.matchId === matchId);
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
      <h2 className="text-2xl font-bold mb-6">{title}</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Matches List */}
        <div className="lg:col-span-1">
          <h3 className="text-lg font-semibold mb-3 text-blue-600">
            Pending Matches ({pendingMatches.length})
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {pendingMatches.length === 0 ? (
              <p className="text-gray-500 text-sm">No pending matches</p>
            ) : (
              pendingMatches.map((match) => (
                <button
                  key={match.matchId}
                  onClick={() => handleSelectMatch(match.matchId)}
                  className={`w-full text-left p-3 rounded border-2 transition ${
                    selectedMatch === match.matchId
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-blue-400"
                  }`}
                >
                  <div className="font-semibold text-sm">{match.matchId}</div>
                  <div className="text-xs text-gray-600">{match.team1Name}</div>
                  <div className="text-xs text-gray-600">vs {match.team2Name}</div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Selected Match Detail & Score Entry */}
        <div className="lg:col-span-2">
          {selectedMatch ? (
            (() => {
              const match = matches.find((m) => m.matchId === selectedMatch)!;
              const matchScores = scores[selectedMatch];

              return (
                <div className="border-2 border-blue-500 rounded-lg p-6 bg-blue-50">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-600 mb-2">
                        Match {match.matchNumber}
                      </h4>
                      <p className="text-xs text-gray-500 mb-3">Type: {match.type}</p>
                    </div>
                    <button
                      onClick={() => setSelectedMatch(null)}
                      className="text-gray-500 hover:text-gray-700 text-xl"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Team 1 */}
                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        {match.team1Name}
                      </label>
                      <p className="text-xs text-gray-600 mb-3">{match.team1Players}</p>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                        value={matchScores?.team1Score || ""}
                        onChange={(e) =>
                          handleScoreChange(
                            selectedMatch,
                            1,
                            parseInt(e.target.value) || 0
                          )
                        }
                        placeholder="Enter team 1 score"
                      />
                    </div>

                    {/* VS */}
                    <div className="flex items-center justify-center py-2">
                      <div className="border-t-2 border-gray-300 flex-grow"></div>
                      <span className="px-4 font-bold text-gray-700">VS</span>
                      <div className="border-t-2 border-gray-300 flex-grow"></div>
                    </div>

                    {/* Team 2 */}
                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        {match.team2Name}
                      </label>
                      <p className="text-xs text-gray-600 mb-3">{match.team2Players}</p>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                        value={matchScores?.team2Score || ""}
                        onChange={(e) =>
                          handleScoreChange(
                            selectedMatch,
                            2,
                            parseInt(e.target.value) || 0
                          )
                        }
                        placeholder="Enter team 2 score"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => handleSaveScore(selectedMatch)}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded transition"
                      >
                        Save Result
                      </button>
                      <button
                        onClick={() => setSelectedMatch(null)}
                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold px-4 py-2 rounded transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500">
              <p>Select a match to enter scores</p>
            </div>
          )}
        </div>
      </div>

      {/* Completed Matches */}
      {completedMatches.length > 0 && (
        <div className="mt-8 pt-8 border-t-2">
          <h3 className="text-lg font-semibold mb-4 text-green-600">
            Completed Matches ({completedMatches.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {completedMatches.map((match) => (
              <div
                key={match.matchId}
                className="border-2 border-green-300 bg-green-50 p-3 rounded"
              >
                <div className="text-sm font-semibold text-green-700 mb-2">
                  {match.matchId}
                </div>
                <div className="text-xs mb-2">
                  <div className="font-semibold">{match.team1Name}</div>
                  <div className="text-gray-600">{match.team1Players}</div>
                </div>
                <div className="text-center font-bold text-lg my-2">
                  {match.team1Score} - {match.team2Score}
                </div>
                <div className="text-xs">
                  <div className="font-semibold">{match.team2Name}</div>
                  <div className="text-gray-600">{match.team2Players}</div>
                </div>
                <div className="mt-2 pt-2 border-t text-xs text-center text-green-700 font-semibold">
                  {match.winner}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
