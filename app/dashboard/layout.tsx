import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-700 bg-slate-900/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
          <Link href="/dashboard" className="font-display text-xl font-bold text-court-400">
            ShuttleScore
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/dashboard" className="text-slate-300 hover:text-white">
              My Tournaments
            </Link>
            <Link href="/dashboard/create" className="text-slate-300 hover:text-white">
              Create
            </Link>
            <span className="text-slate-500 hidden sm:inline">
              {profile?.display_name || user.email}
            </span>
            <form action="/auth/signout" method="post">
              <button type="submit" className="text-slate-400 hover:text-white">
                Log out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
