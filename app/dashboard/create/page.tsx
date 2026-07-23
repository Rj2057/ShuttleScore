"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils/slug";
import type { MatchFormat } from "@/types/database";

export default function CreateTournamentPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [season, setSeason] = useState("");
  const [pointsToWin, setPointsToWin] = useState(21);
  const [winMargin, setWinMargin] = useState(2);
  const [matchFormat, setMatchFormat] = useState<MatchFormat>("bo1");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    if (!slug || slug === slugify(name)) {
      setSlug(slugify(value));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in.");
      setLoading(false);
      return;
    }

    const finalSlug = slugify(slug || name);
    if (!finalSlug) {
      setError("Please enter a valid tournament name.");
      setLoading(false);
      return;
    }

    const today = new Date().toISOString().slice(0, 10);

    const { data, error: insertError } = await supabase
      .from("tournaments")
      .insert({
        organizer_id: user.id,
        name: name.trim(),
        slug: finalSlug,
        season: season.trim(),
        start_date: today,
        end_date: today,
        is_public: true,
        settings: {
          points_to_win: pointsToWin,
          win_margin: winMargin,
          max_points: 30,
          match_format: matchFormat,
          win_mode: "target_score",
        },
      })
      .select("id")
      .single();

    setLoading(false);

    if (insertError) {
      if (insertError.code === "23505") {
        setError("This URL slug is already taken. Try a different name.");
      } else {
        setError(insertError.message);
      }
      return;
    }

    router.push(`/dashboard/${data.id}/scores`);
  }

  return (
    <div className="max-w-lg">
      <Link href="/dashboard" className="text-court-400 hover:text-court-300 text-sm font-display mb-4 inline-block">
        ← Back
      </Link>
      <h1 className="font-display text-3xl font-bold text-white mb-2">Create Tournament</h1>
      <p className="text-slate-400 text-sm mb-6">Manual setup — AI builder coming next</p>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-700 bg-slate-800/80 p-6">
        <div>
          <label className="block text-sm text-slate-400 mb-1">Tournament name</label>
          <input
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-600 text-white focus:outline-none focus:border-court-500"
            placeholder="PG Badminton Open 2026"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1">URL slug</label>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-sm">/t/</span>
            <input
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              required
              className="flex-1 px-4 py-3 rounded-lg bg-slate-900 border border-slate-600 text-white font-mono text-sm focus:outline-none focus:border-court-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1">Season (optional)</label>
          <input
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-600 text-white focus:outline-none focus:border-court-500"
            placeholder="Season 1"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Points to win</label>
            <input
              type="number"
              min={1}
              value={pointsToWin}
              onChange={(e) => setPointsToWin(parseInt(e.target.value) || 21)}
              className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-600 text-white focus:outline-none focus:border-court-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Win margin</label>
            <input
              type="number"
              min={1}
              value={winMargin}
              onChange={(e) => setWinMargin(parseInt(e.target.value) || 2)}
              className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-600 text-white focus:outline-none focus:border-court-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1">Match format</label>
          <select
            value={matchFormat}
            onChange={(e) => setMatchFormat(e.target.value as MatchFormat)}
            className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-600 text-white focus:outline-none focus:border-court-500"
          >
            <option value="bo1">Best of 1</option>
            <option value="bo3">Best of 3</option>
          </select>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg bg-court-600 hover:bg-court-500 text-white font-display font-semibold disabled:opacity-50 transition"
        >
          {loading ? "Creating…" : "Create Tournament"}
        </button>
      </form>
    </div>
  );
}
