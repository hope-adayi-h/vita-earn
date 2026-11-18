import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import {
  isAdminUnlocked,
  getCurrentHourlyInfo,
  SUPER_ADMIN_EMAIL,
} from "@/lib/security/admin-lock";
import { AdminLockClient } from "./AdminLockClient";

export const metadata = {
  title: "Sas de Sécurité Administrateur — Vita Earn",
};

export default async function AdminLockPage() {
  const cookieStore = cookies();
  const supabase = createClient();

  let userEmail = "";
  let isAdmin = false;

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
      }
    }
  } catch {}

  // Fallback local session
  if (!isAdmin) {
    const rawSession = cookieStore.get("vita_session_user")?.value;
    if (rawSession) {
      try {
        const parsed = JSON.parse(rawSession);
        if (parsed.role === "admin" || parsed.email === SUPER_ADMIN_EMAIL) {
          isAdmin = true;
          userEmail = parsed.email || SUPER_ADMIN_EMAIL;
        }
      } catch {}
    }
  }

  // Si l'utilisateur n'est pas connecté, rediriger vers la connexion
  if (!isAdmin) {
    redirect("/auth/login?redirect=/admin");
  }

  // Si la session est DÉJÀ déverrouillée, aller directement sur /admin
  const unlocked = await isAdminUnlocked();
  if (unlocked) {
    redirect("/admin");
  }

  const hourlyInfo = getCurrentHourlyInfo();

  return (
    <AdminLockClient
      userEmail={userEmail || SUPER_ADMIN_EMAIL}
      minutesRemaining={hourlyInfo?.minutesRemaining || 60}
      currentHourlyCode={hourlyInfo?.code || "VITA26"}
    />
  );
}
