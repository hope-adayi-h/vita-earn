import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Video } from "lucide-react";
import { isAdminUnlocked, checkAdminSession } from "@/lib/security/admin-lock";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { getAllLiveConferences } from "@/lib/data/live-store";
import { AdminLiveClient } from "./AdminLiveClient";

export const metadata = {
  title: "Gestion des Conférences Live — Administration Vita Earn",
};

export const dynamic = "force-dynamic";

export default async function AdminLivePage() {
  const { isAdmin, isSuperAdmin, userEmail } = await checkAdminSession();

  if (!isAdmin) {
    redirect("/auth/login?redirect=/admin/live");
  }

  const unlocked = await isAdminUnlocked();
  if (!unlocked) {
    redirect("/admin/lock");
  }

  const lives = await getAllLiveConferences();

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
          <span className="text-slate-900 font-bold">Conférences Live</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Gestion des Formations & Conférences Live
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Vérifiez les demandes de lives, validez les créneaux, attribuez les liens Google Meet et lancez la diffusion en direct.
            </p>
          </div>
        </div>
      </div>

      <AdminLiveClient initialLives={lives} />
    </div>
  );
}
