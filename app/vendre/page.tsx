import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSellerDashboardData } from "./actions";
import { VendreClient } from "./VendreClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Espace Vendeur — Publier un article | Vita Earn",
  description: "Publiez vos produits physiques, services et ressources digitales sur la marketplace Vita Earn.",
};

export default async function VendrePage() {
  const data = await getSellerDashboardData();

  if (!data) {
    redirect("/auth/login?redirect=/vendre");
  }

  if (!data.isActivated) {
    redirect("/activation");
  }

  return (
    <Suspense
      fallback={
        <div className="max-w-xl mx-auto py-12 text-center text-xs text-vita-muted">
          Chargement de l'espace vendeur...
        </div>
      }
    >
      <VendreClient initialData={data} />
    </Suspense>
  );
}
