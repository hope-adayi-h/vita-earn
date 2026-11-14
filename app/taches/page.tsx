import Link from "next/link";
import { ArrowLeft, Clock, ShieldCheck, HelpCircle } from "lucide-react";
import { TimeTableSection } from "@/components/TimeTableSection";

export const metadata = {
  title: "Time Table & Tâches Quotidiennes — Vita Earn",
  description: "Accomplissez vos tâches quotidiennes et gagnez des récompenses en direct.",
};

export default function TachesPage() {
  return (
    <div className="max-w-xl mx-auto py-3 sm:py-6 space-y-4">
      {/* Barre de retour */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-vita-muted hover:text-vita-deep transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour au tableau de bord</span>
        </Link>
        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
          Planning Hebdomadaire
        </span>
      </div>

      {/* Bannière Explicative */}
      <div className="rounded-3xl bg-gradient-to-br from-[#0B3308] via-[#1B4D0F] to-[#256815] p-5 text-white shadow-lg space-y-2 relative overflow-hidden">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#7ED321]" />
          <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
            Programme des Tâches Rémunérées
          </h1>
        </div>
        <p className="text-xs text-emerald-100/90 leading-relaxed">
          Chaque jour de la semaine à 08:00, une nouvelle session est planifiée. Dès que l'administrateur active la tâche du jour, le bouton <strong>« Participer »</strong> devient accessible. Vos gains s'accumulent directement devant chaque tâche jusqu'au palier de retrait de <strong>4 500 FCFA</strong>.
        </p>
      </div>

      {/* Composant Time Table */}
      <TimeTableSection />
    </div>
  );
}
