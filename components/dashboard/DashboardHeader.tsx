"use client";

import { useState } from "react";
import Link from "next/link";
import QuickMatchModal from "./QuickMatchModal";

export default function DashboardHeader() {
  const [showQuickMatch, setShowQuickMatch] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Shuttle Score Pro</h1>
          <p className="text-slate-400 mt-1">Create tournaments and keep scores live</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowQuickMatch(true)}
            className="w-full sm:w-auto px-5 py-3 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-display font-semibold transition"
          >
            Create Quick Match
          </button>
          <Link
            href="/dashboard/create"
            className="w-full sm:w-auto px-5 py-3 rounded-full bg-court-600 hover:bg-court-500 text-white font-display font-semibold transition text-center"
          >
            + New Tournament
          </Link>
        </div>
      </div>

      {showQuickMatch && (
        <QuickMatchModal onClose={() => setShowQuickMatch(false)} />
      )}
    </>
  );
}
