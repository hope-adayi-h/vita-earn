import fs from "fs";
import path from "path";
import os from "os";
import { getCountryByCode, getAllCountries } from "@/lib/countries";

export interface AutoPaymentCountrySettings {
  suspendedCountries: string[]; // Codes ISO 2 lettres des pays suspendus, ex: ["BJ", "TG"]
  customMessage: string;
  adminEmail: string;
  updatedAt: string;
  updatedBy: string;
}

const DEFAULT_SETTINGS: AutoPaymentCountrySettings = {
  suspendedCountries: [], // Par défaut, AUCUN pays n'est suspendu (tous les pays sont cochés/actifs)
  customMessage:
    "Les paiements automatiques sont temporairement suspendus pour votre pays. Veuillez contacter notre administration pour procéder à votre adhésion.",
  adminEmail: "admin@vitaearn.com",
  updatedAt: "2026-11-20T00:00:00.000Z",
  updatedBy: "superadmin",
};

function getStorageFilePath(): string {
  try {
    const localDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const testFile = path.join(localDir, ".test_auto_countries_write");
    fs.writeFileSync(testFile, "1");
    fs.unlinkSync(testFile);
    return path.join(localDir, "automatic_payment_countries.json");
  } catch {
    const tmpDir = path.join(os.tmpdir(), "vita_earn_data");
    if (!fs.existsSync(tmpDir)) {
      try {
        fs.mkdirSync(tmpDir, { recursive: true });
      } catch {}
    }
    return path.join(tmpDir, "automatic_payment_countries.json");
  }
}

/**
 * Récupère les paramètres actuels d'activation des pays pour le paiement automatique
 */
export async function getAutoPaymentCountrySettings(): Promise<AutoPaymentCountrySettings> {
  try {
    const filePath = getStorageFilePath();
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8").replace(/^\uFEFF/, "");
      const parsed = JSON.parse(content) as AutoPaymentCountrySettings;
      return {
        suspendedCountries: Array.isArray(parsed.suspendedCountries)
          ? parsed.suspendedCountries.map((c) => c.toUpperCase())
          : [],
        customMessage: parsed.customMessage || DEFAULT_SETTINGS.customMessage,
        adminEmail: parsed.adminEmail || DEFAULT_SETTINGS.adminEmail,
        updatedAt: parsed.updatedAt || new Date().toISOString(),
        updatedBy: parsed.updatedBy || "admin",
      };
    }
  } catch (err) {
    console.warn("Fallback lecture automatic_payment_countries.json:", err);
  }

  return DEFAULT_SETTINGS;
}

/**
 * Sauvegarde la configuration modifiée par l'administrateur
 */
export async function saveAutoPaymentCountrySettings(
  input: {
    suspendedCountries: string[];
    customMessage?: string;
    adminEmail?: string;
  },
  adminIdentifier: string
): Promise<{ success: boolean; settings?: AutoPaymentCountrySettings; error?: string }> {
  try {
    const cleanEmail = (input.adminEmail || "").trim() || DEFAULT_SETTINGS.adminEmail;
    const cleanMessage =
      (input.customMessage || "").trim() || DEFAULT_SETTINGS.customMessage;

    const normalizedSuspended = Array.isArray(input.suspendedCountries)
      ? Array.from(new Set(input.suspendedCountries.map((c) => c.toUpperCase().trim())))
      : [];

    const now = new Date().toISOString();
    const newSettings: AutoPaymentCountrySettings = {
      suspendedCountries: normalizedSuspended,
      customMessage: cleanMessage,
      adminEmail: cleanEmail,
      updatedAt: now,
      updatedBy: adminIdentifier,
    };

    const filePath = getStorageFilePath();
    fs.writeFileSync(filePath, JSON.stringify(newSettings, null, 2), "utf-8");

    return { success: true, settings: newSettings };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur de sauvegarde.";
    return { success: false, error: msg };
  }
}

/**
 * Vérifie si un pays donné est suspendu pour les paiements automatiques
 */
export async function isCountrySuspendedForAutoPayment(
  countryCodeOrName: string
): Promise<{ isSuspended: boolean; customMessage: string; adminEmail: string }> {
  const settings = await getAutoPaymentCountrySettings();

  if (!countryCodeOrName || settings.suspendedCountries.length === 0) {
    return {
      isSuspended: false,
      customMessage: settings.customMessage,
      adminEmail: settings.adminEmail,
    };
  }

  const clean = countryCodeOrName.trim().toUpperCase();
  const matched = getCountryByCode(clean);
  const isoCode = matched ? matched.code.toUpperCase() : clean;

  const isSuspended = settings.suspendedCountries.some(
    (c) => c === isoCode || (matched && c === matched.name.toUpperCase())
  );

  return {
    isSuspended,
    customMessage: settings.customMessage,
    adminEmail: settings.adminEmail,
  };
}
