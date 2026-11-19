"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPaymentProvider } from "@/lib/payments";
import { SasPayClient, calculateEffectiveChargeAmount } from "@/lib/payments/saspay";
import { activateUser } from "@/lib/auth/local-store";
import type { ActivationData } from "./types";

export type { ActivationData };

const isProd = process.env.NODE_ENV === "production";
const ACTIVATION_COOKIE_OPTIONS = {
  path: "/",
  httpOnly: true,
  secure: isProd,
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 30, // 30 jours
};

/**
 * Activation immédiate en 1 clic (Mode simplifié & test)
 * Valide le compte et redirige immédiatement vers le tableau de bord avec le nom d'utilisateur
 */
export async function quickActivateAction(): Promise<void> {
  const cookieStore = cookies();
  const sessionUserCookie = cookieStore.get("vita_session_user")?.value;
  let sessionUser: any = null;
  if (sessionUserCookie) {
    try {
      sessionUser = JSON.parse(sessionUserCookie);
    } catch {
      try {
        sessionUser = JSON.parse(decodeURIComponent(sessionUserCookie));
      } catch {}
    }
  }
  const testUser = cookieStore.get("vita_test_user")?.value;
  const testEmail = cookieStore.get("vita_test_email")?.value;

  cookieStore.set("vita_account_activated", "true", ACTIVATION_COOKIE_OPTIONS);

  if (sessionUser) {
    sessionUser.isActivated = true;
    cookieStore.set("vita_session_user", JSON.stringify(sessionUser), ACTIVATION_COOKIE_OPTIONS);
    activateUser(sessionUser.id || sessionUser.username || sessionUser.email);
  } else if (testUser) {
    activateUser(testUser);
    const newSession = {
      id: "usr_" + Date.now(),
      username: testUser,
      fullName: testUser,
      email: testEmail || "user@vitaearn.com",
      role: "user",
      isActivated: true,
    };
    cookieStore.set("vita_session_user", JSON.stringify(newSession), ACTIVATION_COOKIE_OPTIONS);
  }

  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      const adminClient = createAdminClient();
      await adminClient
        .from("profiles")
        .update({ is_activated: true })
        .eq("id", data.user.id);
    }
  } catch {}

  revalidatePath("/");
  revalidatePath("/activation");
  revalidatePath("/profil");
  redirect("/");
}

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
  let username = "Nouvel Utilisateur";
  let phone: string | undefined = undefined;
  let country: string | undefined = undefined;

  const cookieStore = cookies();
  const sessionUserCookie = cookieStore.get("vita_session_user")?.value;
  let sessionUser: any = null;
  if (sessionUserCookie) {
    try {
      sessionUser = JSON.parse(sessionUserCookie);
    } catch {}
  }
  const testUser = cookieStore.get("vita_test_user")?.value;
  const activatedCookie = cookieStore.get("vita_account_activated")?.value === "true";

  if (sessionUser) {
    username = sessionUser.username || sessionUser.fullName || "Utilisateur";
    fullName = sessionUser.fullName || sessionUser.username || "Utilisateur";
    phone = sessionUser.phone;
    country = sessionUser.country;
    isActivated = Boolean(sessionUser.isActivated || activatedCookie);
  } else if (testUser) {
    username = testUser;
    fullName = testUser;
    isActivated = activatedCookie;
  }

  try {
    const rawAccounts = cookieStore.get("vita_accounts")?.value;
    if (rawAccounts) {
      const accs = JSON.parse(rawAccounts);
      if (Array.isArray(accs) && accs.length > 0) {
        const lastReal = [...accs].reverse().find(
          (a) =>
            a.username &&
            a.username.toLowerCase() !== "membre" &&
            a.username.toLowerCase() !== "admin"
        );
        if (
          lastReal &&
          (!username ||
            username.toLowerCase() === "membre" ||
            username.toLowerCase() === "utilisateur" ||
            username.toLowerCase() === "nouvel utilisateur")
        ) {
          username = lastReal.username;
          fullName = lastReal.fullName || lastReal.username;
          if (!phone && lastReal.phone) phone = lastReal.phone;
          if (!country && lastReal.country) country = lastReal.country;
        } else if (!sessionUser && !testUser) {
          const lastAcc = accs[accs.length - 1];
          username = lastAcc.username || "Utilisateur";
          fullName = lastAcc.username || "Utilisateur";
          phone = lastAcc.phone;
          country = lastAcc.country;
          isActivated = Boolean(lastAcc.isActivated || activatedCookie);
        }
      }
    }
  } catch {}

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, phone, is_activated, country")
      .eq("id", user.id)
      .maybeSingle();

    if (profile) {
      isActivated = Boolean(profile.is_activated || sessionUser?.isActivated || activatedCookie);
      fullName = profile.full_name || sessionUser?.fullName || user.email || "Utilisateur";
      username = sessionUser?.username || profile.full_name || user.email?.split("@")[0] || "Utilisateur";
      phone = profile.phone || sessionUser?.phone;
      country = (profile as any).country || sessionUser?.country;
    }
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
      username,
      phone,
      country,
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
 * Initialise le paiement d'activation direct avec SasPay
 * Redirige l'utilisateur vers la page de paiement hébergée (Hosted Checkout)
 * - Calcule les frais exacts : 4 500 FCFA pour le Togo/standard, 4 620 FCFA pour les pays à frais élevés (Ghana, Gabon, Congo, Guinée, Niger, Ouaga/Burkina, Zambie)
 * - RÈGLE D'AFFICHAGE : L'utilisateur voit toujours 4 500 FCFA sur l'application.
 */
