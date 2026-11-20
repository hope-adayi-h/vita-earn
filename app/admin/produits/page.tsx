import { redirect } from "next/navigation";
import { isAdminUnlocked, checkAdminSession } from "@/lib/security/admin-lock";
import { getAllStoredProducts, getMarketplaceSettings } from "@/lib/data/products-store";
import { ProduitsClient } from "./ProduitsClient";
import { AdminNavbar } from "@/components/admin/AdminNavbar";

export const metadata = {
  title: "Modération & Réglages Marketplace — Administration Vita Earn",
};

export default async function AdminProduitsPage() {
  const { isAdmin, isSuperAdmin, userEmail } = await checkAdminSession();

  if (!isAdmin) {
    redirect("/auth/login?redirect=/admin/produits");
  }

  const unlocked = await isAdminUnlocked();
  if (!unlocked) {
    redirect("/admin/lock");
  }

  const [productsList, settings] = await Promise.all([
    getAllStoredProducts(),
    getMarketplaceSettings(),
  ]);

  const pendingProductsCount = productsList.filter((p) => p.status === "pending").length;

  return (
    <div className="max-w-6xl mx-auto py-3 sm:py-6 space-y-6 px-4">
      <AdminNavbar
        userEmail={userEmail}
        isSuperAdmin={isSuperAdmin}
        pendingProductsCount={pendingProductsCount}
      />
      <ProduitsClient initialProducts={productsList} initialSettings={settings} />
    </div>
  );
}
