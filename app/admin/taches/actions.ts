"use server";

import { revalidatePath } from "next/cache";
import { checkAdminSession } from "@/lib/security/admin-lock";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseUniversalVideoUrl } from "@/lib/video/universal-embed";
import { isWeekdayDate } from "@/lib/utils/lome-time";
import {
  saveStoredDailyTask,
  toggleStoredTaskActive,
  deleteStoredDailyTask,
  StoredDailyTask,
  QuizQuestionItem,
} from "@/lib/data/tasks-store";

export interface SaveTaskInput {
  id?: string;
  dayOfWeek: number; // 1 = Lundi à 5 = Vendredi
  specificDate?: string | null; // "YYYY-MM-DD" ou null
  title?: string;
  videoUrl?: string; // Lien unique universel
  instructions: string;
  rewardAmount: number; // FCFA
  isActive: boolean;
}

export interface SaveQuizInput {
  id?: string;
  title?: string;
  instructions: string;
  rewardAmount: number;
  isActive: boolean;
  quizQuestions: QuizQuestionItem[];
}

export interface SaveAdSenseInput {
  id?: string;
  title?: string;
  instructions: string;
  adImageUrl: string;
  adTargetUrl?: string;
  sponsorName?: string;
  adDurationSeconds: number;
  rewardAmount: number;
  isActive: boolean;
}

export interface ActionResult {
  success: boolean;
  message?: string;
  error?: string;
  task?: StoredDailyTask;
}

/**
 * Enregistre ou modifie une tâche vidéo quotidienne
 */
