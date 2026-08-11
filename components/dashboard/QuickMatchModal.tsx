"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function QuickMatchModal({ onClose }: { onClose: () => void }) {
  const [team1Name, setTeam1Name] = useState("");
  const [team2Name, setTeam2Name] = useState("");
  const [format, setFormat] = useState("bo1");
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team1Name || !team2Name) return;
    
    setIsCreating(true);
    try {
      const res = await fetch("/api/quick-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team1Name, team2Name, format })
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/referee/${data.matchId}?pin=${data.pin}`);
      } else {
        alert("Failed: " + data.error);
        setIsCreating(false);
      }
    } catch (err) {
      console.error(err);
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-8 font-display">
        <h2 className="text-3xl font-bold text-white mb-2">Quick Match</h2>
        <p className="text-slate-400 mb-8">Start a single match instantly without a full bracket.</p>
        
        <form onSubmit={handleCreate} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-400 mb-2">Player 1 / Team 1</label>
            <input 
              type="text" 
              required
              value={team1Name}
              onChange={(e) => setTeam1Name(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-court-500 transition"
            />
          </div>

          <div className="flex justify-center text-slate-500 font-bold italic">VS</div>

          <div>
            <label className="block text-sm font-bold text-slate-400 mb-2">Player 2 / Team 2</label>
            <input 
              type="text" 
              required
              value={team2Name}
              onChange={(e) => setTeam2Name(e.target.value)}
              placeholder="e.g. Jane Smith"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-court-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-400 mb-2">Format</label>
            <select 
              value={format} 
              onChange={(e) => setFormat(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-court-500 transition appearance-none"
            >
              <option value="bo1">Best of 1 (Single Game)</option>
              <option value="bo3">Best of 3 (Standard Match)</option>
            </select>
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-slate-800">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-transparent text-slate-400 hover:text-white font-bold transition"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isCreating}
              className="px-6 py-3 bg-court-600 hover:bg-court-500 text-white font-bold rounded-xl transition disabled:opacity-50 shadow-lg shadow-court-600/20"
            >
              {isCreating ? "Starting..." : "Start Match Now"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
