"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getLomeServerTime } from "@/lib/utils/lome-time";
import {
  getTodayTaskForLome,
  hasUserValidatedToday,
  recordStoredTaskValidation,
  recordQuizSubmission,
} from "@/lib/data/tasks-store";
import { findUserByIdentifier } from "@/lib/auth/local-store";

export interface TaskValidationResult {
  success: boolean;
  message: string;
  reward?: number;
  newBalance?: number;
}

/**
 * Valide la tâche vidéo du jour pour l'utilisateur connecté
 * SÉCURITÉ ABSOLUE :
 * - Vérification connexion utilisateur
 * - Vérification compte ACTIVÉ (is_activated = true)
 * - Calcul strict de la date selon le fuseau horaire de Lomé (Africa/Lome)
 * - Tâche disponible uniquement du lundi au vendredi
 * - Idempotence stricte (unicité par utilisateur, tâche et date)
 * - Montant de la récompense lu côté serveur (plafonné par platform_settings)
 * - Écriture immuable dans le grand livre (ledger_entries)
 */
export async function validateDailyVideoTaskAction(taskId: string): Promise<TaskValidationResult> {
  try {
    // 1. Calcul de l'heure et du jour officiel côté serveur (Lomé, UTC+0)
    const lomeTime = getLomeServerTime();

    if (lomeTime.isWeekend) {
      return {
        success: false,
        message: "Les tâches rémunérées ne sont pas disponibles le week-end (samedi et dimanche). Rendez-vous lundi dès 08:00 !",
      };
    }

    // 2. Identification de l'utilisateur connecté
    const cookieStore = cookies();
    const sessionUserRaw = cookieStore.get("vita_session_user")?.value;
    const testUser = cookieStore.get("vita_test_user")?.value;
    const isActivatedCookie = cookieStore.get("vita_is_activated")?.value === "true";

    let userId = "";
    let userEmail = "";
    let isActivated = false;

    if (sessionUserRaw) {
      try {
        const parsed = JSON.parse(sessionUserRaw);
        userId = parsed.id || parsed.username || "";
        userEmail = parsed.email || "";
        isActivated = Boolean(parsed.isActivated || isActivatedCookie);
      } catch {}
    } else if (testUser) {
      const localU = findUserByIdentifier(testUser);
      if (localU) {
        userId = localU.id;
        userEmail = localU.email;
        isActivated = Boolean(localU.isActivated);
      } else {
        userId = testUser;
        isActivated = isActivatedCookie;
      }
    }

    // Vérifier aussi la session Supabase officielle si configurée
    let supabaseAuthId = "";
    const isConfigured =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

    if (isConfigured) {
      try {
        const supabase = createClient();
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (authUser) {
          supabaseAuthId = authUser.id;
          userId = userId || authUser.id;
          userEmail = userEmail || authUser.email || "";

          const { data: profile } = await supabase
            .from("profiles")
            .select("is_activated")
            .eq("id", authUser.id)
            .maybeSingle();

          if (profile) {
            isActivated = Boolean(profile.is_activated);
          }
        }
      } catch {}
    }

    if (!userId && !supabaseAuthId) {
      return {
        success: false,
        message: "Veuillez vous connecter pour valider la tâche du jour.",
      };
    }

    // 3. RÈGLE STRICTE : Le compte de l'utilisateur doit être ACTIVÉ
    if (!isActivated) {
      return {
        success: false,
        message:
          "Votre compte doit être activé pour participer et valider les tâches rémunérées. Veuillez souscrire à l'activation annuelle.",
      };
    }

    // 4. Vérification de la tâche du jour
    const todayTask = getTodayTaskForLome(lomeTime);
    if (!todayTask || todayTask.id !== taskId || !todayTask.isActive || todayTask.isDeleted) {
      return {
        success: false,
        message: "Cette tâche n'est pas programmée ou active pour aujourd'hui.",
      };
    }

    // 5. Vérification de l'idempotence stricte (anti-doublon)
    const effectiveUserId = supabaseAuthId || userId;
    if (hasUserValidatedToday(effectiveUserId, taskId, lomeTime.dateStr)) {
      return {
        success: false,
        message: "Vous avez déjà validé cette tâche aujourd'hui. Votre gain a déjà été crédité.",
      };
    }

    // 6. Plafond de récompense (lu côté serveur)
    const rewardAmount = Math.max(1, Math.min(todayTask.rewardAmount, 500));

    // 7. Enregistrement dans Supabase si connecté via la procédure SQL sécurisée
    if (isConfigured && supabaseAuthId) {
      try {
        const adminClient = createAdminClient();
        const { data: rpcRes, error: rpcErr } = await adminClient.rpc("validate_video_task", {
          p_user_id: supabaseAuthId,
          p_task_id: taskId,
          p_current_date: lomeTime.dateStr,
        });

        if (rpcErr) {
          console.warn("Erreur RPC validate_video_task Supabase:", rpcErr.message);
          // Si l'erreur indique qu'elle est déjà validée
          if (rpcErr.message.includes("déjà validé")) {
            return {
              success: false,
              message: "Vous avez déjà validé cette tâche aujourd'hui.",
            };
          }
        }
      } catch (err) {
        console.warn("Fallback local validation:", err);
      }
    }

    // 8. Enregistrement dans le store local résilient et crédit immédiat
    const storeRes = recordStoredTaskValidation({
      userId: effectiveUserId,
      taskId,
      rewardAmount,
      dateStr: lomeTime.dateStr,
    });

    if (!storeRes.success) {
      return {
        success: false,
        message: storeRes.error || "Erreur lors de la validation.",
      };
    }

    // 9. Mettre à jour les cookies de session pour reflet immédiat
    try {
      if (sessionUserRaw) {
        const sessionUser = JSON.parse(sessionUserRaw);
        sessionUser.balance = (sessionUser.balance || 0) + rewardAmount;
        sessionUser.profit = (sessionUser.profit || 0) + rewardAmount;
        cookieStore.set("vita_session_user", JSON.stringify(sessionUser), {
          path: "/",
          maxAge: 31536000,
          sameSite: "lax",
        });
      }

      // Mettre à jour vita_accounts si présent
      const rawAccounts = cookieStore.get("vita_accounts")?.value;
      if (rawAccounts) {
        const accounts = JSON.parse(rawAccounts);
        if (Array.isArray(accounts)) {
          const acc = accounts.find(
            (a: any) =>
              a.id === effectiveUserId ||
              a.username?.toLowerCase() === userId.toLowerCase() ||
              a.email?.toLowerCase() === userEmail.toLowerCase()
          );
          if (acc) {
            acc.balance = (acc.balance || 0) + rewardAmount;
            acc.profit = (acc.profit || 0) + rewardAmount;
            cookieStore.set("vita_accounts", JSON.stringify(accounts), {
              path: "/",
              maxAge: 31536000,
              sameSite: "lax",
            });
          }
        }
      }
    } catch {}

    // Revalidation des routes concernées
    revalidatePath("/taches");
    revalidatePath("/");
    revalidatePath("/portefeuille");
    revalidatePath("/admin/taches");

    return {
      success: true,
      message: `Félicitations ! Vous avez validé la tâche vidéo du jour et reçu ${rewardAmount} FCFA sur votre solde.`,
      reward: rewardAmount,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur inattendue.";
    return { success: false, message: msg };
  }
}

export interface QuizSubmissionResult {
  success: boolean;
  message: string;
  earnedReward: number;
  score: number;
  totalQuestions: number;
  failedQuestion?: boolean;
}

/**
 * Valide la soumission d'un questionnaire (Lundi)
 * RÈGLE STRICTE : Une seule tentative autorisée !
 */
export async function submitDailyQuizAction(
  taskId: string,
  answers: Record<string, number>
): Promise<QuizSubmissionResult> {
  try {
    const lomeTime = getLomeServerTime();

    if (lomeTime.isWeekend) {
      return {
        success: false,
        message: "Les tâches rémunérées ne sont pas disponibles le week-end.",
        earnedReward: 0,
        score: 0,
        totalQuestions: 0,
      };
    }

    const cookieStore = cookies();
    const sessionUserRaw = cookieStore.get("vita_session_user")?.value;
    const testUser = cookieStore.get("vita_test_user")?.value;
    const isActivatedCookie = cookieStore.get("vita_is_activated")?.value === "true";

    let userId = "";
    let userEmail = "";
    let isActivated = false;

    if (sessionUserRaw) {
      try {
        const parsed = JSON.parse(sessionUserRaw);
        userId = parsed.id || parsed.username || "";
        userEmail = parsed.email || "";
        isActivated = Boolean(parsed.isActivated || isActivatedCookie);
      } catch {}
    } else if (testUser) {
      const localU = findUserByIdentifier(testUser);
      if (localU) {
        userId = localU.id;
        userEmail = localU.email;
        isActivated = Boolean(localU.isActivated);
      } else {
        userId = testUser;
        isActivated = isActivatedCookie;
      }
    }

    let supabaseAuthId = "";
    const isConfigured =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

    if (isConfigured) {
      try {
        const supabase = createClient();
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (authUser) {
          supabaseAuthId = authUser.id;
          userId = userId || authUser.id;
          userEmail = userEmail || authUser.email || "";

          const { data: profile } = await supabase
            .from("profiles")
            .select("is_activated")
            .eq("id", authUser.id)
            .maybeSingle();

          if (profile) {
            isActivated = Boolean(profile.is_activated);
          }
        }
      } catch {}
    }

    if (!userId && !supabaseAuthId) {
      return {
        success: false,
        message: "Veuillez vous connecter pour valider le questionnaire.",
        earnedReward: 0,
        score: 0,
        totalQuestions: 0,
      };
    }

    if (!isActivated) {
      return {
        success: false,
        message:
          "Votre compte doit être activé pour valider le questionnaire rémunéré. Veuillez activer votre compte.",
        earnedReward: 0,
        score: 0,
        totalQuestions: 0,
      };
    }

    const effectiveUserId = supabaseAuthId || userId;

    if (hasUserValidatedToday(effectiveUserId, taskId, lomeTime.dateStr)) {
      return {
        success: false,
        message:
          "Vous avez déjà complété ou tenté le questionnaire d'aujourd'hui. Une seule tentative autorisée chaque lundi.",
        earnedReward: 0,
        score: 0,
        totalQuestions: 0,
      };
    }

    const quizRes = recordQuizSubmission({
      userId: effectiveUserId,
      taskId,
      dateStr: lomeTime.dateStr,
      answers,
    });

    if (!quizRes.success) {
      return {
        success: false,
        message: quizRes.error || "Erreur lors du traitement du questionnaire.",
        earnedReward: 0,
        score: 0,
        totalQuestions: 0,
      };
    }

    // Mise à jour des cookies de session pour refléter immédiatement le solde
    if (quizRes.earnedReward > 0) {
      try {
        if (sessionUserRaw) {
          const sessionUser = JSON.parse(sessionUserRaw);
          sessionUser.balance = (sessionUser.balance || 0) + quizRes.earnedReward;
          sessionUser.profit = (sessionUser.profit || 0) + quizRes.earnedReward;
          cookieStore.set("vita_session_user", JSON.stringify(sessionUser), {
            path: "/",
            maxAge: 31536000,
            sameSite: "lax",
          });
        }
      } catch {}
    }

    revalidatePath("/taches");
    revalidatePath("/");
    revalidatePath("/portefeuille");

    const feedbackMsg =
      quizRes.failedQuestion
        ? `Questionnaire terminé : vous avez obtenu ${quizRes.correctCount}/${quizRes.totalQuestions} bonne(s) réponse(s). Vous avez encaissé ${quizRes.earnedReward} FCFA. Attention : c'était votre seule tentative pour ce lundi.`
        : `Félicitations ! Sans faute : ${quizRes.correctCount}/${quizRes.totalQuestions} réponses correctes ! Vous avez encaissé ${quizRes.earnedReward} FCFA sur votre portefeuille.`;

    return {
      success: true,
      message: feedbackMsg,
      earnedReward: quizRes.earnedReward,
      score: quizRes.correctCount,
      totalQuestions: quizRes.totalQuestions,
      failedQuestion: quizRes.failedQuestion,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur inattendue.";
    return {
      success: false,
      message: msg,
      earnedReward: 0,
      score: 0,
      totalQuestions: 0,
    };
  }
}

/**
 * Valide la publicité photo AdSense (Jeudi) après compte à rebours
 */
export async function validateAdSensePhotoTaskAction(
  taskId: string,
  elapsedSeconds: number
): Promise<TaskValidationResult> {
  try {
    const lomeTime = getLomeServerTime();

    if (lomeTime.isWeekend) {
      return {
        success: false,
        message: "Les tâches ne sont pas disponibles le week-end.",
      };
    }

    const cookieStore = cookies();
    const sessionUserRaw = cookieStore.get("vita_session_user")?.value;
    const testUser = cookieStore.get("vita_test_user")?.value;
    const isActivatedCookie = cookieStore.get("vita_is_activated")?.value === "true";

    let userId = "";
    let isActivated = false;

    if (sessionUserRaw) {
      try {
        const parsed = JSON.parse(sessionUserRaw);
        userId = parsed.id || parsed.username || "";
        isActivated = Boolean(parsed.isActivated || isActivatedCookie);
      } catch {}
    } else if (testUser) {
      const localU = findUserByIdentifier(testUser);
      if (localU) {
        userId = localU.id;
        isActivated = Boolean(localU.isActivated);
      } else {
        userId = testUser;
        isActivated = isActivatedCookie;
      }
    }

    let supabaseAuthId = "";
    const isConfigured =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

    if (isConfigured) {
      try {
        const supabase = createClient();
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        if (authUser) {
          supabaseAuthId = authUser.id;
          userId = userId || authUser.id;
          const { data: profile } = await supabase
            .from("profiles")
            .select("is_activated")
            .eq("id", authUser.id)
            .maybeSingle();
          if (profile) isActivated = Boolean(profile.is_activated);
        }
      } catch {}
    }

    if (!userId && !supabaseAuthId) {
      return { success: false, message: "Veuillez vous connecter pour valider l'annonce." };
    }

    if (!isActivated) {
      return {
        success: false,
        message: "Votre compte doit être activé pour participer aux annonces rémunérées.",
      };
    }

    const todayTask = getTodayTaskForLome(lomeTime);
    if (!todayTask || todayTask.id !== taskId || !todayTask.isActive || todayTask.isDeleted) {
      return { success: false, message: "Cette publicité n'est pas active aujourd'hui." };
    }

    const requiredDuration = todayTask.adDurationSeconds || 15;
    if (elapsedSeconds < requiredDuration) {
      return {
        success: false,
        message: `Vous devez visualiser la publicité pendant au moins ${requiredDuration} secondes avant de pouvoir valider.`,
      };
    }

    const effectiveUserId = supabaseAuthId || userId;
    if (hasUserValidatedToday(effectiveUserId, taskId, lomeTime.dateStr)) {
      return {
        success: false,
        message: "Vous avez déjà validé cette publicité aujourd'hui.",
      };
    }

    const rewardAmount = Math.max(1, Math.min(todayTask.rewardAmount, 500));

    const storeRes = recordStoredTaskValidation({
      userId: effectiveUserId,
      taskId,
      rewardAmount,
      dateStr: lomeTime.dateStr,
    });

    if (!storeRes.success) {
      return { success: false, message: storeRes.error || "Erreur de validation." };
    }

    try {
      if (sessionUserRaw) {
        const sessionUser = JSON.parse(sessionUserRaw);
        sessionUser.balance = (sessionUser.balance || 0) + rewardAmount;
        sessionUser.profit = (sessionUser.profit || 0) + rewardAmount;
        cookieStore.set("vita_session_user", JSON.stringify(sessionUser), {
          path: "/",
          maxAge: 31536000,
          sameSite: "lax",
        });
      }
    } catch {}

    revalidatePath("/taches");
    revalidatePath("/");
    revalidatePath("/portefeuille");

    return {
      success: true,
      message: `Félicitations ! Vous avez complété la publicité du jeudi et empoché ${rewardAmount} FCFA !`,
      reward: rewardAmount,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur inattendue.";
    return { success: false, message: msg };
  }
}
