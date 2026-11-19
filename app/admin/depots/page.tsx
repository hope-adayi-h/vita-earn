import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminUnlocked, checkAdminSession } from "@/lib/security/admin-lock";
import { getAllStoredDeposits, resolveOperatorName, type StoredDeposit } from "@/lib/data/deposits-store";
import { getAllUsers } from "@/lib/auth/local-store";
import { DepotsClient } from "./DepotsClient";

export const metadata = {
  title: "Dépôts Mobile Money — Administration Vita Earn",
};

export const dynamic = "force-dynamic";

export default async function AdminDepotsPage() {
  const { isAdmin, isSuperAdmin, userEmail } = await checkAdminSession();

  if (!isAdmin) {
    redirect("/auth/login?redirect=/admin/depots");
  }

  const unlocked = await isAdminUnlocked();
  if (!unlocked) {
    redirect("/admin/lock");
  }

  // 1. Lire les dépôts locaux enregistrés
  const localDeposits = getAllStoredDeposits();
  const registeredUsers = getAllUsers();

  let consolidatedDeposits: StoredDeposit[] = [...localDeposits];

  // 2. Si Supabase est connecté, lire les paiements réels
  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

  if (isConfigured) {
    try {
      const adminClient = createAdminClient();

      // Lire les 50 derniers paiements
      const { data: payments } = await adminClient
        .from("payments")
        .select("id, user_id, amount, currency, purpose, status, provider, provider_ref, metadata, created_at, updated_at")
        .order("created_at", { ascending: false })
        .limit(50);

      // Lire les profils pour enrichir avec les noms et numéros
      const { data: profiles } = await adminClient
        .from("profiles")
        .select("id, full_name, email, phone, country");

      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

      if (payments && payments.length > 0) {
        for (const p of payments) {
          const prof = profileMap.get(p.user_id);
          const meta = (p.metadata as any) || {};

          const foundLocalUser = registeredUsers.find(
            (u) =>
              u.id === p.user_id ||
              (prof?.email && u.email.toLowerCase() === prof.email.toLowerCase()) ||
              (meta?.email && u.email.toLowerCase() === meta.email.toLowerCase())
          );

          const username =
            foundLocalUser?.username ||
            prof?.full_name?.toLowerCase().replace(/\s+/g, "") ||
            meta?.username ||
            meta?.customer_name?.toLowerCase().replace(/\s+/g, "") ||
            "utilisateur";

          const fullName =
            (foundLocalUser as any)?.fullName ||
            foundLocalUser?.username ||
            prof?.full_name ||
            meta?.customer_name ||
            "Client VitaEarn";

          const email =
            foundLocalUser?.email ||
            prof?.email ||
            meta?.customer_email ||
            "client@vitaearn.com";

          const phone =
            meta?.phone ||
            foundLocalUser?.phone ||
            prof?.phone ||
            "+228 90 00 00 00";

          const operator = resolveOperatorName(meta?.payment_method || meta?.channel || p.provider, phone);

          const isSasPay = (p.provider || "").toLowerCase().includes("saspay");
          let confirmationSource = "Paiement automatique confirmé par SasPay";
          if (p.provider === "MANUAL_ADMIN") {
            confirmationSource = "Validé manuellement par l'Administrateur";
          } else if (p.status === "pending") {
            confirmationSource = "En attente de règlement SasPay";
          } else if (p.status === "failed") {
            confirmationSource = "Paiement refusé / Échoué";
          } else if (isSasPay) {
            confirmationSource = "Paiement automatique confirmé par SasPay";
          }

          const existingIdx = consolidatedDeposits.findIndex(
            (d) => d.id === p.id || (p.provider_ref && d.providerRef === p.provider_ref)
          );

          const depositItem: StoredDeposit = {
            id: p.id,
            userId: p.user_id,
            username,
            fullName,
            email,
            phone,
            operator,
            amount: Number(p.amount) || 4500,
            currency: p.currency || "XOF",
            purpose: p.purpose === "activation" ? "Activation de compte" : "Recharge portefeuille",
            status: p.status as any,
            provider: p.provider as any,
            providerRef: p.provider_ref || p.id,
            confirmationSource,
            createdAt: p.created_at,
            confirmedAt: p.status === "succeeded" ? p.updated_at || p.created_at : null,
          };

          if (existingIdx >= 0) {
            consolidatedDeposits[existingIdx] = { ...consolidatedDeposits[existingIdx], ...depositItem };
          } else {
            consolidatedDeposits.push(depositItem);
          }
        }
      }
    } catch (err) {
      console.error("Erreur consolidation Supabase payments:", err);
    }
  }

  // Trier par date décroissante (plus récent en premier)
  consolidatedDeposits.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <DepotsClient
      initialDeposits={consolidatedDeposits}
      userEmail={userEmail}
      isSuperAdmin={isSuperAdmin}
    />
  );
}
