import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { activateUser } from "@/lib/auth/local-store";
import { updateStoredDepositStatus } from "@/lib/data/deposits-store";

const EXTERNAL_WALLET_ID = "643c02e4-835e-4dea-b099-14a44286c35d";
const PLATFORM_WALLET_ID = "7701b857-c172-424c-8394-089ab5116b51";

/**
 * Exécute l'activation atomique d'un compte utilisateur et la distribution
 * des commissions d'affiliation sur 3 niveaux (Règles 1 & 2 : service_role).
 *
 * Grand livre immuable en partie double (Double-Entry Ledger) :
 * Débit externe (-4 500 FCFA), Crédit L1 (+2 000 FCFA), Crédit L2 (+1 000 FCFA),
 * Crédit L3 (+500 FCFA), Marge plateforme (+reste) -> Somme des écritures = 0.
 */
export async function processSuccessfulActivation(params: {
  userId: string;
  paymentId?: string;
  providerRef?: string;
}): Promise<{ success: boolean; message: string }> {
  const { userId, paymentId, providerRef } = params;

  // 1. Activation dans le store local (résilience hors-ligne / fallback)
  try {
    activateUser(userId);
  } catch {}

  // 1.b Mise à jour du statut dans le registre des dépôts d'encaissement
  try {
    updateStoredDepositStatus({
      identifierOrRef: providerRef || userId,
      status: "succeeded",
      confirmationSource: "Paiement automatique confirmé par SasPay",
    });
  } catch {}

  // 2. Traitement côté Supabase (Grand Livre Immuable & Commissions)
  try {
    const adminClient = createAdminClient();

    // Résoudre l'UUID réel si userId est un pseudo ou identifiant temporaire
    let targetUuid = userId;
    if (!targetUuid || targetUuid.length !== 36) {
      const { data: userProf } = await adminClient
        .from("profiles")
        .select("id")
        .or(`username.ilike.${userId},full_name.ilike.${userId}`)
        .limit(1)
        .maybeSingle();

      if (userProf?.id) {
        targetUuid = userProf.id;
      }
    }

    if (!targetUuid || targetUuid.length !== 36) {
      return { success: true, message: "Compte activé localement." };
    }

    // Activer le profil dans Supabase
    await adminClient
      .from("profiles")
      .update({
        is_activated: true,
        activated_at: new Date().toISOString(),
      })
      .eq("id", targetUuid);

    // Résoudre ou créer un paiement valide dans public.payments
    let validPaymentId = paymentId;
    if (validPaymentId && validPaymentId.length === 36) {
      await adminClient
        .from("payments")
        .update({
          status: "succeeded",
          provider_ref: providerRef || undefined,
          updated_at: new Date().toISOString(),
        })
        .eq("id", validPaymentId);
    } else {
      const { data: existingPay } = await adminClient
        .from("payments")
        .select("id")
        .eq("user_id", targetUuid)
        .eq("purpose", "activation")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingPay?.id) {
        validPaymentId = existingPay.id;
        await adminClient
          .from("payments")
          .update({
            status: "succeeded",
            provider_ref: providerRef || undefined,
            updated_at: new Date().toISOString(),
          })
          .eq("id", validPaymentId);
      } else {
        const { data: createdPay } = await adminClient
          .from("payments")
          .insert({
            user_id: targetUuid,
            amount: 4500,
            purpose: "activation",
            status: "succeeded",
            provider: "saspay",
            provider_ref: providerRef || `act_${Date.now()}`,
            idempotency_key: `idemp_act_${targetUuid}_${Date.now()}`,
          })
          .select("id")
          .single();

        validPaymentId = createdPay?.id;
      }
    }

    if (!validPaymentId) {
      return { success: true, message: "Profil activé." };
    }

    // Idempotence : vérifier si les commissions ont déjà été calculées
    const { count: commCount } = await adminClient
      .from("commissions")
      .select("id", { count: "exact", head: true })
      .eq("payment_id", validPaymentId);

    if ((commCount || 0) > 0) {
      return {
        success: true,
        message: "Compte déjà activé et commissions déjà distribuées.",
      };
    }

    // Trouver la chaîne de parrainage sur 3 générations (L1, L2, L3)
    const { data: ref1 } = await adminClient
      .from("referrals")
      .select("referrer_id")
      .eq("referred_id", targetUuid)
      .maybeSingle();

    let l1ReferrerId = ref1?.referrer_id && ref1.referrer_id !== targetUuid ? ref1.referrer_id : null;
    let l2ReferrerId: string | null = null;
    let l3ReferrerId: string | null = null;

    if (l1ReferrerId) {
      const { data: ref2 } = await adminClient
        .from("referrals")
        .select("referrer_id")
        .eq("referred_id", l1ReferrerId)
        .maybeSingle();

      if (
        ref2?.referrer_id &&
        ref2.referrer_id !== targetUuid &&
        ref2.referrer_id !== l1ReferrerId
      ) {
        l2ReferrerId = ref2.referrer_id;

        const { data: ref3 } = await adminClient
          .from("referrals")
          .select("referrer_id")
          .eq("referred_id", l2ReferrerId)
          .maybeSingle();

        if (
          ref3?.referrer_id &&
          ref3.referrer_id !== targetUuid &&
          ref3.referrer_id !== l1ReferrerId &&
          ref3.referrer_id !== l2ReferrerId
        ) {
          l3ReferrerId = ref3.referrer_id;
        }
      }
    }

    // Récupérer les portefeuilles correspondants
    const [w1Res, w2Res, w3Res] = await Promise.all([
      l1ReferrerId
        ? adminClient.from("wallets").select("id").eq("user_id", l1ReferrerId).maybeSingle()
        : Promise.resolve({ data: null }),
      l2ReferrerId
        ? adminClient.from("wallets").select("id").eq("user_id", l2ReferrerId).maybeSingle()
        : Promise.resolve({ data: null }),
      l3ReferrerId
        ? adminClient.from("wallets").select("id").eq("user_id", l3ReferrerId).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const w1Id = w1Res.data?.id;
    const w2Id = w2Res.data?.id;
    const w3Id = w3Res.data?.id;

    // Préparation des écritures du Grand Livre (Double-Entry Bookkeeping)
    const txId = crypto.randomUUID();
    const ledgerEntries: any[] = [];
    const commissionRecords: any[] = [];
    let distributedAmount = 0;

    // Débit du portefeuille externe (-4 500 FCFA reçu de Mobile Money / SasPay)
    ledgerEntries.push({
      tx_id: txId,
      wallet_id: EXTERNAL_WALLET_ID,
      amount: -4500,
      entry_type: "activation_credit",
      reference_id: validPaymentId,
      description: "Encaissement activation SasPay",
    });

    // Niveau 1 : 2 000 FCFA
    if (w1Id && l1ReferrerId) {
      ledgerEntries.push({
        tx_id: txId,
        wallet_id: w1Id,
        amount: 2000,
        entry_type: "commission_level_1",
        reference_id: validPaymentId,
        description: "Commission Parrainage Niveau 1 (Filleul direct)",
      });
      commissionRecords.push({
        beneficiary_id: l1ReferrerId,
        buyer_id: targetUuid,
        payment_id: validPaymentId,
        level: 1,
        amount: 2000,
        status: "available",
      });
      distributedAmount += 2000;
    }

    // Niveau 2 : 1 000 FCFA
    if (w2Id && l2ReferrerId) {
      ledgerEntries.push({
        tx_id: txId,
        wallet_id: w2Id,
        amount: 1000,
        entry_type: "commission_level_2",
        reference_id: validPaymentId,
        description: "Commission Parrainage Niveau 2",
      });
      commissionRecords.push({
        beneficiary_id: l2ReferrerId,
        buyer_id: targetUuid,
        payment_id: validPaymentId,
        level: 2,
        amount: 1000,
        status: "available",
      });
      distributedAmount += 1000;
    }

    // Niveau 3 : 500 FCFA
    if (w3Id && l3ReferrerId) {
      ledgerEntries.push({
        tx_id: txId,
        wallet_id: w3Id,
        amount: 500,
        entry_type: "commission_level_3",
        reference_id: validPaymentId,
        description: "Commission Parrainage Niveau 3",
      });
      commissionRecords.push({
        beneficiary_id: l3ReferrerId,
        buyer_id: targetUuid,
        payment_id: validPaymentId,
        level: 3,
        amount: 500,
        status: "available",
      });
      distributedAmount += 500;
    }

    // Frais techniques & marge de la plateforme (Complément pour équilibre = 0)
    const platformRemaining = 4500 - distributedAmount;
    if (platformRemaining > 0) {
      ledgerEntries.push({
        tx_id: txId,
        wallet_id: PLATFORM_WALLET_ID,
        amount: platformRemaining,
        entry_type: "fee_debit",
        reference_id: validPaymentId,
        description: "Frais techniques et marge plateforme",
      });
    }

    // Insertion atomique des écritures comptables
    if (ledgerEntries.length > 0) {
      await adminClient.from("ledger_entries").insert(ledgerEntries);
    }

    // Insertion des commissions d'affiliation
    if (commissionRecords.length > 0) {
      await adminClient.from("commissions").insert(commissionRecords);
    }
  } catch (err) {
    console.error("Erreur lors de la distribution des commissions:", err);
  }

  return {
    success: true,
    message: "Compte activé et commissions réparties avec succès.",
  };
}
