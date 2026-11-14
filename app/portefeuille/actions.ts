"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const withdrawalSchema = z.object({
  amount: z.number().int().min(2000, "Le montant minimum de retrait est de 2 000 FCFA."),
  paymentMethod: z.enum([
    "tmoney",
    "flooz",
    "wave",
    "mtn_momo",
    "orange",
    "moov",
    "free",
    "celtiis",
    "airtel",
  ]),
  phoneNumber: z.string().min(6, "Numéro de téléphone Mobile Money requis."),
  accountName: z.string().min(2, "Nom du bénéficiaire requis."),
});

export async function requestWithdrawalAction(formData: FormData): Promise<{
  success?: boolean;
  error?: string;
  message?: string;
}> {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Session expirée. Veuillez vous reconnecter." };
  }

  // 1. Validation des champs
  const rawData = {
    amount: parseInt(formData.get("amount") as string, 10),
    paymentMethod: formData.get("paymentMethod") as string,
    phoneNumber: formData.get("phoneNumber") as string,
    accountName: formData.get("accountName") as string,
  };

  const parsed = withdrawalSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message || "Données de retrait invalides." };
  }

  const { amount, paymentMethod, phoneNumber, accountName } = parsed.data;

  // 2. Vérification du solde disponible côté serveur
  const { data: wb, error: wbError } = await supabase
    .from("wallet_balances")
    .select("balance, available_balance")
    .eq("user_id", user.id)
    .maybeSingle();

  if (wbError || !wb) {
    return { error: "Portefeuille introuvable." };
  }

  const currentAvailable = Number(wb.available_balance ?? wb.balance) || 0;
  if (currentAvailable < amount) {
    return {
      error: `Solde disponible insuffisant (${currentAvailable.toLocaleString("fr-FR")} FCFA disponibles, ${amount.toLocaleString("fr-FR")} FCFA demandés).`,
    };
  }

  // 3. Appel de la fonction SQL RPC request_withdrawal avec la clé service_role (Règle 2)
  try {
    const adminClient = createAdminClient();
    const { data: rpcResult, error: rpcError } = await adminClient.rpc("request_withdrawal", {
      p_user_id: user.id,
      p_amount: amount,
      p_payment_method: paymentMethod,
      p_phone_number: phoneNumber.trim(),
      p_account_name: accountName.trim(),
    });

    if (rpcError) {
      return { error: rpcError.message || "Erreur lors de la réservation des fonds." };
    }

    revalidatePath("/portefeuille");
    revalidatePath("/");

    return {
      success: true,
      message: `Votre demande de retrait de ${amount.toLocaleString("fr-FR")} FCFA a été enregistrée avec succès. Les fonds ont été réservés en attente de traitement.`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur inattendue.";
    return { error: message };
  }
}
