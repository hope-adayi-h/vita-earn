"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function verifyAdminUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Authentification requise.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // RÈGLE P0 : Seuls les comptes avec role === 'admin' vérifié en base peuvent exécuter des actions admin
  if (profile?.role !== "admin") {
    throw new Error("Accès formellement refusé : privilèges administrateur requis.");
  }

  return { user, isAdmin: true };
}

export async function reviewWithdrawalAction(params: {
  withdrawalId: string;
  action: "approve" | "processing" | "reject" | "paid";
  notes?: string;
}): Promise<{ success?: boolean; error?: string; message?: string }> {
  try {
    const { user, isAdmin } = await verifyAdminUser();
    if (!isAdmin) {
      return { error: "Accès formellement refusé : privilèges administrateur requis." };
    }

    const adminClient = createAdminClient();

    const { data: result, error } = await adminClient.rpc("review_withdrawal", {
      p_withdrawal_id: params.withdrawalId,
      p_action: params.action,
      p_admin_id: user.id,
      p_notes: params.notes || null,
    });

    if (error) {
      return { error: error.message || "Erreur lors du traitement du retrait." };
    }

    revalidatePath("/admin");
    revalidatePath("/admin/retraits");
    revalidatePath("/portefeuille");

    let actionLabel = "mis à jour";
    if (params.action === "approve") actionLabel = "approuvé";
    if (params.action === "processing") actionLabel = "passé en cours de traitement";
    if (params.action === "reject") actionLabel = "rejeté et les fonds ont été restitués au client";
    if (params.action === "paid") actionLabel = "confirmé payé avec succès";

    return {
      success: true,
      message: `Le retrait a été ${actionLabel}.`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur non autorisée.";
    return { error: message };
  }
}
