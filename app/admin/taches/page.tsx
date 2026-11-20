import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, ShieldCheck, CheckCircle2 } from "lucide-react";
import { isAdminUnlocked, checkAdminSession } from "@/lib/security/admin-lock";
import { createAdminClient } from "@/lib/supabase/admin";
import { getLomeServerTime } from "@/lib/utils/lome-time";
import { getAllStoredDailyTasks, StoredDailyTask } from "@/lib/data/tasks-store";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { AdminTachesClient } from "./AdminTachesClient";

export const metadata = {
  title: "Gestion des Tâches Quotidiennes — Administration Vita Earn",
};

export default async function AdminTasksPage() {
  const { isAdmin, isSuperAdmin, userEmail } = await checkAdminSession();

  if (!isAdmin) {
    redirect("/auth/login?redirect=/admin/taches");
  }

  const unlocked = await isAdminUnlocked();
  if (!unlocked) {
    redirect("/admin/lock");
  }

  // 1. Calcul strict du temps officiel serveur Lomé (Africa/Lome, UTC+0)
  const lomeTime = getLomeServerTime();

  // 2. Récupération des tâches depuis Supabase ou fallback store local
  let tasks: StoredDailyTask[] = getAllStoredDailyTasks();

  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

  if (isConfigured) {
    try {
      const adminClient = createAdminClient();
      const { data: dbTasks } = await adminClient
        .from("daily_video_tasks")
        .select("*")
        .eq("is_deleted", false)
        .order("day_of_week", { ascending: true });

      if (dbTasks && dbTasks.length > 0) {
        tasks = dbTasks.map((t) => {
          const day = t.day_of_week;
          const taskType =
            t.task_type ||
            (day === 1
              ? "quiz"
              : day === 2
              ? "tiktok"
              : day === 3
              ? "youtube"
              : day === 4
              ? "adsense"
              : "instagram");

          return {
            id: t.id,
            dayOfWeek: day,
            specificDate: t.specific_date,
            taskType,
            title: t.title,
            videoUrl: t.video_url,
            platform: t.platform,
            embedUrl: t.embed_url,
            videoId: t.video_id,
            instructions: t.instructions,
            rewardAmount: Number(t.reward_amount) || 100,
            isActive: Boolean(t.is_active),
            isDeleted: Boolean(t.is_deleted),
            quizQuestions: t.quiz_questions || undefined,
            adImageUrl: t.ad_image_url || undefined,
            adTargetUrl: t.ad_target_url || undefined,
            adDurationSeconds: t.ad_duration_seconds || undefined,
            sponsorName: t.sponsor_name || undefined,
            createdAt: t.created_at,
            updatedAt: t.updated_at,
          };
        });
      }
    } catch (err) {
      console.warn("Fallback lecture locale des tâches:", err);
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-3 sm:py-6 space-y-6">
      <AdminNavbar userEmail={userEmail} isSuperAdmin={isSuperAdmin} />

      {/* Barre retour & En-tête */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour au tableau de bord administrateur</span>
        </Link>
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          Module Tâches Hebdomadaires (5 Jours)
        </span>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
          <Clock className="w-3 h-3 text-indigo-600" />
          <span>Gestion Quotidienne des Tâches (Lundi au Vendredi)</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Espace de Gestion des Tâches Quotidiennes
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          Configurez chaque jour selon son type dédié fixe : <strong>Lundi</strong> (Questionnaire & Quiz interactif), <strong>Mardi</strong> (Vidéo TikTok), <strong>Mercredi</strong> (Vidéo YouTube), <strong>Jeudi</strong> (Publicité AdSense Photo & Clics), et <strong>Vendredi</strong> (Vidéo Instagram).
        </p>
      </div>

      {/* Interface d'administration interactive */}
      <AdminTachesClient
        initialTasks={tasks}
        lomeTime={lomeTime}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  );
}
