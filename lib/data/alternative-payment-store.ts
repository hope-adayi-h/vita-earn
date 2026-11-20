import fs from "fs";
import path from "path";
import os from "os";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCountryByCode } from "@/lib/countries";

export interface AlternativePaymentSettings {
  isEnabled: boolean;
  paymentUrl: string;
  buttonLabel: string;
  userMessage: string;
  targetCountries: string[]; // Codes ISO 2 lettres ex: ["TG", "BJ"]
  allCountries: boolean;
  email: string;
  whatsappNumber?: string;
  postPaymentInstructions: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface AlternativePaymentUserView {
  paymentUrl: string;
  buttonLabel: string;
  userMessage: string;
  email: string | null;
  postPaymentInstructions: string;
}

const DEFAULT_SETTINGS: AlternativePaymentSettings = {
  isEnabled: false,
  paymentUrl: "",
  buttonLabel: "Payer via un lien alternatif",
  userMessage: "Si le paiement habituel ne fonctionne pas, utilisez ce lien.",
  targetCountries: [],
  allCountries: false,
  email: "support@vitaearn.com",
  whatsappNumber: "",
  postPaymentInstructions:
    "Après ton paiement, envoie la capture d'écran de ta transaction à l'adresse ci-dessous. Ton compte sera activé après vérification.",
  updatedAt: "2026-11-20T00:00:00.000Z",
  updatedBy: "superadmin",
};

function getStorageFilePath(): string {
  try {
    const localDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const testFile = path.join(localDir, ".test_alt_write");
    fs.writeFileSync(testFile, "1");
    fs.unlinkSync(testFile);
    return path.join(localDir, "alternative_payment_settings.json");
  } catch {
    const tmpDir = path.join(os.tmpdir(), "vita_earn_data");
    if (!fs.existsSync(tmpDir)) {
      try {
        fs.mkdirSync(tmpDir, { recursive: true });
      } catch {}
    }
    return path.join(tmpDir, "alternative_payment_settings.json");
  }
}

/**
 * Récupère les paramètres actuels du paiement alternatif
 */
export async function getAlternativePaymentSettings(): Promise<AlternativePaymentSettings> {
  // 1. Tenter depuis Supabase si configuré
  try {
    const isConfigured =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

    if (isConfigured) {
      const adminClient = createAdminClient();
      const { data, error } = await adminClient
        .from("alternative_payment_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();

      if (!error && data) {
        return {
          isEnabled: Boolean(data.is_enabled),
          paymentUrl: data.payment_url || "",
          buttonLabel: data.button_label || DEFAULT_SETTINGS.buttonLabel,
          userMessage: data.user_message || DEFAULT_SETTINGS.userMessage,
          targetCountries: Array.isArray(data.target_countries) ? data.target_countries : [],
          allCountries: Boolean(data.all_countries),
          email: data.email || "",
          whatsappNumber: data.whatsapp_number || "",
          postPaymentInstructions:
            data.post_payment_instructions || DEFAULT_SETTINGS.postPaymentInstructions,
          updatedAt: data.updated_at || new Date().toISOString(),
          updatedBy: data.updated_by || undefined,
        };
      }
    }
  } catch {}

  // 2. Fichier local de secours
  try {
    const filePath = getStorageFilePath();
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content) as AlternativePaymentSettings;
    }
  } catch {}

  return DEFAULT_SETTINGS;
}

/**
 * Enregistre les modifications apportées par un administrateur
 */
