"use client";

import { useState } from "react";

export function DynamicStageRenderer({ tournamentData }: { tournamentData: any }) {
  const { teams, stages, groups } = tournamentData;
  const [activeStageId, setActiveStageId] = useState<string>(stages?.[0]?.id);

  if (!stages || stages.length === 0) {
    return <div className="text-slate-400">No stages generated.</div>;
  }

  const activeStage = stages.find((s: any) => s.id === activeStageId);

  const getTeamName = (teamId: string) => {
    if (!teamId) return "TBD";
    const team = teams.find((t: any) => t.id === teamId);
    return team ? team.name : teamId;
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden font-display shadow-2xl">
      {/* Stage Navigation */}
      <div className="flex overflow-x-auto bg-slate-950 border-b border-slate-800 custom-scrollbar hide-scrollbar-on-mobile">
        {stages.map((stage: any, idx: number) => (
          <button
            key={stage.id}
            onClick={() => setActiveStageId(stage.id)}
            className={`px-6 py-4 font-bold text-sm whitespace-nowrap transition-all border-b-2 ${
              activeStageId === stage.id
                ? "border-court-500 text-court-400 bg-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/50"
            }`}
          >
            {idx + 1}. {stage.name}
          </button>
        ))}
        {groups && groups.length > 0 && (
          <button
            onClick={() => setActiveStageId("groups")}
            className={`px-6 py-4 font-bold text-sm whitespace-nowrap transition-all border-b-2 ${
              activeStageId === "groups"
                ? "border-court-500 text-court-400 bg-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/50"
            }`}
          >
            Groups Overview
          </button>
        )}
      </div>

      {/* Stage Content */}
      <div className="p-6 overflow-x-auto">
        {activeStageId === "groups" ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
             {groups.map((g: any) => (
               <div key={g.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                 <h3 className="text-white font-bold text-lg mb-1">{g.name}</h3>
                 <p className="text-xs text-slate-400 mb-4">Capacity: {g.capacity} teams</p>
                 <div className="space-y-2">
                   {/* In a real scenario, we'd list assigned teams here */}
                   <div className="text-sm text-slate-500 italic">Waiting for stage completion...</div>
                 </div>
               </div>
             ))}
          </div>
        ) : (
          <div className="flex gap-8 justify-start items-center min-w-max">
            <div className="space-y-4">
              {activeStage?.matches?.map((match: any, i: number) => (
                <div key={match.id} className="flex items-center gap-4">
                  <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden w-64 shadow-md">
                    <div className="px-4 py-3 border-b border-slate-700 flex justify-between items-center text-sm">
                      <span className="font-semibold text-slate-200">{getTeamName(match.team1_id)}</span>
                    </div>
                    <div className="px-4 py-3 flex justify-between items-center text-sm bg-slate-800/80">
                      <span className="font-semibold text-slate-200">{getTeamName(match.team2_id)}</span>
                    </div>
                  </div>
                  
                  {/* Visual logic path indicators */}
                  {(match.winner_goes_to || match.loser_goes_to) && (
                    <div className="text-xs text-slate-500 flex flex-col gap-1">
                      {match.winner_goes_to && (
                        <div className="flex items-center gap-1 text-emerald-400/80">
                          <span>W ➔</span>
                          <span>{match.winner_goes_to.replace(/_/g, ' ')}</span>
                        </div>
                      )}
                      {match.loser_goes_to && (
                        <div className="flex items-center gap-1 text-red-400/80">
                          <span>L ➔</span>
                          <span>{match.loser_goes_to.replace(/_/g, ' ')}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
