"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkWithdrawalRateLimit } from "@/lib/security/rate-limit";

export interface WithdrawalRecord {
  id: string;
  amount: number;
  fee?: number;
  netAmount?: number;
  paymentMethod: string;
  phoneNumber: string;
  accountName: string;
  status: "pending" | "processing" | "completed";
  createdAt: string;
  processedAt?: string;
  reference: string;
  estimatedDelay?: string;
}

export interface WithdrawalPageData {
  user: {
    id: string;
    fullName: string;
    username: string;
    email: string;
    phone: string;
    isActivated: boolean;
  };
  balance: number;
  totalWithdrawn: number;
  minWithdrawal: number;
}

/**
 * Récupère les informations de compte et le solde pour la page de retrait
 */
export async function getWithdrawalData(): Promise<WithdrawalPageData> {
  const cookieStore = cookies();
  const sessionUserCookie = cookieStore.get("vita_session_user")?.value;
  let sessionUser: any = null;
  if (sessionUserCookie) {
    try {
      sessionUser = JSON.parse(sessionUserCookie);
    } catch {}
  }
  const testUser = cookieStore.get("vita_test_user")?.value;
  const isActivatedCookie = cookieStore.get("vita_account_activated")?.value === "true";

  const registeredPhoneCookie = cookieStore.get("vita_registered_phone")?.value;

  let fullName = "Utilisateur";
  let username = "Utilisateur";
  let email = "user@vitaearn.com";
  let phone = registeredPhoneCookie || sessionUser?.phone || "";
  let isActivated = Boolean(isActivatedCookie);
  let balance = 4500; // Solde par défaut ou crédité
  let totalWithdrawn = 0;
  let sumWithdrawnCookie = 0;

  // Récupérer depuis les comptes locaux
  if (sessionUser) {
    username = sessionUser.username || "Utilisateur";
    fullName = sessionUser.fullName || sessionUser.username || "Utilisateur";
    email = sessionUser.email || "user@vitaearn.com";
    if (!phone && sessionUser.phone) phone = sessionUser.phone;
    isActivated = Boolean(sessionUser.isActivated || isActivatedCookie);
  } else if (testUser) {
    username = testUser;
    fullName = testUser;
    isActivated = true;
  }

  // Chercher dans le coffre vita_accounts pour retrouver le numéro exact d'inscription
  try {
    const rawAccounts = cookieStore.get("vita_accounts")?.value;
    if (rawAccounts) {
      const accs = JSON.parse(rawAccounts);
      if (Array.isArray(accs) && accs.length > 0) {
        const found =
          [...accs].reverse().find(
            (a) =>
              (username && a.username?.toLowerCase() === username.toLowerCase()) ||
              (email && a.email?.toLowerCase() === email.toLowerCase()) ||
              (testUser && a.username?.toLowerCase() === testUser.toLowerCase())
          ) || [...accs].reverse().find((a) => a.phone);

        if (found) {
          if (!phone && found.phone) phone = found.phone;
          if (username === "Utilisateur" && found.username) username = found.username;
          if (fullName === "Utilisateur" && (found.fullName || found.username)) {
            fullName = found.fullName || found.username;
          }
        }
      }
    }
  } catch {}

  // Solde spécial pour Koffi ou autres comptes démo
  if (username.toLowerCase() === "koffi") {
    balance = 1070;
    totalWithdrawn = 445249;
  }

  // Calcul des retraits locaux sauvegardés
  try {
    const rawW = cookieStore.get("vita_withdrawals")?.value;
    if (rawW) {
      const records: WithdrawalRecord[] = JSON.parse(rawW);
      if (Array.isArray(records)) {
        sumWithdrawnCookie = records.reduce((acc, r) => acc + (r.amount || 0), 0);
      }
    }
  } catch {}

  // Si Supabase est connecté, lire la vue wallet_balances
  try {
    const supabase = createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone, is_activated")
        .eq("id", authUser.id)
        .maybeSingle();

      if (profile) {
        fullName = profile.full_name || fullName;
        phone = profile.phone || phone;
        isActivated = Boolean(profile.is_activated || isActivated);
      }

      const { data: wb } = await supabase
        .from("wallet_balances")
        .select("balance, available_balance, total_withdrawn")
        .eq("user_id", authUser.id)
        .maybeSingle();

      if (wb) {
        balance = Number(wb.available_balance ?? wb.balance) || 0;
        totalWithdrawn = Number(wb.total_withdrawn) || 0;
      }
    }
  } catch {}

  // Application stricte de la déduction immédiate de tous les retraits
  if (sumWithdrawnCookie > 0) {
    totalWithdrawn += sumWithdrawnCookie;
    balance = Math.max(0, balance - sumWithdrawnCookie);
  }

  return {
    user: {
      id: sessionUser?.id || "usr_current",
      fullName,
      username,
      email,
      phone,
      isActivated,
    },
    balance,
    totalWithdrawn,
    minWithdrawal: 4500,
  };
}

