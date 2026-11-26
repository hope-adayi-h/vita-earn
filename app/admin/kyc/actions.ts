"use server";

import { revalidatePath } from "next/cache";
import { checkAdminSession } from "@/lib/security/admin-lock";
import { reviewKycRequest, type StoredKycRequest } from "@/lib/data/kyc-store";

export interface ReviewKycResult {
  success: boolean;
  message?: string;
  error?: string;
  items?: StoredKycRequest[];
}

export async function reviewSellerKycAction(input: {
  id: string;
  decision: "approved" | "rejected";
  reason?: string;
}): Promise<ReviewKycResult> {
  try {
    const { isAdmin, userEmail } = await checkAdminSession();
    if (!isAdmin) {
      return { success: false, error: "Accès refusé : privilèges administrateur requis." };
    }

    if (!input.id) {
      return { success: false, error: "Identifiant de demande KYC manquant." };
    }

    const { request, all } = await reviewKycRequest({
      id: input.id,
      decision: input.decision,
      reviewedBy: userEmail || "admin",
      reason: input.reason,
    });

    if (!request) {
      return { success: false, error: "Demande KYC introuvable." };
    }

    revalidatePath("/admin/kyc");
    revalidatePath("/vendre");
    revalidatePath("/marche");
    revalidatePath("/admin");

    return {
      success: true,
      message:
        input.decision === "approved"
          ? `KYC de ${request.fullName} validé ! Son compte vendeur est désormais vérifié.`
          : `KYC de ${request.fullName} refusé. Il ne pourra pas publier d'articles.`,
      items: all,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur lors de la validation KYC.";
    return { success: false, error: msg };
  }
}
