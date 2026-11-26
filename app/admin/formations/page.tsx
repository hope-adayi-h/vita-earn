import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { isAdminUnlocked, checkAdminSession } from "@/lib/security/admin-lock";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { fetchAndSyncFormations } from "@/lib/data/formations-store";
import { AdminFormationsClient } from "./AdminFormationsClient";

export const metadata = {
  title: "Formations Vita Earn — Administration Vita Earn",
};

export const dynamic = "force-dynamic";

export default async function AdminFormationsPage() {
  const { isAdmin, isSuperAdmin, userEmail } = await checkAdminSession();

  if (!isAdmin) {
    redirect("/auth/login?redirect=/admin/formations");
  }

  const unlocked = await isAdminUnlocked();
  if (!unlocked) {
    redirect("/admin/lock");
  }

  const items = await fetchAndSyncFormations();

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
          <span className="text-slate-900 font-bold">Formations</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Gestion des Formations
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Ajoutez et gérez les formations (image, titre, description et lien PDF / Google Drive / Share).
        </p>
      </div>

      <AdminFormationsClient initialItems={items} />
    </div>
  );
}