/**
 * Récupère l'historique complet des retraits
 */
export async function getWithdrawalHistory(): Promise<WithdrawalRecord[]> {
  const cookieStore = cookies();
  let localRecords: WithdrawalRecord[] = [];

  try {
    const rawW = cookieStore.get("vita_withdrawals")?.value;
    if (rawW) {
      const parsed = JSON.parse(rawW);
      if (Array.isArray(parsed)) {
        localRecords = parsed.map((r) => ({
          ...r,
          fee: r.fee ?? 500,
          netAmount: r.netAmount ?? Math.max(0, (r.amount || 0) - 500),
          estimatedDelay: r.estimatedDelay ?? "10 minutes à 24 heures",
        }));
      }
    }
  } catch {}

  // Récupérer depuis Supabase si connecté
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: userWithdrawals } = await supabase
        .from("withdrawals")
        .select("id, amount, payment_method, phone_number, status, created_at, provider_ref")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (userWithdrawals && userWithdrawals.length > 0) {
        const mapped: WithdrawalRecord[] = userWithdrawals.map((w: any) => ({
          id: w.id,
          amount: Number(w.amount),
          paymentMethod: w.payment_method || "T-Money",
          phoneNumber: w.phone_number || "",
          accountName: "Bénéficiaire",
          status: w.status === "paid" || w.status === "approved" ? "completed" : "pending",
          createdAt: w.created_at,
          reference: w.provider_ref || "WDR-" + w.id.substring(0, 8).toUpperCase(),
        }));
        return mapped;
      }
    }
  } catch {}

  // Données de démonstration si aucun historique pour les comptes connus (ex: Koffi)
  const testUser = cookieStore.get("vita_test_user")?.value;
  if (localRecords.length === 0 && testUser?.toLowerCase() === "koffi") {
    return [
      {
        id: "wdr_101",
        amount: 150000,
        paymentMethod: "T-Money Togo (+228)",
        phoneNumber: "+228 90 •• •• 88",
        accountName: "Koffi Mensah",
        status: "completed",
        createdAt: "2026-11-12T14:30:00Z",
        reference: "TX-TM-89421",
      },
      {
        id: "wdr_102",
        amount: 200000,
        paymentMethod: "Moov Flooz Togo (+228)",
        phoneNumber: "+228 98 •• •• 12",
        accountName: "Koffi Mensah",
        status: "completed",
        createdAt: "2026-11-08T10:15:00Z",
        reference: "TX-FL-44019",
      },
      {
        id: "wdr_103",
        amount: 95249,
        paymentMethod: "T-Money Togo (+228)",
        phoneNumber: "+228 90 •• •• 88",
        accountName: "Koffi Mensah",
        status: "completed",
        createdAt: "2026-11-01T16:45:00Z",
        reference: "TX-TM-11093",
      },
    ];
  }

  return localRecords;
}

/**
 * Enregistre une nouvelle demande de retrait Mobile Money
 */
