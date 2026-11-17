"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface SupportSettings {
  email: string;
  telegram: string;
  telegramUsername: string;
}

const DEFAULT_SUPPORT_SETTINGS: SupportSettings = {
  email: "support@vitaearn.com",
  telegram: "https://t.me/vitaearn_officiel",
  telegramUsername: "@vitaearn_officiel",
};

/**
 * Récupérer les coordonnées du support (Email & Telegram).
 * Priorité : platform_settings dans Supabase -> Cookie admin -> Valeur par défaut.
 */
export async function getSupportSettingsAction(): Promise<SupportSettings> {
  try {
    const isConfigured =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

    // Vérifier d'abord le cookie pour le mode test / local
    const cookieStore = cookies();
    const cookieSettings = cookieStore.get("vita_support_settings")?.value;
    let fallbackSettings = DEFAULT_SUPPORT_SETTINGS;
    if (cookieSettings) {
      try {
        fallbackSettings = { ...DEFAULT_SUPPORT_SETTINGS, ...JSON.parse(cookieSettings) };
      } catch {}
    }

    if (!isConfigured) {
      return fallbackSettings;
    }

    const adminClient = createAdminClient();
    const { data } = await adminClient
      .from("platform_settings")
      .select("value")
      .eq("key", "support_settings")
      .maybeSingle();

    if (data?.value) {
      const val = data.value as Partial<SupportSettings>;
      return {
        email: val.email || fallbackSettings.email,
        telegram: val.telegram || fallbackSettings.telegram,
        telegramUsername: val.telegramUsername || fallbackSettings.telegramUsername,
      };
    }

    return fallbackSettings;
  } catch (error) {
    console.error("Erreur lors de la lecture des réglages support:", error);
    return DEFAULT_SUPPORT_SETTINGS;
  }
}

/**
 * Mise à jour des coordonnées de support par l'administrateur.
 */
export async function updateSupportSettingsAction(settings: Partial<SupportSettings>) {
  try {
    const cookieStore = cookies();
    const current = await getSupportSettingsAction();
    const updated: SupportSettings = {
      email: settings.email?.trim() || current.email,
      telegram: settings.telegram?.trim() || current.telegram,
      telegramUsername: settings.telegramUsername?.trim() || current.telegramUsername,
    };

    // Sauvegarde en cookie
    cookieStore.set("vita_support_settings", JSON.stringify(updated), {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    });

    const isConfigured =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

    if (isConfigured) {
      const adminClient = createAdminClient();
      await adminClient.from("platform_settings").upsert(
        {
          key: "support_settings",
          value: updated,
          description: "Coordonnées officielles du support (Email & Telegram)",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );
    }

    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true, message: "Coordonnées de support mises à jour avec succès !", settings: updated };
  } catch (error) {
    console.error("Erreur mise à jour réglages support:", error);
    return { success: false, message: "Impossible d'enregistrer les coordonnées de support." };
  }
}

/**
 * Envoi d'un message direct au support depuis la modale ou la page support.
 */
export async function sendSupportMessageAction(formData: {
  name: string;
  email: string;
  subject?: string;
  message: string;
}) {
  try {
    const isConfigured =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

    if (!formData.message?.trim()) {
      return { success: false, message: "Le message ne peut pas être vide." };
    }

    if (isConfigured) {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const adminClient = createAdminClient();
      await adminClient.from("audit_logs").insert({
        user_id: user?.id || null,
        action: "support_message_received",
        entity_type: "support_ticket",
        payload: {
          name: formData.name,
          email: formData.email,
          subject: formData.subject || "Demande d'assistance",
          message: formData.message,
          created_at: new Date().toISOString(),
        },
      });
    }

    return {
      success: true,
      message: "Votre message a été transmis avec succès à notre équipe d'assistance. Nous vous répondrons dans les plus brefs délais.",
    };
  } catch (error) {
    console.error("Erreur envoi message support:", error);
    return { success: false, message: "Une erreur est survenue lors de l'envoi de votre message." };
  }
}
