/**
 * Main Tournament Dashboard Page
 */
"use client";

import { useState, useEffect } from "react";
import MatchSelector from "@/components/MatchSelector";
import TeamAssignment from "@/components/TeamAssignment";
import GroupStandings from "@/components/GroupStandings";

export default function TournamentPage() {
  const [tournamentId, setTournamentId] = useState<string>("");
  const [tournament, setTournament] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentStage, setCurrentStage] = useState<
    "league" | "loser" | "group" | "quarterfinal" | "semifinal" | "final" | "standings" | "manage-teams" | "matches"
  >("matches");

  // Initialize tournament
  useEffect(() => {
    const initTournament = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/tournament", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Badminton Doubles Championship 2026" }),
        });

        const data = await response.json();
        setTournamentId(data.tournament.id);
        await fetchTournament(data.tournament.id);
      } catch (error) {
        console.error("Error creating tournament:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!tournamentId) {
      initTournament();
    }
  }, []);

  const fetchTournament = async (id: string) => {
    try {
      const response = await fetch(`/api/tournament/${id}`);
      const data = await response.json();
      setTournament(data);
    } catch (error) {
      console.error("Error fetching tournament:", error);
    }
  };

  const executeTournamentAction = async (action: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tournament/${tournamentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();
      await fetchTournament(tournamentId);
    } catch (error) {
      console.error("Error executing action:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateMatchScore = async (matchId: string, team1Score: number, team2Score: number) => {
    try {
      setLoading(true);
      await fetch(`/api/tournament/${tournamentId}/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, team1Score, team2Score }),
      });

      await fetchTournament(tournamentId);
    } catch (error) {
      console.error("Error updating match:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !tournament) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading Tournament...</div>
      </div>
    );
  }

  if (!tournament) {
    return <div className="text-red-500">Error loading tournament</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-4xl font-bold mb-2">{tournament.tournament.name}</h1>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-semibold">Status:</span> {tournament.tournament.status}
            </div>
            <div>
              <span className="font-semibold">Total Teams:</span> {tournament.tournament.totalTeams}
            </div>
            <div>
              <span className="font-semibold">Start Date:</span>{" "}
              {new Date(tournament.tournament.startDate).toLocaleDateString()}
            </div>
            {tournament.tournament.champion && (
              <div className="col-span-2 md:col-span-4 bg-yellow-100 p-2 rounded">
                <span className="font-bold text-lg">🏆 Champion: {tournament.tournament.champion}</span>
              </div>
            )}
          </div>
        </div>

        {/* Control Panel */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Tournament Control</h2>
          <p className="text-sm text-gray-600 mb-4">
            🎯 Workflow: Start → League Matches → Losers Matches → Manage Teams in Groups → Play Group Matches → Knockout Stages
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() => executeTournamentAction("start")}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-semibold"
              disabled={loading}
            >
              1️⃣ Start Tournament
            </button>
            <button
              onClick={() => executeTournamentAction("complete_initial")}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-semibold"
              disabled={loading}
            >
              2️⃣ Simulate/Done League
            </button>
            <button
              onClick={() => executeTournamentAction("progress_to_loser")}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded font-semibold"
              disabled={loading}
            >
              3️⃣ Start Loser Matches
            </button>
            <button
              onClick={() => executeTournamentAction("complete_loser")}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded font-semibold"
              disabled={loading}
            >
              4️⃣ Done Loser Matches
            </button>
            <button
              onClick={() => executeTournamentAction("progress_to_group")}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-semibold"
              disabled={loading}
            >
              5️⃣ Start Group Stage
            </button>
            <button
              onClick={() => executeTournamentAction("complete_group")}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-semibold"
              disabled={loading}
            >
              6️⃣ Done Group Matches
            </button>
            <button
              onClick={() => executeTournamentAction("progress_to_knockout")}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded font-semibold"
              disabled={loading}
            >
              7️⃣ Start Quarterfinals
            </button>
            <button
              onClick={() => executeTournamentAction("complete_quarterfinals")}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded font-semibold"
              disabled={loading}
            >
              8️⃣ Done Quarterfinals
            </button>
            <button
              onClick={() => executeTournamentAction("progress_to_semifinals")}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-semibold"
              disabled={loading}
            >
              9️⃣ Start Semifinals
            </button>
            <button
              onClick={() => executeTournamentAction("complete_semifinals")}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-semibold"
              disabled={loading}
            >
              🔟 Done Semifinals
            </button>
            <button
              onClick={() => executeTournamentAction("progress_to_final")}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded font-semibold"
              disabled={loading}
            >
              ♻️ Start Final
            </button>
            <button
              onClick={() => executeTournamentAction("complete_final")}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded font-semibold"
              disabled={loading}
            >
              ✅ Complete Final
            </button>
          </div>
        </div>

        {/* Stage Navigation */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Tournament Stages</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCurrentStage("matches")}
              className={`px-4 py-2 rounded font-bold ${
                currentStage === "matches"
                  ? "bg-indigo-500 text-white"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
            >
              📋 All Matches
            </button>
            <button
              onClick={() => setCurrentStage("manage-teams")}
              className={`px-4 py-2 rounded ${
                currentStage === "manage-teams"
                  ? "bg-indigo-500 text-white"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
            >
              👥 Manage Teams
            </button>
            <button
              onClick={() => setCurrentStage("standings")}
              className={`px-4 py-2 rounded ${
                currentStage === "standings"
                  ? "bg-green-500 text-white"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
            >
              📊 Standings
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div>
          {currentStage === "matches" && (
            <MatchSelector
              allMatches={{
                league: tournament.leagueMatches || [],
                loser: tournament.loserMatches || [],
                group: tournament.groupMatches || [],
                quarterfinal: tournament.knockoutMatches?.quarterfinals || [],
                semifinal: tournament.knockoutMatches?.semifinals || [],
                final: [
                  ...(tournament.knockoutMatches?.final?.final || []),
                  ...(tournament.knockoutMatches?.final?.thirdPlace || []),
                ],
              }}
              onMatchUpdate={updateMatchScore}
            />
          )}

          {currentStage === "manage-teams" && tournament.teams && (
            <TeamAssignment
              allTeams={tournament.teams}
              groups={tournament.groups || []}
              onTeamsAssigned={async (updatedGroups) => {
                console.log("Teams assigned to groups");
                await fetchTournament(tournamentId);
              }}
            />
          )}

          {currentStage === "standings" &&
            tournament.groupStandings &&
            Object.entries(tournament.groupStandings).map(([group, standings]: [string, any]) => (
              <GroupStandings key={group} group={group.replace("Group ", "")} standings={standings} />
            ))}
        </div>
      </div>
    </div>
  );
}
