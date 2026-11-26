import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { isAdminUnlocked, checkAdminSession } from "@/lib/security/admin-lock";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { fetchAndSyncEmploiPosts } from "@/lib/data/emploi-store";
import { AdminEmploiClient } from "./AdminEmploiClient";

export const metadata = {
  title: "Gestion Emploi — Administration Vita Earn",
};

export const dynamic = "force-dynamic";

export default async function AdminEmploiPage() {
  const { isAdmin, isSuperAdmin, userEmail } = await checkAdminSession();

  if (!isAdmin) {
    redirect("/auth/login?redirect=/admin/emploi");
  }

  const unlocked = await isAdminUnlocked();
  if (!unlocked) {
    redirect("/admin/lock");
  }

  const posts = await fetchAndSyncEmploiPosts();

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
          <span className="text-slate-900 font-bold">Emploi</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Emploi & Profils Publiés
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Consultez les informations des membres publiées sur l&apos;espace Emploi et modérez si nécessaire.
        </p>
      </div>

      <AdminEmploiClient initialPosts={posts} />
    </div>
  );
}
