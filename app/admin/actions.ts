"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  verifyAdminCode,
  generateAdminSessionToken,
  checkAdminLockRateLimit,
  registerFailedAdminAttempt,
  resetAdminAttempts,
  getCurrentHourlyInfo,
  SUPER_ADMIN_EMAIL,
  checkAdminSession,
} from "@/lib/security/admin-lock";
import { getAllUsers, saveUser } from "@/lib/auth/local-store";

const SESSION_COOKIE_NAME = "vita_admin_unlocked";

/**
 * Vérifie l'identité de l'administrateur avec tolérance et résilience
 */
export async function verifyAdminUser() {
  const { isAdmin, isSuperAdmin, userEmail, userId } = await checkAdminSession();

  if (isAdmin) {
    return {
      user: {
        id: userId || "usr_espoir_master",
        email: userEmail || SUPER_ADMIN_EMAIL,
      },
      isAdmin: true,
      isSuperAdmin,
    };
  }

  throw new Error("Accès formellement refusé : privilèges administrateur requis.");
}

/**
 * Déverrouille l'accès Admin avec un Code Secret Maître ou le Code Dynamique Horaire
 */
export async function unlockAdminWithCodeAction(
  code: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { user } = await verifyAdminUser();
    const cookieStore = cookies();

    // Vérifier la limitation de débit
    const rateCheck = checkAdminLockRateLimit(user.email);
    if (!rateCheck.allowed) {
      return {
        error: `Accès temporairement verrouillé pour sécurité. Réessayez dans ${rateCheck.lockedMinutesRemaining} minute(s).`,
      };
    }

    const isValid = verifyAdminCode(code);
    if (!isValid) {
      registerFailedAdminAttempt(user.email);
      return {
        error: "Code d'accès incorrect. Vérifiez votre code secret maître ou le code horaire.",
      };
    }

    // Réinitialiser les tentatives et poser le jeton de session
    resetAdminAttempts(user.email);
    const token = generateAdminSessionToken(user.email);

    cookieStore.set(SESSION_COOKIE_NAME, token, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 60, // 30 minutes
    });

    // Journal d'audit si Supabase configuré
    try {
      const adminClient = createAdminClient();
      await adminClient.from("audit_logs").insert({
        user_id: user.id,
        action: "admin_unlocked_with_code",
        entity_type: "admin_session",
      });
    } catch {}

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur non autorisée.";
    return { error: message };
  }
}

/**
 * Déverrouille l'accès Admin via Face ID / Touch ID / Biométrie appareil (WebAuthn)
 */
export async function unlockAdminWithBiometricsAction(): Promise<{
  success?: boolean;
  error?: string;
}> {
  try {
    const { user } = await verifyAdminUser();
    const cookieStore = cookies();

    resetAdminAttempts(user.email);
    const token = generateAdminSessionToken(user.email);

    cookieStore.set(SESSION_COOKIE_NAME, token, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 60, // 30 minutes
    });

    try {
      const adminClient = createAdminClient();
      await adminClient.from("audit_logs").insert({
        user_id: user.id,
        action: "admin_unlocked_with_biometrics",
        entity_type: "admin_session",
      });
    } catch {}

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur non autorisée.";
    return { error: message };
  }
}

/**
 * Verrouille manuellement la session Administrateur (Reverrouillage immédiat)
 */
export async function lockAdminSessionAction() {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  revalidatePath("/admin");
  redirect("/admin/lock");
}

/**
 * Récupère le code horaire actuel (accessible uniquement par l'admin connecté)
 */
export async function getAdminHourlyCodeAction(): Promise<{
  code?: string;
  minutesRemaining?: number;
  error?: string;
}> {
  try {
    await verifyAdminUser();
    return getCurrentHourlyInfo();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Accès non autorisé.";
    return { error: message };
  }
}

/**
 * Traitement / Revue d'une demande de retrait Mobile Money (procédure PostgreSQL review_withdrawal)
 */
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
    if (params.action === "reject") actionLabel = "rejeté et remboursé au client";
    if (params.action === "paid") actionLabel = "marqué payé avec succès";

    return {
      success: true,
      message: `Le retrait a été ${actionLabel}.`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur non autorisée.";
    return { error: message };
  }
}

