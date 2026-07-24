"use client";

import { useState } from "react";

export default function EditMatchModal({ 
  match, 
  teams, 
  onClose,
  onUpdate
}: { 
  match: any, 
  teams: any[], 
  onClose: () => void,
  onUpdate: () => void
}) {
  const [team1Id, setTeam1Id] = useState(match.team1_id || "");
  const [team2Id, setTeam2Id] = useState(match.team2_id || "");
  const [stage, setStage] = useState(match.stage || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch(`/api/matches/${match.id}/update-score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          team1_id: team1Id || null, 
          team2_id: team2Id || null, 
          stage 
        })
      });
      onUpdate();
    } catch (e) {
      console.error(e);
    }
    setIsSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this match? This cannot be undone.")) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/matches/${match.id}/delete`, {
        method: "DELETE"
      });
      onUpdate();
    } catch (e) {
      console.error(e);
    }
    setIsDeleting(false);
    onClose();
  };

  return (
    <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-6 font-display">
      <h2 className="text-2xl font-bold text-white mb-6">Edit Match</h2>
      
      <div className="space-y-4 mb-8">
        <div>
          <label className="block text-sm font-bold text-slate-400 mb-2">Stage / Name</label>
          <input 
            type="text" 
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-court-500 transition"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-400 mb-2">Team 1</label>
          <select 
            value={team1Id} 
            onChange={(e) => setTeam1Id(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-court-500 transition appearance-none"
          >
            <option value="">TBD (To Be Decided)</option>
            {teams.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-400 mb-2">Team 2</label>
          <select 
            value={team2Id} 
            onChange={(e) => setTeam2Id(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-court-500 transition appearance-none"
          >
            <option value="">TBD (To Be Decided)</option>
            {teams.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-slate-800">
        <button 
          onClick={handleDelete}
          disabled={isSaving || isDeleting}
          className="text-red-400 hover:text-red-300 text-sm font-bold transition disabled:opacity-50"
        >
          {isDeleting ? "Deleting..." : "Delete Match"}
        </button>
        
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving || isDeleting}
            className="px-4 py-2 bg-court-600 hover:bg-court-500 text-white font-bold rounded-lg transition disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
