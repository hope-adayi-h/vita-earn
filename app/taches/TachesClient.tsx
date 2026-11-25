"use client";

import { useState, useEffect, useTransition } from "react";
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
  Play,
  RotateCcw,
  Check,
  ExternalLink,
  HelpCircle,
  Image as ImageIcon,
  Eye,
  Video,
  Moon,
} from "lucide-react";
import { formatFCFA } from "@/lib/utils";
import { VideoEmbedPlayer } from "@/components/video/VideoEmbedPlayer";
import {
  validateDailyVideoTaskAction,
  submitDailyQuizAction,
  validateAdSensePhotoTaskAction,
  type TaskValidationResult,
  type QuizSubmissionResult,
} from "./actions";
import type { VideoPlatform } from "@/lib/video/universal-embed";
import type { LomeDateInfo } from "@/lib/utils/lome-time";
import type { DailyTaskType } from "@/lib/data/tasks-store";

export interface PublicQuizQuestion {
  id: string;
  question: string;
  options: string[];
  rewardAmount: number;
}

export interface PublicDailyTask {
  id: string;
  dayOfWeek: number;
  taskType: DailyTaskType;
  title: string;
  instructions: string;
  rewardAmount: number;
  isActive: boolean;

  // Lundi : Quiz
  quizQuestions?: PublicQuizQuestion[];

  // Vidéos
  platform?: VideoPlatform;
  embedUrl?: string;
  cleanUrl?: string;
  videoDurationSeconds?: number;

  // Jeudi : Photo AdSense
  adImageUrl?: string;
  adTargetUrl?: string;
  adDurationSeconds?: number;
  sponsorName?: string;
}

interface TachesClientProps {
  activeTasks: PublicDailyTask[];
  validatedTaskIds: string[];
  initialSelectedTaskId?: string;
  lomeTime: LomeDateInfo;
  isActivated: boolean;
  isLoggedIn: boolean;
}

const WEEK_SCHEDULE = [
  { day: 1, name: "Lundi", type: "Questionnaire (Quiz)", icon: HelpCircle, color: "text-purple-600 bg-purple-50 border-purple-200" },
  { day: 2, name: "Mardi", type: "Vidéo TikTok", icon: Video, color: "text-slate-800 bg-slate-100 border-slate-300" },
  { day: 3, name: "Mercredi", type: "Vidéo YouTube", icon: Play, color: "text-red-600 bg-red-50 border-red-200" },
  { day: 4, name: "Jeudi", type: "Publicité AdSense (Photo)", icon: ImageIcon, color: "text-blue-600 bg-blue-50 border-blue-200" },
  { day: 5, name: "Vendredi", type: "Vidéo Instagram", icon: Video, color: "text-pink-600 bg-pink-50 border-pink-200" },
];

