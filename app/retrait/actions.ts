"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
  reference: string;
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

  let fullName = "Utilisateur";
  let username = "Utilisateur";
  let email = "user@vitaearn.com";
  let phone = "+228 90 00 00 00";
  let isActivated = Boolean(isActivatedCookie);
  let balance = 4500; // Solde par défaut ou crédité
  let totalWithdrawn = 0;

  // Récupérer depuis les comptes locaux
  if (sessionUser) {
    username = sessionUser.username || "Utilisateur";
    fullName = sessionUser.fullName || sessionUser.username || "Utilisateur";
    email = sessionUser.email || "user@vitaearn.com";
    phone = sessionUser.phone || "+228 90 00 00 00";
    isActivated = Boolean(sessionUser.isActivated || isActivatedCookie);
  } else if (testUser) {
    username = testUser;
    fullName = testUser;
    isActivated = true;
  }

  // Solde spécial pour Koffi ou autres comptes démo
  if (username.toLowerCase() === "koffi") {
    balance = 1070;
    totalWithdrawn = 445249;
  }

  // Calcul du solde après retraits locaux sauvegardés
  try {
    const rawW = cookieStore.get("vita_withdrawals")?.value;
    if (rawW) {
      const records: WithdrawalRecord[] = JSON.parse(rawW);
      if (Array.isArray(records)) {
        const sumWithdrawn = records.reduce((acc, r) => acc + (r.amount || 0), 0);
        totalWithdrawn += sumWithdrawn;
        balance = Math.max(0, balance - sumWithdrawn);
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
    minWithdrawal: 1000,
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
      localRecords = JSON.parse(rawW);
      if (!Array.isArray(localRecords)) localRecords = [];
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
  if (isNaN(amount) || amount < 1000) {
    return { error: "Le montant minimum de retrait est de 1 000 FCFA." };
  }

  const fee = 500;
  const netAmount = Math.max(0, amount - fee);

  const cookieStore = cookies();
  const sessionUserCookie = cookieStore.get("vita_session_user")?.value;
  let sessionUser: any = null;
  if (sessionUserCookie) {
    try {
      sessionUser = JSON.parse(sessionUserCookie);
    } catch {}
  }

  const phone = (formData.get("phone") as string)?.trim() || sessionUser?.phone || "+228 90 00 00 00";
  const accountName = (formData.get("accountName") as string)?.trim() || sessionUser?.fullName || sessionUser?.username || "Titulaire du compte";

  // Sauvegarde dans l'historique des retraits
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
    message: `Votre demande de retrait de ${amount.toLocaleString("fr-FR")} FCFA vers ${operator} a été enregistrée avec succès (Frais: 500 FCFA, Net reçu: ${netAmount.toLocaleString("fr-FR")} FCFA). Référence : ${newRecord.reference}.`,
    netAmount,
    fee,
  };
}
