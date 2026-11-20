"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Play,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Check,
  Video,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Image as ImageIcon,
  Lock,
  Layers,
  CheckSquare,
  Square,
  Loader2,
} from "lucide-react";
import { formatFCFA } from "@/lib/utils";
import { parseUniversalVideoUrl, type ParsedVideo } from "@/lib/video/universal-embed";
import { VideoEmbedPlayer } from "@/components/video/VideoEmbedPlayer";
import {
  saveDailyVideoTaskAction,
  saveDailyQuizTaskAction,
  saveDailyAdSenseTaskAction,
  toggleDailyVideoTaskAction,
} from "./actions";
import type {
  StoredDailyTask,
  QuizQuestionItem,
  DailyTaskType,
} from "@/lib/data/tasks-store";
import type { LomeDateInfo } from "@/lib/utils/lome-time";

interface AdminTachesClientProps {
  initialTasks: StoredDailyTask[];
  lomeTime: LomeDateInfo;
  isSuperAdmin: boolean;
}

const ORDERED_DAYS = [
  {
    day: 1,
    label: "Lundi",
    short: "Lun",
    taskType: "quiz" as DailyTaskType,
    title: "Questionnaire (Quiz)",
    icon: HelpCircle,
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
  },
  {
    day: 2,
    label: "Mardi",
    short: "Mar",
    taskType: "tiktok" as DailyTaskType,
    title: "Vidéo TikTok",
    icon: Video,
    badgeColor: "bg-slate-100 text-slate-800 border-slate-300",
  },
  {
    day: 3,
    label: "Mercredi",
    short: "Mer",
    taskType: "youtube" as DailyTaskType,
    title: "Vidéo YouTube",
    icon: Play,
    badgeColor: "bg-red-100 text-red-800 border-red-200",
  },
  {
    day: 4,
    label: "Jeudi",
    short: "Jeu",
    taskType: "adsense" as DailyTaskType,
    title: "Publicité AdSense (Photo)",
    icon: ImageIcon,
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
  },
  {
    day: 5,
    label: "Vendredi",
    short: "Ven",
    taskType: "instagram" as DailyTaskType,
    title: "Vidéo Instagram",
    icon: Video,
    badgeColor: "bg-pink-100 text-pink-800 border-pink-200",
  },
];

