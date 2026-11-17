"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_WHEEL_SEGMENTS, WheelSegment } from "@/lib/wheel-constants";

/**
 * Récupère le statut du tour de bienvenue pour l'utilisateur connecté.
 * Règle système : 1 seul tour à vie par compte, réservé aux comptes activés.
 */
export async function getDailySpinStatusAction() {
  try {
    const cookieStore = cookies();
    const hasSpunCookie = cookieStore.get("vita_wheel_spun")?.value === "true";
    const rewardCookie = cookieStore.get("vita_wheel_reward")?.value;
    const sessionUserCookie = cookieStore.get("vita_session_user")?.value;
    let sessionUser: any = null;
    if (sessionUserCookie) {
      try {
        sessionUser = JSON.parse(sessionUserCookie);
      } catch {}
    }
    const isActivatedCookie = cookieStore.get("vita_account_activated")?.value === "true";

    const isConfigured =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

    if (!isConfigured) {
      return {
        isLoggedIn: true,
        isActivated: Boolean(isActivatedCookie || sessionUser?.isActivated),
        hasSpunToday: hasSpunCookie,
        todayReward: rewardCookie ? Number(rewardCookie) : (hasSpunCookie ? 56 : undefined),
        segments: DEFAULT_WHEEL_SEGMENTS,
      };
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        isLoggedIn: Boolean(sessionUser),
        isActivated: Boolean(isActivatedCookie || sessionUser?.isActivated),
        hasSpunToday: hasSpunCookie,
        todayReward: rewardCookie ? Number(rewardCookie) : (hasSpunCookie ? 56 : undefined),
        segments: DEFAULT_WHEEL_SEGMENTS,
      };
    }

    const adminClient = createAdminClient();

    // Vérifier l'activation du compte
    const { data: profile } = await adminClient
      .from("profiles")
      .select("is_activated")
      .eq("id", user.id)
      .maybeSingle();

    const isActivated = Boolean(profile?.is_activated || isActivatedCookie || sessionUser?.isActivated);

    // Portefeuille
    const { data: wallet } = await adminClient
      .from("wallets")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!wallet) {
      return {
        isLoggedIn: true,
        isActivated,
        hasSpunToday: hasSpunCookie,
        todayReward: rewardCookie ? Number(rewardCookie) : undefined,
        segments: DEFAULT_WHEEL_SEGMENTS,
      };
    }

    // Vérifier si un gain de la roue a déjà été inscrit (un seul tour à vie par utilisateur)
    const { data: entry } = await adminClient
      .from("ledger_entries")
      .select("amount")
      .eq("wallet_id", wallet.id)
      .like("reference_id", "wheel_%")
      .maybeSingle();

    const hasSpun = Boolean(entry) || hasSpunCookie;

    return {
      isLoggedIn: true,
      isActivated,
      hasSpunToday: hasSpun,
      todayReward: entry?.amount ? Number(entry.amount) : (hasSpun ? 56 : undefined),
      segments: DEFAULT_WHEEL_SEGMENTS,
    };
  } catch (error) {
    console.error("Erreur getDailySpinStatusAction:", error);
    return {
      isLoggedIn: false,
      isActivated: false,
      hasSpunToday: false,
      segments: DEFAULT_WHEEL_SEGMENTS,
    };
  }
}

/**
 * Lance la roue de bienvenue côté serveur.
 * Règle système :
 * - Un seul tour à vie par compte utilisateur.
 * - Le tirage s'arrête SYSTÉMATIQUEMENT sur les 56 FCFA (segment index 7).
 * - Les 56 FCFA sont inscrits dans le grand livre et s'ajoutent au solde de retrait.
 */
