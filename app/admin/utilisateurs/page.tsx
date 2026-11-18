import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminUnlocked, checkAdminSession } from "@/lib/security/admin-lock";
import { getAllUsers } from "@/lib/auth/local-store";
import { UtilisateursClient, type UserItem } from "./UtilisateursClient";
import { AdminNavbar } from "@/components/admin/AdminNavbar";

export const metadata = {
  title: "Gestion des Utilisateurs — Administration Vita Earn",
};

export default async function AdminUtilisateursPage({
  searchParams,
}: {
  searchParams?: { filter?: string };
}) {
  const { isAdmin, isSuperAdmin, userEmail } = await checkAdminSession();

  if (!isAdmin) {
    redirect("/auth/login?redirect=/admin/utilisateurs");
  }

  const unlocked = await isAdminUnlocked();
  if (!unlocked) {
    redirect("/admin/lock");
  }

  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

  let formattedUsers: UserItem[] = [];

  if (isConfigured) {
    try {
      const adminClient = createAdminClient();
      const { data: profiles } = await adminClient
        .from("profiles")
        .select("id, full_name, email, phone, role, is_activated, referral_code, created_at")
        .order("created_at", { ascending: false });

      if (profiles && profiles.length > 0) {
        formattedUsers = profiles.map((p) => ({
          id: p.id,
          name: p.full_name || p.email?.split("@")[0] || "Membre",
          username: p.full_name?.toLowerCase().replace(/\s+/g, "") || "user",
          email: p.email || "",
          phone: p.phone || "",
          country: "Togo",
          role: p.role || "user",
          isActivated: Boolean(p.is_activated),
          referralCode: p.referral_code,
          createdAt: p.created_at,
        }));
      }
    } catch {}
  }

  if (formattedUsers.length === 0) {
    const localUsers = getAllUsers();
    formattedUsers = localUsers.map((u) => ({
      id: u.id,
      name: u.username,
      username: u.username.toLowerCase(),
      email: u.email,
      phone: u.phone,
      country: u.country,
      role: u.role,
      isActivated: u.isActivated,
      referralCode: "VE-ESPOIR",
      createdAt: u.createdAt,
    }));
  }

  return (
    <div className="max-w-5xl mx-auto py-3 sm:py-6 space-y-6">
      <AdminNavbar
        userEmail={userEmail}
        isSuperAdmin={isSuperAdmin}
      />
      <UtilisateursClient
        initialUsers={formattedUsers}
        isSuperAdmin={isSuperAdmin}
        currentUserEmail={userEmail}
        initialFilter={
          searchParams?.filter === "activated" ||
          searchParams?.filter === "pending" ||
          searchParams?.filter === "admin"
            ? searchParams.filter
            : "all"
        }
      />
    </div>
  );
}
