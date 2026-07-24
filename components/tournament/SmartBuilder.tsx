"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DynamicStageRenderer } from "@/components/bracket/DynamicStageRenderer";

export default function SmartBuilder({ tournamentId }: { tournamentId: string }) {
  const [prompt, setPrompt] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  
  const router = useRouter();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && files.length === 0) return;
    setIsGenerating(true);
    setError(null);
    try {
      let finalPrompt = prompt;

      // 1. If files exist, parse them first
      if (files.length > 0) {
        let combinedPdfText = "";
        for (const f of files) {
          const formData = new FormData();
          formData.append("file", f);
          const fileRes = await fetch("/api/parse-pdf", {
            method: "POST",
            body: formData,
          });
          const fileData = await fileRes.json();
          if (!fileRes.ok) throw new Error(fileData.error || `Failed to parse PDF: ${f.name}`);
          combinedPdfText += `\n\n--- Document: ${f.name} ---\n${fileData.text}`;
        }
        
        finalPrompt = `Tournament Rules (from uploaded documents):\n${combinedPdfText}\n\nAdditional Instructions:\n${prompt}`;
      }

      // 2. Send combined prompt to AI Architect
      const res = await fetch("/api/ai-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: finalPrompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate tournament structure");
      
      setPreviewData(data.tournament); // Notice we expect an entire tournament structure now
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!previewData) return;
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/apply-architecture`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournamentData: previewData.tournament || previewData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save architecture");
      
      alert("Tournament successfully generated and saved to the database!");
      router.push(`/dashboard/${tournamentId}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-xl font-display">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 bg-gradient-to-br from-court-400 to-court-600 rounded-xl flex items-center justify-center shadow-lg">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">AI Tournament Architect</h2>
          <p className="text-sm text-slate-400">Describe your complex rules or upload a PDF rulebook.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
           <label className="block text-sm text-slate-400 mb-2">Upload Rules (PDFs)</label>
           <input 
             type="file" 
             accept="application/pdf"
             multiple
             onChange={handleFileUpload}
             className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-court-500/20 file:text-court-400 hover:file:bg-court-500/30 transition cursor-pointer"
           />
           {files.length > 0 && (
             <p className="text-xs text-court-400 mt-2">{files.length} file(s) selected.</p>
           )}
        </div>
        
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Paste teams or type custom rules here... e.g.&#10;20 teams (Team A to T). Round 1 matches create 10 winners. 10 losers play a losers round..."
          className="w-full h-32 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-court-500 resize-none"
        />

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm break-words">
            {error}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={isGenerating || (!prompt.trim() && files.length === 0)}
          className="w-full py-3 bg-white hover:bg-slate-200 text-slate-900 font-bold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? "Architecting Tournament..." : "Generate Tournament Structure"}
        </button>

        {previewData && (
          <div className="mt-8 border-t border-slate-700 pt-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-court-400">✓</span> Architecture Generated!
            </h3>
            <DynamicStageRenderer tournamentData={previewData.tournament || previewData} />
            
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="mt-6 w-full py-3 bg-court-600 hover:bg-court-500 text-white font-bold rounded-xl transition shadow-lg shadow-court-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving to Database..." : "Apply Architecture & Create Bracket"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
