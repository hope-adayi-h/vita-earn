"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import {
  createLiveRequest,
  toggleLiveReminder,
  getUserSubscribedLiveIds,
  getAllLiveConferences,
  getApprovedAndActiveLives,
  getLiveAlerts,
} from "@/lib/data/live-store";

const liveRequestSchema = z.object({
  title: z.string().trim().min(4, "Le titre du live doit comporter au moins 4 caractères.").max(150),
  description: z.string().trim().min(10, "La description / objectif doit comporter au moins 10 caractères.").max(1200),
  applicantName: z.string().trim().min(2, "Votre nom complet ou d'intervenant est obligatoire.").max(100),
  applicantPhone: z.string().trim().min(6, "Veuillez renseigner un numéro de téléphone valide.").max(30),
  category: z.string().trim().default("Formation & Conférence"),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (AAAA-MM-JJ)."),
  scheduledTime: z.string().regex(/^\d{2}:\d{2}$/, "Format d'heure invalide (HH:MM)."),
  durationMinutes: z.coerce.number().min(15).max(360).default(60),
  meetUrl: z.string().trim().optional().default(""),
  coverImageUrl: z.string().trim().optional().default(""),
});

function resolveCurrentUser(): { id: string; identifier: string; name: string } {
  const cookieStore = cookies();
  const sessionUserRaw = cookieStore.get("vita_session_user")?.value;
  const testUser = cookieStore.get("vita_test_user")?.value;

  if (sessionUserRaw) {
    try {
      const parsed = JSON.parse(sessionUserRaw);
      return {
        id: String(parsed.id || parsed.username || "user"),
        identifier: String(parsed.email || parsed.username || parsed.id || "user"),
        name: String(parsed.fullName || parsed.username || ""),
      };
    } catch {
      try {
        const parsed = JSON.parse(decodeURIComponent(sessionUserRaw));
        return {
          id: String(parsed.id || parsed.username || "user"),
          identifier: String(parsed.email || parsed.username || parsed.id || "user"),
          name: String(parsed.fullName || parsed.username || ""),
        };
      } catch {}
    }
  }

  if (testUser) {
    return {
      id: testUser,
      identifier: testUser,
      name: testUser,
    };
  }

  // Identifiant anonyme persistant pour les visiteurs
  let anonId = cookieStore.get("vita_anon_visitor")?.value;
  if (!anonId) {
    anonId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  return {
    id: anonId,
    identifier: anonId,
    name: "Participant",
  };
}

export async function submitLiveRequestAction(prevState: any, formData: FormData) {
  try {
    const rawData = {
      title: formData.get("title"),
      description: formData.get("description"),
      applicantName: formData.get("applicantName"),
      applicantPhone: formData.get("applicantPhone"),
      category: formData.get("category") || "Formation & Conférence",
      scheduledDate: formData.get("scheduledDate"),
      scheduledTime: formData.get("scheduledTime"),
      durationMinutes: formData.get("durationMinutes") || 60,
      meetUrl: formData.get("meetUrl") || "",
      coverImageUrl: formData.get("coverImageUrl") || "",
    };

    const parsed = liveRequestSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message || "Données invalides.",
      };
    }

    const user = resolveCurrentUser();

    // Vérifier si un live est déjà approuvé exactement au même créneau
    const all = await getAllLiveConferences();
    const conflict = all.find(
      (l) =>
        (l.status === "approved" || l.status === "live") &&
        l.scheduledDate === parsed.data.scheduledDate &&
        l.scheduledTime === parsed.data.scheduledTime
    );

    if (conflict) {
      return {
        ok: false,
        error: `Un live est déjà programmé à cette date (${parsed.data.scheduledDate}) et heure (${parsed.data.scheduledTime}). Veuillez choisir un autre horaire.`,
      };
    }

    // Valider ou assigner le lien Google Meet
    let finalMeetUrl = parsed.data.meetUrl;
    if (!finalMeetUrl || !finalMeetUrl.startsWith("http")) {
      finalMeetUrl = "https://meet.google.com/new";
    }

    await createLiveRequest({
      userId: user.id,
      applicantName: parsed.data.applicantName,
      applicantPhone: parsed.data.applicantPhone,
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      scheduledDate: parsed.data.scheduledDate,
      scheduledTime: parsed.data.scheduledTime,
      durationMinutes: parsed.data.durationMinutes,
      meetUrl: finalMeetUrl,
      coverImageUrl: parsed.data.coverImageUrl,
    });

    revalidatePath("/live");
    revalidatePath("/admin/live");
    revalidatePath("/");

    return {
      ok: true,
      message: "Votre demande de live a été envoyée avec succès ! L'administrateur va vérifier les disponibilités et valider votre créneau.",
    };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || "Une erreur est survenue lors de l'enregistrement de votre demande.",
    };
  }
}

export async function toggleLiveReminderAction(liveId: string) {
  try {
    const user = resolveCurrentUser();
    const result = await toggleLiveReminder(liveId, user.identifier);

    revalidatePath("/live");
    revalidatePath("/");

    return {
      ok: true,
      isSubscribed: result.isSubscribed,
      count: result.count,
    };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || "Erreur de rappel.",
    };
  }
}

export async function getLiveAlertsAction() {
  try {
    const user = resolveCurrentUser();
    const userSubscribedIds = await getUserSubscribedLiveIds(user.identifier);
    const alerts = await getLiveAlerts(userSubscribedIds);
    return { ok: true, alerts };
  } catch {
    return { ok: false, alerts: { activeLive: null, imminentLive: null, tomorrowLive: null } };
  }
}
