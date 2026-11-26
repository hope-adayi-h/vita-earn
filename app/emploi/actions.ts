"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { findUserByIdentifier } from "@/lib/auth/local-store";
import { upsertEmploiPostForUser, type StoredEmploiPost } from "@/lib/data/emploi-store";

const emploiSchema = z.object({
  firstName: z.string().trim().min(2, "Le prénom doit contenir au moins 2 caractères.").max(80),
  lastName: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères.").max(80),
  phone: z
    .string()
    .trim()
    .min(6, "Veuillez renseigner un numéro de téléphone valide.")
    .max(30, "Numéro de téléphone trop long."),
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

async function resolveCurrentUserId(): Promise<string> {
  const cookieStore = cookies();
  const sessionUserRaw = cookieStore.get("vita_session_user")?.value;
  const testUser = cookieStore.get("vita_test_user")?.value;

  if (sessionUserRaw) {
    try {
      const parsed = JSON.parse(sessionUserRaw);
      if (parsed?.id) return String(parsed.id);
      if (parsed?.username) return String(parsed.username);
    } catch {
      try {
        const parsed = JSON.parse(decodeURIComponent(sessionUserRaw));
        if (parsed?.id) return String(parsed.id);
      } catch {}
    }
  }

  if (testUser) {
    const localU = findUserByIdentifier(testUser);
    return localU?.id || testUser;
  }

  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");
  if (isConfigured) {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.id) return user.id;
    } catch {}
  }

  return "";
}

export interface UpsertEmploiResult {
  success: boolean;
  message?: string;
  error?: string;
  post?: StoredEmploiPost;
  isUpdate?: boolean;
}

export async function saveMyEmploiPostAction(input: {
  firstName: string;
  lastName: string;
  phone: string;
  location: string;
  profession: string;
  description: string;
  serviceUrl?: string;
  photoUrl?: string;
}): Promise<UpsertEmploiResult> {
  try {
    const userId = await resolveCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: "Veuillez vous connecter pour publier ou modifier votre emploi.",
      };
    }

    const parsed = emploiSchema.safeParse(input);
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

    const { post, isUpdate } = await upsertEmploiPostForUser(userId, {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      phone: parsed.data.phone,
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
      isUpdate,
      message: isUpdate
        ? "Votre profil professionnel a été mis à jour avec succès !"
        : "Votre profil professionnel a été publié avec succès !",
      post,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur lors de la publication.";
    return { success: false, error: msg };
  }
}
