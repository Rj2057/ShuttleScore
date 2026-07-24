import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-4xl w-full text-center space-y-8">
        <h1 className="font-display text-5xl md:text-7xl font-bold text-white drop-shadow-lg tracking-tight">
          ShuttleScore Pro
        </h1>
        <h2 className="font-display text-2xl md:text-4xl font-semibold text-court-400 max-w-2xl mx-auto leading-relaxed">
          The all-in-one tournament platform. Create, manage, and broadcast your badminton tournaments in real-time.
        </h2>
        <p className="text-xl text-slate-300">
          Powered by AI generation and real-time live scoring.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Link
            href="/dashboard"
            className="px-8 py-4 rounded-xl bg-court-500 hover:bg-court-600 text-white font-display font-semibold text-lg shadow-lg hover:shadow-court-500/30 transition"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/t"
            className="px-8 py-4 rounded-xl border-2 border-slate-500 hover:border-court-400 text-slate-300 hover:text-white font-display font-semibold text-lg transition"
          >
            Find a Tournament
          </Link>
        </div>

        <div className="pt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-2">Multi-Tenant Setup</h3>
            <p className="text-slate-400">Host multiple tournaments under one account. Public URLs for viewers.</p>
          </div>
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-2">Smart AI Builder</h3>
            <p className="text-slate-400">Generate complex brackets and group stages with a single click using our AI integration.</p>
          </div>
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-2">Referee Scoring</h3>
            <p className="text-slate-400">Generate secure, single-match PINs for court-side referees to score games on their phones.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
