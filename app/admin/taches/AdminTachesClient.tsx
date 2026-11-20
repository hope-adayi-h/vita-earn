"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Play,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  Check,
  Video,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Layers,
  Sparkles,
} from "lucide-react";
import { formatFCFA } from "@/lib/utils";
import { parseUniversalVideoUrl, type ParsedVideo } from "@/lib/video/universal-embed";
import { VideoEmbedPlayer } from "@/components/video/VideoEmbedPlayer";
import {
  saveDailyVideoTaskAction,
  toggleDailyVideoTaskAction,
  deleteDailyVideoTaskAction,
  type SaveTaskInput,
} from "./actions";
import type { StoredDailyTask } from "@/lib/data/tasks-store";
import type { LomeDateInfo } from "@/lib/utils/lome-time";

interface AdminTachesClientProps {
  initialTasks: StoredDailyTask[];
  lomeTime: LomeDateInfo;
  isSuperAdmin: boolean;
}

const DAYS_OF_WEEK = [
  { day: 1, label: "Lundi", short: "Lun" },
  { day: 2, label: "Mardi", short: "Mar" },
  { day: 3, label: "Mercredi", short: "Mer" },
  { day: 4, label: "Jeudi", short: "Jeu" },
  { day: 5, label: "Vendredi", short: "Ven" },
];

