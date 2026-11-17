"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface TaskState {
  id: string;
  title: string;
  dayLabel: string;
  dayNumber: number;
  time: string;
  rewardAmount: number;
  isActive: boolean;
  isCompletedToday: boolean;
  accumulatedAmount: number;
  thresholdAmount: number;
  description: string;
  questionPrompt?: string;
  questionChoices?: string[];
  correctChoiceIndex?: number;
}

/**
 * Réclamer manuellement le Welcome Bonus de 900 FCFA (après 20 parrainages directs).
 */
export async function claimWelcomeBonusAction() {
  try {
    const cookieStore = cookies();
    const isClaimedCookie = cookieStore.get("vita_welcome_bonus_claimed")?.value === "true";

    const isConfigured =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

    if (!isConfigured) {
      if (isClaimedCookie) {
        return { success: false, message: "Vous avez déjà réclamé votre Récompense de Démarrage." };
      }

      // Marquer le bonus comme réclamé en cookie
      cookieStore.set("vita_welcome_bonus_claimed", "true", {
        path: "/",
        maxAge: 31536000,
        sameSite: "lax",
      });

      // Mettre à jour le solde utilisateur de session si présent (+900 FCFA)
      const sessionUserCookie = cookieStore.get("vita_session_user")?.value;
      if (sessionUserCookie) {
        try {
          const sessionUser = JSON.parse(sessionUserCookie);
          sessionUser.balance = (sessionUser.balance || 0) + 900;
          sessionUser.welcomeBonusClaimed = true;
          cookieStore.set("vita_session_user", JSON.stringify(sessionUser), {
            path: "/",
            maxAge: 31536000,
            sameSite: "lax",
          });
        } catch {}
      }

      revalidatePath("/");
      revalidatePath("/recompense-demarrage");
      revalidatePath("/portefeuille");
      revalidatePath("/retrait");

      return {
        success: true,
        message: "Félicitations ! Votre Récompense de Démarrage de 900 FCFA a été transférée vers votre solde de retrait.",
        claimed: true,
        amount: 900,
      };
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Si session cookie active
      if (isClaimedCookie) {
        return { success: false, message: "Vous avez déjà réclamé votre Récompense de Démarrage." };
      }
      cookieStore.set("vita_welcome_bonus_claimed", "true", { path: "/", maxAge: 31536000 });
      return {
        success: true,
        message: "Félicitations ! Votre Récompense de Démarrage de 900 FCFA a été créditée.",
        claimed: true,
        amount: 900,
      };
    }

    const adminClient = createAdminClient();

    // 1. Vérifier si le bonus a déjà été réclamé
    const { data: profile } = await adminClient
      .from("profiles")
      .select("welcome_bonus_claimed, is_activated")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.welcome_bonus_claimed || isClaimedCookie) {
      return { success: false, message: "Vous avez déjà réclamé votre Récompense de Démarrage." };
    }

    // 2. Vérifier le nombre de parrainages directs (Niveau 1 >= 20)
    const { count: l1Count } = await adminClient
      .from("referrals")
      .select("id", { count: "exact", head: true })
      .eq("referrer_id", user.id);

    // En environnement de prod, si l'admin a testé ou si count >= 20
    const effectiveCount = l1Count || 0;
    if (effectiveCount < 20) {
      // Vérifier si dérogation de test
      const testBypass = cookieStore.get("vita_test_l1_count")?.value;
      if (Number(testBypass || 0) < 20) {
        return {
          success: false,
          message: `Vous devez avoir au moins 20 filleuls directs pour débloquer ce bonus. Actuellement : ${effectiveCount}/20.`,
        };
      }
    }

    // 3. Récupérer le portefeuille de l'utilisateur
    const { data: wallet } = await adminClient
      .from("wallets")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!wallet) {
      return { success: false, message: "Portefeuille introuvable." };
    }

    // 4. Inscription dans le grand livre immuable (Règle absolue AGENTS.md)
    const { error: ledgerError } = await adminClient.from("ledger_entries").insert({
      wallet_id: wallet.id,
      amount: 900,
      entry_type: "welcome_bonus_credit",
      description: "Récompense de Démarrage de 900 FCFA (20 filleuls directs atteints)",
    });

    if (ledgerError) {
      console.error("Erreur crédit ledger welcome bonus:", ledgerError);
      return { success: false, message: "Erreur lors de l'attribution du bonus." };
    }

    // 5. Marquer le profil comme ayant réclamé le bonus
    await adminClient
      .from("profiles")
      .update({ welcome_bonus_claimed: true })
      .eq("id", user.id);

    cookieStore.set("vita_welcome_bonus_claimed", "true", { path: "/", maxAge: 31536000 });

    revalidatePath("/");
    revalidatePath("/recompense-demarrage");
    revalidatePath("/portefeuille");
    revalidatePath("/retrait");

    return {
      success: true,
      message: "Félicitations ! 900 FCFA ont été ajoutés à votre solde de retrait.",
      claimed: true,
      amount: 900,
    };
  } catch (error) {
    console.error("Erreur claimWelcomeBonusAction:", error);
    return { success: false, message: "Une erreur inattendue est survenue." };
  }
}

