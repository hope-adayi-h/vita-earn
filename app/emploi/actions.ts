"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { addEmploiPost, type StoredEmploiPost } from "@/lib/data/emploi-store";

const createEmploiSchema = z.object({
  firstName: z.string().trim().min(2, "Le prénom doit contenir au moins 2 caractères.").max(80),
  lastName: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères.").max(80),
  location: z.string().trim().min(2, "Veuillez indiquer votre ville ou lieu de résidence.").max(120),
  profession: z.string().trim().min(2, "Veuillez indiquer votre profession ou activité.").max(120),
  description: z.string().trim().min(10, "Décrivez brièvement votre travail (au moins 10 caractères).").max(1000),
  serviceUrl: z.string().trim().max(500).optional().default(""),
  photoUrl: z.string().trim().max(500000).optional().default(""),
});

function sanitizeOptionalHttpUrl(raw: string): { ok: boolean; url: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: true, url: "" };

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
  if (!trimmed) return { ok: true, url: "" };
  if (/^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/i.test(trimmed)) {
    return { ok: true, url: trimmed };
  }
  return sanitizeOptionalHttpUrl(trimmed);
}

export interface CreateEmploiResult {
  success: boolean;
  message?: string;
  error?: string;
  post?: StoredEmploiPost;
}

export async function createEmploiPostAction(input: {
  firstName: string;
  lastName: string;
  location: string;
  profession: string;
  description: string;
  serviceUrl?: string;
  photoUrl?: string;
}): Promise<CreateEmploiResult> {
  try {
    const parsed = createEmploiSchema.safeParse(input);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message || "Veuillez vérifier les champs saisis.";
      return { success: false, error: firstIssue };
    }

    const urlCheck = sanitizeOptionalHttpUrl(parsed.data.serviceUrl);
    if (!urlCheck.ok) {
      return { success: false, error: "Le lien du site web ou de vos services est invalide." };
    }

    const photoCheck = sanitizeImageSource(parsed.data.photoUrl);
    if (!photoCheck.ok) {
      return { success: false, error: "La photo fournie n'est pas dans un format valide." };
    }

    const { post } = await addEmploiPost({
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      location: parsed.data.location,
      profession: parsed.data.profession,
      description: parsed.data.description,
      serviceUrl: urlCheck.url || undefined,
      photoUrl: photoCheck.url || undefined,
    });

    revalidatePath("/emploi");
    revalidatePath("/admin/emploi");

    return {
      success: true,
      message: "Votre profil professionnel a été publié avec succès !",
      post,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur lors de la publication.";
    return { success: false, error: msg };
  }
}
