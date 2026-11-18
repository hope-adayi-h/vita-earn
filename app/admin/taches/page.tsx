import { redirect } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminUnlocked, checkAdminSession } from "@/lib/security/admin-lock";
import { AdminTaskToggleList, AdminTaskItem } from "@/components/admin/AdminTaskToggleList";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { Clock, ArrowLeft, ShieldCheck, CheckCircle } from "lucide-react";

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

  const defaultTasks: AdminTaskItem[] = [
    {
      id: "trivia",
      title: "Trivia Questions",
      dayLabel: "Lundi",
      time: "8:00 AM",
      rewardAmount: 15,
      isActive: true,
      description: "Quiz de culture générale et questions-réponses pour les utilisateurs.",
    },
    {
      id: "tiktok",
      title: "TikTok Videos",
      dayLabel: "Mardi",
      time: "8:00 AM",
      rewardAmount: 50,
      isActive: false,
      description: "Visionnage certifié de vidéos partenaires TikTok.",
    },
    {
      id: "youtube",
      title: "YouTube Videos",
      dayLabel: "Mercredi",
      time: "8:00 AM",
      rewardAmount: 50,
      isActive: false,
      description: "Visionnage de vidéos de formation sur YouTube.",
    },
    {
      id: "ads",
      title: "Ads Clicking",
      dayLabel: "Jeudi",
      time: "8:00 AM",
      rewardAmount: 30,
      isActive: false,
      description: "Visites et clics sur les annonces sponsorisées du jour.",
    },
    {
      id: "instagram",
      title: "Instagram Videos",
      dayLabel: "Vendredi",
      time: "8:00 AM",
      rewardAmount: 50,
      isActive: false,
      description: "Interaction avec les publications et vidéos Instagram partenaires.",
    },
  ];

  let tasks: AdminTaskItem[] = defaultTasks;

  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

  try {

    if (isConfigured) {
      const adminClient = createAdminClient();
      const { data: dbTasks } = await adminClient
        .from("task_definitions")
        .select("*")
        .order("day_of_week", { ascending: true });

      if (dbTasks && dbTasks.length > 0) {
        const dayMap: Record<number, string> = {
          1: "Lundi",
          2: "Mardi",
          3: "Mercredi",
          4: "Jeudi",
          5: "Vendredi",
        };
        tasks = dbTasks.map((t) => ({
          id: t.id,
          title: t.title,
          dayLabel: dayMap[t.day_of_week] || "Quotidien",
          time: t.scheduled_time || "8:00 AM",
          rewardAmount: Number(t.reward_amount) || 15,
          isActive: Boolean(t.is_active),
          description: t.description || "",
        }));
      }
    }
  } catch {
    // Mode démo / secours
    tasks = defaultTasks;
  }

  return (
    <div className="max-w-4xl mx-auto py-3 sm:py-6 space-y-6">
      <AdminNavbar
        userEmail={userEmail}
        isSuperAdmin={isSuperAdmin}
      />

      {/* Barre retour & En-tête */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-vita-muted hover:text-vita-deep transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour au tableau de bord administrateur</span>
        </Link>
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          Module Tâches & Time Table
        </span>
      </div>

      <div className="bg-white rounded-3xl border border-vita-border p-6 shadow-sm space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
          <Clock className="w-3 h-3 text-indigo-600" />
          <span>Contrôle Quotidien des Tâches</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-vita-deep tracking-tight">
          Activation Quotidienne des Tâches Rémunérées
        </h1>
        <p className="text-xs sm:text-sm text-vita-muted leading-relaxed">
          Activez ou désactivez chaque tâche selon le planning du jour. Si une tâche n'est pas activée par vos soins ici, les utilisateurs verront la mention <em>« En attente d'approbation admin »</em> et ne pourront pas encore participer.
        </p>
      </div>

      {/* Liste des boutons d'activation pour l'admin */}
      <AdminTaskToggleList initialTasks={tasks} />
    </div>
  );
}
