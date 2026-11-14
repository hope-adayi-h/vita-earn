"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPaymentProvider } from "@/lib/payments";
import type { ActivationData } from "./types";

export type { ActivationData };

/**
 * Récupère le statut d'activation et le montant serveur (Règle 4 : source de vérité platform_settings)
 */
export async function getActivationData(): Promise<ActivationData> {
  const supabase = createClient();
  let user = null;
  try {
    const { data: authData } = await supabase.auth.getUser();
    user = authData?.user || null;
  } catch {
    user = null;
  }

  // 1. Profil utilisateur si connecté
  let isActivated = false;
  let fullName = "Nouvel Utilisateur";
  let phone: string | undefined = undefined;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, phone, is_activated")
      .eq("id", user.id)
      .maybeSingle();

    isActivated = Boolean(profile?.is_activated);
    fullName = profile?.full_name || user.email || "Utilisateur";
    phone = profile?.phone;
  }

  // 2. Montant officiel lu depuis platform_settings (jamais depuis le client)
  let feeAmount = 4500; // valeur officielle de 4 500 FCFA
  let currency = "XOF";

  const { data: setting } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "activation_fee")
    .maybeSingle();

  if (setting?.value && typeof setting.value === "object" && "amount" in setting.value) {
    const rawAmount = (setting.value as { amount: number; currency?: string }).amount;
    if (typeof rawAmount === "number") {
      feeAmount = rawAmount;
    }
    if ((setting.value as { currency?: string }).currency) {
      currency = (setting.value as { currency: string }).currency;
    }
  }

  // 3. Paiement d'activation en cours si existant
  let pendingPayment = null;
  if (user) {
    const { data: pending } = await supabase
      .from("payments")
      .select("id, provider, provider_ref, amount, status")
      .eq("user_id", user.id)
      .eq("purpose", "activation")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    pendingPayment = pending;
  }

  return {
    user: {
      id: user?.id || "",
      email: user?.email || "visiteur@vitaearn.com",
      fullName,
      phone,
    },
    isActivated,
    feeAmount,
    currency,
    pendingPayment: pendingPayment
      ? {
          id: pendingPayment.id,
          provider: pendingPayment.provider,
          providerRef: pendingPayment.provider_ref,
          amount: Number(pendingPayment.amount),
          status: pendingPayment.status,
        }
      : null,
  };
}

/**
 * Initialise une transaction de paiement d'activation
 */
export async function initiateActivationPayment(formData?: FormData) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Session expirée. Veuillez vous reconnecter." };
  }

  // Vérifier si le profil est déjà activé
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_activated, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.is_activated) {
    return { error: "Votre compte est déjà activé." };
  }

  // Règle 4 : Le montant vient obligatoirement du serveur (platform_settings)
  let feeAmount = 4500;
  let currency = "XOF";
  const { data: setting } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "activation_fee")
    .maybeSingle();

  if (setting?.value && typeof setting.value === "object" && "amount" in setting.value) {
    feeAmount = (setting.value as { amount: number }).amount || 4500;
  }

  const provider = getPaymentProvider("mock");
  const idempotencyKey = `act_${user.id}_${Date.now()}`;

  const paymentResult = await provider.initiatePayment({
    userId: user.id,
    amount: feeAmount,
    currency,
    purpose: "activation",
    idempotencyKey,
    customerEmail: user.email,
    customerName: profile?.full_name || user.email,
    metadata: {
      source: "web_mvp",
      provider: provider.name,
    },
  });

  // Enregistrer le paiement dans la table payments de Supabase
  const { data: paymentRecord, error: insertError } = await supabase
    .from("payments")
    .insert({
      user_id: user.id,
      amount: feeAmount,
      currency,
      purpose: "activation",
      status: "pending",
      provider: provider.name,
      provider_ref: paymentResult.providerRef,
      idempotency_key: idempotencyKey,
      metadata: {
        initiated_at: new Date().toISOString(),
      },
    })
    .select("id, provider_ref")
    .single();

  if (insertError) {
    return { error: "Erreur lors de l'enregistrement du paiement d'activation." };
  }

  revalidatePath("/activation");

  return {
    success: true,
    paymentId: paymentRecord.id,
    providerRef: paymentRecord.provider_ref,
    amount: feeAmount,
    currency,
  };
}

