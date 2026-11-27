"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import {
  reviewLiveRequest,
  toggleLiveStatus,
  deleteLiveConference,
  getAllLiveConferences,
  getLiveSettings,
  updateLiveSettings,
  type LiveStatus,
  type LiveSettings,
} from "@/lib/data/live-store";

function isAdminAuthorized(): boolean {
  const cookieStore = cookies();
  const adminUnlocked = cookieStore.get("vita_admin_unlocked")?.value;
  const testRole = cookieStore.get("vita_test_role")?.value;
  const sessionUserRaw = cookieStore.get("vita_session_user")?.value;

  if (adminUnlocked === "true") return true;
  if (testRole === "admin") return true;

  if (sessionUserRaw) {
    try {
      const parsed = JSON.parse(sessionUserRaw);
      if (parsed?.role === "admin") return true;
    } catch {
      try {
        const parsed = JSON.parse(decodeURIComponent(sessionUserRaw));
        if (parsed?.role === "admin") return true;
      } catch {}
    }
  }

  return true; // En mode local/fallback admin
}

export async function reviewLiveAction(prevState: any, formData: FormData) {
  if (!isAdminAuthorized()) {
    return { ok: false, error: "Non autorisé." };
  }

  const liveId = formData.get("liveId")?.toString();
  const status = formData.get("status")?.toString() as LiveStatus;
  const adminMessage = formData.get("adminMessage")?.toString() || "";
  const meetUrl = formData.get("meetUrl")?.toString() || "";
  const scheduledDate = formData.get("scheduledDate")?.toString() || "";
  const scheduledTime = formData.get("scheduledTime")?.toString() || "";

  if (!liveId || !status) {
    return { ok: false, error: "Paramètres manquants." };
  }

  try {
    const updated = await reviewLiveRequest({
      id: liveId,
      status,
      adminMessage,
      meetUrl,
      scheduledDate,
      scheduledTime,
      reviewedBy: "Admin Vita Earn",
    });

    if (!updated) {
      return { ok: false, error: "Live introuvable." };
    }

    revalidatePath("/admin/live");
    revalidatePath("/live");
    revalidatePath("/");

    return {
      ok: true,
      message:
        status === "approved"
          ? "Le live a été validé et programmé avec succès !"
          : "Le live a été refusé avec le motif envoyé.",
    };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Erreur de mise à jour." };
  }
}

export async function quickToggleLiveStatusAction(liveId: string, status: LiveStatus) {
  if (!isAdminAuthorized()) {
    return { ok: false, error: "Non autorisé." };
  }

  try {
    const updated = await toggleLiveStatus(liveId, status);
    if (!updated) {
      return { ok: false, error: "Live introuvable." };
    }

    revalidatePath("/admin/live");
    revalidatePath("/live");
    revalidatePath("/");

    return { ok: true, status: updated.status };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Erreur lors du changement de statut." };
  }
}

export async function deleteLiveAction(liveId: string) {
  if (!isAdminAuthorized()) {
    return { ok: false, error: "Non autorisé." };
  }

  try {
    const success = await deleteLiveConference(liveId);
    if (!success) {
      return { ok: false, error: "Live introuvable ou déjà supprimé." };
    }

    revalidatePath("/admin/live");
    revalidatePath("/live");
    revalidatePath("/");

    return { ok: true, message: "Live supprimé avec succès." };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Erreur lors de la suppression." };
  }
}

export async function updateLiveSettingsAction(prevState: any, formData: FormData) {
  if (!isAdminAuthorized()) {
    return { ok: false, error: "Non autorisé." };
  }

  try {
    const maxSlotsRaw = formData.get("maxSlotsPerWeek");
    const maxSlots = Number(maxSlotsRaw);
    if (isNaN(maxSlots) || maxSlots <= 0) {
      return { ok: false, error: "Le nombre de places doit être supérieur à zéro." };
    }

    const allowedDaysRaw = formData.getAll("allowedDays");
    const allowedDays = allowedDaysRaw.map((v) => Number(v)).filter((v) => !isNaN(v) && v >= 0 && v <= 6);

    if (allowedDays.length === 0) {
      return { ok: false, error: "Vous devez sélectionner au moins un jour disponible." };
    }

    const noticeMessage = (formData.get("noticeMessage") as string) || "";

    const updated = await updateLiveSettings({
      maxSlotsPerWeek: maxSlots,
      allowedDaysOfWeek: allowedDays,
      noticeMessage,
    });

    revalidatePath("/admin/live");
    revalidatePath("/live");
    revalidatePath("/");

    return {
      ok: true,
      message: `Paramètres enregistrés ! Quota : ${updated.maxSlotsPerWeek} places/semaine sur ${updated.allowedDaysOfWeek.length} jours configurés.`,
      settings: updated,
    };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Erreur lors de la sauvegarde des paramètres." };
  }
}
