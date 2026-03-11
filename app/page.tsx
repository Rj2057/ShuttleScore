import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        <h1 className="font-display text-4xl md:text-6xl font-bold text-white drop-shadow-lg">
          Lakshmi Hegde PG
        </h1>
        <h2 className="font-display text-3xl md:text-5xl font-extrabold text-court-400">
          Badminton Tournament
        </h2>
        <p className="text-xl text-slate-300">Season 2</p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
          <Link
            href="/live"
            className="px-8 py-4 rounded-xl bg-court-500 hover:bg-court-600 text-white font-display font-semibold text-lg shadow-lg hover:shadow-court-500/30 transition"
          >
            Live Scoreboard
          </Link>
          <Link
            href="/admin"
            className="px-8 py-4 rounded-xl border-2 border-slate-500 hover:border-court-400 text-slate-300 hover:text-white font-display font-semibold text-lg transition"
          >
            Admin
          </Link>
        </div>

        <p className="text-sm text-slate-500 pt-4">
          No login required to view live scores
        </p>
      </div>
    </main>
  );
}