/**
 * Simule la confirmation d'un paiement et déclenche l'activation via la fonction SQL activate_account
 * RÈGLE ABSOLUE : Fonction SQL activate_account appelée UNIQUEMENT avec service_role côté serveur
 */
export async function confirmMockPayment(paymentId: string) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Session invalide. Veuillez vous reconnecter." };
  }

  // 1. Vérifier le paiement associé
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("id, user_id, status, purpose, provider, provider_ref")
    .eq("id", paymentId)
    .eq("user_id", user.id)
    .single();

  if (paymentError || !payment) {
    return { error: "Transaction de paiement introuvable." };
  }

  if (payment.status === "succeeded") {
    return { success: true, message: "Ce paiement a déjà été validé." };
  }

  if (payment.purpose !== "activation") {
    return { error: "Paiement non valide pour une activation de compte." };
  }

  // 2. Vérification auprès de l'agrégateur (MockPaymentProvider)
  const provider = getPaymentProvider(payment.provider);
  const verifyResult = await provider.verifyPayment(payment.provider_ref || "");

  if (verifyResult.status !== "succeeded") {
    return { error: "La validation du paiement auprès du fournisseur a échoué." };
  }

  // 3. Mettre à jour le paiement en succeeded
  const { error: updateError } = await supabase
    .from("payments")
    .update({
      status: "succeeded",
      updated_at: new Date().toISOString(),
      metadata: {
        verified_at: new Date().toISOString(),
        verified_by: "MockProvider",
      },
    })
    .eq("id", paymentId);

  if (updateError) {
    return { error: "Erreur lors de la mise à jour du statut de paiement." };
  }

  // 4. Appel sécurisé à la fonction SQL activate_account avec service_role
  // RÈGLE ABSOLUE 2 : service_role uniquement
  try {
    const adminClient = createAdminClient();
    const { data: rpcResult, error: rpcError } = await adminClient.rpc("activate_account", {
      p_user_id: user.id,
      p_payment_id: paymentId,
    });

    if (rpcError) {
      await distributeCommissionsFallback(user.id, paymentId);
    }
  } catch (err) {
    await distributeCommissionsFallback(user.id, paymentId);
  }

  revalidatePath("/activation");
  revalidatePath("/profil");
  revalidatePath("/");

  return {
    success: true,
    message: "Félicitations ! Votre paiement a été confirmé et votre compte Vita Earn est maintenant actif.",
  };
}

/**
 * Secours pour distribution des commissions si la fonction RPC PostgreSQL n'a pas encore été migrée
 */
async function distributeCommissionsFallback(userId: string, paymentId: string) {
  try {
    const adminClient = createAdminClient();
    await adminClient.from("profiles").update({ is_activated: true }).eq("id", userId);

    // Vérifier si commissions déjà insérées pour ce paymentId
    const { count } = await adminClient
      .from("commissions")
      .select("id", { count: "exact", head: true })
      .eq("payment_id", paymentId);

    if ((count || 0) > 0) return;

    // Niveau 1 (2 000 FCFA)
    const { data: ref1 } = await adminClient
      .from("referrals")
      .select("referrer_id")
      .eq("referred_id", userId)
      .maybeSingle();

    if (ref1?.referrer_id && ref1.referrer_id !== userId) {
      const { data: w1 } = await adminClient
        .from("wallets")
        .select("id")
        .eq("user_id", ref1.referrer_id)
        .maybeSingle();

      if (w1?.id) {
        await adminClient.from("commissions").insert({
          beneficiary_id: ref1.referrer_id,
          buyer_id: userId,
          payment_id: paymentId,
          level: 1,
          amount: 2000,
          status: "available",
        });

        await adminClient.from("ledger_entries").insert({
          wallet_id: w1.id,
          amount: 2000,
          entry_type: "commission_level_1",
          reference_id: paymentId,
          description: "Commission Parrainage Niveau 1 (Filleul direct)",
        });
      }

      // Niveau 2 (1 000 FCFA)
      const { data: ref2 } = await adminClient
        .from("referrals")
        .select("referrer_id")
        .eq("referred_id", ref1.referrer_id)
        .maybeSingle();

      if (
        ref2?.referrer_id &&
        ref2.referrer_id !== userId &&
        ref2.referrer_id !== ref1.referrer_id
      ) {
        const { data: w2 } = await adminClient
          .from("wallets")
          .select("id")
          .eq("user_id", ref2.referrer_id)
          .maybeSingle();

        if (w2?.id) {
          await adminClient.from("commissions").insert({
            beneficiary_id: ref2.referrer_id,
            buyer_id: userId,
            payment_id: paymentId,
            level: 2,
            amount: 1000,
            status: "available",
          });

          await adminClient.from("ledger_entries").insert({
            wallet_id: w2.id,
            amount: 1000,
            entry_type: "commission_level_2",
            reference_id: paymentId,
            description: "Commission Parrainage Niveau 2",
          });
        }

        // Niveau 3 (500 FCFA)
        const { data: ref3 } = await adminClient
          .from("referrals")
          .select("referrer_id")
          .eq("referred_id", ref2.referrer_id)
          .maybeSingle();

        if (
          ref3?.referrer_id &&
          ref3.referrer_id !== userId &&
          ref3.referrer_id !== ref1.referrer_id &&
          ref3.referrer_id !== ref2.referrer_id
        ) {
          const { data: w3 } = await adminClient
            .from("wallets")
            .select("id")
            .eq("user_id", ref3.referrer_id)
            .maybeSingle();

          if (w3?.id) {
            await adminClient.from("commissions").insert({
              beneficiary_id: ref3.referrer_id,
              buyer_id: userId,
              payment_id: paymentId,
              level: 3,
              amount: 500,
              status: "available",
            });

            await adminClient.from("ledger_entries").insert({
              wallet_id: w3.id,
              amount: 500,
              entry_type: "commission_level_3",
              reference_id: paymentId,
              description: "Commission Parrainage Niveau 3",
            });
          }
        }
      }
    }
  } catch {
    // Ignoré
  }
}

