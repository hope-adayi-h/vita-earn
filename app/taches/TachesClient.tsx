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
  videoDurationSeconds?: number;

  // Jeudi : Photo AdSense
  adImageUrl?: string;
  adTargetUrl?: string;
  adDurationSeconds?: number;
  sponsorName?: string;
}

interface TachesClientProps {
  todayTask: PublicDailyTask | null;
  lomeTime: LomeDateInfo;
  isActivated: boolean;
  isLoggedIn: boolean;
  hasValidatedToday: boolean;
}

const WEEK_SCHEDULE = [
  { day: 1, name: "Lundi", type: "Questionnaire (Quiz)", icon: HelpCircle, color: "text-purple-600 bg-purple-50 border-purple-200" },
  { day: 2, name: "Mardi", type: "Vidéo TikTok", icon: Video, color: "text-slate-800 bg-slate-100 border-slate-300" },
  { day: 3, name: "Mercredi", type: "Vidéo YouTube", icon: Play, color: "text-red-600 bg-red-50 border-red-200" },
  { day: 4, name: "Jeudi", type: "Publicité AdSense (Photo)", icon: ImageIcon, color: "text-blue-600 bg-blue-50 border-blue-200" },
  { day: 5, name: "Vendredi", type: "Vidéo Instagram", icon: Video, color: "text-pink-600 bg-pink-50 border-pink-200" },
];

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

  // États pour le Quiz (Lundi)
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<QuizSubmissionResult | null>(null);

  // États pour la Pub AdSense Photo (Jeudi)
  const requiredSeconds = todayTask?.adDurationSeconds || 15;
  const [countdown, setCountdown] = useState<number>(requiredSeconds);
  const [hasCompletedTimer, setHasCompletedTimer] = useState<boolean>(initialHasValidated);

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
      setHasValidated(true);
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
        setHasValidated(true);
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
        setHasValidated(true);
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
            const Icon = item.icon;
            return (
              <div
                key={item.day}
                className={`p-2.5 rounded-2xl border text-center transition-all ${
                  isToday
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-500/30"
                    : "bg-slate-50/70 border-slate-200/80 text-slate-700"
                }`}
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Icon className={`w-3.5 h-3.5 ${isToday ? "text-white" : "text-slate-500"}`} />
                  <span className="text-xs font-black">{item.name}</span>
                </div>
                <p className={`text-[10px] font-medium leading-tight ${isToday ? "text-emerald-100" : "text-slate-500"}`}>
                  {item.type}
                </p>
                {isToday && (
                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-white text-emerald-700">
                    Aujourd&apos;hui
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. CAS DU WEEK-END : FERMÉ AVEC INVITATION */}
      {lomeTime.isWeekend && (
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
      {!lomeTime.isWeekend && todayTask && (
        <div className="space-y-4">
          {/* CARTE D'EN-TÊTE DE LA TÂCHE */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 mb-1.5">
                  Tâche du {lomeTime.dayName}
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
                />
              ) : (
                <div className="aspect-video bg-slate-900 text-white flex items-center justify-center rounded-2xl">
                  <Play className="w-8 h-8 text-white/60" />
                </div>
              )}

              {/* Bouton de validation vidéo */}
              {!hasValidated ? (
                <button
                  type="button"
                  onClick={handleValidateVideo}
                  disabled={isPending}
                  className="w-full touch-target min-h-[48px] rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-sm py-3.5 px-4 flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  {isPending ? (
                    <span>Validation en cours...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-white" />
                      <span>Valider la vidéo et encaisser {formatFCFA(todayTask.rewardAmount)}</span>
                      <ArrowRight className="w-4 h-4 text-white/80" />
                    </>
                  )}
                </button>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center text-xs font-bold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Tâche vidéo déjà validée pour aujourd&apos;hui. Gain crédité !</span>
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
