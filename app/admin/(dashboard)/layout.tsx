import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminNav from "../AdminNav";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: admin } = await supabase
    .from("admin_users")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!admin) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=not_admin");
  }

  return (
    <div className="min-h-screen">
      <AdminNav />
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
