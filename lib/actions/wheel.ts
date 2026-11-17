"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface WheelSegment {
  index: number;
  amount: number;
  label: string;
  color: string;
  weight: number;
}

export const DEFAULT_WHEEL_SEGMENTS: WheelSegment[] = [
  { index: 0, amount: 280, label: "XOF 280", color: "#EF4444", weight: 15 },
  { index: 1, amount: 400, label: "XOF 400", color: "#F97316", weight: 12 },
  { index: 2, amount: 112, label: "XOF 112", color: "#EAB308", weight: 20 },
  { index: 3, amount: 560, label: "XOF 560", color: "#84CC16", weight: 8 },
  { index: 4, amount: 800, label: "XOF 800", color: "#10B981", weight: 4 },
  { index: 5, amount: 168, label: "XOF 168", color: "#06B6D4", weight: 18 },
  { index: 6, amount: 840, label: "XOF 840", color: "#3B82F6", weight: 3 },
  { index: 7, amount: 100, label: "XOF 100", color: "#6366F1", weight: 22 },
  { index: 8, amount: 420, label: "XOF 420", color: "#EC4899", weight: 10 },
  { index: 9, amount: 224, label: "XOF 224", color: "#F59E0B", weight: 16 },
  { index: 10, amount: 120, label: "XOF 120", color: "#14B8A6", weight: 20 },
  { index: 11, amount: 200, label: "XOF 200", color: "#8B5CF6", weight: 18 },
];

/**
 * Récupère le statut quotidien de la roue pour l'utilisateur connecté.
 * Heure de Lomé = UTC (remise à zéro à 00:00:00 UTC).
 */
export async function getDailySpinStatusAction() {
  try {
    const isConfigured =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

    if (!isConfigured) {
      return {
        isLoggedIn: true,
        isActivated: true,
        hasSpunToday: false,
        segments: DEFAULT_WHEEL_SEGMENTS,
      };
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        isLoggedIn: false,
        isActivated: false,
        hasSpunToday: false,
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

    const isActivated = Boolean(profile?.is_activated);

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
        hasSpunToday: false,
        segments: DEFAULT_WHEEL_SEGMENTS,
      };
    }

    // Date du jour en UTC (heure de Lomé)
    const today = new Date().toISOString().split("T")[0];
    const referenceId = `wheel_spin_${today}`;

    // Vérifier si un gain de la roue a déjà été inscrit aujourd'hui
    const { data: entry } = await adminClient
      .from("ledger_entries")
      .select("amount")
      .eq("wallet_id", wallet.id)
      .eq("reference_id", referenceId)
      .maybeSingle();

    return {
      isLoggedIn: true,
      isActivated,
      hasSpunToday: Boolean(entry),
      todayReward: entry?.amount ? Number(entry.amount) : undefined,
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
 * Lance la roue du jour côté serveur.
 * Tire le résultat de façon déterministe et sécurisée côté serveur,
 * crédite le grand livre immuable et renvoie l'index gagnant pour l'animation.
 */
export async function spinWheelAction(): Promise<{
  success: boolean;
  message?: string;
  winningIndex?: number;
  amount?: number;
  label?: string;
}> {
  try {
    const isConfigured =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

    if (!isConfigured) {
      // Simulation locale
      const winningIndex = Math.floor(Math.random() * DEFAULT_WHEEL_SEGMENTS.length);
      const segment = DEFAULT_WHEEL_SEGMENTS[winningIndex];
      return {
        success: true,
        winningIndex: segment.index,
        amount: segment.amount,
        label: segment.label,
        message: `Félicitations ! Vous avez gagné ${segment.label} ajouté à votre solde.`,
      };
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
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

    if (!profile?.is_activated) {
      return {
        success: false,
        message: "Vous devez activer votre compte pour participer au tour quotidien.",
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

    // 3. Règle absolue : un seul tour par jour et par utilisateur (minuit UTC / Lomé)
    const today = new Date().toISOString().split("T")[0];
    const referenceId = `wheel_spin_${today}`;

    const { data: existingEntry } = await adminClient
      .from("ledger_entries")
      .select("id")
      .eq("wallet_id", wallet.id)
      .eq("reference_id", referenceId)
      .maybeSingle();

    if (existingEntry) {
      return {
        success: false,
        message: "Vous avez déjà utilisé votre tour du jour. Reviens demain pour un nouveau tour.",
      };
    }

    // 4. Lecture des montants et probabilités (table platform_settings si disponible)
    let segments = DEFAULT_WHEEL_SEGMENTS;
    const { data: customConfig } = await adminClient
      .from("platform_settings")
      .select("value")
      .eq("key", "wheel_config")
      .maybeSingle();

    if (customConfig?.value && Array.isArray(customConfig.value) && customConfig.value.length === 12) {
      segments = customConfig.value as WheelSegment[];
    }

    // 5. Tirage pondéré côté serveur (impossible à manipuler depuis le client)
    const totalWeight = segments.reduce((sum, s) => sum + (s.weight || 1), 0);
    const randomVal = Math.random() * totalWeight;

    let cumulative = 0;
    let winningSegment = segments[0];
    for (const seg of segments) {
      cumulative += seg.weight || 1;
      if (randomVal <= cumulative) {
        winningSegment = seg;
        break;
      }
    }

    // 6. Inscription dans le grand livre immuable (ledger_entries)
    const { error: ledgerError } = await adminClient.from("ledger_entries").insert({
      wallet_id: wallet.id,
      amount: winningSegment.amount,
      entry_type: "adjustment",
      reference_id: referenceId,
      description: `Gain Tour de Chance Quotidien (${winningSegment.label})`,
    });

    if (ledgerError) {
      console.error("Erreur inscription grand livre pour roue:", ledgerError);
      return {
        success: false,
        message: "Une erreur est survenue lors de l'enregistrement de votre gain.",
      };
    }

    // Revalidation des pages
    revalidatePath("/roue");
    revalidatePath("/portefeuille");
    revalidatePath("/profil");

    return {
      success: true,
      winningIndex: winningSegment.index,
      amount: winningSegment.amount,
      label: winningSegment.label,
      message: `Félicitations ! Vous avez gagné ${winningSegment.label} crédité sur votre portefeuille.`,
    };
  } catch (error) {
    console.error("Erreur spinWheelAction:", error);
    return {
      success: false,
      message: "Erreur technique lors du tirage de la roue.",
    };
  }
}
