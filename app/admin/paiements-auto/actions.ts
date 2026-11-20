"use server";

import { revalidatePath } from "next/cache";
import { checkAdminSession, isAdminUnlocked } from "@/lib/security/admin-lock";
import {
  saveAutoPaymentCountrySettings,
  getAutoPaymentCountrySettings,
  type AutoPaymentCountrySettings,
} from "@/lib/data/auto-payment-countries-store";

export interface SaveAutoPaymentResult {
  success: boolean;
  message?: string;
  error?: string;
  settings?: AutoPaymentCountrySettings;
}

export async function saveAutoPaymentCountriesAction(input: {
  suspendedCountries: string[];
  customMessage?: string;
  adminEmail?: string;
}): Promise<SaveAutoPaymentResult> {
  const { isAdmin, userEmail } = await checkAdminSession();
  if (!isAdmin) {
    return {
      success: false,
      error: "Accès refusé : privilèges administrateur requis.",
    };
  }

  const unlocked = await isAdminUnlocked();
  if (!unlocked) {
    return {
      success: false,
      error: "Accès verrouillé : veuillez déverrouiller l'administration sur /admin/lock.",
    };
  }

  const res = await saveAutoPaymentCountrySettings(input, userEmail || "admin");
  if (!res.success) {
    return {
      success: false,
      error: res.error || "Erreur de sauvegarde des paramètres.",
    };
  }

  revalidatePath("/admin/paiements-auto");
  revalidatePath("/activation/paiement");
  revalidatePath("/activation");

  return {
    success: true,
    message: "Paramètres des pays et paiements automatiques enregistrés avec succès.",
    settings: res.settings,
  };
}
