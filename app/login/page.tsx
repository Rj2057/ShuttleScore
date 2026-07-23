"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-court-400 hover:text-court-300 mb-6 font-display">
          ← Back to Home
        </Link>
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 shadow-xl">
          <h1 className="font-display text-2xl font-bold text-white mb-2">Log in</h1>
          <p className="text-slate-400 text-sm mb-6">Manage your tournaments</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-court-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-court-500"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-court-600 hover:bg-court-500 text-white font-display font-semibold disabled:opacity-50 transition"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p className="text-slate-400 text-sm text-center mt-4">
            No account?{" "}
            <Link href="/register" className="text-court-400 hover:text-court-300">
              Register
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
