import { redirect } from "next/navigation";
import { checkAdminSession, isAdminUnlocked } from "@/lib/security/admin-lock";
import { getAdminAlternativePaymentData } from "./actions";
import { PaiementAlternatifClient } from "./PaiementAlternatifClient";
import { AdminNavbar } from "@/components/admin/AdminNavbar";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Paiement Alternatif — Administration Vita Earn",
  description: "Configuration du bouton de paiement alternatif par pays pour les utilisateurs.",
};

export default async function AdminPaiementAlternatifPage() {
  const { isAdmin, isSuperAdmin, userEmail } = await checkAdminSession();
  if (!isAdmin) {
    redirect("/auth/login?redirect=/admin/paiement-alternatif");
  }

  const unlocked = await isAdminUnlocked();
  if (!unlocked) {
    redirect("/admin/lock");
  }

  const settings = await getAdminAlternativePaymentData();

  return (
    <div className="min-h-screen bg-[#F4F7F0] p-3 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <AdminNavbar
          userEmail={userEmail || "admin@vitaearn.com"}
          isSuperAdmin={isSuperAdmin}
        />

        <PaiementAlternatifClient
          initialSettings={settings}
          userEmail={userEmail || "admin@vitaearn.com"}
        />
      </div>
    </div>
  );
}
