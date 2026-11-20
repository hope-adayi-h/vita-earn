import { redirect } from "next/navigation";
import { isAdminUnlocked, checkAdminSession } from "@/lib/security/admin-lock";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { getAutoPaymentCountrySettings } from "@/lib/data/auto-payment-countries-store";
import { PaiementsAutoClient } from "./PaiementsAutoClient";

export const metadata = {
  title: "Contrôle des Pays & Paiements Automatiques — Administration Vita Earn",
};

export default async function AdminPaiementsAutoPage() {
  const { isAdmin, isSuperAdmin, userEmail } = await checkAdminSession();

  if (!isAdmin) {
    redirect("/auth/login?redirect=/admin/paiements-auto");
  }

  const unlocked = await isAdminUnlocked();
  if (!unlocked) {
    redirect("/admin/lock");
  }

  const settings = await getAutoPaymentCountrySettings();

  return (
    <div className="space-y-6">
      <AdminNavbar userEmail={userEmail} isSuperAdmin={isSuperAdmin} />
      <PaiementsAutoClient initialSettings={settings} userEmail={userEmail} />
    </div>
  );
}
