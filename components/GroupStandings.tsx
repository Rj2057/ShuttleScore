/**
 * Group Standings Component
 */
"use client";

interface Standing {
  position: number;
  teamName: string;
  teamId: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifference: number;
  totalPoints: number;
}

interface GroupStandingsProps {
  group: string;
  standings: Standing[];
}

export default function GroupStandings({ group, standings }: GroupStandingsProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 my-4">
      <h3 className="text-xl font-bold mb-4">Group {group}</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-gray-300 px-4 py-2 text-left">POS</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Team</th>
              <th className="border border-gray-300 px-4 py-2 text-center">M</th>
              <th className="border border-gray-300 px-4 py-2 text-center">W</th>
              <th className="border border-gray-300 px-4 py-2 text-center">L</th>
              <th className="border border-gray-300 px-4 py-2 text-center">PF</th>
              <th className="border border-gray-300 px-4 py-2 text-center">PA</th>
              <th className="border border-gray-300 px-4 py-2 text-center">PD</th>
              <th className="border border-gray-300 px-4 py-2 text-center">PTS</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((standing) => (
              <tr 
                key={standing.teamId} 
                className={standing.position <= 2 ? "bg-green-50" : "hover:bg-gray-50"}
              >
                <td className="border border-gray-300 px-4 py-2 font-bold">
                  {standing.position}
                  {standing.position <= 2 && <span className="text-green-600 ml-1">✓</span>}
                </td>
                <td className="border border-gray-300 px-4 py-2 font-semibold">
                  {standing.teamName}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {standing.matchesPlayed}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {standing.wins}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {standing.losses}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {standing.pointsFor}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {standing.pointsAgainst}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {standing.pointDifference > 0 ? "+" : ""}
                  {standing.pointDifference}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-center font-bold">
                  {standing.totalPoints}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-xs text-gray-600">
        <p>M=Matches, W=Wins, L=Losses, PF=Points For, PA=Points Against, PD=Point Difference, PTS=Total Points</p>
      </div>
    </div>
  );
}