export async function spinWheelAction(): Promise<{
  success: boolean;
  message?: string;
  winningIndex?: number;
  amount?: number;
  label?: string;
}> {
  try {
    const cookieStore = cookies();
    const hasSpunCookie = cookieStore.get("vita_wheel_spun")?.value === "true";
    if (hasSpunCookie) {
      return {
        success: false,
        message: "Vous avez déjà utilisé votre tour de bienvenue.",
      };
    }

    const segments = DEFAULT_WHEEL_SEGMENTS;
    // Règle absolue : le gain est obligatoirement le segment de 56 FCFA
    const targetSegment = segments.find((s) => s.amount === 56) || segments[7] || {
      index: 7,
      amount: 56,
      label: "XOF 56",
      color: "#6366F1",
      weight: 100,
    };

    const isConfigured =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

    const sessionUserCookie = cookieStore.get("vita_session_user")?.value;
    let sessionUser: any = null;
    if (sessionUserCookie) {
      try {
        sessionUser = JSON.parse(sessionUserCookie);
      } catch {}
    }
    const isActivatedCookie = cookieStore.get("vita_account_activated")?.value === "true";

    if (!isConfigured) {
      // Simulation / session cookie
      cookieStore.set("vita_wheel_spun", "true", { path: "/", maxAge: 60 * 60 * 24 * 365 });
      cookieStore.set("vita_wheel_reward", "56", { path: "/", maxAge: 60 * 60 * 24 * 365 });

      if (sessionUser) {
        sessionUser.balance = (Number(sessionUser.balance) || 0) + 56;
        cookieStore.set("vita_session_user", JSON.stringify(sessionUser), {
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });
      }

      revalidatePath("/roue");
      revalidatePath("/");
      revalidatePath("/portefeuille");
      revalidatePath("/retrait");
      revalidatePath("/profil");

      return {
        success: true,
        winningIndex: targetSegment.index,
        amount: 56,
        label: "XOF 56",
        message: "Félicitations ! Vous avez gagné XOF 56 crédité sur votre solde de retrait.",
      };
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Si utilisateur en mode session locale
      if (sessionUser) {
        cookieStore.set("vita_wheel_spun", "true", { path: "/", maxAge: 60 * 60 * 24 * 365 });
        cookieStore.set("vita_wheel_reward", "56", { path: "/", maxAge: 60 * 60 * 24 * 365 });
        sessionUser.balance = (Number(sessionUser.balance) || 0) + 56;
        cookieStore.set("vita_session_user", JSON.stringify(sessionUser), {
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });

        revalidatePath("/roue");
        revalidatePath("/");
        revalidatePath("/portefeuille");
        revalidatePath("/retrait");
        revalidatePath("/profil");

        return {
          success: true,
          winningIndex: targetSegment.index,
          amount: 56,
          label: "XOF 56",
          message: "Félicitations ! Vous avez gagné XOF 56 crédité sur votre solde de retrait.",
        };
      }

      return {
        success: false,
        message: "Vous devez être connecté pour tourner la roue.",
      };
    }

    const adminClient = createAdminClient();

    // 1. Règle absolue : réservé aux comptes activés
    const { data: profile } = await adminClient
      .from("profiles")
      .select("is_activated")
      .eq("id", user.id)
      .maybeSingle();

    const isActivated = Boolean(profile?.is_activated || isActivatedCookie || sessionUser?.isActivated);
    if (!isActivated) {
      return {
        success: false,
        message: "Vous devez activer votre compte pour participer au tour de la roue.",
      };
    }

    // 2. Récupérer le portefeuille
    const { data: wallet } = await adminClient
      .from("wallets")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!wallet) {
      return {
        success: false,
        message: "Portefeuille introuvable.",
      };
    }

    // 3. Règle absolue : un seul tour à vie par utilisateur
    const referenceId = "wheel_welcome_spin";

    const { data: existingEntry } = await adminClient
      .from("ledger_entries")
      .select("id")
      .eq("wallet_id", wallet.id)
      .like("reference_id", "wheel_%")
      .maybeSingle();

    if (existingEntry) {
      cookieStore.set("vita_wheel_spun", "true", { path: "/", maxAge: 60 * 60 * 24 * 365 });
      return {
        success: false,
        message: "Vous avez déjà utilisé votre tour de bienvenue.",
      };
    }

    // 4. Inscription dans le grand livre immuable (56 FCFA ajoutés au solde de retrait)
    const { error: ledgerError } = await adminClient.from("ledger_entries").insert({
      wallet_id: wallet.id,
      amount: 56,
      entry_type: "adjustment",
      reference_id: referenceId,
      description: "Gain Tour de Bienvenue (XOF 56)",
    });

    if (ledgerError) {
      console.error("Erreur inscription grand livre pour roue:", ledgerError);
      return {
        success: false,
        message: "Une erreur est survenue lors de l'enregistrement de votre gain.",
      };
    }

    // Marquer le tour comme utilisé
    cookieStore.set("vita_wheel_spun", "true", { path: "/", maxAge: 60 * 60 * 24 * 365 });
    cookieStore.set("vita_wheel_reward", "56", { path: "/", maxAge: 60 * 60 * 24 * 365 });

    if (sessionUser) {
      sessionUser.balance = (Number(sessionUser.balance) || 0) + 56;
      cookieStore.set("vita_session_user", JSON.stringify(sessionUser), {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    // Revalidation des pages
    revalidatePath("/roue");
    revalidatePath("/");
    revalidatePath("/portefeuille");
    revalidatePath("/retrait");
    revalidatePath("/profil");

    return {
      success: true,
      winningIndex: targetSegment.index,
      amount: 56,
      label: "XOF 56",
      message: "Félicitations ! Vous avez gagné XOF 56 crédité sur votre solde de retrait.",
    };
  } catch (error) {
    console.error("Erreur spinWheelAction:", error);
    return {
      success: false,
      message: "Erreur technique lors du tirage de la roue.",
    };
  }
}