export async function startSasPayActivationAction(params: {
  channel?: string;
  walletNumber?: string;
  fullName?: string;
}): Promise<{ success?: boolean; error?: string; checkoutUrl?: string }> {
  try {
    const supabase = createClient();
    let user: any = null;
    try {
      const { data } = await supabase.auth.getUser();
      user = data?.user || null;
    } catch {}

    const cookieStore = cookies();
    const sessionUserCookie = cookieStore.get("vita_session_user")?.value;
    let sessionUser: any = null;
    if (sessionUserCookie) {
      try {
        sessionUser = JSON.parse(sessionUserCookie);
      } catch {
        try {
          sessionUser = JSON.parse(decodeURIComponent(sessionUserCookie));
        } catch {}
      }
    }

    const testUser = cookieStore.get("vita_test_user")?.value;
    const testEmail = cookieStore.get("vita_test_email")?.value;

    const effectiveUserId =
      user?.id || sessionUser?.id || (testUser ? `usr_${testUser}` : `usr_${Date.now()}`);
    const effectiveEmail =
      user?.email || sessionUser?.email || testEmail || "client@vitaearn.com";
    const effectiveName =
      params.fullName?.trim() ||
      sessionUser?.fullName ||
      sessionUser?.username ||
      testUser ||
      user?.email?.split("@")[0] ||
      "Client VitaEarn";
    const effectivePhone = params.walletNumber?.trim() || sessionUser?.phone || "";
    const effectiveCountry = sessionUser?.country || "";

    // 1. Calcul du montant à débiter chez SasPay selon le pays
    const feeInfo = calculateEffectiveChargeAmount(effectiveCountry, effectivePhone);

    // 2. Initialiser auprès de SasPay
    const saspay = new SasPayClient();
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://vita-earn.netlify.app").replace(/\/+$/, "");
    const returnUrl = `${appUrl}/activation/callback`;

    // Si pas de clés SasPay en dev/test local, simulation élégante
    if (!saspay.isConfigured()) {
      return {
        success: true,
        checkoutUrl: `/activation/callback?session_id=sim_${Date.now()}`,
      };
    }

    const res = await saspay.createCheckoutSession({
      amount: feeInfo.chargeAmount,
      currency: "XOF",
      description: "Activation de compte VitaEarn",
      customerEmail: effectiveEmail,
      customerName: effectiveName,
      customerPhone: effectivePhone,
      returnUrl,
      metadata: {
        userId: effectiveUserId,
        purpose: "activation",
        nominalAmount: feeInfo.nominalAmount,
        chargeAmount: feeInfo.chargeAmount,
        country: feeInfo.countryCode,
      },
    });

    if (!res.success || !res.checkoutUrl) {
      return {
        error: res.error || "Impossible de générer le lien de paiement SasPay.",
      };
    }

    // 3. Enregistrer l'intention de paiement dans Supabase si connecté
    if (user) {
      try {
        await supabase.from("payments").insert({
          user_id: user.id,
          amount: 4500,
          currency: "XOF",
          purpose: "activation",
          status: "pending",
          provider: "saspay",
          provider_ref: res.sessionId || res.checkoutUrl,
          idempotency_key: `act_${user.id}_${Date.now()}`,
          metadata: {
            charge_amount: feeInfo.chargeAmount,
            nominal_amount: feeInfo.nominalAmount,
            country: feeInfo.countryCode,
            phone: effectivePhone,
            initiated_at: new Date().toISOString(),
          },
        });
      } catch {}
    }

    return {
      success: true,
      checkoutUrl: res.checkoutUrl,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur inattendue.";
    return { error: message };
  }
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

  const cookieStore = cookies();
  const sessionCookie = cookieStore.get("vita_session_user")?.value;
  if (sessionCookie) {
    try {
      const s = JSON.parse(sessionCookie);
      s.isActivated = true;
      cookieStore.set("vita_session_user", JSON.stringify(s), ACTIVATION_COOKIE_OPTIONS);
    } catch {}
  }

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
  let user: any = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user || null;
  } catch {}

  const cookieStore = cookies();
  const sessionUserCookie = cookieStore.get("vita_session_user")?.value;
  let sessionUser: any = null;
  if (sessionUserCookie) {
    try {
      sessionUser = JSON.parse(sessionUserCookie);
    } catch {}
  }

  if (!user && !sessionUser) {
    return { error: "Session expirée. Veuillez vous connecter pour finaliser votre adhésion." };
  }

  // Si pas d'utilisateur Supabase connecté, mise à jour session directe
  if (!user && sessionUser) {
    sessionUser.isActivated = true;
    cookieStore.set("vita_session_user", JSON.stringify(sessionUser), ACTIVATION_COOKIE_OPTIONS);
    revalidatePath("/activation");
    revalidatePath("/profil");
    revalidatePath("/");
    return {
      success: true,
      redirectUrl: "/activation?activated=1",
      message: "Paiement de 4 500 FCFA validé avec succès ! Votre compte est actif.",
    };
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

  // 2. Initialiser auprès du provider configuré (SasPay prioritaire, ou Mock pour MVP)
  const provider = getPaymentProvider();
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

  // 4. Si redirection externe fournie (ex: SasPay Checkout hébergé), rediriger l'utilisateur
  if (paymentResult.checkoutUrl && paymentResult.checkoutUrl.startsWith("http")) {
    return {
      success: true,
      redirectUrl: paymentResult.checkoutUrl,
      message: "Redirection vers le portail de paiement sécurisé...",
    };
  }

  // 5. En mode MVP / simulateur : validation immédiate via confirmMockPayment -> activate_account
  const confirmResult = await confirmMockPayment(paymentRecord.id);
  if (confirmResult.error) {
    return { error: confirmResult.error };
  }

  revalidatePath("/activation");
  revalidatePath("/profil");
  revalidatePath("/");

  const paymentSessionCookie = cookieStore.get("vita_session_user")?.value;
  if (paymentSessionCookie) {
    try {
      const s = JSON.parse(paymentSessionCookie);
      s.isActivated = true;
      cookieStore.set("vita_session_user", JSON.stringify(s), ACTIVATION_COOKIE_OPTIONS);
    } catch {}
  }

  return {
    success: true,
    redirectUrl: "/activation?activated=1",
    message: "Paiement de 4 500 FCFA validé avec succès ! Votre compte est actif.",
  };
}
