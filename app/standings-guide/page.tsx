import Link from "next/link";

const glossary = [
  ["MP", "Matches Played", "Total completed matches played by the team in that group."],
  ["W", "Matches Won", "Completed matches won by the team."],
  ["L", "Matches Lost", "Completed matches lost by the team."],
  ["GW", "Games Won", "Total individual games won across all completed matches."],
  ["GL", "Games Lost", "Total individual games lost across all completed matches."],
  ["GD", "Game Difference", "GW - GL"],
  ["PF", "Points For", "Total rally points scored in all completed games."],
  ["PA", "Points Against", "Total rally points conceded in all completed games."],
  ["PD", "Point Difference", "PF - PA"],
  ["Pts", "Match Points", "Currently equal to matches won in this system."],
];

export default function StandingsGuidePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="font-display text-3xl font-bold">Group Standings Guide</h1>
            <p className="text-slate-400 mt-2">Full forms, formulas, and ranking rules used by the Admin panel and Live Scoreboard.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href="/admin/matches" className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm">Admin Matches</Link>
            <Link href="/live" className="px-4 py-2 rounded-lg bg-court-600 hover:bg-court-500 text-sm">Live Scoreboard</Link>
          </div>
        </div>

        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <h2 className="text-xl font-semibold">Ranking Order</h2>
          <div className="grid gap-2 text-sm text-slate-300">
            <p>1. <strong className="text-white">Pts</strong>: Higher match points ranks first.</p>
            <p>2. <strong className="text-white">GD</strong>: If tied on Pts, higher game difference ranks first.</p>
            <p>3. <strong className="text-white">PD</strong>: If still tied, higher point difference ranks first.</p>
            <p>4. <strong className="text-white">Head-to-head</strong>: If still tied, the team that won the direct match ranks higher.</p>
          </div>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <h2 className="text-xl font-semibold">Full Forms</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border border-slate-800">
              <thead className="bg-slate-900 text-slate-300">
                <tr>
                  <th className="px-3 py-2 text-left">Short</th>
                  <th className="px-3 py-2 text-left">Full Form</th>
                  <th className="px-3 py-2 text-left">Meaning</th>
                </tr>
              </thead>
              <tbody>
                {glossary.map(([short, full, meaning]) => (
                  <tr key={short} className="border-t border-slate-800 text-slate-200">
                    <td className="px-3 py-2 font-semibold text-court-400">{short}</td>
                    <td className="px-3 py-2">{full}</td>
                    <td className="px-3 py-2">{meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <h2 className="text-xl font-semibold">Formulas</h2>
          <div className="grid gap-2 text-sm text-slate-300">
            <p><strong className="text-white">matches_played</strong> = matches_won + matches_lost</p>
            <p><strong className="text-white">games_won</strong> = sum of games won across completed matches</p>
            <p><strong className="text-white">games_lost</strong> = sum of games lost across completed matches</p>
            <p><strong className="text-white">game_difference</strong> = games_won - games_lost</p>
            <p><strong className="text-white">points_scored</strong> = total points scored in all completed games</p>
            <p><strong className="text-white">points_conceded</strong> = total points conceded in all completed games</p>
            <p><strong className="text-white">point_difference</strong> = points_scored - points_conceded</p>
            <p><strong className="text-white">match_points</strong> = matches_won</p>
          </div>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <h2 className="text-xl font-semibold">Example</h2>
          <div className="grid gap-2 text-sm text-slate-300">
            <p>If Team A beats Team B by games 2-1, then Team A gets W +1, Team B gets L +1.</p>
            <p>Team A adds GW +2 and GL +1. Team B adds GW +1 and GL +2.</p>
            <p>All rally points from every game are added into PF and PA.</p>
            <p>After that, GD = GW - GL and PD = PF - PA are recalculated automatically.</p>
          </div>
        </section>
      </div>
    </main>
  );
}