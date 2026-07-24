"use client";

import { useState } from "react";
import SmartBuilder from "@/components/tournament/SmartBuilder";
import MatchManager from "@/components/tournament/MatchManager";

export default function DashboardTabs({ tournamentId, initialMatches, teams }: { tournamentId: string, initialMatches: any[], teams: any[] }) {
  const [activeTab, setActiveTab] = useState<"matches" | "builder">("matches");

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-800 mb-8">
        <button
          onClick={() => setActiveTab("matches")}
          className={`px-6 py-3 font-semibold text-sm transition border-b-2 ${
            activeTab === "matches"
              ? "border-court-500 text-court-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Matches & Scoring
        </button>
        <button
          onClick={() => setActiveTab("builder")}
          className={`px-6 py-3 font-semibold text-sm transition border-b-2 ${
            activeTab === "builder"
              ? "border-court-500 text-court-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          AI Architect Builder
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === "matches" && (
          <MatchManager tournamentId={tournamentId} initialMatches={initialMatches} teams={teams} />
        )}
        
        {activeTab === "builder" && (
          <div className="max-w-3xl mx-auto">
            <SmartBuilder tournamentId={tournamentId} />
          </div>
        )}
      </div>
    </div>
  );
}
