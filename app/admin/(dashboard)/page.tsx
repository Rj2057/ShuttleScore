import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold text-white">Admin Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/matches"
          className="block p-6 rounded-xl bg-slate-800/80 border border-slate-700 hover:border-court-500 transition"
        >
          <h2 className="font-display font-semibold text-lg text-white">Matches</h2>
          <p className="text-slate-400 text-sm mt-1">Add, edit scores, set winners</p>
        </Link>
        <Link
          href="/admin/teams"
          className="block p-6 rounded-xl bg-slate-800/80 border border-slate-700 hover:border-court-500 transition"
        >
          <h2 className="font-display font-semibold text-lg text-white">Teams</h2>
          <p className="text-slate-400 text-sm mt-1">Manage teams and groups</p>
        </Link>
        <Link
          href="/admin/tournament"
          className="block p-6 rounded-xl bg-slate-800/80 border border-slate-700 hover:border-court-500 transition"
        >
          <h2 className="font-display font-semibold text-lg text-white">Tournament</h2>
          <p className="text-slate-400 text-sm mt-1">Create bracket, knockout matches</p>
        </Link>
      </div>
      <div className="p-4 rounded-lg bg-court-900/30 border border-court-700 text-sm text-slate-300">
        <strong className="text-court-400">TBD Auto-Progression:</strong> When you set a winner on a knockout match, the winner automatically fills the TBD slot in the next round (QF → SF → Final).
      </div>
    </div>
  );
}