export function AdminTachesClient({
  initialTasks,
  lomeTime,
  isSuperAdmin,
}: AdminTachesClientProps) {
  const [tasks, setTasks] = useState<StoredDailyTask[]>(initialTasks);
  const [selectedDayFilter, setSelectedDayFilter] = useState<number | "all">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewModalTask, setPreviewModalTask] = useState<StoredDailyTask | null>(null);

  // Formulaire d'édition / création
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [formDayOfWeek, setFormDayOfWeek] = useState<number>(lomeTime.isWeekend ? 1 : lomeTime.dayOfWeek);
  const [formSpecificDate, setFormSpecificDate] = useState<string>("");
  const [formVideoUrl, setFormVideoUrl] = useState<string>("");
  const [formTitle, setFormTitle] = useState<string>("");
  const [formInstructions, setFormInstructions] = useState<string>("");
  const [formRewardAmount, setFormRewardAmount] = useState<number>(100);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);

  // Détection en direct du lien vidéo
  const [videoAnalysis, setVideoAnalysis] = useState<ParsedVideo>({ isValid: false });

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Analyse automatique en direct de l'URL collée
  useEffect(() => {
    if (!formVideoUrl.trim()) {
      setVideoAnalysis({ isValid: false });
      return;
    }
    const result = parseUniversalVideoUrl(formVideoUrl);
    setVideoAnalysis(result);
  }, [formVideoUrl]);

  // Ouvrir le modal pour créer une nouvelle tâche
  const handleOpenCreateModal = (day?: number) => {
    setEditingTaskId(null);
    setFormDayOfWeek(day || (lomeTime.isWeekend ? 1 : lomeTime.dayOfWeek));
    setFormSpecificDate("");
    setFormVideoUrl("");
    setFormTitle("");
    setFormInstructions(
      "Visionnez cette vidéo partenaire pendant au moins 30 secondes pour découvrir les opportunités, puis validez votre récompense."
    );
    setFormRewardAmount(100);
    setFormIsActive(true);
    setMessage(null);
    setIsModalOpen(true);
  };

  // Ouvrir le modal pour modifier une tâche existante
  const handleOpenEditModal = (task: StoredDailyTask) => {
    setEditingTaskId(task.id);
    setFormDayOfWeek(task.dayOfWeek);
    setFormSpecificDate(task.specificDate || "");
    setFormVideoUrl(task.videoUrl);
    setFormTitle(task.title);
    setFormInstructions(task.instructions);
    setFormRewardAmount(task.rewardAmount);
    setFormIsActive(task.isActive);
    setMessage(null);
    setIsModalOpen(true);
  };

  // Enregistrer (Créer ou Modifier)
  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoAnalysis.isValid || !videoAnalysis.embedUrl) {
      setMessage({
        type: "error",
        text: videoAnalysis.error || "Veuillez coller un lien vidéo valide (YouTube, TikTok, Facebook ou Instagram).",
      });
      return;
    }

    if (!formInstructions.trim()) {
      setMessage({ type: "error", text: "Veuillez renseigner les consignes de la tâche." });
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const payload: SaveTaskInput = {
        id: editingTaskId || undefined,
        dayOfWeek: formDayOfWeek,
        specificDate: formSpecificDate.trim() ? formSpecificDate.trim() : null,
        title: formTitle.trim() || undefined,
        videoUrl: formVideoUrl.trim(),
        instructions: formInstructions.trim(),
        rewardAmount: Number(formRewardAmount) || 100,
        isActive: formIsActive,
      };

      const res = await saveDailyVideoTaskAction(payload);
      if (!res.success) {
        setMessage({ type: "error", text: res.error || "Erreur d'enregistrement." });
      } else if (res.task) {
        const saved = res.task;
        setTasks((prev) => {
          const idx = prev.findIndex((t) => t.id === saved.id);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = saved;
            return updated;
          }
          return [...prev, saved];
        });
        setMessage({ type: "success", text: res.message || "Tâche enregistrée avec succès." });
        setIsModalOpen(false);
      }
    });
  };

  // Activer / Désactiver une tâche
  const handleToggleActive = (task: StoredDailyTask) => {
    const newStatus = !task.isActive;
    startTransition(async () => {
      const res = await toggleDailyVideoTaskAction(task.id, newStatus);
      if (res.success) {
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, isActive: newStatus } : t))
        );
      }
    });
  };

  // Supprimer une tâche (soft-delete)
  const handleDeleteTask = (task: StoredDailyTask) => {
    if (!confirm(`Supprimer définitivement la tâche « ${task.title} » ?`)) return;
    startTransition(async () => {
      const res = await deleteDailyVideoTaskAction(task.id);
      if (res.success) {
        setTasks((prev) => prev.filter((t) => t.id !== task.id));
      }
    });
  };

  // Badge visuel de la plateforme
  const getPlatformBadge = (platform: string) => {
    switch (platform) {
      case "youtube":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
            YouTube
          </span>
        );
      case "tiktok":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-white">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            TikTok
          </span>
        );
      case "facebook":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            Facebook
          </span>
        );
      case "instagram":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-50 text-pink-700 border border-pink-200">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
            Instagram
          </span>
        );
      default:
        return null;
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (selectedDayFilter === "all") return true;
    return t.dayOfWeek === selectedDayFilter;
  });

  return (
    <div className="space-y-6">
      {/* Barre de statut du jour Lomé & Horloge officielle */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-5 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-700/60">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <Clock className="w-3 h-3 text-emerald-400" />
            <span>Fuseau Serveur : Africa/Lome (UTC+0)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Aujourd&apos;hui : {lomeTime.formattedLongDate}
          </h2>
          <p className="text-xs text-slate-300">
            {lomeTime.isWeekend ? (
              <span className="text-amber-300 font-semibold">
                Week-end : Les tâches sont suspendues et reprendront lundi matin.
              </span>
            ) : (
              <span>
                Jour ouvré en cours : <strong>{lomeTime.dayName}</strong> • Seule la tâche active de ce jour s&apos;affiche aux utilisateurs.
              </span>
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenCreateModal()}
          className="px-4 py-3 rounded-2xl bg-[#0084FF] hover:bg-blue-600 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Programmer une Tâche</span>
        </button>
      </div>

      {/* Message de notification global */}
      {message && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Filtres par Jour de la Semaine (Lundi à Vendredi) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setSelectedDayFilter("all")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            selectedDayFilter === "all"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          Tous les jours ({tasks.length})
        </button>
        {DAYS_OF_WEEK.map((d) => {
          const count = tasks.filter((t) => t.dayOfWeek === d.day).length;
          const isToday = !lomeTime.isWeekend && lomeTime.dayOfWeek === d.day;
          return (
            <button
              key={d.day}
              type="button"
              onClick={() => setSelectedDayFilter(d.day)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                selectedDayFilter === d.day
                  ? "bg-[#0084FF] text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span>{d.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedDayFilter === d.day ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                }`}
              >
                {count}
              </span>
              {isToday && (
                <span className="w-2 h-2 rounded-full bg-emerald-400" title="Aujourd'hui" />
              )}
            </button>
          );
        })}
      </div>

      {/* Grille des Tâches Programmées */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTasks.length === 0 ? (
          <div className="col-span-full p-8 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
            Aucune tâche vidéo n&apos;est programmée pour ce créneau.
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isTodayTask =
              !lomeTime.isWeekend &&
              (task.specificDate === lomeTime.dateStr ||
                (!task.specificDate && task.dayOfWeek === lomeTime.dayOfWeek));
            const dayName = DAYS_OF_WEEK.find((d) => d.day === task.dayOfWeek)?.label || "Jour";

            return (
              <div
                key={task.id}
                className={`bg-white rounded-3xl p-5 border transition-all space-y-4 shadow-xs relative ${
                  isTodayTask
                    ? "border-emerald-500/80 ring-2 ring-emerald-500/20"
                    : "border-slate-200/80 hover:border-slate-300"
                }`}
              >
                {/* Liseré de statut aujourd'hui */}
                {isTodayTask && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>En direct aujourd&apos;hui</span>
                  </div>
                )}

                {/* En-tête de la carte */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black uppercase tracking-wider text-[#0084FF]">
                        {dayName}
                      </span>
                      {getPlatformBadge(task.platform)}
                      {task.specificDate ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                          Date unique : {task.specificDate}
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-400">
                          Récurrent chaque semaine
                        </span>
                      )}
                    </div>
                    <h3 className="font-black text-slate-900 text-base leading-snug truncate">
                      {task.title}
                    </h3>
                  </div>

                  {/* Bouton switch actif / inactif */}
                  <button
                    type="button"
                    onClick={() => handleToggleActive(task)}
                    disabled={isPending}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ${
                      task.isActive
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100"
                        : "bg-slate-100 text-slate-500 border border-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    {task.isActive ? "Active" : "Désactivée"}
                  </button>
                </div>

                {/* Instructions */}
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  {task.instructions}
                </p>

                {/* Détails Récompense & Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      RÉCOMPENSE PAR VUE
                    </span>
                    <span className="text-lg font-black text-slate-900">
                      {formatFCFA(task.rewardAmount)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Bouton Prévisualisation */}
                    <button
                      type="button"
                      onClick={() => setPreviewModalTask(task)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                      title="Prévisualiser la vidéo"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Bouton Modifier */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(task)}
                      className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0084FF] transition-colors cursor-pointer"
                      title="Modifier cette tâche"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Bouton Supprimer */}
                    <button
                      type="button"
                      onClick={() => handleDeleteTask(task)}
                      disabled={isPending}
                      className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                      title="Supprimer la tâche"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL DE CRÉATION & ÉDITION DE TÂCHE                                      */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-7 space-y-5 shadow-2xl border border-slate-100 text-slate-900 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {editingTaskId ? "Modifier la Tâche Vidéo" : "Programmer une Nouvelle Tâche Vidéo"}
                </h3>
                <p className="text-xs text-slate-500">
                  Système universel : collez directement un lien TikTok, YouTube, Facebook ou Instagram.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-4">
              {/* 1. Sélection du Jour & Date Spécifique */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Jour de programmation * :
                  </label>
                  <select
                    value={formDayOfWeek}
                    onChange={(e) => setFormDayOfWeek(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-[#0084FF] focus:bg-white"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d.day} value={d.day}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Date spécifique (optionnel) :
                  </label>
                  <input
                    type="date"
                    value={formSpecificDate}
                    onChange={(e) => setFormSpecificDate(e.target.value)}
                    placeholder="YYYY-MM-DD"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-[#0084FF] focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Uniquement du lundi au vendredi. Laissez vide pour une diffusion récurrente chaque semaine.
                  </span>
                </div>
              </div>

              {/* 2. CHAMP UNIQUE UNIVERSEL LIEN VIDÉO */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Lien de la vidéo (Champ Universel) * :</span>
                  {videoAnalysis.isValid && videoAnalysis.platform && (
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Plateforme détectée : {videoAnalysis.platformName}
                    </span>
                  )}
                </label>

                <div className="relative">
                  <input
                    type="url"
                    value={formVideoUrl}
                    onChange={(e) => setFormVideoUrl(e.target.value)}
                    placeholder="Collez ici votre lien (ex: https://www.tiktok.com/@user/video/... ou https://youtu.be/...)"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border text-xs text-slate-900 focus:outline-hidden focus:bg-white transition-all ${
                      formVideoUrl.trim()
                        ? videoAnalysis.isValid
                          ? "border-emerald-500 ring-2 ring-emerald-500/20"
                          : "border-red-400 ring-2 ring-red-400/20"
                        : "border-slate-200 focus:border-[#0084FF]"
                    }`}
                    required
                  />
                </div>

                {formVideoUrl.trim() && !videoAnalysis.isValid && (
                  <p className="text-[11px] text-red-600 font-medium">
                    {videoAnalysis.error}
                  </p>
                )}
              </div>

              {/* 3. PRÉVISUALISATION DIRECTE DANS LE PANNEAU D'ADMIN */}
              {videoAnalysis.isValid && videoAnalysis.embedUrl && videoAnalysis.platform && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-[#0084FF]" />
                      <span>Prévisualisation avant publication :</span>
                    </span>
                    {getPlatformBadge(videoAnalysis.platform)}
                  </div>
                  <VideoEmbedPlayer
                    embedUrl={videoAnalysis.embedUrl}
                    platform={videoAnalysis.platform}
                    title="Prévisualisation Admin"
                  />
                </div>
              )}

              {/* 4. Titre & Récompense */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Titre de la tâche (facultatif) :
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Ex: Découverte des Outils E-commerce"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-[#0084FF] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Récompense (FCFA) * :
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={formRewardAmount}
                    onChange={(e) => setFormRewardAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-black text-slate-900 focus:outline-hidden focus:border-[#0084FF] focus:bg-white"
                    required
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Plafond max : 500 FCFA
                  </span>
                </div>
              </div>

              {/* 5. Instructions */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Instructions pour l&apos;utilisateur * :
                </label>
                <textarea
                  rows={3}
                  value={formInstructions}
                  onChange={(e) => setFormInstructions(e.target.value)}
                  placeholder="Expliquez ce que l'utilisateur doit observer ou faire avant de valider..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-[#0084FF] focus:bg-white resize-none"
                  required
                />
              </div>

              {/* 6. Activer immédiatement */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0084FF] focus:ring-0"
                />
                <span>Rendre cette tâche active immédiatement dès son jour de diffusion</span>
              </label>

              {/* Boutons d'action */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isPending || !videoAnalysis.isValid}
                  className="px-5 py-2.5 rounded-xl bg-[#0084FF] hover:bg-blue-600 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {editingTaskId ? "Enregistrer les modifications" : "Publier la tâche"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE PRÉVISUALISATION DÉDIÉ                                           */}
      {/* ========================================================================= */}
      {previewModalTask && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-100 text-slate-900 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-black uppercase text-[#0084FF]">
                  Aperçu Joueur Utilisateur
                </span>
                <h3 className="text-base font-black text-slate-900">{previewModalTask.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalTask(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <VideoEmbedPlayer
              embedUrl={previewModalTask.embedUrl}
              platform={previewModalTask.platform}
              title={previewModalTask.title}
            />

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1 text-xs">
              <span className="font-bold text-slate-800 block">Instructions de visionnage :</span>
              <p className="text-slate-600 leading-relaxed">{previewModalTask.instructions}</p>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="font-bold text-slate-500">Récompense paramétrée :</span>
              <span className="text-sm font-black text-emerald-600">
                {formatFCFA(previewModalTask.rewardAmount)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
