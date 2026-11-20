"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Lock,
  Gift,
  Play,
  RotateCcw,
} from "lucide-react";
import { formatFCFA } from "@/lib/utils";
import { VideoEmbedPlayer } from "@/components/video/VideoEmbedPlayer";
import { validateDailyVideoTaskAction, type TaskValidationResult } from "./actions";
import type { VideoPlatform } from "@/lib/video/universal-embed";
import type { LomeDateInfo } from "@/lib/utils/lome-time";

export interface PublicDailyTask {
  id: string;
  dayOfWeek: number;
  title: string;
  platform: VideoPlatform;
  embedUrl: string;
  instructions: string;
  rewardAmount: number;
  isActive: boolean;
}

interface TachesClientProps {
  todayTask: PublicDailyTask | null;
  lomeTime: LomeDateInfo;
  isActivated: boolean;
  isLoggedIn: boolean;
  hasValidatedToday: boolean;
}

export function TachesClient({
  todayTask,
  lomeTime,
  isActivated,
  isLoggedIn,
  hasValidatedToday: initialHasValidated,
}: TachesClientProps) {
  const [hasValidated, setHasValidated] = useState(initialHasValidated);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Soumission de la validation sécurisée
  const handleValidateTask = () => {
    if (!todayTask || hasValidated || isPending) return;

    if (!isLoggedIn) {
      setFeedback({
        type: "error",
        text: "Veuillez vous connecter pour valider la tâche.",
      });
      return;
    }

    if (!isActivated) {
      setFeedback({
        type: "error",
        text: "Votre compte doit être activé pour percevoir les récompenses de tâches.",
      });
      return;
    }

    setFeedback(null);
    startTransition(async () => {
      const res: TaskValidationResult = await validateDailyVideoTaskAction(todayTask.id);
      if (res.success) {
        setHasValidated(true);
        setFeedback({
          type: "success",
          text: res.message || `Félicitations ! Vous avez empoché ${formatFCFA(todayTask.rewardAmount)}.`,
        });
      } else {
        setFeedback({
          type: "error",
          text: res.message || "Impossible de valider cette tâche pour le moment.",
        });
      }
    });
  };

  // Badge visuel de la plateforme
  const getPlatformBadge = (platform: string) => {
    switch (platform) {
      case "youtube":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
            <span className="w-2 h-2 rounded-full bg-red-600" />
            Lecteur Officiel YouTube
          </span>
        );
      case "tiktok":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-900 text-white">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Lecteur Officiel TikTok
          </span>
        );
      case "facebook":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            Lecteur Officiel Facebook
          </span>
        );
      case "instagram":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-pink-50 text-pink-700 border border-pink-200">
            <span className="w-2 h-2 rounded-full bg-pink-500" />
            Lecteur Officiel Instagram
          </span>
        );
      default:
        return null;
    }
  };

  // =========================================================================
  // CAS 1 : C'EST LE WEEK-END (SAMEDI OU DIMANCHE)
  // =========================================================================
  if (lomeTime.isWeekend) {
    return (
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-inner">
          <Calendar className="w-8 h-8" />
        </div>

        <div className="space-y-2 max-w-md mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Pause du Week-end
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Pas de Tâche Rémunérée le Week-end
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Les tâches vidéo quotidiennes sont programmées <strong>du lundi au vendredi</strong>. Prenez le temps de vous reposer et de développer votre réseau d&apos;affiliation !
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 max-w-sm mx-auto text-xs text-slate-500 flex items-center justify-between">
          <span>Prochaine session :</span>
          <span className="font-black text-emerald-700">Lundi dès 08:00 (GMT)</span>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <span>Retourner au tableau de bord</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // =========================================================================
  // CAS 2 : JOUR OUVRABLE SANS TÂCHE ACTIVÉE AUJOURD'HUI
  // =========================================================================
  if (!todayTask) {
    return (
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
          <Clock className="w-8 h-8" />
        </div>
        <div className="space-y-1.5 max-w-md mx-auto">
          <h2 className="text-xl font-black text-slate-900">
            Session en Préparation pour {lomeTime.dayName}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            L&apos;administrateur n&apos;a pas encore activé la vidéo sponsorisée du jour. Veuillez vous reconnecter d&apos;ici quelques instants pour participer.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#0084FF] hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-xs"
        >
          <span>Retour au tableau de bord</span>
        </Link>
      </div>
    );
  }

  // =========================================================================
  // CAS 3 : TÂCHE VIDÉO DISPONIBLE AUJOURD'HUI
  // =========================================================================
  return (
    <div className="space-y-5">
      {/* 1. CARTE EN-TÊTE DE LA TÂCHE DU JOUR */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black uppercase tracking-wider text-[#0084FF] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Tâche du {lomeTime.dayName}
            </span>
            {getPlatformBadge(todayTask.platform)}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{lomeTime.formattedLongDate}</span>
          </div>
        </div>

        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            {todayTask.title}
          </h2>
        </div>

        {/* 2. LECTEUR VIDÉO INTÉGRÉ OFFICIEL (AUCUN LIEN BRUT VISIBLE) */}
        <div className="pt-1">
          <VideoEmbedPlayer
            embedUrl={todayTask.embedUrl}
            platform={todayTask.platform}
            title={todayTask.title}
          />
        </div>

        {/* 3. INSTRUCTIONS DE LA TÂCHE */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-1.5 text-xs">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
            Instructions de la Tâche :
          </span>
          <p className="text-slate-700 leading-relaxed text-xs sm:text-sm">
            {todayTask.instructions}
          </p>
        </div>

        {/* 4. CARTE RÉCOMPENSE & STATUT */}
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                Récompense du jour
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-700 tracking-tight">
                {formatFCFA(todayTask.rewardAmount)}
              </span>
            </div>
          </div>

          {hasValidated ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-200 text-emerald-900 border border-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-800" />
              <span>Validée & Encaissée</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-white text-emerald-800 border border-emerald-200 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Prêt pour validation</span>
            </span>
          )}
        </div>

        {/* Notification de feedback */}
        {feedback && (
          <div
            className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* 5. ZONE D'ACTION : VALIDATION CONFORME AUX RÈGLES */}
        <div className="pt-2">
          {!isLoggedIn ? (
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span>Connectez-vous pour valider cette tâche et créditer votre compte.</span>
              <Link
                href="/auth/login?redirect=/taches"
                className="px-4 py-2 rounded-xl bg-[#0084FF] hover:bg-blue-600 text-white font-bold shrink-0 text-center transition-all shadow-xs"
              >
                Se connecter
              </Link>
            </div>
          ) : !isActivated ? (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2.5">
              <div className="flex items-center gap-2 font-black text-amber-800">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Compte non activé</span>
              </div>
              <p className="text-amber-800/90 leading-relaxed">
                Vous devez activer votre compte Vita Earn (4 500 FCFA) pour débloquer la validation quotidienne et percevoir vos récompenses en FCFA.
              </p>
              <Link
                href="/activation"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition-all shadow-xs"
              >
                <span>Activer mon compte maintenant</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : hasValidated ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-emerald-900">
                  Tâche Accomplie avec Succès !
                </h4>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Votre gain de <strong>{formatFCFA(todayTask.rewardAmount)}</strong> a été crédité à votre portefeuille. Rendez-vous demain pour la prochaine vidéo !
                </p>
              </div>
              <div className="pt-1">
                <button
                  type="button"
                  disabled
                  className="px-5 py-2.5 rounded-xl bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 opacity-80 cursor-not-allowed"
                >
                  Tâche déjà validée pour aujourd&apos;hui
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleValidateTask}
              disabled={isPending}
              className="w-full py-3.5 rounded-2xl bg-[#16A34A] hover:bg-[#15803D] active:scale-[0.99] text-white text-sm font-black transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Validation et versement en cours...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Valider la tâche & Encaisser {formatFCFA(todayTask.rewardAmount)}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
