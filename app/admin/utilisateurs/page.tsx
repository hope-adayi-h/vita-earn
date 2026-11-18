import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminUnlocked, SUPER_ADMIN_EMAIL } from "@/lib/security/admin-lock";
import { getAllUsers } from "@/lib/auth/local-store";
import { UtilisateursClient, type UserItem } from "./UtilisateursClient";

export const metadata = {
  title: "Gestion des Utilisateurs — Administration Vita Earn",
};

export default async function AdminUtilisateursPage() {
  const cookieStore = cookies();
  const supabase = createClient();

  let userEmail = "";
  let isAdmin = false;
  let isSuperAdmin = false;

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      userEmail = user.email || "";
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role === "admin" || user.email === SUPER_ADMIN_EMAIL) {
        isAdmin = true;
        isSuperAdmin = user.email === SUPER_ADMIN_EMAIL;
      }
    }
  } catch {}

  if (!isAdmin) {
    const rawSession = cookieStore.get("vita_session_user")?.value;
    if (rawSession) {
      try {
        const parsed = JSON.parse(rawSession);
        if (parsed.role === "admin" || parsed.email === SUPER_ADMIN_EMAIL) {
          isAdmin = true;
          userEmail = parsed.email || SUPER_ADMIN_EMAIL;
          isSuperAdmin = parsed.email === SUPER_ADMIN_EMAIL;
        }
      } catch {}
    }
  }

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
    <div className="max-w-5xl mx-auto py-4 sm:py-8">
      <UtilisateursClient
        initialUsers={formattedUsers}
        isSuperAdmin={isSuperAdmin}
        currentUserEmail={userEmail}
      />
    </div>
  );
}
