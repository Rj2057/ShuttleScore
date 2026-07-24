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
          <h1 className="font-display text-3xl font-bold text-white">My Tournaments</h1>
          <p className="text-slate-400 mt-1">Create, manage, and share live scoreboards</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowQuickMatch(true)}
            className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-display font-semibold transition"
          >
            Create Quick Match
          </button>
          <Link
            href="/dashboard/create"
            className="px-5 py-2.5 rounded-lg bg-court-600 hover:bg-court-500 text-white font-display font-semibold transition"
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
