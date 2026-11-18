import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminUnlocked, checkAdminSession } from "@/lib/security/admin-lock";
import { ProduitsClient, type ProductAdminItem } from "./ProduitsClient";
import { AdminNavbar } from "@/components/admin/AdminNavbar";

export const metadata = {
  title: "Modération des Produits — Administration Vita Earn",
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

  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

  let productsList: ProductAdminItem[] = [];

  if (isConfigured) {
    try {
      const adminClient = createAdminClient();
      const { data: prods } = await adminClient
        .from("products")
        .select("id, title, description, price, category, status, is_digital, created_at, seller_id")
        .order("created_at", { ascending: false });

      if (prods && prods.length > 0) {
        const sellerIds = Array.from(new Set(prods.map((p) => p.seller_id)));
        const { data: sellers } = await adminClient
          .from("profiles")
          .select("id, full_name")
          .in("id", sellerIds);

        const sellerMap = new Map((sellers || []).map((s) => [s.id, s.full_name]));

        productsList = prods.map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description || "",
          price: Number(p.price) || 0,
          category: p.category || "Général",
          status: p.status,
          sellerName: sellerMap.get(p.seller_id) || "Vendeur",
          isDigital: Boolean(p.is_digital),
          createdAt: p.created_at,
        }));
      }
    } catch {}
  }

  const pendingProductsCount = productsList.filter((p) => p.status === "pending").length;

  return (
    <div className="max-w-5xl mx-auto py-3 sm:py-6 space-y-6">
      <AdminNavbar
        userEmail={userEmail}
        isSuperAdmin={isSuperAdmin}
        pendingProductsCount={pendingProductsCount}
      />
      <ProduitsClient initialProducts={productsList} />
    </div>
  );
}
