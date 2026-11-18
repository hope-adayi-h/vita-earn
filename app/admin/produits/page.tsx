import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminUnlocked, SUPER_ADMIN_EMAIL } from "@/lib/security/admin-lock";
import { ProduitsClient, type ProductAdminItem } from "./ProduitsClient";

export const metadata = {
  title: "Modération des Produits — Administration Vita Earn",
};

export default async function AdminProduitsPage() {
  const cookieStore = cookies();
  const supabase = createClient();

  let userEmail = "";
  let isAdmin = false;

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      userEmail = user.email || "";
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role === "admin" || user.email === SUPER_ADMIN_EMAIL) {
        isAdmin = true;
      }
    }
  } catch {}

  if (!isAdmin) {
    const rawSession = cookieStore.get("vita_session_user")?.value;
    if (rawSession) {
      try {
        const parsed = JSON.parse(rawSession);
        if (parsed.role === "admin" || parsed.email === SUPER_ADMIN_EMAIL) {
          isAdmin = true;
        }
      } catch {}
    }
  }

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

  return (
    <div className="max-w-5xl mx-auto py-4 sm:py-8">
      <ProduitsClient initialProducts={productsList} />
    </div>
  );
}
