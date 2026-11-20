import { redirect } from "next/navigation";
import { isAdminUnlocked, checkAdminSession } from "@/lib/security/admin-lock";
import { getLomeServerTime } from "@/lib/utils/lome-time";
import { fetchAndSyncDailyTasks, StoredDailyTask } from "@/lib/data/tasks-store";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { AdminTachesClient } from "./AdminTachesClient";

export const metadata = {
  title: "Gestion des Tâches Quotidiennes — Administration Vita Earn",
};

export default async function AdminTasksPage() {
  const { isAdmin, isSuperAdmin, userEmail } = await checkAdminSession();

  if (!isAdmin) {
    redirect("/auth/login?redirect=/admin/taches");
  }

  const unlocked = await isAdminUnlocked();
  if (!unlocked) {
    redirect("/admin/lock");
  }

  // 1. Calcul strict du temps officiel serveur Lomé (Africa/Lome, UTC+0)
  const lomeTime = getLomeServerTime();

  // 2. Récupération des tâches synchronisées (Supabase platform_settings + local store)
  const tasks: StoredDailyTask[] = await fetchAndSyncDailyTasks();

  return (
    <div className="max-w-5xl mx-auto py-3 sm:py-6 space-y-6 px-4">
      <AdminNavbar
        userEmail={userEmail}
        isSuperAdmin={isSuperAdmin}
      />
      <AdminTachesClient
        initialTasks={tasks}
        lomeTime={lomeTime}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  );
}