export function AdminTachesClient({
  initialTasks,
  lomeTime,
  isSuperAdmin,
}: AdminTachesClientProps) {
  const [tasks, setTasks] = useState<StoredDailyTask[]>(initialTasks);
  const [selectedDay, setSelectedDay] = useState<number>(
    lomeTime.isWeekend ? 1 : lomeTime.dayOfWeek
  );
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Tâche associée au jour actuellement sélectionné
  const currentTask = useMemo(() => {
    return tasks.find((t) => t.dayOfWeek === selectedDay && !t.isDeleted) || null;
  }, [tasks, selectedDay]);

  // ÉTATS ÉDITEUR LUNDI (QUIZ)
  const [quizTitle, setQuizTitle] = useState("");
  const [quizInstructions, setQuizInstructions] = useState("");
  const [quizIsActive, setQuizIsActive] = useState(true);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestionItem[]>([]);

  // ÉTATS ÉDITEUR VIDÉO (MARDI, MERCREDI, VENDREDI)
  const [videoTitle, setVideoTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoInstructions, setVideoInstructions] = useState("");
  const [videoRewardAmount, setVideoRewardAmount] = useState(150);
  const [videoDurationSeconds, setVideoDurationSeconds] = useState(30);
  const [videoIsActive, setVideoIsActive] = useState(true);
  const [videoAnalysis, setVideoAnalysis] = useState<ParsedVideo>({ isValid: false });

  // ÉTATS ÉDITEUR JEUDI (ADSENSE PHOTO)
  const [adTitle, setAdTitle] = useState("");
  const [adInstructions, setAdInstructions] = useState("");
  const [adImageUrl, setAdImageUrl] = useState("");
  const [adTargetUrl, setAdTargetUrl] = useState("");
  const [sponsorName, setSponsorName] = useState("");
  const [adDurationSeconds, setAdDurationSeconds] = useState(15);
  const [adRewardAmount, setAdRewardAmount] = useState(200);
  const [adIsActive, setAdIsActive] = useState(true);

  // Synchronisation des états à chaque changement de jour sélectionné
  useEffect(() => {
    setMessage(null);
    if (!currentTask) {
      if (selectedDay === 1) {
        setQuizTitle("Questionnaire du Lundi — Connaissances Digitales");
        setQuizInstructions("Répondez avec précision. Une seule tentative autorisée ce lundi !");
        setQuizIsActive(true);
        setQuizQuestions([
          {
            id: `q_${Date.now()}_1`,
            question: "Quel est le moyen de paiement officiel au Togo ?",
            options: ["T-Money & Moov Flooz", "PayPal", "Chèque bancaire"],
            correctOptionIndex: 0,
            rewardAmount: 100,
          },
        ]);
      } else if (selectedDay === 4) {
        setAdTitle("Publicité AdSense du Jeudi — Sponsor & Partenaire");
        setAdInstructions("Examinez cette annonce. Restez sur la photo jusqu'à la fin du décompte.");
        setAdImageUrl("https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=1200&auto=format&fit=crop&q=80");
        setAdTargetUrl("https://vita-earn.netlify.app/marche");
        setSponsorName("Vita Commerce Partenaire");
        setAdDurationSeconds(15);
        setAdRewardAmount(200);
        setAdIsActive(true);
      } else {
        const dayConfig = ORDERED_DAYS.find((d) => d.day === selectedDay);
        setVideoTitle(`Tâche Vidéo du ${dayConfig?.label} (${dayConfig?.title})`);
        setVideoUrl("");
        setVideoInstructions("Visionnez cette vidéo partenaire pendant la durée requise.");
        setVideoRewardAmount(150);
        setVideoDurationSeconds(30);
        setVideoIsActive(true);
        setVideoAnalysis({ isValid: false });
      }
      return;
    }

    if (selectedDay === 1) {
      setQuizTitle(currentTask.title);
      setQuizInstructions(currentTask.instructions);
      setQuizIsActive(currentTask.isActive);
      setQuizQuestions(
        currentTask.quizQuestions && currentTask.quizQuestions.length > 0
          ? currentTask.quizQuestions
          : [
              {
                id: `q_${Date.now()}_1`,
                question: "Question du questionnaire",
                options: ["Option 1", "Option 2", "Option 3"],
                correctOptionIndex: 0,
                rewardAmount: 100,
              },
            ]
      );
    } else if (selectedDay === 4) {
      setAdTitle(currentTask.title);
      setAdInstructions(currentTask.instructions);
      setAdImageUrl(
        currentTask.adImageUrl ||
          "https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=1200&auto=format&fit=crop&q=80"
      );
      setAdTargetUrl(currentTask.adTargetUrl || "");
      setSponsorName(currentTask.sponsorName || "Partenaire Officiel UEMOA");
      setAdDurationSeconds(currentTask.adDurationSeconds || 15);
      setAdRewardAmount(currentTask.rewardAmount || 200);
      setAdIsActive(currentTask.isActive);
    } else {
      setVideoTitle(currentTask.title);
      setVideoUrl(currentTask.videoUrl || "");
      setVideoInstructions(currentTask.instructions);
      setVideoRewardAmount(currentTask.rewardAmount || 150);
      setVideoDurationSeconds(currentTask.videoDurationSeconds || 30);
      setVideoIsActive(currentTask.isActive);
      if (currentTask.videoUrl) {
        setVideoAnalysis(parseUniversalVideoUrl(currentTask.videoUrl));
      } else {
        setVideoAnalysis({ isValid: false });
      }
    }
  }, [selectedDay, currentTask]);

  // Analyse vidéo dynamique
  useEffect(() => {
    if (!videoUrl.trim() || selectedDay === 1 || selectedDay === 4) {
      setVideoAnalysis({ isValid: false });
      return;
    }
    setVideoAnalysis(parseUniversalVideoUrl(videoUrl));
  }, [videoUrl, selectedDay]);

  // MANIPULATION DES QUESTIONS DU QUIZ (LUNDI)
  const handleAddQuestion = () => {
    const newQ: QuizQuestionItem = {
      id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      question: "",
      options: ["Réponse A", "Réponse B", "Réponse C"],
      correctOptionIndex: 0,
      rewardAmount: 100,
    };
    setQuizQuestions([...quizQuestions, newQ]);
  };

  const handleRemoveQuestion = (qIndex: number) => {
    if (quizQuestions.length <= 1) {
      setMessage({ type: "error", text: "Le questionnaire doit comporter au moins une question." });
      return;
    }
    setQuizQuestions(quizQuestions.filter((_, idx) => idx !== qIndex));
  };

  const handleUpdateQuestionText = (qIndex: number, text: string) => {
    const updated = [...quizQuestions];
    updated[qIndex].question = text;
    setQuizQuestions(updated);
  };

  const handleUpdateQuestionReward = (qIndex: number, reward: number) => {
    const updated = [...quizQuestions];
    updated[qIndex].rewardAmount = Math.max(1, reward);
    setQuizQuestions(updated);
  };

  const handleSetCorrectOption = (qIndex: number, optionIndex: number) => {
    const updated = [...quizQuestions];
    updated[qIndex].correctOptionIndex = optionIndex;
    setQuizQuestions(updated);
  };

  const handleUpdateOptionText = (qIndex: number, optIndex: number, text: string) => {
    const updated = [...quizQuestions];
    updated[qIndex].options[optIndex] = text;
    setQuizQuestions(updated);
  };

  const handleAddOption = (qIndex: number) => {
    const updated = [...quizQuestions];
    if (updated[qIndex].options.length >= 6) return;
    updated[qIndex].options.push(`Nouvelle option ${updated[qIndex].options.length + 1}`);
    setQuizQuestions(updated);
  };

  const handleRemoveOption = (qIndex: number, optIndex: number) => {
    const updated = [...quizQuestions];
    if (updated[qIndex].options.length <= 2) {
      setMessage({ type: "error", text: "Chaque question doit avoir au moins 2 options." });
      return;
    }
    updated[qIndex].options = updated[qIndex].options.filter((_, idx) => idx !== optIndex);
    if (updated[qIndex].correctOptionIndex >= updated[qIndex].options.length) {
      updated[qIndex].correctOptionIndex = 0;
    }
    setQuizQuestions(updated);
  };

  // SAUVEGARDE DU QUIZ (LUNDI)
  const handleSaveQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const totalReward = quizQuestions.reduce((acc, q) => acc + (q.rewardAmount || 0), 0);

    startTransition(async () => {
      const res = await saveDailyQuizTaskAction({
        id: currentTask?.id || "task_lundi",
        title: quizTitle.trim() || "Questionnaire du Lundi — Connaissances Digitales",
        instructions: quizInstructions.trim(),
        rewardAmount: totalReward,
        isActive: quizIsActive,
        quizQuestions,
      });

      if (res.success && res.task) {
        setTasks((prev) => {
          const idx = prev.findIndex((t) => t.id === res.task?.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = res.task!;
            return next;
          }
          return [...prev, res.task!];
        });
        setMessage({ type: "success", text: res.message || "Questionnaire du lundi enregistré avec succès." });
      } else {
        setMessage({ type: "error", text: res.error || "Erreur lors de la sauvegarde du quiz." });
      }
    });
  };

  // SAUVEGARDE D'UNE VIDÉO (MARDI, MERCREDI, VENDREDI)
  const handleSaveVideo = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!videoUrl.trim()) {
      setMessage({ type: "error", text: "Veuillez renseigner le lien vidéo." });
      return;
    }
    if (!videoAnalysis.isValid) {
      setMessage({ type: "error", text: videoAnalysis.error || "Lien vidéo non reconnu." });
      return;
    }

    startTransition(async () => {
      const res = await saveDailyVideoTaskAction({
        id: currentTask?.id,
        dayOfWeek: selectedDay,
        title: videoTitle.trim(),
        videoUrl: videoUrl.trim(),
        instructions: videoInstructions.trim(),
        rewardAmount: videoRewardAmount,
        isActive: videoIsActive,
      });

      if (res.success && res.task) {
        setTasks((prev) => {
          const idx = prev.findIndex((t) => t.id === res.task?.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = res.task!;
            return next;
          }
          return [...prev, res.task!];
        });
        setMessage({ type: "success", text: res.message || "Tâche vidéo enregistrée avec succès." });
      } else {
        setMessage({ type: "error", text: res.error || "Erreur lors de la sauvegarde." });
      }
    });
  };

  // SAUVEGARDE DE LA PUB ADSENSE (JEUDI)
  const handleSaveAdSense = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!adImageUrl.trim()) {
      setMessage({ type: "error", text: "Veuillez renseigner l'URL de la photo publicitaire." });
      return;
    }

    startTransition(async () => {
      const res = await saveDailyAdSenseTaskAction({
        id: currentTask?.id || "task_jeudi",
        title: adTitle.trim() || "Publicité AdSense du Jeudi",
        instructions: adInstructions.trim(),
        adImageUrl: adImageUrl.trim(),
        adTargetUrl: adTargetUrl.trim(),
        sponsorName: sponsorName.trim(),
        adDurationSeconds: adDurationSeconds,
        rewardAmount: adRewardAmount,
        isActive: adIsActive,
      });

      if (res.success && res.task) {
        setTasks((prev) => {
          const idx = prev.findIndex((t) => t.id === res.task?.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = res.task!;
            return next;
          }
          return [...prev, res.task!];
        });
        setMessage({ type: "success", text: res.message || "Publicité AdSense enregistrée avec succès." });
      } else {
        setMessage({ type: "error", text: res.error || "Erreur lors de la sauvegarde." });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. SÉLECTEUR STRICT DES 5 JOURS ORDONNÉS */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Ordre Hebdomadaire des Tâches (Lundi à Vendredi)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Chaque jour possède sa catégorie dédiée fixe. Cliquez sur un jour pour gérer ses paramètres.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
            Aujourd&apos;hui : {lomeTime.dayName}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {ORDERED_DAYS.map((item) => {
            const isSelected = item.day === selectedDay;
            const isToday = item.day === lomeTime.dayOfWeek && !lomeTime.isWeekend;
            const taskForDay = tasks.find((t) => t.dayOfWeek === item.day && !t.isDeleted);
            const Icon = item.icon;

            return (
              <button
                key={item.day}
                type="button"
                onClick={() => setSelectedDay(item.day)}
                className={`touch-target p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/30"
                    : "bg-white hover:bg-slate-50 border-slate-200 text-slate-800"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-black">{item.label}</span>
                  {isToday && (
                    <span
                      className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                        isSelected ? "bg-white text-emerald-700" : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      Aujourd&apos;hui
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs font-bold truncate">
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-white" : "text-slate-500"}`} />
                  <span className="truncate">{item.title}</span>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100/20 flex items-center justify-between text-[10px]">
                  <span className={isSelected ? "text-emerald-100" : "text-slate-400"}>
                    {taskForDay?.isActive ? "Actif" : "Inactif"}
                  </span>
                  <span className={`font-black ${isSelected ? "text-white" : "text-emerald-600"}`}>
                    +{taskForDay?.rewardAmount || 0} F
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* NOTIFICATION MESSAGE */}
      {message && (
        <div
          className={`p-4 rounded-2xl flex items-start gap-3 text-xs font-bold border transition-all ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-950"
              : "bg-red-50 border-red-300 text-red-950"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <p className="leading-relaxed">{message.text}</p>
        </div>
      )}

      {/* 2. ÉDITEUR DU LUNDI : QUESTIONNAIRES & QUIZ */}
      {selectedDay === 1 && (
        <form onSubmit={handleSaveQuiz} className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Gestion du Questionnaire du Lundi
                </h3>
                <p className="text-xs text-slate-500">
                  Configurez le nombre de questions, les options de réponses et le prix par réponse. Règle : 1 seule chance pour l&apos;utilisateur.
                </p>
              </div>
            </div>

            <label className="inline-flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors">
              <input
                type="checkbox"
                checked={quizIsActive}
                onChange={(e) => setQuizIsActive(e.target.checked)}
                className="rounded text-purple-600 focus:ring-purple-500"
              />
              <span className="text-xs font-bold text-slate-800">
                {quizIsActive ? "Tâche active" : "Désactivée"}
              </span>
            </label>
          </div>

          {/* Titre & Consignes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                Titre du questionnaire
              </label>
              <input
                type="text"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                placeholder="Ex: Questionnaire du Lundi — Connaissances Digitales"
                className="w-full touch-target px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:border-purple-600"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                Récompense totale calculée
              </label>
              <div className="touch-target px-3.5 py-2.5 rounded-xl bg-purple-50 border border-purple-200 text-xs sm:text-sm font-black text-purple-900 flex items-center justify-between">
                <span>{quizQuestions.length} question(s) au total</span>
                <span>
                  +{formatFCFA(quizQuestions.reduce((acc, q) => acc + (q.rewardAmount || 0), 0))}
                </span>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                Instructions affichées aux utilisateurs
              </label>
              <textarea
                value={quizInstructions}
                onChange={(e) => setQuizInstructions(e.target.value)}
                rows={2}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-purple-600"
                required
              />
            </div>
          </div>

          {/* LISTE DES QUESTIONS */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Questions du Questionnaire ({quizQuestions.length})
              </h4>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="touch-target px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter une question</span>
              </button>
            </div>

            <div className="space-y-4">
              {quizQuestions.map((q, qIndex) => (
                <div
                  key={q.id || qIndex}
                  className="p-4 rounded-2xl border border-purple-200/80 bg-purple-50/30 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-purple-900 bg-purple-100 px-2.5 py-1 rounded-lg">
                      Question #{qIndex + 1}
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <label className="text-[11px] font-bold text-slate-600">Prix réponse :</label>
                        <input
                          type="number"
                          value={q.rewardAmount}
                          onChange={(e) => handleUpdateQuestionReward(qIndex, Number(e.target.value))}
                          className="w-20 px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-black text-emerald-700 text-right"
                          min={1}
                          max={500}
                        />
                        <span className="text-[11px] font-bold text-slate-500">FCFA</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(qIndex)}
                        className="touch-target p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                        title="Supprimer cette question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Énoncé */}
                  <input
                    type="text"
                    value={q.question}
                    onChange={(e) => handleUpdateQuestionText(qIndex, e.target.value)}
                    placeholder="Énoncé de la question..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-bold text-slate-900 focus:outline-hidden focus:border-purple-600"
                    required
                  />

                  {/* Options de réponse */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                      <span>Options de réponses (cochez le rond pour désigner la bonne réponse)</span>
                      <button
                        type="button"
                        onClick={() => handleAddOption(qIndex)}
                        className="text-purple-700 hover:text-purple-900 font-black cursor-pointer"
                      >
                        + Ajouter une option
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {q.options.map((opt, optIndex) => {
                        const isCorrect = q.correctOptionIndex === optIndex;
                        return (
                          <div
                            key={optIndex}
                            className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                              isCorrect
                                ? "bg-emerald-50 border-emerald-300 ring-1 ring-emerald-400"
                                : "bg-white border-slate-200"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleSetCorrectOption(qIndex, optIndex)}
                              className="touch-target p-1 cursor-pointer shrink-0"
                              title="Définir comme bonne réponse"
                            >
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                  isCorrect
                                    ? "border-emerald-600 bg-emerald-600 text-white"
                                    : "border-slate-300 bg-white text-transparent"
                                }`}
                              >
                                <Check className="w-3 h-3 stroke-3" />
                              </div>
                            </button>

                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => handleUpdateOptionText(qIndex, optIndex, e.target.value)}
                              placeholder={`Option ${optIndex + 1}`}
                              className="flex-1 px-2.5 py-1.5 rounded-lg border border-transparent hover:border-slate-200 focus:border-purple-600 bg-transparent text-xs font-medium text-slate-900 focus:bg-white"
                              required
                            />

                            {isCorrect && (
                              <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md shrink-0">
                                Bonne réponse
                              </span>
                            )}

                            {q.options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveOption(qIndex, optIndex)}
                                className="touch-target p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer shrink-0"
                                title="Supprimer cette option"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="touch-target min-h-[44px] px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              {isPending ? (
                <span>Enregistrement en cours...</span>
              ) : (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Enregistrer le Questionnaire du Lundi</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* 3. ÉDITEUR DES VIDÉOS (MARDI: TIKTOK, MERCREDI: YOUTUBE, VENDREDI: INSTAGRAM) */}
      {(selectedDay === 2 || selectedDay === 3 || selectedDay === 5) && (
        <form onSubmit={handleSaveVideo} className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {ORDERED_DAYS.find((d) => d.day === selectedDay)?.label} :{" "}
                  {ORDERED_DAYS.find((d) => d.day === selectedDay)?.title}
                </h3>
                <p className="text-xs text-slate-500">
                  Collez le lien direct de la vidéo à diffuser. Le lecteur sécurisé officiel s&apos;adapte automatiquement.
                </p>
              </div>
            </div>

            <label className="inline-flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors">
              <input
                type="checkbox"
                checked={videoIsActive}
                onChange={(e) => setVideoIsActive(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs font-bold text-slate-800">
                {videoIsActive ? "Tâche active" : "Désactivée"}
              </span>
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                Lien de la vidéo ({ORDERED_DAYS.find((d) => d.day === selectedDay)?.title})
              </label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.tiktok.com/... ou https://www.youtube.com/... ou https://instagram.com/reel/..."
                className="w-full touch-target px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 font-mono focus:outline-hidden focus:border-emerald-600"
                required
              />
              {videoAnalysis.isValid && (
                <p className="text-[11px] text-emerald-700 font-bold mt-1.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Vidéo reconnue : {videoAnalysis.platformName} (ID: {videoAnalysis.videoId})</span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                  Titre de la tâche
                </label>
                <input
                  type="text"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  className="w-full touch-target px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:border-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                  Récompense (FCFA)
                </label>
                <input
                  type="number"
                  value={videoRewardAmount}
                  onChange={(e) => setVideoRewardAmount(Number(e.target.value))}
                  min={1}
                  max={500}
                  className="w-full touch-target px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-black text-emerald-700 focus:outline-hidden focus:border-emerald-600"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                  Instructions pour le visionnage
                </label>
                <textarea
                  value={videoInstructions}
                  onChange={(e) => setVideoInstructions(e.target.value)}
                  rows={2}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600"
                  required
                />
              </div>
            </div>

            {/* Prévisualisation vidéo */}
            {videoAnalysis.isValid && videoAnalysis.embedUrl && (
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">
                  Aperçu en direct du lecteur :
                </span>
                <VideoEmbedPlayer
                  embedUrl={videoAnalysis.embedUrl}
                  platform={videoAnalysis.platform!}
                  title={videoTitle}
                />
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="touch-target min-h-[44px] px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              {isPending ? (
                <span>Enregistrement en cours...</span>
              ) : (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Enregistrer la tâche vidéo ({ORDERED_DAYS.find((d) => d.day === selectedDay)?.label})</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* 4. ÉDITEUR DU JEUDI : PUBLICITÉ ADSENSE (PHOTO & CLICS) */}
      {selectedDay === 4 && (
        <form onSubmit={handleSaveAdSense} className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Gestion de la Publicité AdSense du Jeudi (Photo & Clics)
                </h3>
                <p className="text-xs text-slate-500">
                  Configurez la photo publicitaire, le sponsor, la durée obligatoire en secondes et la récompense.
                </p>
              </div>
            </div>

            <label className="inline-flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors">
              <input
                type="checkbox"
                checked={adIsActive}
                onChange={(e) => setAdIsActive(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs font-bold text-slate-800">
                {adIsActive ? "Publicité active" : "Désactivée"}
              </span>
            </label>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                  Titre de l&apos;annonce publicitaire
                </label>
                <input
                  type="text"
                  value={adTitle}
                  onChange={(e) => setAdTitle(e.target.value)}
                  placeholder="Ex: Offre Spéciale — Smartphone & High-Tech"
                  className="w-full touch-target px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                  Nom du sponsor / Annonceur officiel
                </label>
                <input
                  type="text"
                  value={sponsorName}
                  onChange={(e) => setSponsorName(e.target.value)}
                  placeholder="Ex: Vita Boutique UEMOA"
                  className="w-full touch-target px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                  Lien de l&apos;image / Photo publicitaire (URL)
                </label>
                <input
                  type="url"
                  value={adImageUrl}
                  onChange={(e) => setAdImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... ou lien de photo hébergée"
                  className="w-full touch-target px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono text-slate-900 focus:outline-hidden focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                  Durée de visualisation obligatoire (secondes)
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    value={adDurationSeconds}
                    onChange={(e) => setAdDurationSeconds(Math.max(5, Number(e.target.value)))}
                    min={5}
                    max={300}
                    className="w-full touch-target pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-black text-blue-900 focus:outline-hidden focus:border-blue-600"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  L&apos;utilisateur devra rester {adDurationSeconds} secondes sur la photo avant que le bouton de gain ne s&apos;active.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                  Récompense pour le visionnage (FCFA)
                </label>
                <input
                  type="number"
                  value={adRewardAmount}
                  onChange={(e) => setAdRewardAmount(Number(e.target.value))}
                  min={1}
                  max={500}
                  className="w-full touch-target px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-black text-emerald-700 focus:outline-hidden focus:border-blue-600"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                  Lien partenaire de redirection (optionnel)
                </label>
                <input
                  type="url"
                  value={adTargetUrl}
                  onChange={(e) => setAdTargetUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full touch-target px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                  Instructions pour les adhérents
                </label>
                <textarea
                  value={adInstructions}
                  onChange={(e) => setAdInstructions(e.target.value)}
                  rows={2}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-blue-600"
                  required
                />
              </div>
            </div>

            {/* Prévisualisation de la photo publicitaire */}
            {adImageUrl && (
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">
                  Aperçu en direct de la publicité photo ({adDurationSeconds}s décompte) :
                </span>
                <div className="rounded-2xl overflow-hidden border border-slate-200 relative bg-slate-900 max-w-xl mx-auto">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={adImageUrl}
                    alt="Aperçu publicitaire"
                    className="w-full max-h-[260px] object-cover"
                  />
                  <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-black/75 text-white text-[11px] font-black flex items-center gap-1">
                    <Clock className="w-3 h-3 text-blue-400" />
                    <span>Décompte imposé : {adDurationSeconds}s</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="touch-target min-h-[44px] px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              {isPending ? (
                <span>Enregistrement en cours...</span>
              ) : (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Enregistrer la publicité AdSense du Jeudi</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
