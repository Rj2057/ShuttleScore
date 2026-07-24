"use client";

import { useState } from "react";

export default function LiveScorer({ match, onClose }: { match: any, onClose: () => void }) {
  const [score1, setScore1] = useState(match.score1 || 0);
  const [score2, setScore2] = useState(match.score2 || 0);
  const [history, setHistory] = useState<{s1: number, s2: number}[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  const syncScore = async (newS1: number, newS2: number, status: string = 'live') => {
    setIsUpdating(true);
    try {
      await fetch(`/api/matches/${match.id}/update-score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score1: newS1, score2: newS2, status })
      });
    } catch (e) {
      console.error("Failed to sync score", e);
    }
    setIsUpdating(false);
  };

  const handlePoint = (team: 1 | 2) => {
    setHistory([...history, { s1: score1, s2: score2 }]);
    const newS1 = team === 1 ? score1 + 1 : score1;
    const newS2 = team === 2 ? score2 + 1 : score2;
    setScore1(newS1);
    setScore2(newS2);
    syncScore(newS1, newS2);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    setHistory(history.slice(0, -1));
    setScore1(lastState.s1);
    setScore2(lastState.s2);
    syncScore(lastState.s1, lastState.s2);
  };

  const handleFinish = async () => {
    const winnerId = score1 > score2 ? match.team1_id : match.team2_id;
    setIsUpdating(true);
    try {
      await fetch(`/api/matches/${match.id}/update-score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed", winner_id: winnerId })
      });
    } catch (e) {
      console.error("Failed to finish match", e);
    }
    setIsUpdating(false);
    onClose();
  };

  return (
    <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden font-display flex flex-col h-[80vh] max-h-[600px]">
      
      {/* Header */}
      <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white capitalize">{match.stage} Match</h2>
          <p className="text-sm text-slate-400">Live Scoring</p>
        </div>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition rounded-full hover:bg-slate-800">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Score Board Area */}
      <div className="flex-1 flex flex-col md:flex-row items-stretch p-6 gap-6 relative">
        {/* Team 1 Side */}
        <button 
          onClick={() => handlePoint(1)}
          disabled={isUpdating}
          className="flex-1 bg-slate-800 hover:bg-slate-700 active:bg-court-600 transition rounded-2xl flex flex-col items-center justify-center border-4 border-transparent hover:border-court-500/50 group"
        >
          <div className="text-2xl md:text-4xl font-bold text-white mb-4 group-hover:scale-105 transition">
            {match.team1?.name || "Team A"}
          </div>
          <div className="text-7xl md:text-9xl font-black text-court-400 font-mono tracking-tighter">
            {score1}
          </div>
          <div className="mt-8 text-slate-400 font-bold tracking-widest text-sm opacity-50 group-hover:opacity-100 transition">
            TAP TO ADD POINT
          </div>
        </button>

        {/* Divider / VS */}
        <div className="flex items-center justify-center">
          <div className="px-4 py-2 bg-slate-950 rounded-full font-black text-slate-600 border border-slate-800">VS</div>
        </div>

        {/* Team 2 Side */}
        <button 
          onClick={() => handlePoint(2)}
          disabled={isUpdating}
          className="flex-1 bg-slate-800 hover:bg-slate-700 active:bg-court-600 transition rounded-2xl flex flex-col items-center justify-center border-4 border-transparent hover:border-court-500/50 group"
        >
          <div className="text-2xl md:text-4xl font-bold text-white mb-4 group-hover:scale-105 transition">
            {match.team2?.name || "Team B"}
          </div>
          <div className="text-7xl md:text-9xl font-black text-court-400 font-mono tracking-tighter">
            {score2}
          </div>
          <div className="mt-8 text-slate-400 font-bold tracking-widest text-sm opacity-50 group-hover:opacity-100 transition">
            TAP TO ADD POINT
          </div>
        </button>
      </div>

      {/* Controls */}
      <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center">
        <button 
          onClick={handleUndo}
          disabled={history.length === 0 || isUpdating}
          className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
          Undo Last Point
        </button>

        <button 
          onClick={handleFinish}
          disabled={isUpdating}
          className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-black tracking-widest rounded-xl transition shadow-lg shadow-red-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          FINISH MATCH
        </button>
      </div>
    </div>
  );
}
