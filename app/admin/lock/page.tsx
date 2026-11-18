import { redirect } from "next/navigation";
import {
  isAdminUnlocked,
  getCurrentHourlyInfo,
  SUPER_ADMIN_EMAIL,
  checkAdminSession,
} from "@/lib/security/admin-lock";
import { AdminLockClient } from "./AdminLockClient";

export const metadata = {
  title: "Sas de Sécurité Administrateur — Vita Earn",
};

export default async function AdminLockPage() {
  // Si la session est DÉJÀ déverrouillée, aller directement sur /admin
  const unlocked = await isAdminUnlocked();
  if (unlocked) {
    redirect("/admin");
  }

  const { userEmail } = await checkAdminSession();
  const hourlyInfo = getCurrentHourlyInfo();

  return (
    <AdminLockClient
      userEmail={userEmail || SUPER_ADMIN_EMAIL}
      minutesRemaining={hourlyInfo?.minutesRemaining || 60}
      currentHourlyCode={hourlyInfo?.code || "VITA26"}
    />
  );
}