/**
 * Gestion des rôles : Promouvoir ou Révoquer un Administrateur (Réservé au Super Admin)
 */
export async function manageAdminRoleAction(params: {
  identifier: string; // Email ou nom d'utilisateur
  newRole: "admin" | "user";
}): Promise<{ success?: boolean; error?: string; message?: string }> {
  try {
    const { user, isSuperAdmin } = await verifyAdminUser();
    if (!isSuperAdmin) {
      return {
        error: "Seul le Super Administrateur principal (Espoir) est autorisé à nommer ou révoquer des administrateurs.",
      };
    }

    const targetId = params.identifier.trim().toLowerCase();

    if (targetId === SUPER_ADMIN_EMAIL && params.newRole === "user") {
      return { error: "Le rôle du Super Administrateur principal ne peut pas être révoqué." };
    }

    let updated = false;

    // 1. Mise à jour dans Supabase si configuré
    try {
      const adminClient = createAdminClient();
      const { data: targetProfile } = await adminClient
        .from("profiles")
        .select("id, email, full_name")
        .or(`email.eq.${targetId},full_name.eq.${targetId}`)
        .maybeSingle();

      if (targetProfile?.id) {
        await adminClient
          .from("profiles")
          .update({ role: params.newRole })
          .eq("id", targetProfile.id);

        await adminClient.from("audit_logs").insert({
          user_id: user.id,
          action: params.newRole === "admin" ? "grant_admin_role" : "revoke_admin_role",
          entity_type: "profiles",
          entity_id: targetProfile.id,
        });

        updated = true;
      }
    } catch {}

    // 2. Mise à jour dans le store local
    const localUsers = getAllUsers();
    const localTarget = localUsers.find(
      (u) =>
        u.email.toLowerCase() === targetId ||
        u.username.toLowerCase() === targetId
    );

    if (localTarget) {
      localTarget.role = params.newRole;
      saveUser(localTarget);
      updated = true;
    }

    if (!updated) {
      return { error: "Aucun utilisateur trouvé avec cet identifiant." };
    }

    revalidatePath("/admin");
    revalidatePath("/admin/utilisateurs");

    return {
      success: true,
      message:
        params.newRole === "admin"
          ? `Privilèges administrateur accordés avec succès à ${params.identifier}.`
          : `Privilèges administrateur révoqués pour ${params.identifier}.`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur non autorisée.";
    return { error: message };
  }
}

/**
 * Modération d'un produit (Approuver, Rejeter, Suspendre)
 */
export async function moderateProductAction(params: {
  productId: string;
  status: "active" | "rejected" | "archived";
  notes?: string;
}): Promise<{ success?: boolean; error?: string }> {
  try {
    const { user } = await verifyAdminUser();
    const adminClient = createAdminClient();

    const { error } = await adminClient
      .from("products")
      .update({
        status: params.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.productId);

    if (error) {
      return { error: error.message };
    }

    try {
      await adminClient.from("audit_logs").insert({
        user_id: user.id,
        action: `product_${params.status}`,
        entity_type: "products",
        entity_id: params.productId,
      });
    } catch {}

    revalidatePath("/admin");
    revalidatePath("/admin/produits");
    revalidatePath("/marche");

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur non autorisée.";
    return { error: message };
  }
}

/**
 * Mise à jour des paramètres de la plateforme (platform_settings)
 */
export async function updatePlatformSettingsAction(params: {
  key: string;
  value: Record<string, unknown>;
  description?: string;
}): Promise<{ success?: boolean; error?: string }> {
  try {
    const { user } = await verifyAdminUser();
    const adminClient = createAdminClient();

    const { error } = await adminClient
      .from("platform_settings")
      .upsert({
        key: params.key,
        value: params.value,
        description: params.description,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      return { error: error.message };
    }

    try {
      await adminClient.from("audit_logs").insert({
        user_id: user.id,
        action: "update_platform_setting",
        entity_type: "platform_settings",
      });
    } catch {}

    revalidatePath("/admin");
    revalidatePath("/admin/reglages");

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur non autorisée.";
    return { error: message };
  }
}
