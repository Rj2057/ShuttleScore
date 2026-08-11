"use client";

import { useState } from "react";
import MatchManager from "@/components/tournament/MatchManager";

export default function DashboardTabs({ tournamentId, initialMatches, teams }: { tournamentId: string, initialMatches: any[], teams: any[] }) {
  const [activeTab, setActiveTab] = useState<"matches">("matches");

  return (
    <div>
      <div className="mb-6 border-b border-slate-800">
        <div className="inline-flex px-4 py-2 rounded-t-lg border border-b-0 border-slate-800 bg-slate-900 text-court-400 font-semibold text-sm">
          Matches & Scoring
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        <MatchManager tournamentId={tournamentId} initialMatches={initialMatches} teams={teams} />
      </div>
    </div>
  );
}
