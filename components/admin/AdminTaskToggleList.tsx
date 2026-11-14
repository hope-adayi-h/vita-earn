"use client";

import { useState } from "react";
import {
  HelpCircle,
  Video,
  PlaySquare,
  MousePointerClick,
  Camera,
  Check,
  Power,
  Clock,
  Sparkles,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { formatFCFA } from "@/lib/utils";
import { adminToggleTaskAction } from "@/lib/actions/tasks";

export interface AdminTaskItem {
  id: string;
  title: string;
  dayLabel: string;
  time: string;
  rewardAmount: number;
  isActive: boolean;
  description: string;
}

export function AdminTaskToggleList({ initialTasks }: { initialTasks: AdminTaskItem[] }) {
  const [tasks, setTasks] = useState<AdminTaskItem[]>(initialTasks);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleToggle = async (taskId: string, currentActive: boolean) => {
    setLoadingId(taskId);
    setStatusMessage(null);

    const newActiveState = !currentActive;
    const res = await adminToggleTaskAction(taskId, newActiveState);
    setLoadingId(null);

    if (res.success) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, isActive: newActiveState } : t))
      );
      setStatusMessage(
        `La tâche « ${taskId} » est désormais ${newActiveState ? "ACTIVÉE" : "DÉSACTIVÉE"} pour les utilisateurs.`
      );
    } else {
      setStatusMessage("Erreur lors de la mise à jour de la tâche.");
    }
  };

  const getTaskIcon = (id: string) => {
    switch (id) {
      case "trivia":
        return <HelpCircle className="w-5 h-5 text-indigo-600" />;
      case "tiktok":
        return <Video className="w-5 h-5 text-rose-500" />;
      case "youtube":
        return <PlaySquare className="w-5 h-5 text-rose-600" />;
      case "ads":
        return <MousePointerClick className="w-5 h-5 text-amber-600" />;
      case "instagram":
        return <Camera className="w-5 h-5 text-purple-600" />;
      default:
        return <Sparkles className="w-5 h-5 text-emerald-600" />;
    }
  };

  return (
    <div className="space-y-4">
      {statusMessage && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`p-4 rounded-3xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              task.isActive
                ? "bg-white border-emerald-300 shadow-sm ring-1 ring-emerald-400/20"
                : "bg-zinc-50 border-zinc-200 opacity-90"
            }`}
          >
            {/* Info tâche */}
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center shadow-sm flex-shrink-0">
                {getTaskIcon(task.id)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-vita-text">
                    {task.title}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-200 text-zinc-700">
                    {task.dayLabel} • {task.time}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      task.isActive
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-zinc-200 text-zinc-600"
                    }`}
                  >
                    {task.isActive ? "Visible & Jouable" : "Verrouillé"}
                  </span>
                </div>
                <p className="text-xs text-vita-muted mt-1 leading-snug">
                  {task.description}
                </p>
                <div className="mt-1.5 flex items-center gap-3 text-[11px] font-bold">
                  <span className="text-emerald-700">
                    Rémunération : +{task.rewardAmount} FCFA
                  </span>
                  <span className="text-zinc-400">•</span>
                  <span className="text-zinc-500">
                    Seuil retrait : 4 500 FCFA
                  </span>
                </div>
              </div>
            </div>

            {/* Interrupteur d'activation pour l'admin */}
            <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-200/60">
              <span className="text-xs font-bold text-vita-muted sm:hidden">
                Statut :
              </span>
              <button
                type="button"
                disabled={loadingId === task.id}
                onClick={() => handleToggle(task.id, task.isActive)}
                className={`touch-target px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 ${
                  task.isActive
                    ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>
                  {loadingId === task.id
                    ? "Mise à jour..."
                    : task.isActive
                    ? "Désactiver pour aujourd'hui"
                    : "Activer pour les utilisateurs"}
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