export function TachesClient({
  activeTasks,
  validatedTaskIds: initialValidatedIds,
  initialSelectedTaskId,
  lomeTime,
  isActivated,
  isLoggedIn,
}: TachesClientProps) {
  const [validatedIds, setValidatedIds] = useState<string[]>(initialValidatedIds);

  // Sélection initiale : tâche demandée en URL (?task=...), sinon première tâche non complétée, sinon première tâche active
  const resolveInitialTaskId = () => {
    if (activeTasks.length === 0) return "";
    if (initialSelectedTaskId) {
      const targetKey = initialSelectedTaskId.toLowerCase().trim();
      const matched = activeTasks.find(
        (t) =>
          t.id.toLowerCase() === targetKey ||
          t.taskType.toLowerCase() === targetKey ||
          (targetKey === "ads" && t.taskType === "adsense") ||
          (targetKey === "trivia" && t.taskType === "quiz")
      );
      if (matched) return matched.id;
    }
    const firstPending = activeTasks.find((t) => !initialValidatedIds.includes(t.id));
    return firstPending ? firstPending.id : activeTasks[0].id;
  };

  const [selectedTaskId, setSelectedTaskId] = useState<string>(resolveInitialTaskId);
  const todayTask = activeTasks.find((t) => t.id === selectedTaskId) || activeTasks[0] || null;
  const hasValidated = todayTask ? validatedIds.includes(todayTask.id) : false;

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // États pour le Quiz (Lundi)
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<QuizSubmissionResult | null>(null);

  // États pour la Pub AdSense Photo (Jeudi)
  const requiredSeconds = todayTask?.adDurationSeconds || 15;
  const [countdown, setCountdown] = useState<number>(requiredSeconds);
  const [hasCompletedTimer, setHasCompletedTimer] = useState<boolean>(hasValidated);

  // États pour les tâches vidéo (Mardi, Mercredi, Vendredi)
  const isVideoTask =
    todayTask?.taskType === "tiktok" ||
    todayTask?.taskType === "youtube" ||
    todayTask?.taskType === "instagram";
  const requiredVideoSeconds = todayTask?.videoDurationSeconds || 30;
  const [videoCountdown, setVideoCountdown] = useState<number>(requiredVideoSeconds);
  const [hasCompletedVideoTimer, setHasCompletedVideoTimer] = useState<boolean>(hasValidated);

  // Réinitialiser les timers et retours lorsqu'on change de tâche active
  const handleSelectTask = (taskId: string) => {
    if (taskId === selectedTaskId) return;
    const target = activeTasks.find((t) => t.id === taskId);
    const alreadyDone = validatedIds.includes(taskId);
    setSelectedTaskId(taskId);
    setFeedback(null);
    setQuizResult(null);
    setVideoCountdown(target?.videoDurationSeconds || 30);
    setHasCompletedVideoTimer(alreadyDone);
    setCountdown(target?.adDurationSeconds || 15);
    setHasCompletedTimer(alreadyDone);
  };

  // Compte à rebours automatique pour les vidéos partenaires
  useEffect(() => {
    if (isVideoTask && !hasValidated && !hasCompletedVideoTimer) {
      setVideoCountdown(requiredVideoSeconds);
      const timer = setInterval(() => {
        setVideoCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setHasCompletedVideoTimer(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isVideoTask, todayTask?.id, hasValidated, hasCompletedVideoTimer, requiredVideoSeconds]);

  // Compte à rebours automatique pour l'annonce AdSense
  useEffect(() => {
    if (todayTask?.taskType === "adsense" && !hasValidated && !hasCompletedTimer) {
      setCountdown(requiredSeconds);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setHasCompletedTimer(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [todayTask?.taskType, todayTask?.id, hasValidated, hasCompletedTimer, requiredSeconds]);

  // Gestion du choix d'option dans le Quiz
  const handleSelectQuizOption = (questionId: string, optionIndex: number) => {
    if (hasValidated || isPending) return;
    setQuizAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  // Soumission du Quiz (Lundi)
  const handleSubmitQuiz = () => {
    if (!todayTask || hasValidated || isPending) return;

    if (!isLoggedIn) {
      setFeedback({ type: "error", text: "Veuillez vous connecter pour valider le questionnaire." });
      return;
    }
    if (!isActivated) {
      setFeedback({ type: "error", text: "Votre compte doit être activé pour percevoir les gains." });
      return;
    }

    const totalQuestions = todayTask.quizQuestions?.length || 0;
    const answeredCount = Object.keys(quizAnswers).length;
    if (answeredCount < totalQuestions) {
      setFeedback({
        type: "error",
        text: `Veuillez répondre à toutes les questions (${answeredCount}/${totalQuestions} renseignée(s)).`,
      });
      return;
    }

    setFeedback(null);
    startTransition(async () => {
      const res = await submitDailyQuizAction(todayTask.id, quizAnswers);
      setQuizResult(res);
      setValidatedIds((prev) => (prev.includes(todayTask.id) ? prev : [...prev, todayTask.id]));
      if (res.success) {
        setFeedback({
          type: res.failedQuestion && res.earnedReward === 0 ? "error" : "success",
          text: res.message,
        });
      } else {
        setFeedback({ type: "error", text: res.message });
      }
    });
  };

  // Soumission de la Vidéo (Mardi, Mercredi, Vendredi)
  const handleValidateVideo = () => {
    if (!todayTask || hasValidated || isPending) return;

    if (!isLoggedIn) {
      setFeedback({ type: "error", text: "Veuillez vous connecter pour valider la tâche." });
      return;
    }
    if (!isActivated) {
      setFeedback({ type: "error", text: "Votre compte doit être activé pour percevoir les récompenses." });
      return;
    }

    setFeedback(null);
    startTransition(async () => {
      const res = await validateDailyVideoTaskAction(todayTask.id);
      if (res.success) {
        setValidatedIds((prev) => (prev.includes(todayTask.id) ? prev : [...prev, todayTask.id]));
        setFeedback({
          type: "success",
          text: res.message || `Félicitations ! Vous avez empoché ${formatFCFA(todayTask.rewardAmount)}.`,
        });
      } else {
        setFeedback({ type: "error", text: res.message || "Impossible de valider cette tâche." });
      }
    });
  };

  // Soumission de la Pub AdSense Photo (Jeudi)
  const handleValidateAdSensePhoto = () => {
    if (!todayTask || hasValidated || isPending || !hasCompletedTimer) return;

    if (!isLoggedIn) {
      setFeedback({ type: "error", text: "Veuillez vous connecter pour valider l'annonce." });
      return;
    }
    if (!isActivated) {
      setFeedback({ type: "error", text: "Votre compte doit être activé pour percevoir les récompenses." });
      return;
    }

    setFeedback(null);
    startTransition(async () => {
      const res = await validateAdSensePhotoTaskAction(todayTask.id, requiredSeconds);
      if (res.success) {
        setValidatedIds((prev) => (prev.includes(todayTask.id) ? prev : [...prev, todayTask.id]));
        setFeedback({
          type: "success",
          text: res.message || `Félicitations ! Vous avez empoché ${formatFCFA(todayTask.rewardAmount)}.`,
        });
      } else {
        setFeedback({ type: "error", text: res.message || "Impossible de valider l'annonce." });
      }
    });
  };

  return (
    <div className="space-y-5">
      {/* 1. CALENDRIER HEBDOMADAIRE EN 5 JOURS RESPECTÉS */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Planning Hebdomadaire des Tâches
            </h3>
          </div>
          <span className="text-[10px] font-bold text-slate-500">
            {lomeTime.dayName} {lomeTime.dateStr}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {WEEK_SCHEDULE.map((item) => {
            const isToday = item.day === lomeTime.dayOfWeek && !lomeTime.isWeekend;
            const activeForDay = activeTasks.find((t) => t.dayOfWeek === item.day);
            const isSelected = Boolean(activeForDay && activeForDay.id === todayTask?.id);
            const isDone = Boolean(activeForDay && validatedIds.includes(activeForDay.id));
            const Icon = item.icon;
            return (
              <button
                key={item.day}
                type="button"
                disabled={!activeForDay}
                onClick={() => activeForDay && handleSelectTask(activeForDay.id)}
                className={`p-2.5 rounded-2xl border text-center transition-all ${
                  isSelected
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-500/30 cursor-pointer"
                    : activeForDay
                    ? "bg-emerald-50/60 border-emerald-200 text-slate-800 hover:bg-emerald-100/70 cursor-pointer"
                    : "bg-slate-50/70 border-slate-200/80 text-slate-400 cursor-not-allowed opacity-70"
                }`}
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-white" : activeForDay ? "text-emerald-700" : "text-slate-400"}`} />
                  <span className="text-xs font-black">{item.name}</span>
                </div>
                <p className={`text-[10px] font-medium leading-tight ${isSelected ? "text-emerald-100" : activeForDay ? "text-slate-600" : "text-slate-400"}`}>
                  {item.type}
                </p>
                {isDone ? (
                  <span className={`inline-flex items-center gap-0.5 mt-1 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase ${isSelected ? "bg-white text-emerald-700" : "bg-emerald-100 text-emerald-700"}`}>
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span>Fait</span>
                  </span>
                ) : activeForDay ? (
                  <span className={`inline-block mt-1 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase ${isSelected ? "bg-white text-emerald-700" : "bg-emerald-600 text-white"}`}>
                    {isToday ? "Aujourd'hui" : "Activée"}
                  </span>
                ) : (
                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-slate-200/70 text-slate-500">
                    Fermée
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SÉLECTEUR MULTI-TÂCHES (LORSQUE L'ADMIN ACTIVE PLUSIEURS TÂCHES LE MÊME JOUR) */}
      {activeTasks.length > 1 && (
        <div className="p-4 rounded-3xl bg-white border border-emerald-200/80 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tâches disponibles aujourd&apos;hui ({validatedIds.filter((id) => activeTasks.some((t) => t.id === id)).length}/{activeTasks.length} complétées)</span>
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeTasks.map((t) => {
              const isSelected = t.id === todayTask?.id;
              const isDone = validatedIds.includes(t.id);
              const dayInfo = WEEK_SCHEDULE.find((d) => d.day === t.dayOfWeek);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSelectTask(t.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : isDone
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:border-emerald-400"
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-emerald-600"}`} />
                  ) : (
                    <Play className={`w-3 h-3 ${isSelected ? "text-white" : "text-emerald-600"}`} />
                  )}
                  <span>{dayInfo?.type || t.title}</span>
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${isSelected ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-700"}`}>
                    +{formatFCFA(t.rewardAmount)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. CAS DU WEEK-END : FERMÉ AVEC INVITATION */}
      {/* 2a. PAUSE DU WEEK-END (SAMEDI & DIMANCHE) */}
      {lomeTime.isWeekend && !todayTask && (
        <div className="p-6 rounded-3xl bg-amber-50 border border-amber-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <h2 className="text-base font-black text-amber-950">
            Pause du Week-end (Samedi & Dimanche)
          </h2>
          <p className="text-xs text-amber-800 leading-relaxed max-w-md mx-auto">
            Les tâches rémunérées sont ouvertes du lundi au vendredi. Profitez de votre week-end pour recharger vos énergies ! Rendez-vous ce lundi pour le grand Questionnaire rémunéré.
          </p>
        </div>
      )}

      {/* 2b. CLÔTURE QUOTIDIENNE STRICTE À 21H00 (LOMÉ GMT) */}
      {!todayTask && !lomeTime.isWeekend && lomeTime.isPast21h && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center text-white space-y-3 shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-amber-400 mx-auto flex items-center justify-center border border-slate-700">
            <Moon className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Clôture quotidienne à 21h00
            </span>
            <h2 className="text-base font-black text-white">
              Tâches du jour clôturées pour la soirée
            </h2>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
            Toutes les activités rémunérées de Vita Earn se désactivent automatiquement à 21h00 (Heure de Lomé GMT). Rendez-vous demain matin pour la prochaine session rémunérée dès l&apos;activation par l&apos;administrateur !
          </p>
          <div className="pt-2 text-[11px] text-slate-400 font-medium">
            Heure de Lomé actuelle : <strong className="text-white">{lomeTime.timeStr} (GMT)</strong> • Prochaine ouverture : dès demain matin
          </div>
        </div>
      )}

      {/* 2c. AUCUNE TÂCHE ACTIVÉE POUR LE MOMENT PAR L'ADMINISTRATEUR */}
      {!todayTask && !lomeTime.isWeekend && !lomeTime.isPast21h && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center border border-amber-200">
            <Clock className="w-6 h-6" />
          </div>
          <h2 className="text-base font-black text-slate-900">
            Tâche du {lomeTime.dayName} en cours de préparation
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
            L&apos;administrateur active les activités rémunérées chaque matinée. Dès son activation, la tâche s&apos;affichera ici instantanément.
          </p>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 max-w-sm mx-auto">
            Rappel : chaque jour ouvré, les tâches sont ouvertes jusqu&apos;à <strong>21h00 pile (GMT)</strong>.
          </div>
        </div>
      )}

      {/* 3. RETOUR D'INFORMATION / NOTIFICATIONS */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-start gap-3 text-xs leading-relaxed font-bold border transition-all ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-950"
              : "bg-red-50 border-red-300 text-red-950"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <p>{feedback.text}</p>
            {quizResult && (
              <p className="text-[11px] font-medium text-slate-600">
                Score : {quizResult.score} / {quizResult.totalQuestions} questions correctes.
              </p>
            )}
          </div>
        </div>
      )}

      {/* 4. TÂCHE ACTIVE DU JOUR */}
      {todayTask && (
        <div className="space-y-4">
          {/* CARTE D'EN-TÊTE DE LA TÂCHE */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 mb-1.5">
                  Tâche active du jour
                </span>
                <h2 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                  {todayTask.title}
                </h2>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Gain à encaisser</span>
                <span className="text-base sm:text-lg font-black text-emerald-600">
                  +{formatFCFA(todayTask.rewardAmount)}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50 p-3 rounded-2xl border border-slate-100">
              {todayTask.instructions}
            </p>
          </div>

          {/* CAS A : LUNDI = QUESTIONNAIRE (QUIZ) */}
          {todayTask.taskType === "quiz" && (
            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-purple-600" />
                  <h3 className="text-sm font-black text-slate-900">
                    Questionnaire interactif ({todayTask.quizQuestions?.length || 0} questions)
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                  1 seule tentative
                </span>
              </div>

              {/* Règle de la chance unique */}
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="font-medium leading-relaxed">
                  Attention : vous ne disposez que d&apos;<strong>une seule chance</strong> aujourd&apos;hui. Chaque bonne réponse vous rapporte sa récompense en FCFA. Choisissez soigneusement !
                </p>
              </div>

              {/* Liste des questions */}
              <div className="space-y-4">
                {todayTask.quizQuestions?.map((q, qIndex) => {
                  const selectedOption = quizAnswers[q.id];
                  return (
                    <div
                      key={q.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-black text-slate-800">
                          Question {qIndex + 1} : {q.question}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
                          +{formatFCFA(q.rewardAmount)}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {q.options.map((opt, optIndex) => {
                          const isSelected = selectedOption === optIndex;
                          return (
                            <button
                              key={optIndex}
                              type="button"
                              disabled={hasValidated}
                              onClick={() => handleSelectQuizOption(q.id, optIndex)}
                              className={`w-full touch-target min-h-[44px] p-3 rounded-xl text-left text-xs sm:text-sm font-medium border flex items-center justify-between gap-2 transition-all ${
                                isSelected
                                  ? "bg-purple-600 text-white border-purple-600 shadow-2xs font-bold"
                                  : "bg-white text-slate-800 border-slate-200 hover:border-purple-300"
                              } ${hasValidated ? "opacity-75 cursor-not-allowed" : "cursor-pointer active:scale-99"}`}
                            >
                              <span>{opt}</span>
                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? "border-white bg-white"
                                    : "border-slate-300 bg-transparent"
                                }`}
                              >
                                {isSelected && <div className="w-2 h-2 rounded-full bg-purple-600" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bouton de soumission du quiz */}
              {!hasValidated ? (
                <button
                  type="button"
                  onClick={handleSubmitQuiz}
                  disabled={isPending}
                  className="w-full touch-target min-h-[48px] rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-black text-sm py-3.5 px-4 flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-98 transition-all cursor-pointer"
                >
                  {isPending ? (
                    <span>Validation en cours...</span>
                  ) : (
                    <>
                      <Check className="w-5 h-5 text-white" />
                      <span>Valider mes réponses et encaisser mes gains</span>
                      <ArrowRight className="w-4 h-4 text-white/80" />
                    </>
                  )}
                </button>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-100 text-slate-700 text-center text-xs font-bold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Questionnaire soumis pour ce lundi (1 seule chance terminée).</span>
                </div>
              )}
            </div>
          )}

          {/* CAS B : MARDI, MERCREDI, VENDREDI = VIDÉO */}
          {(todayTask.taskType === "tiktok" ||
            todayTask.taskType === "youtube" ||
            todayTask.taskType === "instagram") && (
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
              {todayTask.embedUrl ? (
                <VideoEmbedPlayer
                  embedUrl={todayTask.embedUrl}
                  platform={todayTask.platform || "youtube"}
                  title={todayTask.title}
                  directUrl={todayTask.cleanUrl || (todayTask.embedUrl.includes("http") ? todayTask.embedUrl : undefined)}
                />
              ) : (
                <div className="aspect-video bg-slate-900 text-white flex items-center justify-center rounded-2xl">
                  <Play className="w-8 h-8 text-white/60" />
                </div>
              )}

              {/* Compte à rebours de visionnage vidéo */}
              {!hasValidated && !hasCompletedVideoTimer && (
                <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                      <span>Visionnage obligatoire en cours</span>
                    </span>
                    <span className="text-emerald-700 font-black">{videoCountdown}s restantes</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 transition-all duration-1000 ease-linear rounded-full"
                      style={{
                        width: `${Math.round(((requiredVideoSeconds - videoCountdown) / requiredVideoSeconds) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Bouton de validation vidéo */}
              {!hasValidated ? (
                <button
                  type="button"
                  onClick={handleValidateVideo}
                  disabled={!hasCompletedVideoTimer || isPending}
                  className={`w-full touch-target min-h-[48px] rounded-2xl font-black text-sm py-3.5 px-4 flex items-center justify-center gap-2 shadow-md transition-all ${
                    hasCompletedVideoTimer
                      ? "bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white cursor-pointer ring-2 ring-emerald-500/30"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {isPending ? (
                    <span>Validation en cours...</span>
                  ) : hasCompletedVideoTimer ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-white" />
                      <span>Valider la vidéo et encaisser {formatFCFA(todayTask.rewardAmount)}</span>
                      <ArrowRight className="w-4 h-4 text-white/80" />
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-slate-400" />
                      <span>Visionnez la vidéo ({videoCountdown}s restantes)</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center text-xs font-bold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Tâche vidéo déjà validée pour aujourd&apos;hui. Gain crédité dans votre cagnotte !</span>
                </div>
              )}
            </div>
          )}

          {/* CAS C : JEUDI = PUBLICITÉ ADSENSE (PHOTO / BANNIÈRE) */}
          {todayTask.taskType === "adsense" && (
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-black text-slate-900">
                    Annonce Sponsorisée AdSense
                  </h3>
                </div>
                {todayTask.sponsorName && (
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                    {todayTask.sponsorName}
                  </span>
                )}
              </div>

              {/* Affichage de la photo publicitaire */}
              <div className="rounded-2xl overflow-hidden border border-slate-200 relative bg-slate-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    todayTask.adImageUrl ||
                    "https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=1200&auto=format&fit=crop&q=80"
                  }
                  alt={todayTask.title}
                  className="w-full max-h-[380px] object-cover"
                />

                {/* Badge décompte interactif en haut de l'image */}
                {!hasValidated && (
                  <div className="absolute top-3 right-3 z-10 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md text-white text-xs font-black flex items-center gap-1.5 shadow-lg border border-white/20">
                    <Clock className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                    <span>
                      {hasCompletedTimer
                        ? "Temps écoulé !"
                        : `Attention requise : ${countdown}s`}
                    </span>
                  </div>
                )}
              </div>

              {/* Barre de progression du visionnage */}
              {!hasValidated && !hasCompletedTimer && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                    <span>Visionnage obligatoire en cours</span>
                    <span className="text-blue-600">{countdown} seconde(s) restante(s)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-1000 ease-linear rounded-full"
                      style={{
                        width: `${Math.round(((requiredSeconds - countdown) / requiredSeconds) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Bouton de validation AdSense */}
              {!hasValidated ? (
                <button
                  type="button"
                  onClick={handleValidateAdSensePhoto}
                  disabled={!hasCompletedTimer || isPending}
                  className={`w-full touch-target min-h-[48px] rounded-2xl font-black text-sm py-3.5 px-4 flex items-center justify-center gap-2 shadow-md transition-all ${
                    hasCompletedTimer
                      ? "bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white cursor-pointer ring-2 ring-emerald-500/30"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {isPending ? (
                    <span>Validation en cours...</span>
                  ) : hasCompletedTimer ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-white" />
                      <span>Valider l&apos;annonce et encaisser {formatFCFA(todayTask.rewardAmount)}</span>
                      <ArrowRight className="w-4 h-4 text-white/80" />
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-slate-400" />
                      <span>Visualisez la photo pendant encore {countdown}s</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center text-xs font-bold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Publicité du jeudi validée avec succès. Gain crédité !</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