export async function saveAlternativePaymentSettings(
  input: {
    isEnabled: boolean;
    paymentUrl: string;
    buttonLabel?: string;
    userMessage?: string;
    targetCountries: string[];
    allCountries: boolean;
    email?: string;
    whatsappNumber?: string;
    postPaymentInstructions?: string;
  },
  adminIdentifier: string
): Promise<{ success: boolean; error?: string; settings?: AlternativePaymentSettings }> {
  const cleanUrl = (input.paymentUrl || "").trim();

  // Validation stricte du lien de paiement (si activé ou si lien fourni)
  if (input.isEnabled || cleanUrl) {
    if (!cleanUrl) {
      return { success: false, error: "Le lien de paiement est obligatoire lorsque le bouton est activé." };
    }
    // Refuse explicitement tout protocole non https
    if (!cleanUrl.toLowerCase().startsWith("https://")) {
      return {
        success: false,
        error: "L'adresse du lien de paiement doit impérativement commencer par https:// (les adresses http://, javascript:, data: sont strictement refusées).",
      };
    }
    try {
      const parsed = new URL(cleanUrl);
      if (parsed.protocol !== "https:") {
        return { success: false, error: "Le lien de paiement doit être une adresse sécurisée https:// valide." };
      }
    } catch {
      return { success: false, error: "L'adresse du lien de paiement est invalide." };
    }
  }

  // Validation : E-mail obligatoire pour recevoir les captures
  const cleanEmail = (input.email || "").trim();

  if (input.isEnabled && !cleanEmail) {
    return {
      success: false,
      error: "Veuillez renseigner votre adresse e-mail administrateur pour la réception des captures de paiement.",
    };
  }

  if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { success: false, error: "L'adresse e-mail renseignée est invalide." };
  }

  const now = new Date().toISOString();
  const newSettings: AlternativePaymentSettings = {
    isEnabled: Boolean(input.isEnabled),
    paymentUrl: cleanUrl,
    buttonLabel: (input.buttonLabel || "").trim() || DEFAULT_SETTINGS.buttonLabel,
    userMessage: (input.userMessage || "").trim() || DEFAULT_SETTINGS.userMessage,
    targetCountries: Array.isArray(input.targetCountries)
      ? input.targetCountries.map((c) => c.toUpperCase())
      : [],
    allCountries: Boolean(input.allCountries),
    email: cleanEmail,
    whatsappNumber: "",
    postPaymentInstructions:
      (input.postPaymentInstructions || "").trim() || DEFAULT_SETTINGS.postPaymentInstructions,
    updatedAt: now,
    updatedBy: adminIdentifier,
  };

  // 1. Sauvegarde locale persistante
  try {
    const filePath = getStorageFilePath();
    fs.writeFileSync(filePath, JSON.stringify(newSettings, null, 2), "utf-8");
  } catch (err) {
    console.error("Erreur d'écriture alternative_payment_settings.json:", err);
  }

  // 2. Sauvegarde dans Supabase
  try {
    const isConfigured =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

    if (isConfigured) {
      const adminClient = createAdminClient();
      await adminClient
        .from("alternative_payment_settings")
        .upsert({
          id: 1,
          is_enabled: newSettings.isEnabled,
          payment_url: newSettings.paymentUrl || null,
          button_label: newSettings.buttonLabel,
          user_message: newSettings.userMessage,
          target_countries: newSettings.targetCountries,
          all_countries: newSettings.allCountries,
          email: newSettings.email || null,
          whatsapp_number: newSettings.whatsappNumber || null,
          post_payment_instructions: newSettings.postPaymentInstructions,
          updated_at: now,
          updated_by: adminIdentifier,
        });

      // 3. Écriture obligatoire dans le journal d'audit (avec domaine uniquement, jamais l'URL complète)
      let domainOnly = "aucun";
      if (cleanUrl) {
        try {
          domainOnly = new URL(cleanUrl).hostname;
        } catch {
          domainOnly = "domaine_masqué";
        }
      }

      await adminClient.from("audit_logs").insert({
        action: "update_alternative_payment_settings",
        entity_type: "alternative_payment_settings",
        entity_id: "1",
        payload: {
          updated_by: adminIdentifier,
          timestamp: now,
          is_enabled: newSettings.isEnabled,
          all_countries: newSettings.allCountries,
          target_countries_count: newSettings.targetCountries.length,
          payment_domain: domainOnly,
          has_email: Boolean(cleanEmail),
        },
      });
    }
  } catch (err) {
    console.error("Erreur de synchronisation Supabase pour alternative_payment_settings:", err);
  }

  return { success: true, settings: newSettings };
}

/**
 * Résout le paiement alternatif pour un utilisateur en fonction de son pays de profil.
 * STRICTEMENT EXÉCUTÉ CÔTÉ SERVEUR : Si les conditions ne sont pas réunies, renvoie null.
 * Le lien externe n'est jamais exposé aux utilisateurs non éligibles.
 */
export async function resolveAlternativePaymentForUser(
  userProfileCountry?: string | null
): Promise<AlternativePaymentUserView | null> {
  const settings = await getAlternativePaymentSettings();

  // Condition 1 : L'interrupteur doit être activé
  if (!settings.isEnabled) {
    return null;
  }

  // Condition 2 : Un lien valide doit être configuré
  if (!settings.paymentUrl || !settings.paymentUrl.toLowerCase().startsWith("https://")) {
    return null;
  }

  // Condition 3 : Au moins un contact (email ou whatsapp)
  if (!settings.email && !settings.whatsappNumber) {
    return null;
  }

  // Condition 4 : Correspondance de pays
  // Si "Tous les pays" est coché, tout utilisateur a droit au bouton
  if (settings.allCountries) {
    return {
      paymentUrl: settings.paymentUrl,
      buttonLabel: settings.buttonLabel || DEFAULT_SETTINGS.buttonLabel,
      userMessage: settings.userMessage || DEFAULT_SETTINGS.userMessage,
      email: settings.email || null,
      postPaymentInstructions:
        settings.postPaymentInstructions || DEFAULT_SETTINGS.postPaymentInstructions,
    };
  }

  // Si aucun pays n'est sélectionné, affiché à personne
  if (!settings.targetCountries || settings.targetCountries.length === 0) {
    return null;
  }

  // Résolution du code pays de l'utilisateur
  const rawCountry = (userProfileCountry || "").trim().toUpperCase();
  const matchedCountry = getCountryByCode(rawCountry);
  const userIsoCode = matchedCountry ? matchedCountry.code : rawCountry;

  const isEligible = settings.targetCountries.some((c) => {
    const cUpper = c.toUpperCase();
    return cUpper === userIsoCode || (matchedCountry && cUpper === matchedCountry.name.toUpperCase());
  });

  if (!isEligible) {
    return null;
  }

  return {
    paymentUrl: settings.paymentUrl,
    buttonLabel: settings.buttonLabel || DEFAULT_SETTINGS.buttonLabel,
    userMessage: settings.userMessage || DEFAULT_SETTINGS.userMessage,
    email: settings.email || null,
    postPaymentInstructions:
      settings.postPaymentInstructions || DEFAULT_SETTINGS.postPaymentInstructions,
  };
}
