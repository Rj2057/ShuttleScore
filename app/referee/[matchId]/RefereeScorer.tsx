"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function RefereeScorer({ initialMatch, pin }: { initialMatch: any, pin: string }) {
  const [match, setMatch] = useState(initialMatch);
  const [isUpdating, setIsUpdating] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // Real-time subscription to stay updated if another device changes the score
    const channel = supabase
      .channel(`match-${match.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "matches",
          filter: `id=eq.${match.id}`,
        },
        (payload) => {
          setMatch((prev: any) => ({ ...prev, ...payload.new }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [match.id, supabase]);

  const updateScore = async (team: 1 | 2, increment: number) => {
    if (isUpdating) return;
    setIsUpdating(true);
    
    const newScore1 = team === 1 ? Math.max(0, match.score1 + increment) : match.score1;
    const newScore2 = team === 2 ? Math.max(0, match.score2 + increment) : match.score2;

    // Optimistic update
    setMatch({ ...match, score1: newScore1, score2: newScore2 });

    // Actually, we need an API endpoint or RPC to securely update the score using the PIN.
    // Standard RLS would block this client-side update because the user isn't logged in as an admin.
    // We will call a dedicated API route that verifies the PIN and updates the score.
    try {
      await fetch(`/api/referee/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: match.id,
          pin,
          score1: newScore1,
          score2: newScore2
        })
      });
    } catch (err) {
      console.error(err);
      // Revert optimistic on error
      setMatch(match);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-slate-950 flex flex-col font-display">
      {/* Header */}
      <div className="bg-slate-900 p-4 border-b border-slate-800 flex items-center justify-between shadow-sm">
        <div>
          <span className="text-court-400 font-bold tracking-widest text-xs uppercase">Live Scoring</span>
          <h1 className="text-white font-semibold text-lg">{match.stage.toUpperCase()} Match</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-court-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-court-500"></span>
          </span>
          <span className="text-xs text-slate-400 uppercase tracking-widest">Connected</span>
        </div>
      </div>

      {/* Scoring Area */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Team 1 */}
        <div className="flex-1 flex flex-col bg-slate-900/50 border-b md:border-b-0 md:border-r border-slate-800">
          <div className="p-4 text-center">
            <h2 className="text-2xl font-bold text-white truncate px-2">{match.team1?.name || "TBD"}</h2>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <button 
              onClick={() => updateScore(1, 1)}
              className="w-full h-full max-h-64 md:max-h-none rounded-3xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 active:scale-95 transition-all flex items-center justify-center group touch-manipulation"
            >
              <span className="text-8xl md:text-9xl font-bold text-white group-active:text-court-400 transition-colors">{match.score1}</span>
            </button>
          </div>
          <div className="p-4 flex justify-center">
             <button 
               onClick={() => updateScore(1, -1)}
               className="px-8 py-3 rounded-full border-2 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 font-bold active:bg-slate-800 touch-manipulation"
             >
               -1 Point
             </button>
          </div>
        </div>

        {/* Team 2 */}
        <div className="flex-1 flex flex-col bg-slate-900/30">
          <div className="p-4 text-center">
            <h2 className="text-2xl font-bold text-white truncate px-2">{match.team2?.name || "TBD"}</h2>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <button 
              onClick={() => updateScore(2, 1)}
              className="w-full h-full max-h-64 md:max-h-none rounded-3xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 active:scale-95 transition-all flex items-center justify-center group touch-manipulation"
            >
              <span className="text-8xl md:text-9xl font-bold text-white group-active:text-court-400 transition-colors">{match.score2}</span>
            </button>
          </div>
          <div className="p-4 flex justify-center">
             <button 
               onClick={() => updateScore(2, -1)}
               className="px-8 py-3 rounded-full border-2 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 font-bold active:bg-slate-800 touch-manipulation"
             >
               -1 Point
             </button>
          </div>
        </div>
      </div>
      
      {/* Footer Controls */}
      <div className="bg-slate-900 p-4 border-t border-slate-800 flex justify-between gap-4">
         <button className="flex-1 py-4 bg-slate-800 rounded-xl text-white font-bold hover:bg-slate-700">End Game</button>
         <button className="flex-1 py-4 bg-court-600 rounded-xl text-white font-bold hover:bg-court-500">Complete Match</button>
      </div>
    </div>
  );
}
