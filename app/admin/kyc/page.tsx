import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { isAdminUnlocked, checkAdminSession } from "@/lib/security/admin-lock";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { fetchAndSyncKycRequests } from "@/lib/data/kyc-store";
import { AdminKycClient } from "./AdminKycClient";

export const metadata = {
  title: "KYC Vendeurs — Administration Vita Earn",
};

export const dynamic = "force-dynamic";

export default async function AdminKycPage() {
  const { isAdmin, isSuperAdmin, userEmail } = await checkAdminSession();

  if (!isAdmin) {
    redirect("/auth/login?redirect=/admin/kyc");
  }

  const unlocked = await isAdminUnlocked();
  if (!unlocked) {
    redirect("/admin/lock");
  }

  const items = await fetchAndSyncKycRequests();

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
          <span className="text-slate-900 font-bold">KYC Vendeurs</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Validation KYC des Vendeurs Marketplace
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Vérifiez la pièce d&apos;identité (ou carte scolaire) recto/verso et la photo du visage avant d&apos;autoriser la publication d&apos;articles.
        </p>
      </div>

      <AdminKycClient initialItems={items} />
    </div>
  );
}
