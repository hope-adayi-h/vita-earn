import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { isAdminUnlocked, checkAdminSession } from "@/lib/security/admin-lock";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { fetchAndSyncPremiumApps } from "@/lib/data/premium-apps-store";
import { AdminApplicationsClient } from "./AdminApplicationsClient";

export const metadata = {
  title: "Applications Premium — Administration Vita Earn",
};

export const dynamic = "force-dynamic";

export default async function AdminApplicationsPage() {
  const { isAdmin, isSuperAdmin, userEmail } = await checkAdminSession();

  if (!isAdmin) {
    redirect("/auth/login?redirect=/admin/applications");
  }

  const unlocked = await isAdminUnlocked();
  if (!unlocked) {
    redirect("/admin/lock");
  }

  const apps = await fetchAndSyncPremiumApps();

  return (
    <div className="space-y-6">
      <AdminNavbar userEmail={userEmail} isSuperAdmin={isSuperAdmin} />

      <div>
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
          <Link href="/admin" className="hover:text-[#0084FF] flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Tableau de bord</span>
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">Applications Premium</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Gestion des Applications Premium
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Configurez le lien de destination de chaque application (Netflix Premium, Vita Canal+, Gemini Pro 12 mois, Telegram).
        </p>
      </div>

      <AdminApplicationsClient initialApps={apps} />
    </div>
  );
}