export async function submitWithdrawalAction(formData: FormData): Promise<{
  success?: boolean;
  error?: string;
  message?: string;
  netAmount?: number;
  fee?: number;
}> {
  const amountStr = formData.get("amount") as string;
  const operator = (formData.get("operator") as string) || "T-Money Togo (+228)";

  const amount = parseInt(amountStr, 10);
  const minWithdrawal = 4500;
  if (isNaN(amount) || amount < minWithdrawal) {
    return { error: `Le montant minimum de retrait est de ${minWithdrawal.toLocaleString("fr-FR")} FCFA.` };
  }

  const fee = 500; // Frais de retrait fixes : 500 FCFA
  const netAmount = Math.max(0, amount - fee);

  const cookieStore = cookies();
  const sessionUserCookie = cookieStore.get("vita_session_user")?.value;
  let sessionUser: any = null;
  if (sessionUserCookie) {
    try {
      sessionUser = JSON.parse(sessionUserCookie);
    } catch {}
  }

  const registeredPhoneCookie = cookieStore.get("vita_registered_phone")?.value;
  let phone = (formData.get("phone") as string)?.trim() || registeredPhoneCookie || sessionUser?.phone || "";

  if (!phone) {
    try {
      const rawAccounts = cookieStore.get("vita_accounts")?.value;
      if (rawAccounts) {
        const accs = JSON.parse(rawAccounts);
        if (Array.isArray(accs) && accs.length > 0) {
          const found = [...accs].reverse().find((a) => a.phone);
          if (found?.phone) phone = found.phone;
        }
      }
    } catch {}
  }
  if (!phone) phone = "+228 90 00 00 00";

  const accountName = (formData.get("accountName") as string)?.trim() || sessionUser?.fullName || sessionUser?.username || "Titulaire du compte";

  // RÈGLE ABSOLUE P0 : Exécution atomique par la fonction SQL request_withdrawal (service_role)
  // Vérifie le solde en temps réel dans le grand livre, verrouille le montant et enregistre le débit immédiat.
  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

  if (isConfigured) {
    const supabase = createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return { error: "Session expirée. Veuillez vous reconnecter." };
    }

    // RÈGLE P2 : Limiter les demandes de retrait par utilisateur (anti-spam / anti-race condition)
    const wLimit = checkWithdrawalRateLimit(user.id);
    if (!wLimit.allowed) {
      return {
        error: `Veuillez patienter ${wLimit.resetInSeconds} secondes avant de soumettre une nouvelle demande de retrait.`,
      };
    }

    const adminClient = createAdminClient();
    const cleanMethod = operator.toLowerCase().includes("flooz")
      ? "flooz"
      : operator.toLowerCase().includes("wave")
      ? "wave"
      : operator.toLowerCase().includes("mtn")
      ? "mtn_momo"
      : "tmoney";

    const { error: rpcErr } = await adminClient.rpc("request_withdrawal", {
      p_user_id: user.id,
      p_amount: amount,
      p_payment_method: cleanMethod,
      p_phone_number: phone,
      p_account_name: accountName,
    });

    if (rpcErr) {
      return {
        error:
          rpcErr.message?.includes("Solde insuffisant")
            ? "Solde insuffisant pour effectuer ce retrait."
            : rpcErr.message || "Erreur lors de la validation du retrait.",
      };
    }
  }

  // Sauvegarde dans l'historique des retraits (session/cookie de confort utilisateur)
  let existingRecords: WithdrawalRecord[] = [];
  try {
    const raw = cookieStore.get("vita_withdrawals")?.value;
    if (raw) existingRecords = JSON.parse(raw);
    if (!Array.isArray(existingRecords)) existingRecords = [];
  } catch {}

  const newRecord: WithdrawalRecord = {
    id: "wdr_" + Date.now().toString(36),
    amount,
    fee,
    netAmount,
    paymentMethod: operator,
    phoneNumber: phone,
    accountName,
    status: "processing",
    createdAt: new Date().toISOString(),
    reference: "WDR-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
    estimatedDelay: "10 minutes à 24 heures",
  };

  existingRecords.unshift(newRecord);

  cookieStore.set("vita_withdrawals", JSON.stringify(existingRecords), {
    path: "/",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  // Si Supabase est connecté, créer également l'enregistrement en base
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const adminClient = createAdminClient();
      await adminClient.from("withdrawals").insert({
        user_id: user.id,
        amount: amount,
        fee: fee,
        net_amount: netAmount,
        payment_method: operator.toLowerCase().includes("flooz") ? "flooz" : "tmoney",
        phone_number: phone,
        status: "pending",
        provider_ref: newRecord.reference,
      });
    }
  } catch {}

  revalidatePath("/");
  revalidatePath("/retrait");
  revalidatePath("/retrait/historique");
  revalidatePath("/portefeuille");

  return {
    success: true,
    message: `Votre demande de retrait de ${amount.toLocaleString("fr-FR")} FCFA vers ${operator} a été enregistrée avec succès (Frais fixes : 500 FCFA, Net reçu : ${netAmount.toLocaleString("fr-FR")} FCFA). Référence : ${newRecord.reference}. Délai estimé de virement : 10 minutes à 24 heures.`,
    netAmount,
    fee,
  };
}

/**
 * Valide un retrait (réservé strictement aux administrateurs pour approbation)
 */
export async function simulateValidateWithdrawalAction(withdrawalId: string): Promise<{
  success: boolean;
  message?: string;
}> {
  // RÈGLE DE SÉCURITÉ P0 : Seuls les administrateurs vérifiés en base peuvent valider des retraits
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Authentification requise." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { success: false, message: "Action réservée aux administrateurs." };
  }

  const cookieStore = cookies();
  try {
    const raw = cookieStore.get("vita_withdrawals")?.value;
    if (raw) {
      const records: WithdrawalRecord[] = JSON.parse(raw);
      if (Array.isArray(records)) {
        const item = records.find((r) => r.id === withdrawalId || r.reference === withdrawalId);
        if (item) {
          item.status = "completed";
          item.processedAt = new Date().toISOString();
          cookieStore.set("vita_withdrawals", JSON.stringify(records), {
            path: "/",
            httpOnly: true,
            maxAge: 60 * 60 * 24 * 365,
            sameSite: "lax",
          });
          revalidatePath("/retrait");
          revalidatePath("/retrait/historique");
          revalidatePath("/portefeuille");
          revalidatePath("/");
          return { success: true, message: "Le paiement a été validé et notifié avec succès." };
        }
      }
    }
  } catch {}
  return { success: false, message: "Retrait introuvable." };
}

