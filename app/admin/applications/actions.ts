"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { checkAdminSession } from "@/lib/security/admin-lock";
import {
  saveSinglePremiumApp,
  type PremiumAppId,
  type StoredPremiumApp,
} from "@/lib/data/premium-apps-store";

const savePremiumAppSchema = z.object({
  id: z.enum(["netflix", "vita-canal-plus", "gemini-pro", "telegram"]),
  targetUrl: z.string().trim().max(1500),
  isComingSoon: z.boolean(),
});

export interface SavePremiumAppResult {
  success: boolean;
  message?: string;
  error?: string;
  apps?: StoredPremiumApp[];
}

export async function savePremiumAppAction(input: {
  id: PremiumAppId;
  targetUrl: string;
  isComingSoon: boolean;
}): Promise<SavePremiumAppResult> {
  try {
    const { isAdmin } = await checkAdminSession();
    if (!isAdmin) {
      return { success: false, error: "Accès refusé : privilèges administrateur requis." };
    }

    const parsed = savePremiumAppSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: "Données invalides." };
    }

    const { id, isComingSoon } = parsed.data;
    let cleanUrl = parsed.data.targetUrl;

    if (cleanUrl) {
      const lower = cleanUrl.toLowerCase();
      if (
        lower.startsWith("javascript:") ||
        lower.startsWith("data:") ||
        cleanUrl.includes("<") ||
        cleanUrl.includes(">")
      ) {
        return { success: false, error: "Lien non sécurisé ou invalide." };
      }

      if (!lower.startsWith("http://") && !lower.startsWith("https://")) {
        cleanUrl = `https://${cleanUrl}`;
      }

      try {
        const u = new URL(cleanUrl);
        if (u.protocol !== "http:" && u.protocol !== "https:") {
          return { success: false, error: "Le lien doit utiliser le protocole http ou https." };
        }
      } catch {
        return { success: false, error: "Format d'adresse URL invalide." };
      }
    }

    const updatedApps = await saveSinglePremiumApp({
      id,
      targetUrl: cleanUrl,
      isComingSoon,
    });

    revalidatePath("/admin/applications");
    revalidatePath("/applications-premium");

    return {
      success: true,
      message: "Lien et statut enregistrés avec succès.",
      apps: updatedApps,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur inattendue.";
    return { success: false, error: msg };
  }
}
