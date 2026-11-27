import "server-only";

import { getAllStoredWithdrawals } from "@/lib/data/withdrawals-store";
import { getLocalKycRequests } from "@/lib/data/kyc-store";
import { getAllLiveConferences } from "@/lib/data/live-store";
import { getAllStoredProducts } from "@/lib/data/products-store";
import { getAllStoredDeposits } from "@/lib/data/deposits-store";
import { formatFCFA } from "@/lib/utils";
import type {
  AdminNotificationItem,
  AdminNotificationSummary,
} from "./admin-notifications-types";

export * from "./admin-notifications-types";

export async function getAdminNotificationSummary(): Promise<AdminNotificationSummary> {
  const items: AdminNotificationItem[] = [];

  // 1. Demandes de Retrait en attente
  let withdrawalsCount = 0;
  try {
    const withdrawals = getAllStoredWithdrawals();
    const pendingWithdrawals = withdrawals.filter(
      (w) => w.status === "pending" || w.status === "processing"
    );
    withdrawalsCount = pendingWithdrawals.length;

    for (const w of pendingWithdrawals) {
      items.push({
        id: `notif_wdr_${w.id}`,
        type: "withdrawal",
        title: `Demande de retrait : ${formatFCFA(w.amount)}`,
        subtitle: `${w.userName || "Membre"} • ${w.paymentMethod} (${w.phoneNumber})`,
        detail: `Net à payer : ${formatFCFA(w.netAmount)} (Frais : ${formatFCFA(w.fee)})`,
        amount: w.amount,
        userName: w.userName,
        href: "/admin/retraits",
        actionLabel: "Traiter le retrait",
        createdAt: w.createdAt || new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error("Erreur notifications retraits:", err);
  }

  // 2. Demandes de KYC Vendeurs en attente
  let kycCount = 0;
  try {
    const kycRequests = getLocalKycRequests();
    const pendingKyc = kycRequests.filter((k) => k.status === "pending");
    kycCount = pendingKyc.length;

    for (const k of pendingKyc) {
      const docLabel = k.documentType === "cni" ? "Carte d'Identité (CNI)" : "Carte Scolaire / Étudiant";
      items.push({
        id: `notif_kyc_${k.id}`,
        type: "kyc",
        title: `Vérification KYC Vendeur en attente`,
        subtitle: `${k.fullName} (@${k.username}) • ${k.phone}`,
        detail: `Document fourni : ${docLabel}`,
        userName: k.fullName,
        href: "/admin/kyc",
        actionLabel: "Examiner les pièces",
        createdAt: k.createdAt || new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error("Erreur notifications KYC:", err);
  }

  // 3. Demandes de Live & Conférences en attente
  let liveCount = 0;
  try {
    const lives = await getAllLiveConferences();
    const pendingLives = lives.filter((l) => l.status === "pending");
    liveCount = pendingLives.length;

    for (const l of pendingLives) {
      items.push({
        id: `notif_live_${l.id}`,
        type: "live",
        title: `Proposition de Live : ${l.title}`,
        subtitle: `Par ${l.applicantName} (${l.applicantPhone})`,
        detail: `Date demandée : ${l.scheduledDate} à ${l.scheduledTime} (~${l.durationMinutes} min)`,
        userName: l.applicantName,
        href: "/admin/live",
        actionLabel: "Valider le créneau",
        createdAt: l.createdAt || new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error("Erreur notifications Live:", err);
  }

  // 4. Produits Marketplace en attente de modération
  let productsCount = 0;
  try {
    const products = await getAllStoredProducts();
    const pendingProducts = products.filter((p) => p.status === "pending");
    productsCount = pendingProducts.length;

    for (const p of pendingProducts) {
      items.push({
        id: `notif_prod_${p.id}`,
        type: "product",
        title: `Nouvel article à modérer : ${p.title}`,
        subtitle: `Vendeur : @${p.sellerUsername} • ${formatFCFA(p.price)}`,
        detail: `Catégorie : ${p.category} (${p.productType})`,
        userName: p.sellerUsername,
        href: "/admin/produits",
        actionLabel: "Modérer l'article",
        createdAt: p.createdAt || new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error("Erreur notifications Produits:", err);
  }

  // 5. Dépôts Mobile Money en attente
  let depositsCount = 0;
  try {
    const deposits = getAllStoredDeposits();
    const pendingDeposits = deposits.filter((d) => d.status === "pending");
    depositsCount = pendingDeposits.length;

    for (const d of pendingDeposits) {
      items.push({
        id: `notif_dep_${d.id}`,
        type: "deposit",
        title: `Dépôt Mobile Money en attente : ${formatFCFA(d.amount)}`,
        subtitle: `${d.fullName} (${d.phone}) • ${d.operator}`,
        detail: `Référence : ${d.providerRef || d.id}`,
        amount: d.amount,
        userName: d.fullName,
        href: "/admin/depots",
        actionLabel: "Vérifier le dépôt",
        createdAt: d.createdAt || new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error("Erreur notifications Dépôts:", err);
  }

  // Tri par date décroissante (les plus récents en premier)
  items.sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime() || 0;
    const timeB = new Date(b.createdAt).getTime() || 0;
    return timeB - timeA;
  });

  const totalCount =
    withdrawalsCount + kycCount + liveCount + productsCount + depositsCount;

  return {
    totalCount,
    withdrawalsCount,
    kycCount,
    liveCount,
    productsCount,
    depositsCount,
    items,
    lastCheckedAt: new Date().toISOString(),
  };
}
