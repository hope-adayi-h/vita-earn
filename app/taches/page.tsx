import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ArrowLeft, Clock, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getLomeServerTime } from "@/lib/utils/lome-time";
import {
  getTodayTaskForLome,
  fetchAndSyncDailyTasks,
  hasUserValidatedToday,
  StoredDailyTask,
} from "@/lib/data/tasks-store";
import { findUserByIdentifier } from "@/lib/auth/local-store";
import { TachesClient, PublicDailyTask } from "./TachesClient";

export const metadata = {
  title: "Tâches Quotidiennes — Vita Earn",
  description: "Complétez votre tâche quotidienne (Quiz, Vidéos, Publicités) et encaissez votre gain en direct.",
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

  // RÈGLE STRICTE P0 : Accès réservé aux membres connectés et activés
  const adminUnlocked = cookieStore.get("vita_admin_unlocked")?.value;
  const testRole = cookieStore.get("vita_test_role")?.value;
  const isSuperAdminUser =
    testRole === "admin" ||
    Boolean(adminUnlocked) ||
    testUser?.toLowerCase() === "espoir" ||
    userId === "333d799b-84ea-493b-b35e-754f88c81b7f";

  if (!isLoggedIn && !isSuperAdminUser) {
    redirect("/auth/login?redirect=/taches");
  }

  if (!isActivated && !isSuperAdminUser) {
    redirect("/activation");
  }

  // 3. Récupération et synchronisation des tâches (Supabase platform_settings + local)
  const syncedTasks = await fetchAndSyncDailyTasks();
  const todayRawTask: StoredDailyTask | null = getTodayTaskForLome(lomeTime, syncedTasks);

  let publicTask: PublicDailyTask | null = null;
  let hasValidatedToday = false;

  if (todayRawTask) {
    // RÈGLE DE SÉCURITÉ ABSOLUE : on ne transmet JAMAIS le lien brut (videoUrl) ni la bonne réponse du quiz au client
    publicTask = {
      id: todayRawTask.id,
      dayOfWeek: todayRawTask.dayOfWeek,
      taskType: todayRawTask.taskType,
      title: todayRawTask.title,
      instructions: todayRawTask.instructions,
      rewardAmount: todayRawTask.rewardAmount,
      isActive: todayRawTask.isActive,
      quizQuestions: todayRawTask.quizQuestions?.map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        rewardAmount: q.rewardAmount,
      })),
      platform: todayRawTask.platform,
      embedUrl: todayRawTask.embedUrl,
      videoDurationSeconds: todayRawTask.videoDurationSeconds,
      adImageUrl: todayRawTask.adImageUrl,
      adTargetUrl: todayRawTask.adTargetUrl,
      adDurationSeconds: todayRawTask.adDurationSeconds,
      sponsorName: todayRawTask.sponsorName,
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
            Tâches Quotidiennes Rémunérées
          </h1>
        </div>
        <p className="text-xs text-emerald-100/90 leading-relaxed">
          Chaque jour ouvré du lundi au vendredi, complétez l&apos;activité sponsorisée du jour (Quiz interactif le lundi, vidéos TikTok/YouTube/Instagram, publicité photo AdSense le jeudi) et encaissez votre récompense en direct sur votre solde.
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
