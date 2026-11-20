"use server";

import { revalidatePath } from "next/cache";
import { checkAdminSession, isAdminUnlocked } from "@/lib/security/admin-lock";
import {
  saveAlternativePaymentSettings,
  getAlternativePaymentSettings,
  type AlternativePaymentSettings,
} from "@/lib/data/alternative-payment-store";

/**
 * Sauvegarde la configuration du paiement alternatif (réservé exclusivement aux administrateurs)
 */
export async function saveAlternativePaymentAction(input: {
  isEnabled: boolean;
  paymentUrl: string;
  buttonLabel?: string;
  userMessage?: string;
  targetCountries: string[];
  allCountries: boolean;
  email?: string;
  whatsappNumber?: string;
  postPaymentInstructions?: string;
}): Promise<{
  success: boolean;
  error?: string;
  message?: string;
  settings?: AlternativePaymentSettings;
}> {
  // 1. Contrôle d'accès strict côté serveur
  const { isAdmin, userEmail } = await checkAdminSession();
  if (!isAdmin) {
    return {
      success: false,
      error: "Accès refusé (403) : Seul un administrateur authentifié peut modifier ces paramètres.",
    };
  }

  const unlocked = await isAdminUnlocked();
  if (!unlocked) {
    return {
      success: false,
      error: "Accès verrouillé : Veuillez déverrouiller la session administrateur sur /admin/lock.",
    };
  }

  // 2. Enregistrement avec validation et écriture dans l'audit_log
  const res = await saveAlternativePaymentSettings(input, userEmail || "admin");
  if (!res.success) {
    return {
      success: false,
      error: res.error || "Erreur lors de la sauvegarde des paramètres.",
    };
  }

  // 3. Revalidation immédiate sans cache
  revalidatePath("/admin/paiement-alternatif");
  revalidatePath("/activation/paiement");
  revalidatePath("/activation");

  return {
    success: true,
    message: "Paramètres du paiement alternatif enregistrés et appliqués en direct.",
    settings: res.settings,
  };
}

/**
 * Récupère les paramètres complets pour le panneau d'administration
 */
export async function getAdminAlternativePaymentData(): Promise<AlternativePaymentSettings> {
  const { isAdmin } = await checkAdminSession();
  if (!isAdmin) {
    throw new Error("Accès refusé (403) : privilèges administrateur requis.");
  }
  return await getAlternativePaymentSettings();
}
