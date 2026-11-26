"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { checkAdminSession } from "@/lib/security/admin-lock";
import {
  addFormationItem,
  deleteFormationItem,
  type StoredFormationItem,
} from "@/lib/data/formations-store";

const createFormationSchema = z.object({
  title: z.string().trim().min(3, "Le titre doit contenir au moins 3 caractères.").max(150),
  description: z.string().trim().min(10, "La description doit contenir au moins 10 caractères.").max(1200),
  imageUrl: z.string().trim().min(1, "Veuillez ajouter une image ou photo de couverture.").max(500000),
  downloadUrl: z.string().trim().min(4, "Veuillez renseigner le lien de téléchargement.").max(1500),
});

function sanitizeHttpUrl(raw: string): { ok: boolean; url: string } {
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("data:") || trimmed.includes("<") || trimmed.includes(">")) {
    return { ok: false, url: "" };
  }
  const candidate = lower.startsWith("http://") || lower.startsWith("https://") ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { ok: false, url: "" };
    }
    return { ok: true, url: candidate };
  } catch {
    return { ok: false, url: "" };
  }
}

function sanitizeImageSource(raw: string): { ok: boolean; url: string } {
  const trimmed = raw.trim();
  if (/^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/i.test(trimmed)) {
    return { ok: true, url: trimmed };
  }
  return sanitizeHttpUrl(trimmed);
}

export interface FormationActionResult {
  success: boolean;
  message?: string;
  error?: string;
  items?: StoredFormationItem[];
}

export async function createFormationAction(input: {
  title: string;
  description: string;
  imageUrl: string;
  downloadUrl: string;
}): Promise<FormationActionResult> {
  try {
    const { isAdmin } = await checkAdminSession();
    if (!isAdmin) {
      return { success: false, error: "Accès refusé : privilèges administrateur requis." };
    }

    const parsed = createFormationSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Veuillez vérifier les champs saisis.",
      };
    }

    const imgCheck = sanitizeImageSource(parsed.data.imageUrl);
    if (!imgCheck.ok || !imgCheck.url) {
      return { success: false, error: "L'image fournie n'est pas valide." };
    }

    const linkCheck = sanitizeHttpUrl(parsed.data.downloadUrl);
    if (!linkCheck.ok || !linkCheck.url) {
      return { success: false, error: "Le lien de téléchargement (PDF, Google Drive, Share...) est invalide." };
    }

    const { allItems } = await addFormationItem({
      title: parsed.data.title,
      description: parsed.data.description,
      imageUrl: imgCheck.url,
      downloadUrl: linkCheck.url,
    });

    revalidatePath("/admin/formations");
    revalidatePath("/formations");

    return {
      success: true,
      message: "Formation publiée avec succès !",
      items: allItems,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur lors de l'ajout de la formation.";
    return { success: false, error: msg };
  }
}

export async function deleteFormationAction(id: string): Promise<FormationActionResult> {
  try {
    const { isAdmin } = await checkAdminSession();
    if (!isAdmin) {
      return { success: false, error: "Accès refusé : privilèges administrateur requis." };
    }

    if (!id) {
      return { success: false, error: "Identifiant de formation manquant." };
    }

    const items = await deleteFormationItem(id);

    revalidatePath("/admin/formations");
    revalidatePath("/formations");

    return {
      success: true,
      message: "Formation supprimée.",
      items,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur lors de la suppression.";
    return { success: false, error: msg };
  }
}
