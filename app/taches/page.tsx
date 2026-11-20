import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowLeft, Clock, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getLomeServerTime } from "@/lib/utils/lome-time";
import {
  getTodayTaskForLome,
  hasUserValidatedToday,
  StoredDailyTask,
} from "@/lib/data/tasks-store";
import { findUserByIdentifier } from "@/lib/auth/local-store";
import { TachesClient, PublicDailyTask } from "./TachesClient";

export const metadata = {
  title: "Tâche Vidéo Quotidienne — Vita Earn",
  description: "Visionnez la vidéo quotidienne et encaissez votre récompense en direct.",
};

export default async function TachesPage() {
  // 1. Calcul strict de la date et de l'heure du serveur selon le fuseau horaire de Lomé (Africa/Lome)
  const lomeTime = getLomeServerTime();

  // 2. Récupération de l'utilisateur connecté
  const cookieStore = cookies();
  const sessionUserRaw = cookieStore.get("vita_session_user")?.value;
  const testUser = cookieStore.get("vita_test_user")?.value;
  const isActivatedCookie = cookieStore.get("vita_is_activated")?.value === "true";

  let userId = "";
  let isActivated = false;
  let isLoggedIn = false;

  if (sessionUserRaw) {
    try {
      const parsed = JSON.parse(sessionUserRaw);
      userId = parsed.id || parsed.username || "";
      isActivated = Boolean(parsed.isActivated || isActivatedCookie);
      isLoggedIn = true;
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
    isLoggedIn = true;
  }

  // Vérifier également Supabase Auth officiel
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
        userId = authUser.id;
        isLoggedIn = true;

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

  // 3. Récupération de la tâche active du jour
  const todayRawTask: StoredDailyTask | null = getTodayTaskForLome(lomeTime);

  let publicTask: PublicDailyTask | null = null;
  let hasValidatedToday = false;

  if (todayRawTask) {
    // RÈGLE DE SÉCURITÉ ABSOLUE : on ne transmet JAMAIS le lien brut (videoUrl) au navigateur
    publicTask = {
      id: todayRawTask.id,
      dayOfWeek: todayRawTask.dayOfWeek,
      title: todayRawTask.title,
      platform: todayRawTask.platform,
      embedUrl: todayRawTask.embedUrl,
      instructions: todayRawTask.instructions,
      rewardAmount: todayRawTask.rewardAmount,
      isActive: todayRawTask.isActive,
    };

    if (userId) {
      hasValidatedToday = hasUserValidatedToday(userId, todayRawTask.id, lomeTime.dateStr);
    }
  }

  return (
    <div className="max-w-xl mx-auto py-3 sm:py-6 space-y-4">
      {/* Barre de retour */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour au tableau de bord</span>
        </Link>
        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          Session du Jour
        </span>
      </div>

      {/* Bannière d'ambiance */}
      <div className="rounded-3xl bg-gradient-to-br from-[#0B3308] via-[#1B4D0F] to-[#256815] p-5 text-white shadow-lg space-y-2 relative overflow-hidden">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#7ED321]" />
          <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
            Tâches Vidéo Quotidiennes Rémunérées
          </h1>
        </div>
        <p className="text-xs text-emerald-100/90 leading-relaxed">
          Chaque jour de la semaine du lundi au vendredi, regardez la vidéo sponsorisée du jour directement sur VitaEarn et validez pour recevoir votre récompense en direct sur votre solde.
        </p>
      </div>

      {/* Composant interactif utilisateur */}
      <TachesClient
        todayTask={publicTask}
        lomeTime={lomeTime}
        isActivated={isActivated}
        isLoggedIn={isLoggedIn}
        hasValidatedToday={hasValidatedToday}
      />
    </div>
  );
}