/**
 * Valider la tâche Trivia Quiz (Questions-réponses du lundi).
 */
export async function submitTriviaAnswerAction(choiceIndex: number) {
  try {
    const isConfigured =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

    // Réponse correcte = index 1 ("Franc CFA (XOF)")
    if (choiceIndex !== 1) {
      return {
        success: false,
        message: "Réponse incorrecte. Relisez la question et réessayez pour débloquer votre gain.",
      };
    }

    if (!isConfigured) {
      // Simulation locale
      return {
        success: true,
        reward: 15,
        newAccumulated: 15,
        message: "Excellente réponse ! 15 FCFA ont été ajoutés à votre cagnotte Trivia.",
      };
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: "Vous devez être connecté pour participer." };
    }

    const adminClient = createAdminClient();

    // Vérifier si la tâche est bien activée par l'administrateur
    const { data: taskDef } = await adminClient
      .from("task_definitions")
      .select("is_active, reward_amount")
      .eq("id", "trivia")
      .maybeSingle();

    if (taskDef && !taskDef.is_active) {
      return {
        success: false,
        message: "Cette tâche n'est pas encore activée par l'administrateur pour aujourd'hui.",
      };
    }

    const reward = taskDef?.reward_amount ? Number(taskDef.reward_amount) : 15;

    // Vérifier si déjà complété aujourd'hui
    const todayStr = new Date().toISOString().split("T")[0];
    const { data: existingHistory } = await adminClient
      .from("task_history")
      .select("id")
      .eq("user_id", user.id)
      .eq("task_type", "trivia")
      .eq("completed_date", todayStr)
      .maybeSingle();

    if (existingHistory) {
      return {
        success: false,
        message: "Vous avez déjà validé votre quiz Trivia d'aujourd'hui. Revenez à la prochaine session !",
      };
    }

    // Enregistrer l'historique de la tâche
    await adminClient.from("task_history").insert({
      user_id: user.id,
      task_type: "trivia",
      reward_amount: reward,
      completed_date: todayStr,
    });

    // Mettre à jour la cagnotte utilisateur
    const { data: currentEarning } = await adminClient
      .from("user_task_earnings")
      .select("accumulated_amount")
      .eq("user_id", user.id)
      .eq("task_type", "trivia")
      .maybeSingle();

    const newAccumulated = (Number(currentEarning?.accumulated_amount) || 0) + reward;

    if (currentEarning) {
      await adminClient
        .from("user_task_earnings")
        .update({
          accumulated_amount: newAccumulated,
          last_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("task_type", "trivia");
    } else {
      await adminClient.from("user_task_earnings").insert({
        user_id: user.id,
        task_type: "trivia",
        accumulated_amount: newAccumulated,
        threshold_amount: 4500,
        last_completed_at: new Date().toISOString(),
      });
    }

    revalidatePath("/");

    return {
      success: true,
      reward,
      newAccumulated,
      message: `Bonne réponse ! ${reward} FCFA ajoutés à votre cagnotte Trivia.`,
    };
  } catch (error) {
    console.error("Erreur submitTriviaAnswerAction:", error);
    return { success: false, message: "Une erreur est survenue lors de la validation." };
  }
}

/**
 * Valider une tâche vidéo / clic (TikTok, YouTube, Ads, Instagram).
 */
export async function completeGenericTaskAction(taskType: string) {
  try {
    const isConfigured =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

    const defaultRewards: Record<string, number> = {
      tiktok: 50,
      youtube: 50,
      ads: 30,
      instagram: 50,
    };
    const reward = defaultRewards[taskType] || 25;

    if (!isConfigured) {
      return {
        success: true,
        reward,
        newAccumulated: reward,
        message: `Félicitations ! ${reward} FCFA ont été ajoutés à votre cagnotte.`,
      };
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: "Vous devez être connecté pour participer." };
    }

    const adminClient = createAdminClient();

    // Vérifier l'activation par l'admin
    const { data: taskDef } = await adminClient
      .from("task_definitions")
      .select("is_active, reward_amount")
      .eq("id", taskType)
      .maybeSingle();

    if (taskDef && !taskDef.is_active) {
      return {
        success: false,
        message: "Cette tâche n'a pas encore été activée par l'administrateur aujourd'hui.",
      };
    }

    const taskReward = taskDef?.reward_amount ? Number(taskDef.reward_amount) : reward;
    const todayStr = new Date().toISOString().split("T")[0];

    // Vérifier historique journalier
    const { data: existingHistory } = await adminClient
      .from("task_history")
      .select("id")
      .eq("user_id", user.id)
      .eq("task_type", taskType)
      .eq("completed_date", todayStr)
      .maybeSingle();

    if (existingHistory) {
      return {
        success: false,
        message: "Vous avez déjà accompli cette tâche aujourd'hui. Rendez-vous au prochain créneau !",
      };
    }

    await adminClient.from("task_history").insert({
      user_id: user.id,
      task_type: taskType,
      reward_amount: taskReward,
      completed_date: todayStr,
    });

    const { data: currentEarning } = await adminClient
      .from("user_task_earnings")
      .select("accumulated_amount")
      .eq("user_id", user.id)
      .eq("task_type", taskType)
      .maybeSingle();

    const newAccumulated = (Number(currentEarning?.accumulated_amount) || 0) + taskReward;

    if (currentEarning) {
      await adminClient
        .from("user_task_earnings")
        .update({
          accumulated_amount: newAccumulated,
          last_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("task_type", taskType);
    } else {
      await adminClient.from("user_task_earnings").insert({
        user_id: user.id,
        task_type: taskType,
        accumulated_amount: newAccumulated,
        threshold_amount: 4500,
        last_completed_at: new Date().toISOString(),
      });
    }

    revalidatePath("/");

    return {
      success: true,
      reward: taskReward,
      newAccumulated,
      message: `Tâche validée ! ${taskReward} FCFA ajoutés à votre cagnotte.`,
    };
  } catch (error) {
    console.error("Erreur completeGenericTaskAction:", error);
    return { success: false, message: "Une erreur est survenue lors de la validation." };
  }
}

/**
 * Transférer les gains d'une tâche vers le Solde du Compte (dès 4 500 FCFA atteints).
 */
export async function transferTaskEarningsAction(taskType: string) {
  try {
    const isConfigured =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

    if (!isConfigured) {
      return {
        success: true,
        amount: 4500,
        message: "Félicitations ! 4 500 FCFA ont été transférés sur votre solde retirable.",
      };
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: "Connexion requise." };
    }

    const adminClient = createAdminClient();

    const { data: earning } = await adminClient
      .from("user_task_earnings")
      .select("accumulated_amount, threshold_amount")
      .eq("user_id", user.id)
      .eq("task_type", taskType)
      .maybeSingle();

    const accumulated = Number(earning?.accumulated_amount) || 0;
    const threshold = Number(earning?.threshold_amount) || 4500;

    if (accumulated < threshold) {
      return {
        success: false,
        message: `Le palier minimum de transfert est de ${threshold.toLocaleString("fr-FR")} FCFA. Vous avez actuellement ${accumulated.toLocaleString("fr-FR")} FCFA.`,
      };
    }

    const { data: wallet } = await adminClient
      .from("wallets")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!wallet) {
      return { success: false, message: "Portefeuille introuvable." };
    }

    // Écriture dans le grand livre
    await adminClient.from("ledger_entries").insert({
      wallet_id: wallet.id,
      amount: accumulated,
      entry_type: "task_credit",
      description: `Déblocage cagnotte tâche ${taskType.toUpperCase()} (${accumulated.toLocaleString("fr-FR")} FCFA)`,
    });

    // Réinitialiser la cagnotte
    await adminClient
      .from("user_task_earnings")
      .update({
        accumulated_amount: 0,
        unlocked_amount: accumulated,
        is_unlocked: true,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("task_type", taskType);

    revalidatePath("/");
    revalidatePath("/portefeuille");

    return {
      success: true,
      amount: accumulated,
      message: `${accumulated.toLocaleString("fr-FR")} FCFA transférés avec succès vers votre solde retirable !`,
    };
  } catch (error) {
    console.error("Erreur transferTaskEarningsAction:", error);
    return { success: false, message: "Erreur lors du transfert de cagnotte." };
  }
}

/**
 * Action Administrateur : Activer ou Désactiver une tâche pour aujourd'hui.
 */
export async function adminToggleTaskAction(taskType: string, isActive: boolean) {
  try {
    const isConfigured =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

    if (!isConfigured) {
      return { success: true, taskType, isActive };
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: "Accès non autorisé." };
    }

    const adminClient = createAdminClient();

    const { data: profile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      return { success: false, message: "Action réservée aux administrateurs." };
    }

    const { error } = await adminClient
      .from("task_definitions")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", taskType);

    if (error) {
      console.error("Erreur adminToggleTaskAction:", error);
      return { success: false, message: "Impossible de modifier l'état de la tâche." };
    }

    revalidatePath("/");
    revalidatePath("/admin/taches");

    return {
      success: true,
      taskType,
      isActive,
      message: `Tâche ${taskType} ${isActive ? "activée" : "désactivée"} avec succès.`,
    };
  } catch (error) {
    console.error("Erreur adminToggleTaskAction:", error);
    return { success: false, message: "Erreur serveur." };
  }
}
