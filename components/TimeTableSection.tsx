"use client";

import { useState, useEffect } from "react";
import {
  HelpCircle,
  Video,
  PlaySquare,
  MousePointerClick,
  Camera,
  Lock,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  TrendingUp,
  X,
  Check,
  AlertCircle,
} from "lucide-react";
import { formatFCFA } from "@/lib/utils";
import { submitTriviaAnswerAction, completeGenericTaskAction, transferTaskEarningsAction } from "@/lib/actions/tasks";
import { PlatformLogo } from "./PlatformLogo";

export interface TaskItem {
  id: string;
  title: string;
  dayLabel: string;
  time: string;
  rewardAmount: number;
  accumulatedAmount: number;
  thresholdAmount: number;
  isActive: boolean;
  isCompletedToday: boolean;
  description: string;
  questionPrompt?: string;
  questionChoices?: string[];
  correctChoiceIndex?: number;
}

interface TimeTableSectionProps {
  tasks?: TaskItem[];
  userBalance?: number;
  onBalanceUpdate?: (newBalance: number) => void;
}

export function TimeTableSection({ tasks: initialTasks }: TimeTableSectionProps) {
  // Définition par défaut des 5 tâches (conforme à la capture d'écran)
  const defaultTasks: TaskItem[] = [
    {
      id: "trivia",
      title: "Trivia Questions",
      dayLabel: "Lundi",
      time: "8:00 AM",
      rewardAmount: 15,
      accumulatedAmount: 0,
      thresholdAmount: 4500,
      isActive: true, // Activée pour permettre le test immédiat
      isCompletedToday: false,
      description: "Répondez aux questions de culture générale et gagnez des récompenses instantanées.",
      questionPrompt: "Quelle est la monnaie officielle utilisée au Togo et dans la zone UEMOA ?",
      questionChoices: ["Naira", "Franc CFA (XOF)", "Cedi", "Dollar"],
      correctChoiceIndex: 1,
    },
    {
      id: "tiktok",
      title: "TikTok Videos",
      dayLabel: "Mardi",
      time: "8:00 AM",
      rewardAmount: 50,
      accumulatedAmount: 0,
      thresholdAmount: 4500,
      isActive: false, // En attente d'activation par l'admin
      isCompletedToday: false,
      description: "Visionnez la courte vidéo sponsorisée TikTok pour valider vos gains.",
    },
    {
      id: "youtube",
      title: "YouTube Videos",
      dayLabel: "Mercredi",
      time: "8:00 AM",
      rewardAmount: 50,
      accumulatedAmount: 0,
      thresholdAmount: 4500,
      isActive: false, // En attente d'activation par l'admin
      isCompletedToday: false,
      description: "Visionnez la vidéo de formation YouTube et débloquez votre récompense.",
    },
    {
      id: "ads",
      title: "Ads Clicking",
      dayLabel: "Jeudi",
      time: "8:00 AM",
      rewardAmount: 30,
      accumulatedAmount: 0,
      thresholdAmount: 4500,
      isActive: false, // En attente d'activation par l'admin
      isCompletedToday: false,
      description: "Visitez le lien sponsorisé du jour pour recevoir votre crédit.",
    },
    {
      id: "instagram",
      title: "Instagram Videos",
      dayLabel: "Vendredi",
      time: "8:00 AM",
      rewardAmount: 50,
      accumulatedAmount: 0,
      thresholdAmount: 4500,
      isActive: false, // En attente d'activation par l'admin
      isCompletedToday: false,
      description: "Découvrez et interagissez avec le contenu vidéo Instagram du jour.",
    },
  ];

  const [taskList, setTaskList] = useState<TaskItem[]>(initialTasks || defaultTasks);
  const [activeModalTask, setActiveModalTask] = useState<TaskItem | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [videoTimer, setVideoTimer] = useState<number | null>(null);

  // Synchronisation dynamique avec les données serveur dès qu'elles changent
  useEffect(() => {
    if (initialTasks && initialTasks.length > 0) {
      setTaskList(initialTasks);
    }
  }, [initialTasks]);

  // Vrais logos officiels pour chaque tâche (TikTok, YouTube, AdSense, Instagram, Trivia)
  const getTaskIcon = (id: string) => {
    switch (id) {
      case "trivia":
        return <PlatformLogo platform="trivia" className="w-11 h-11" />;
      case "tiktok":
        return <PlatformLogo platform="tiktok" className="w-11 h-11" />;
      case "youtube":
        return <PlatformLogo platform="youtube" className="w-11 h-11" />;
      case "ads":
        return <PlatformLogo platform="adsense" className="w-11 h-11" />;
      case "instagram":
        return <PlatformLogo platform="instagram" className="w-11 h-11" />;
      default:
        return (
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-sm">
            <TrendingUp className="w-5 h-5" />
          </div>
        );
    }
  };

  // Ouverture de la modale de tâche
  const handleOpenTask = (task: TaskItem) => {
    if (!task.isActive || task.isCompletedToday) return;
    setActiveModalTask(task);
    setSelectedChoice(null);
    setFeedbackMessage(null);
    setVideoTimer(task.id !== "trivia" ? 10 : null);
  };

  // Soumission du Quiz Trivia
  const handleTriviaSubmit = async () => {
    if (selectedChoice === null || !activeModalTask) return;
    setIsSubmitting(true);
    setFeedbackMessage(null);

    const res = await submitTriviaAnswerAction(selectedChoice);
    setIsSubmitting(false);

    if (res.success) {
      setFeedbackMessage({ type: "success", text: res.message });
      // Mettre à jour la tâche locale
      setTaskList((prev) =>
        prev.map((t) =>
          t.id === "trivia"
            ? {
                ...t,
                accumulatedAmount: (t.accumulatedAmount || 0) + (res.reward || 15),
                isCompletedToday: true,
              }
            : t
        )
      );
      setTimeout(() => {
        setActiveModalTask(null);
      }, 1500);
    } else {
      setFeedbackMessage({ type: "error", text: res.message });
    }
  };

  // Soumission de tâche vidéo / clic
  const handleGenericTaskSubmit = async () => {
    if (!activeModalTask) return;
    setIsSubmitting(true);

    const res = await completeGenericTaskAction(activeModalTask.id);
    setIsSubmitting(false);

    if (res.success) {
      setFeedbackMessage({ type: "success", text: res.message });
      setTaskList((prev) =>
        prev.map((t) =>
          t.id === activeModalTask.id
            ? {
                ...t,
                accumulatedAmount: (t.accumulatedAmount || 0) + (res.reward || 50),
                isCompletedToday: true,
              }
            : t
        )
      );
      setTimeout(() => {
        setActiveModalTask(null);
      }, 1500);
    } else {
      setFeedbackMessage({ type: "error", text: res.message });
    }
  };

  // Transfert de la cagnotte vers le solde du compte (dès 4 500 FCFA)
  const handleTransfer = async (task: TaskItem) => {
    if (task.accumulatedAmount < task.thresholdAmount) return;
    setIsSubmitting(true);

    const res = await transferTaskEarningsAction(task.id);
    setIsSubmitting(false);

    if (res.success) {
      alert(res.message);
      setTaskList((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, accumulatedAmount: 0 } : t
        )
      );
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-vita-border/90 p-5 sm:p-6 shadow-sm space-y-4">
      {/* En-tête Time Table */}
      <div className="flex items-start justify-between gap-3 border-b border-vita-border/60 pb-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 mb-1">
            <Clock className="w-3 h-3 text-indigo-600" />
            <span>Planning Quotidien</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-vita-deep tracking-tight">
            Time Table
          </h2>
          <p className="text-xs text-vita-muted">
            Tâches quotidiennes rémunérées approuvées par l'administrateur.
          </p>
        </div>

        <div className="text-right flex-shrink-0">
          <span className="block text-[10px] font-bold uppercase text-vita-muted">
            Palier Retrait
          </span>
          <span className="text-xs sm:text-sm font-black text-vita-deep bg-vita-surface px-2 py-0.5 rounded-md border border-vita-border inline-block">
            4 500 FCFA
          </span>
        </div>
      </div>

      {/* Liste des 5 tâches (Time Table) */}
      <div className="space-y-3">
        {taskList.map((task) => {
          const progressPercent = Math.min(
            100,
            Math.round((task.accumulatedAmount / task.thresholdAmount) * 100)
          );
          const canTransfer = task.accumulatedAmount >= task.thresholdAmount;

          return (
            <div
              key={task.id}
              className="p-3.5 sm:p-4 rounded-2xl bg-vita-surface/40 hover:bg-vita-surface/80 border border-vita-border/70 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              {/* Côté gauche : Logo officiel + Nom + Logo après titre + Heure */}
              <div className="flex items-center gap-3 min-w-0">
                {getTaskIcon(task.id)}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold text-vita-text truncate flex items-center gap-1.5">
                      <span>{task.title}</span>
                      <PlatformLogo
                        platform={task.id === "ads" ? "adsense" : task.id}
                        className="w-4 h-4 rounded-xs inline-block"
                      />
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100 flex-shrink-0">
                      {task.dayLabel}
                    </span>
                  </div>
                  <span className="text-[11px] text-vita-muted font-medium block">
                    {task.time}
                  </span>
                </div>
              </div>

              {/* Centre & Côté droit : Compteur dédié Cash avec logo + Bouton d'action selon validation Admin */}
              <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-vita-border/40">
                {/* Compteur individuel Cash avec vrai logo */}
                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-vita-muted flex items-center sm:justify-end gap-1 mb-0.5">
                    <PlatformLogo
                      platform={task.id === "ads" ? "adsense" : task.id}
                      className="w-3.5 h-3.5 rounded-xs"
                    />
                    <span>Cash {task.id === "ads" ? "AdSense" : task.id.charAt(0).toUpperCase() + task.id.slice(1)}</span>
                  </span>
                  <div className="flex items-baseline gap-1 sm:justify-end">
                    <span className="text-sm sm:text-base font-black text-emerald-700">
                      {formatFCFA(task.accumulatedAmount)}
                    </span>
                    <span className="text-[10px] text-vita-muted">
                      / {formatFCFA(task.thresholdAmount)}
                    </span>
                  </div>
                </div>

                {/* État / Bouton interactif conditionné par l'Admin */}
                <div className="flex-shrink-0">
                  {canTransfer ? (
                    <button
                      type="button"
                      onClick={() => handleTransfer(task)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold shadow-sm transition-all flex items-center gap-1 animate-bounce"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Transférer au Solde</span>
                    </button>
                  ) : task.isCompletedToday ? (
                    <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Complété</span>
                    </div>
                  ) : task.isActive ? (
                    <button
                      type="button"
                      onClick={() => handleOpenTask(task)}
                      className="touch-target px-3.5 py-1.5 rounded-xl bg-vita-deep hover:bg-vita-medium text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <span>Participer</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  ) : (
                    <div
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-zinc-100 text-zinc-500 text-[10px] font-bold border border-zinc-200 cursor-not-allowed"
                      title="En attente d'approbation et activation par l'administrateur"
                    >
                      <Lock className="w-3 h-3 text-zinc-400" />
                      <span>En attente admin</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODALE INTERACTIVE POUR QUIZ TRIVIA & TÂCHES VIDÉOS */}
      {activeModalTask && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-vita-border space-y-4 relative">
            {/* Bouton Fermer */}
            <button
              type="button"
              onClick={() => setActiveModalTask(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-vita-surface hover:bg-zinc-200 text-vita-muted flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* En-tête de la modale */}
            <div className="flex items-center gap-3">
              {getTaskIcon(activeModalTask.id)}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                  Session du {activeModalTask.dayLabel}
                </span>
                <h3 className="text-base sm:text-lg font-black text-vita-deep leading-tight">
                  {activeModalTask.title}
                </h3>
                <span className="text-xs text-emerald-700 font-bold">
                  Gain : +{activeModalTask.rewardAmount} FCFA
                </span>
              </div>
            </div>

            {/* Message de notification / retour */}
            {feedbackMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  feedbackMessage.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}
              >
                {feedbackMessage.type === "success" ? (
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                )}
                <span>{feedbackMessage.text}</span>
              </div>
            )}

            {/* CAS 1 : QUIZ TRIVIA */}
            {activeModalTask.id === "trivia" ? (
              <div className="space-y-3 pt-1">
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs font-bold text-indigo-950">
                  {activeModalTask.questionPrompt}
                </div>

                <div className="space-y-2">
                  {activeModalTask.questionChoices?.map((choice, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedChoice(idx)}
                      className={`w-full p-3 rounded-xl border text-xs font-bold text-left transition-all flex items-center justify-between ${
                        selectedChoice === idx
                          ? "bg-vita-deep text-white border-vita-deep shadow-sm"
                          : "bg-white text-vita-text border-vita-border hover:bg-vita-surface"
                      }`}
                    >
                      <span>{choice}</span>
                      {selectedChoice === idx && <Check className="w-4 h-4 text-vita-bright" />}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={selectedChoice === null || isSubmitting}
                  onClick={handleTriviaSubmit}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span>Vérification en cours...</span>
                  ) : (
                    <>
                      <span>Valider ma réponse (+15 FCFA)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* CAS 2 : TÂCHE VIDÉO / CLIC */
              <div className="space-y-4 pt-1">
                <div className="p-4 rounded-2xl bg-zinc-900 text-white text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto text-emerald-400">
                    <Video className="w-6 h-6 animate-pulse" />
                  </div>
                  <p className="text-xs font-semibold text-zinc-300">
                    {activeModalTask.description}
                  </p>
                  <div className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 py-1 px-3 rounded-full inline-block border border-emerald-800">
                    Visionnage certifié
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleGenericTaskSubmit}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span>Validation en cours...</span>
                  ) : (
                    <>
                      <span>Confirmer la complétion (+{activeModalTask.rewardAmount} FCFA)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
