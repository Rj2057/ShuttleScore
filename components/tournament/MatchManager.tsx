"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import LiveScorer from "./LiveScorer";
import EditMatchModal from "./EditMatchModal";
import { createClient } from "@/lib/supabase/client";

export default function MatchManager({ tournamentId, initialMatches, teams }: { tournamentId: string, initialMatches: any[], teams: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [matches, setMatches] = useState(initialMatches);

  useEffect(() => {
    setMatches(initialMatches);
  }, [initialMatches]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`matches-manager-${tournamentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "matches",
          filter: `tournament_id=eq.${tournamentId}`,
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tournamentId, router]);
  const [activeMatch, setActiveMatch] = useState<any | null>(null);
  const [editingMatch, setEditingMatch] = useState<any | null>(null);

  // Group matches by stage for better display
  const groupedMatches = matches.reduce((acc, m) => {
    const stage = m.stage || "other";
    if (!acc[stage]) acc[stage] = [];
    acc[stage].push(m);
    return acc;
  }, {} as Record<string, any[]>);

  const handleGeneratePin = async (matchId: string) => {
    // Generate a simple 6 digit PIN
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    try {
      const res = await fetch(`/api/matches/${matchId}/pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (res.ok) {
        setMatches(matches.map(m => m.id === matchId ? { ...m, referee_pin: pin } : m));
        router.refresh();
      }
    } catch (e) {
      console.error("Failed to generate pin", e);
    }
  };

  const handleCloseScorer = () => {
    setActiveMatch(null);
    router.push(`/dashboard/${tournamentId}?tab=matches`);
    router.refresh(); // Refresh data to show latest scores and statuses
  };

  return (
    <div className="space-y-8">
      {/* Live Scorer Modal */}
      {activeMatch && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <LiveScorer 
            match={activeMatch} 
            onClose={handleCloseScorer} 
          />
        </div>
      )}

      {/* Edit Match Modal */}
      {editingMatch && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <EditMatchModal 
            match={editingMatch}
            teams={teams}
            onClose={() => setEditingMatch(null)}
            onUpdate={() => {
              setEditingMatch(null);
              router.refresh();
            }}
          />
        </div>
      )}

      {Object.keys(groupedMatches).length === 0 ? (
        <div className="text-center p-12 border border-dashed border-slate-700 rounded-xl text-slate-500">
          No matches found. Switch to the AI Architect Builder tab to generate a tournament.
        </div>
      ) : (
        Object.entries(groupedMatches).map(([stage, stageMatches]) => (
          <div key={stage} className="bg-slate-900 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-slate-800/50 px-6 py-4 border-b border-slate-700">
              <h3 className="text-lg font-bold text-white capitalize">{stage}</h3>
            </div>
            
            <div className="divide-y divide-slate-700/50">
              {stageMatches.map((m) => (
                <div key={m.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  {/* Match Info */}
                  <div className="flex-1 flex flex-col md:flex-row items-center gap-4">
                    <div className="flex-1 text-center md:text-right">
                      <p className="text-lg font-bold text-white">{m.team1?.name || "TBD"}</p>
                    </div>
                    
                    <div className="px-6 py-2 bg-slate-950 rounded-xl border border-slate-800 text-center min-w-[120px]">
                      <div className="text-2xl font-black text-court-400">
                        {m.score1} - {m.score2}
                      </div>
                      <div className={`text-xs mt-1 font-bold ${
                        m.status === 'live' ? 'text-green-400' : 
                        m.status === 'completed' ? 'text-slate-500' : 'text-yellow-400'
                      }`}>
                        {m.status.toUpperCase()}
                      </div>
                    </div>

                    <div className="flex-1 text-center md:text-left">
                      <p className="text-lg font-bold text-white">{m.team2?.name || "TBD"}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-center gap-3 md:w-80">
                    <button 
                      onClick={() => setEditingMatch(m)}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold rounded-lg transition"
                      title="Edit Match Architecture"
                    >
                      Edit
                    </button>

                    <button 
                      onClick={() => setActiveMatch(m)}
                      disabled={m.status === 'completed' || !m.team1_id || !m.team2_id}
                      className="px-4 py-2 bg-court-600 hover:bg-court-500 text-white text-sm font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {m.status === 'live' ? 'Resume Scoring' : 'Start Match'}
                    </button>

                    {m.referee_pin ? (
                      <div className="text-center bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Referee PIN</p>
                        <p className="font-mono text-court-400 font-bold tracking-widest">{m.referee_pin}</p>
                        <Link 
                          href={`/referee/${m.id}?pin=${m.referee_pin}`} 
                          target="_blank"
                          className="text-[10px] text-slate-400 hover:text-white underline mt-1 block"
                        >
                          Open Link
                        </Link>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleGeneratePin(m.id)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg transition"
                      >
                        Gen PIN
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