export async function saveDailyVideoTaskAction(input: SaveTaskInput): Promise<ActionResult> {
  try {
    const { isAdmin } = await checkAdminSession();
    if (!isAdmin) {
      return { success: false, error: "Accès refusé : privilèges administrateur requis." };
    }

    // 1. Validation du jour de la semaine (1 à 5)
    const dayOfWeek = Number(input.dayOfWeek);
    if (!dayOfWeek || dayOfWeek < 1 || dayOfWeek > 5) {
      return { success: false, error: "Le jour de la tâche doit être compris entre Lundi et Vendredi." };
    }

    // 2. Validation de la date spécifique si fournie (uniquement lundi à vendredi)
    let cleanSpecificDate: string | null = null;
    if (input.specificDate && input.specificDate.trim()) {
      const dateCandidate = input.specificDate.trim();
      if (!isWeekdayDate(dateCandidate)) {
        return {
          success: false,
          error: "La date spécifique choisie doit être un jour ouvrable (du lundi au vendredi).",
        };
      }
      cleanSpecificDate = dateCandidate;
    }

    // 3. Validation universelle du lien vidéo (YouTube, TikTok, Facebook, Instagram)
    const rawVideoUrl = (input.videoUrl || "").trim();
    if (!rawVideoUrl) {
      return {
        success: false,
        error: "Veuillez renseigner le lien de la vidéo.",
      };
    }
    const parsed = parseUniversalVideoUrl(rawVideoUrl);
    if (!parsed.isValid || !parsed.platform || !parsed.embedUrl) {
      return {
        success: false,
        error: parsed.error || "Lien vidéo non valide. Veuillez fournir un lien YouTube, TikTok, Facebook ou Instagram.",
      };
    }

    // 4. Instructions
    const instructions = input.instructions ? input.instructions.trim() : "";
    if (!instructions) {
      return { success: false, error: "Veuillez renseigner les consignes de la tâche." };
    }

    // 5. Récompense (en FCFA, minimum 1, plafond par défaut 500)
    let rewardAmount = Number(input.rewardAmount) || 100;
    if (rewardAmount <= 0) {
      return { success: false, error: "Le montant de la récompense doit être strictement positif." };
    }
    if (rewardAmount > 500) {
      rewardAmount = 500;
    }

    // 6. Titre par défaut selon la plateforme et le jour
    const dayNames = ["", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
    const title = input.title?.trim() || `Tâche du ${dayNames[dayOfWeek]} (${parsed.platformName})`;

    // 7. Enregistrement dans le store local
    const saved = saveStoredDailyTask({
      id: input.id,
      dayOfWeek,
      specificDate: cleanSpecificDate,
      taskType: (dayOfWeek === 2 ? "tiktok" : dayOfWeek === 3 ? "youtube" : "instagram") as any,
      title,
      videoUrl: rawVideoUrl,
      platform: parsed.platform,
      embedUrl: parsed.embedUrl,
      videoId: parsed.videoId,
      instructions,
      rewardAmount,
      isActive: Boolean(input.isActive),
      isDeleted: false,
    });

    // 8. Enregistrement dans Supabase si configuré
    try {
      const isConfigured =
        Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
        !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

      if (isConfigured) {
        const adminClient = createAdminClient();
        await adminClient.from("daily_video_tasks").upsert({
          id: saved.id,
          day_of_week: dayOfWeek,
          specific_date: cleanSpecificDate,
          title,
          video_url: rawVideoUrl,
          platform: parsed.platform,
          embed_url: parsed.embedUrl,
          video_id: parsed.videoId,
          instructions,
          reward_amount: rewardAmount,
          is_active: Boolean(input.isActive),
          is_deleted: false,
          updated_at: new Date().toISOString(),
        });
      }
    } catch (dbErr) {
      console.warn("Avertissement synchronisation Supabase tâche:", dbErr);
    }

    revalidatePath("/admin/taches");
    revalidatePath("/taches");
    revalidatePath("/");

    return {
      success: true,
      message: "La tâche vidéo quotidienne a été enregistrée avec succès.",
      task: saved,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur inattendue.";
    return { success: false, error: msg };
  }
}

/**
 * Enregistre ou modifie le questionnaire du Lundi
 */
export async function saveDailyQuizTaskAction(input: SaveQuizInput): Promise<ActionResult> {
  try {
    const { isAdmin } = await checkAdminSession();
    if (!isAdmin) {
      return { success: false, error: "Accès refusé : privilèges administrateur requis." };
    }

    if (!input.quizQuestions || input.quizQuestions.length === 0) {
      return { success: false, error: "Veuillez configurer au moins une question pour le questionnaire du lundi." };
    }

    // Validation de chaque question
    for (let i = 0; i < input.quizQuestions.length; i++) {
      const q = input.quizQuestions[i];
      if (!q.question.trim()) {
        return { success: false, error: `La question #${i + 1} n'a pas d'énoncé.` };
      }
      if (!q.options || q.options.length < 2) {
        return { success: false, error: `La question #${i + 1} doit comporter au moins 2 options de réponse (3 ou 4 recommandées).` };
      }
      if (q.correctOptionIndex < 0 || q.correctOptionIndex >= q.options.length) {
        return { success: false, error: `Veuillez sélectionner la bonne réponse pour la question #${i + 1}.` };
      }
      if (q.rewardAmount <= 0) {
        return { success: false, error: `La récompense pour la question #${i + 1} doit être positive.` };
      }
    }

    const totalReward = input.quizQuestions.reduce((sum, q) => sum + (Number(q.rewardAmount) || 0), 0);

    const saved = saveStoredDailyTask({
      id: input.id || "task_lundi",
      dayOfWeek: 1,
      specificDate: null,
      taskType: "quiz",
      title: input.title?.trim() || "Questionnaire du Lundi — Connaissances Digitales",
      instructions:
        input.instructions?.trim() ||
        "Répondez avec précision aux questions ci-dessous. Vous n'avez droit qu'à une seule tentative ce lundi !",
      rewardAmount: totalReward > 0 ? totalReward : Number(input.rewardAmount) || 300,
      quizQuestions: input.quizQuestions,
      isActive: Boolean(input.isActive),
      isDeleted: false,
    });

    revalidatePath("/admin/taches");
    revalidatePath("/taches");
    revalidatePath("/");

    return {
      success: true,
      message: "Le questionnaire du lundi a été enregistré avec succès.",
      task: saved,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur inattendue.";
    return { success: false, error: msg };
  }
}

/**
 * Enregistre ou modifie la publicité AdSense du Jeudi
 */
export async function saveDailyAdSenseTaskAction(input: SaveAdSenseInput): Promise<ActionResult> {
  try {
    const { isAdmin } = await checkAdminSession();
    if (!isAdmin) {
      return { success: false, error: "Accès refusé : privilèges administrateur requis." };
    }

    const cleanImg = (input.adImageUrl || "").trim();
    if (!cleanImg) {
      return { success: false, error: "Veuillez renseigner le lien ou l'image de la publicité." };
    }

    const duration = Math.max(5, Number(input.adDurationSeconds) || 15);
    const rewardAmount = Math.max(1, Number(input.rewardAmount) || 200);

    const saved = saveStoredDailyTask({
      id: input.id || "task_jeudi",
      dayOfWeek: 4,
      specificDate: null,
      taskType: "adsense",
      title: input.title?.trim() || "Publicité AdSense du Jeudi — Annonce Sponsorisée",
      instructions:
        input.instructions?.trim() ||
        "Examinez attentivement cette annonce. Vous devez rester sur la publicité jusqu'à la fin complète du décompte pour percevoir votre gain.",
      adImageUrl: cleanImg,
      adTargetUrl: input.adTargetUrl?.trim() || "",
      sponsorName: input.sponsorName?.trim() || "Partenaire Officiel UEMOA",
      adDurationSeconds: duration,
      rewardAmount,
      isActive: Boolean(input.isActive),
      isDeleted: false,
    });

    revalidatePath("/admin/taches");
    revalidatePath("/taches");
    revalidatePath("/");

    return {
      success: true,
      message: "La publicité AdSense du jeudi a été enregistrée avec succès.",
      task: saved,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur inattendue.";
    return { success: false, error: msg };
  }
}

/**
 * Active ou désactive une tâche vidéo
 */
export async function toggleDailyVideoTaskAction(taskId: string, isActive: boolean): Promise<ActionResult> {
  try {
    const { isAdmin } = await checkAdminSession();
    if (!isAdmin) {
      return { success: false, error: "Accès refusé : privilèges administrateur requis." };
    }

    toggleStoredTaskActive(taskId, isActive);

    try {
      const isConfigured =
        Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
        !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

      if (isConfigured) {
        const adminClient = createAdminClient();
        await adminClient
          .from("daily_video_tasks")
          .update({ is_active: isActive, updated_at: new Date().toISOString() })
          .eq("id", taskId);
      }
    } catch {}

    revalidatePath("/admin/taches");
    revalidatePath("/taches");
    revalidatePath("/");

    return {
      success: true,
      message: `Tâche ${isActive ? "activée" : "désactivée"} avec succès.`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur inattendue.";
    return { success: false, error: msg };
  }
}

/**
 * Suppression logique (soft-delete) d'une tâche vidéo pour conserver l'historique d'audit
 */
export async function deleteDailyVideoTaskAction(taskId: string): Promise<ActionResult> {
  try {
    const { isAdmin } = await checkAdminSession();
    if (!isAdmin) {
      return { success: false, error: "Accès refusé : privilèges administrateur requis." };
    }

    deleteStoredDailyTask(taskId);

    try {
      const isConfigured =
        Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
        !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

      if (isConfigured) {
        const adminClient = createAdminClient();
        await adminClient
          .from("daily_video_tasks")
          .update({ is_deleted: true, is_active: false, updated_at: new Date().toISOString() })
          .eq("id", taskId);
      }
    } catch {}

    revalidatePath("/admin/taches");
    revalidatePath("/taches");
    revalidatePath("/");

    return {
      success: true,
      message: "Tâche supprimée avec succès (historique conservé).",
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur inattendue.";
    return { success: false, error: msg };
  }
}
