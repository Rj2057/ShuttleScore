"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [configOk, setConfigOk] = useState<boolean | null>(null);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    setConfigOk(Boolean(url && key && url.startsWith("https") && key.startsWith("eyJ")));
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "not_admin") {
      setError("Login worked but you're not an admin. Run this in Supabase SQL Editor: INSERT INTO admin_users (id) SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL';");
    }
  }, []);

  async function clearSessionAndRetry() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setError("");
    window.location.href = "/admin/login";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      setError("Missing Supabase config. Check .env.local");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (data?.user) {
        // Full page reload ensures cookies are sent to server (fixes redirect loop)
        window.location.href = "/admin";
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Network error. Clear cookies for localhost and try again.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-court-400 hover:text-court-300 mb-6 font-display">
          ← Back to Home
        </Link>
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 shadow-xl">
          <h1 className="font-display text-2xl font-bold text-white mb-6">
            Admin Login
          </h1>
          {configOk === false && (
            <div className="mb-4 p-3 rounded-lg bg-amber-900/50 border border-amber-700 text-amber-200 text-sm">
              Config issue: Use <strong>Anon Key (Legacy)</strong> from Supabase (starts with eyJ). Restart dev server after changing .env.local.
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-court-500"
                placeholder="admin@example.com"
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
            {error && (
              <div className="space-y-2">
                <p className="text-red-400 text-sm">{error}</p>
                <button
                  type="button"
                  onClick={clearSessionAndRetry}
                  className="text-xs text-slate-400 hover:text-white underline"
                >
                  Clear session & reload
                </button>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-court-600 hover:bg-court-500 text-white font-display font-semibold disabled:opacity-50 transition"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