/**
 * Action appelée depuis la page de paiement complète (/activation/paiement)
 * Prépare et traite le paiement d'adhésion Mobile Money
 */
export async function submitActivationPaymentAction(params: {
  fullName: string;
  country: string;
  phone: string;
  paymentMethod: string;
}): Promise<{ success?: boolean; error?: string; redirectUrl?: string; message?: string }> {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Session expirée. Veuillez vous connecter pour finaliser votre adhésion." };
  }

  // 1. Lire le montant officiel depuis platform_settings (4 500 FCFA)
  let feeAmount = 4500;
  let currency = "XOF";
  const { data: setting } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "activation_fee")
    .maybeSingle();

  if (setting?.value && typeof setting.value === "object" && "amount" in setting.value) {
    feeAmount = (setting.value as { amount: number }).amount || 4500;
  }

  // 2. Initialiser auprès du provider (mock pour le MVP, prêt pour CinetPay/FedaPay)
  const provider = getPaymentProvider("mock");
  const idempotencyKey = `act_${user.id}_${Date.now()}`;

  const paymentResult = await provider.initiatePayment({
    userId: user.id,
    amount: feeAmount,
    currency,
    purpose: "activation",
    idempotencyKey,
    customerEmail: user.email,
    customerName: params.fullName || user.email,
    customerPhone: params.phone,
    metadata: {
      country: params.country,
      paymentMethod: params.paymentMethod,
      source: "web_checkout",
    },
  });

  // 3. Enregistrer dans la table payments
  const { data: paymentRecord, error: insertError } = await supabase
    .from("payments")
    .insert({
      user_id: user.id,
      amount: feeAmount,
      currency,
      purpose: "activation",
      status: "pending",
      provider: provider.name,
      provider_ref: paymentResult.providerRef,
      idempotency_key: idempotencyKey,
      metadata: {
        customer_name: params.fullName,
        country: params.country,
        phone: params.phone,
        payment_method: params.paymentMethod,
        initiated_at: new Date().toISOString(),
      },
    })
    .select("id")
    .single();

  if (insertError || !paymentRecord) {
    return { error: "Erreur lors de la création de la transaction de paiement." };
  }

  // 4. En mode MVP : validation immédiate via confirmMockPayment -> activate_account
  const confirmResult = await confirmMockPayment(paymentRecord.id);
  if (confirmResult.error) {
    return { error: confirmResult.error };
  }

  revalidatePath("/activation");
  revalidatePath("/profil");
  revalidatePath("/");

  return {
    success: true,
    redirectUrl: "/activation?activated=1",
    message: "Paiement de 4 500 FCFA validé avec succès ! Votre compte est actif.",
  };
}
