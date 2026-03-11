"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const nav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/matches", label: "Matches" },
  { href: "/admin/teams", label: "Teams" },
  { href: "/admin/tournament", label: "Tournament" },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-700">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-display font-semibold text-court-400">
            ← Home
          </Link>
          <nav className="flex gap-2 flex-wrap">
            {nav.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  pathname === href
                    ? "bg-court-600 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-700"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <button
          onClick={logout}
          className="px-3 py-1 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-700"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
