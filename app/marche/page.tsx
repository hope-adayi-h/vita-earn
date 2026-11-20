import { cookies } from "next/headers";
import { getActiveMarketplaceProducts } from "@/lib/data/products-store";
import { createClient } from "@/lib/supabase/server";
import { MarketplaceClient } from "./MarketplaceClient";

export const metadata = {
  title: "Place de Marché — Vita Earn",
  description: "Découvrez et achetez des produits physiques, services et ressources digitales certifiés au Togo et en Afrique de l'Ouest.",
};

export default async function MarchePage() {
  const cookieStore = cookies();
  const sessionUserCookie = cookieStore.get("vita_session_user")?.value;
  let sessionUser: any = null;
  if (sessionUserCookie) {
    try {
      sessionUser = JSON.parse(sessionUserCookie);
    } catch {}
  }

  const isActivatedCookie = cookieStore.get("vita_account_activated")?.value === "true";

  let isActivated = Boolean(isActivatedCookie || sessionUser?.isActivated);

  // Vérification Supabase Auth si disponible
  if (!isActivated) {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_activated")
          .eq("id", user.id)
          .maybeSingle();
        if (profile?.is_activated) {
          isActivated = true;
        }
      }
    } catch {}
  }

  const products = await getActiveMarketplaceProducts();

  return <MarketplaceClient initialProducts={products} isActivated={isActivated} />;
}
