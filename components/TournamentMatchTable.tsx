/**
 * Tournament Match Display Component
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

interface MatchTableProps {
  matches: Match[];
  title: string;
  onMatchUpdate?: (matchId: string, team1Score: number, team2Score: number) => void;
}

export default function MatchTable({ matches, title, onMatchUpdate }: MatchTableProps) {
  const [editingMatch, setEditingMatch] = useState<string | null>(null);
  const [scores, setScores] = useState<{
    [key: string]: { team1Score: number; team2Score: number };
  }>({});

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
      setEditingMatch(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 my-4">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-gray-300 px-4 py-2 text-left">SR.NO</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Team 1</th>
              <th className="border border-gray-300 px-4 py-2 text-center">vs</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Team 2</th>
              <th className="border border-gray-300 px-4 py-2 text-center">Score</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Position</th>
              <th className="border border-gray-300 px-4 py-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((match, index) => (
              <tr key={match.matchId} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
                <td className="border border-gray-300 px-4 py-2">
                  <div className="font-semibold">{match.team1Name}</div>
                  <div className="text-xs text-gray-600">{match.team1Players}</div>
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center">vs</td>
                <td className="border border-gray-300 px-4 py-2">
                  <div className="font-semibold">{match.team2Name}</div>
                  <div className="text-xs text-gray-600">{match.team2Players}</div>
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {editingMatch === match.matchId ? (
                    <div className="flex gap-2 justify-center">
                      <input
                        type="number"
                        max="100"
                        className="w-12 px-1 border border-gray-300 rounded"
                        value={scores[match.matchId]?.team1Score || ""}
                        onChange={(e) =>
                          handleScoreChange(match.matchId, 1, parseInt(e.target.value) || 0)
                        }
                      />
                      <span>-</span>
                      <input
                        type="number"
                        max="100"
                        className="w-12 px-1 border border-gray-300 rounded"
                        value={scores[match.matchId]?.team2Score || ""}
                        onChange={(e) =>
                          handleScoreChange(match.matchId, 2, parseInt(e.target.value) || 0)
                        }
                      />
                    </div>
                  ) : (
                    <span className="font-bold">
                      {match.team1Score !== undefined && match.team2Score !== undefined
                        ? `${match.team1Score}-${match.team2Score}`
                        : "N/A"}
                    </span>
                  )}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {match.winner || "Pending"}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {editingMatch === match.matchId ? (
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => handleSaveScore(match.matchId)}
                        className="bg-green-500 text-white px-3 py-1 rounded text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingMatch(null)}
                        className="bg-gray-500 text-white px-3 py-1 rounded text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingMatch(match.matchId);
                        setScores((prev) => ({
                          ...prev,
                          [match.matchId]: {
                            team1Score: match.team1Score || 0,
                            team2Score: match.team2Score || 0,
                          },
                        }));
                      }}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                    >
                      {match.team1Score !== undefined ? "Edit" : "Set Score"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
