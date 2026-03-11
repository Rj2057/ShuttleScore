import type { GroupStanding, Team } from "@/types/database";

interface GroupStandingsTableProps {
  standings: GroupStanding[];
  teamsMap?: Record<string, Team>;
  emptyMessage?: string;
}

export function GroupStandingsTable({ standings, teamsMap = {}, emptyMessage = "No completed matches yet." }: GroupStandingsTableProps) {
  if (standings.length === 0) {
    return <p className="text-slate-500 text-xs">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs text-slate-200 border border-slate-700 rounded-lg overflow-hidden">
        <thead className="bg-slate-900/70 text-slate-300">
          <tr>
            <th className="px-2 py-1 text-left">Pos</th>
            <th className="px-2 py-1 text-left">Team</th>
            <th className="px-2 py-1 text-right">MP</th>
            <th className="px-2 py-1 text-right">W</th>
            <th className="px-2 py-1 text-right">L</th>
            <th className="px-2 py-1 text-right">GW</th>
            <th className="px-2 py-1 text-right">GL</th>
            <th className="px-2 py-1 text-right">GD</th>
            <th className="px-2 py-1 text-right">PF</th>
            <th className="px-2 py-1 text-right">PA</th>
            <th className="px-2 py-1 text-right">PD</th>
            <th className="px-2 py-1 text-right">Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((standing) => (
            <tr key={standing.team_id} className="border-t border-slate-700/70">
              <td className="px-2 py-1 font-semibold">{standing.position ?? "-"}</td>
              <td className="px-2 py-1 whitespace-nowrap">{standing.team?.name ?? teamsMap[standing.team_id]?.name ?? "TBD"}</td>
              <td className="px-2 py-1 text-right">{standing.matches_played}</td>
              <td className="px-2 py-1 text-right">{standing.matches_won}</td>
              <td className="px-2 py-1 text-right">{standing.matches_lost}</td>
              <td className="px-2 py-1 text-right">{standing.games_won}</td>
              <td className="px-2 py-1 text-right">{standing.games_lost}</td>
              <td className="px-2 py-1 text-right">{standing.game_difference}</td>
              <td className="px-2 py-1 text-right">{standing.points_scored}</td>
              <td className="px-2 py-1 text-right">{standing.points_conceded}</td>
              <td className="px-2 py-1 text-right">{standing.point_difference}</td>
              <td className="px-2 py-1 text-right font-semibold text-court-400">{standing.match_points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}