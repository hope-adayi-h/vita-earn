"use server";

import { revalidatePath } from "next/cache";
import { checkAdminSession } from "@/lib/security/admin-lock";
import { deleteEmploiPost, type StoredEmploiPost } from "@/lib/data/emploi-store";

export interface DeleteEmploiResult {
  success: boolean;
  message?: string;
  error?: string;
  posts?: StoredEmploiPost[];
}

export async function deleteEmploiPostAction(id: string): Promise<DeleteEmploiResult> {
  try {
    const { isAdmin } = await checkAdminSession();
    if (!isAdmin) {
      return { success: false, error: "Accès refusé : privilèges administrateur requis." };
    }

    if (!id || typeof id !== "string") {
      return { success: false, error: "Identifiant introuvable." };
    }

    const posts = await deleteEmploiPost(id);

    revalidatePath("/admin/emploi");
    revalidatePath("/emploi");

    return {
      success: true,
      message: "Publication supprimée avec succès.",
      posts,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur lors de la suppression.";
    return { success: false, error: msg };
  }
}
