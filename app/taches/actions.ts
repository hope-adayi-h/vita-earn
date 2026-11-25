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

    // 5. Vérification de l'idempotence stricte (anti-doublon universel)
    const effectiveUserId = supabaseAuthId || userId;
    const taskTypeKey = todayTask.taskType || "tiktok";

    if (
      hasUserValidatedToday(effectiveUserId, taskId, lomeTime.dateStr) ||
      hasUserValidatedToday(effectiveUserId, taskTypeKey, lomeTime.dateStr)
    ) {
      return {
        success: false,
        message: "Vous avez déjà validé cette tâche aujourd'hui. Votre gain a déjà été crédité.",
      };
    }

    // Double vérification dans Supabase task_history
    if (isConfigured && effectiveUserId) {
      try {
        const adminClient = createAdminClient();
        const { data: existingTask } = await adminClient
          .from("task_history")
          .select("id")
          .eq("user_id", effectiveUserId)
          .eq("task_type", taskTypeKey)
          .eq("completed_date", lomeTime.dateStr)
          .maybeSingle();

        if (existingTask) {
          return {
            success: false,
            message: "Vous avez déjà validé cette tâche aujourd'hui. Votre gain a déjà été crédité.",
          };
        }
      } catch {}
    }

    // 6. Plafond de récompense (lu côté serveur)
    const rewardAmount = Math.max(1, Math.min(todayTask.rewardAmount, 500));

    // 7. Enregistrement dans Supabase dans la cagnotte dédiée user_task_earnings
    if (isConfigured && effectiveUserId) {
      try {
        const adminClient = createAdminClient();
        const taskTypeKey = todayTask.taskType || "tiktok";

        // Historique de la tâche
        await adminClient.from("task_history").insert({
          user_id: effectiveUserId,
          task_type: taskTypeKey,
          reward_amount: rewardAmount,
          completed_date: lomeTime.dateStr,
        });

        // Mise à jour de la cagnotte dédiée (seuil de 4 500 FCFA)
        const { data: curEarn } = await adminClient
          .from("user_task_earnings")
          .select("accumulated_amount")
          .eq("user_id", effectiveUserId)
          .eq("task_type", taskTypeKey)
          .maybeSingle();

        const newAcc = (Number(curEarn?.accumulated_amount) || 0) + rewardAmount;
        if (curEarn) {
          await adminClient
            .from("user_task_earnings")
            .update({
              accumulated_amount: newAcc,
              last_completed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", effectiveUserId)
            .eq("task_type", taskTypeKey);
        } else {
          await adminClient.from("user_task_earnings").insert({
            user_id: effectiveUserId,
            task_type: taskTypeKey,
            accumulated_amount: newAcc,
            threshold_amount: 4500,
            last_completed_at: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn("Erreur mise à jour user_task_earnings:", err);
      }
    }

    // 8. Enregistrement dans le store local
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

    // Revalidation des routes concernées
    revalidatePath("/taches");
    revalidatePath("/");
    revalidatePath("/portefeuille");
    revalidatePath("/retrait");
    revalidatePath("/admin/taches");

    return {
      success: true,
      message: `Félicitations ! Vous avez validé la tâche vidéo du jour et reçu ${rewardAmount} FCFA dans votre cagnotte dédiée.`,
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

    if (
      hasUserValidatedToday(effectiveUserId, taskId, lomeTime.dateStr) ||
      hasUserValidatedToday(effectiveUserId, "trivia", lomeTime.dateStr) ||
      hasUserValidatedToday(effectiveUserId, "quiz", lomeTime.dateStr)
    ) {
      return {
        success: false,
        message:
          "Vous avez déjà complété ou tenté le questionnaire d'aujourd'hui. Une seule tentative autorisée chaque lundi.",
        earnedReward: 0,
        score: 0,
        totalQuestions: 0,
      };
    }

    if (isConfigured && effectiveUserId) {
      try {
        const adminClient = createAdminClient();
        const { data: existingTrivia } = await adminClient
          .from("task_history")
          .select("id")
          .eq("user_id", effectiveUserId)
          .in("task_type", ["trivia", "quiz"])
          .eq("completed_date", lomeTime.dateStr)
          .maybeSingle();

        if (existingTrivia) {
          return {
            success: false,
            message:
              "Vous avez déjà complété ou tenté le questionnaire d'aujourd'hui. Une seule tentative autorisée chaque lundi.",
            earnedReward: 0,
            score: 0,
            totalQuestions: 0,
          };
        }
      } catch {}
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

    // RÈGLE ABSOLUE AGENTS.md :
    // Les gains du questionnaire (Trivia / Quiz) sont directement crédités sur le Solde Principal
    // et le PROFIT via une écriture immuable dans ledger_entries, immédiatement retirable sur /retrait.
    if (quizRes.earnedReward > 0) {
      if (isConfigured && effectiveUserId) {
        try {
          const adminClient = createAdminClient();

          // 1. Trouver ou créer le portefeuille de l'utilisateur
          let { data: wallet } = await adminClient
            .from("wallets")
            .select("id")
            .eq("user_id", effectiveUserId)
            .maybeSingle();

          if (!wallet) {
            const { data: newW } = await adminClient
              .from("wallets")
              .insert({ user_id: effectiveUserId })
              .select("id")
              .maybeSingle();
            wallet = newW;
          }

          if (wallet) {
            // 2. Écriture immuable dans ledger_entries (Solde Principal retirable)
            const { error: ledgerErr } = await adminClient.from("ledger_entries").insert({
              wallet_id: wallet.id,
              amount: quizRes.earnedReward,
              entry_type: "activation_credit",
              description: `Gain Questionnaire Trivia (${lomeTime.dateStr})`,
            });
            if (ledgerErr) {
              console.error("Erreur écriture ledger quiz:", ledgerErr);
            }
          }

          // 3. Tracking dans user_task_earnings
          const { data: curEarn } = await adminClient
            .from("user_task_earnings")
            .select("accumulated_amount")
            .eq("user_id", effectiveUserId)
            .eq("task_type", "trivia")
            .maybeSingle();

          const newAcc = (Number(curEarn?.accumulated_amount) || 0) + quizRes.earnedReward;
          if (curEarn) {
            await adminClient
              .from("user_task_earnings")
              .update({
                accumulated_amount: newAcc,
                last_completed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", effectiveUserId)
              .eq("task_type", "trivia");
          } else {
            await adminClient.from("user_task_earnings").insert({
              user_id: effectiveUserId,
              task_type: "trivia",
              accumulated_amount: newAcc,
              threshold_amount: 4500,
              last_completed_at: new Date().toISOString(),
            });
          }
        } catch (dbErr) {
          console.error("Erreur crédit Supabase quiz:", dbErr);
        }
      }

      // 4. Mise à jour des cookies de session pour refléter immédiatement le solde
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
    revalidatePath("/retrait");

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

    // Enregistrement dans Supabase dans la cagnotte dédiée user_task_earnings (ads)
    if (isConfigured && effectiveUserId) {
      try {
        const adminClient = createAdminClient();
        await adminClient.from("task_history").insert({
          user_id: effectiveUserId,
          task_type: "ads",
          reward_amount: rewardAmount,
          completed_date: lomeTime.dateStr,
        });

        const { data: curEarn } = await adminClient
          .from("user_task_earnings")
          .select("accumulated_amount")
          .eq("user_id", effectiveUserId)
          .eq("task_type", "ads")
          .maybeSingle();

        const newAcc = (Number(curEarn?.accumulated_amount) || 0) + rewardAmount;
        if (curEarn) {
          await adminClient
            .from("user_task_earnings")
            .update({
              accumulated_amount: newAcc,
              last_completed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", effectiveUserId)
            .eq("task_type", "ads");
        } else {
          await adminClient.from("user_task_earnings").insert({
            user_id: effectiveUserId,
            task_type: "ads",
            accumulated_amount: newAcc,
            threshold_amount: 4500,
            last_completed_at: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn("Erreur mise à jour user_task_earnings ads:", err);
      }
    }

    revalidatePath("/taches");
    revalidatePath("/");
    revalidatePath("/retrait");

    return {
      success: true,
      message: `Félicitations ! Vous avez complété l'annonce AdSense et reçu ${rewardAmount} FCFA dans votre cagnotte dédiée !`,
      reward: rewardAmount,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur inattendue.";
    return { success: false, message: msg };
  }
}
