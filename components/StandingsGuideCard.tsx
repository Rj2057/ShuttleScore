import Link from "next/link";

interface StandingsGuideCardProps {
  guideHref?: string;
  compact?: boolean;
}

export function StandingsGuideCard({ guideHref = "/standings-guide", compact = false }: StandingsGuideCardProps) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-white">Table Full Forms & Ranking Logic</h3>
          <p className="text-xs text-slate-400">Used in both Admin and Live Scoreboard group tables.</p>
        </div>
        <Link href={guideHref} className="text-xs px-3 py-1.5 rounded-lg bg-court-600 hover:bg-court-500 text-white font-medium">
          Open Full Guide
        </Link>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 text-xs text-slate-300">
        <p><strong className="text-white">MP</strong>: Matches Played</p>
        <p><strong className="text-white">W</strong>: Matches Won</p>
        <p><strong className="text-white">L</strong>: Matches Lost</p>
        <p><strong className="text-white">GW</strong>: Games Won</p>
        <p><strong className="text-white">GL</strong>: Games Lost</p>
        <p><strong className="text-white">GD</strong>: GW - GL</p>
        <p><strong className="text-white">PF</strong>: Points For / Scored</p>
        <p><strong className="text-white">PA</strong>: Points Against / Conceded</p>
        <p><strong className="text-white">PD</strong>: PF - PA</p>
        <p><strong className="text-white">Pts</strong>: Match Points</p>
      </div>

      {!compact && (
        <div className="text-xs text-slate-300 space-y-1">
          <p><strong className="text-white">Ranking order</strong>: Pts, then GD, then PD, then head-to-head.</p>
          <p><strong className="text-white">Calculation</strong>: After each completed match, standings update matches won/lost, games won/lost, and total points scored/conceded.</p>
        </div>
      )}
    </div>
  );
}