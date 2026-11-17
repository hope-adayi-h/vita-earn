"use client";

import { useState } from "react";
import Link from "next/link";
import { Gift, CheckCircle, ArrowRight, Sparkles, AlertCircle } from "lucide-react";
import { claimWelcomeBonusAction } from "@/lib/actions/tasks";
import { formatFCFA } from "@/lib/utils";

interface WelcomeBonusCardProps {
  level1Count: number;
  welcomeBonusAmount?: number;
  initialClaimed?: boolean;
}

export function WelcomeBonusCard({
  level1Count,
  welcomeBonusAmount = 900,
  initialClaimed = false,
}: WelcomeBonusCardProps) {
  const target = 20;
  const isUnlocked = level1Count >= target;
  const progressPercent = Math.min(100, Math.round((level1Count / target) * 100));

  const [isClaimed, setIsClaimed] = useState(initialClaimed);
  const [isClaiming, setIsClaiming] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleClaim = async () => {
    if (!isUnlocked || isClaimed || isClaiming) return;
    setIsClaiming(true);
    setFeedback(null);

    const res = await claimWelcomeBonusAction();
    setIsClaiming(false);

    if (res.success) {
      setIsClaimed(true);
      setFeedback(res.message);
    } else {
      setFeedback(res.message);
    }
  };

  return (
    <div className="rounded-2xl bg-[#EBDDFB] p-4 sm:p-5 shadow-sm relative overflow-hidden">
      {/* En-tête */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#9333EA] flex items-center justify-center shadow-xs">
            <Gift className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-[#1F2937] tracking-wide">
              Welcome Bonus
            </h2>
            <p className="text-[10px] text-[#4B5563]">
              Parrainez 20 personnes pour débloquer
            </p>
          </div>
        </div>

        <span
          className={`px-2 py-0.5 rounded-full text-[9px] font-bold shadow-xs ${
            isClaimed
              ? "bg-[#9333EA] text-white"
              : isUnlocked
              ? "bg-[#9333EA] text-white animate-pulse"
              : "bg-[#9333EA] text-white"
          }`}
        >
          {isClaimed
            ? "Bonus Réclamé"
            : isUnlocked
            ? "Prêt à réclamer !"
            : `${level1Count}/${target} invités`}
        </span>
      </div>

      {/* Montant */}
      <div className="mt-2.5 flex items-baseline gap-1.5">
        <span className="text-[11px] font-bold text-[#4B5563] uppercase tracking-wider">
          XOF
        </span>
        <span className="text-2xl sm:text-3xl font-black text-[#1F2937] tracking-tight">
          {welcomeBonusAmount.toLocaleString("fr-FR")}
        </span>
      </div>

      {/* Barre de progression ou Bouton de réclamation manuelle */}
      <div className="mt-2.5 pt-2 border-t border-[#9333EA]/20 space-y-2">
        {!isClaimed && (
          <div>
            <div className="flex items-center justify-between text-[10px] text-[#4B5563] mb-1">
              <span>Progression du déblocage</span>
              <span className="font-bold text-[#1F2937]">{progressPercent}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#9333EA]/20 overflow-hidden">
              <div
                className="h-full bg-[#9333EA] rounded-full transition-all duration-500 shadow-xs"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Message d'état ou bouton d'action selon conditions */}
        {isClaimed ? (
          <div className="flex items-center gap-1.5 text-[10px] text-[#9333EA] font-bold bg-[#9333EA]/10 px-2.5 py-1.5 rounded-lg border border-[#9333EA]/20">
            <CheckCircle className="w-3.5 h-3.5 text-[#9333EA] flex-shrink-0" />
            <span>Bonus réclamé et transféré vers votre solde retirable.</span>
          </div>
        ) : isUnlocked ? (
          <div className="space-y-1.5">
            <button
              type="button"
              disabled={isClaiming}
              onClick={handleClaim}
              className="w-full py-2.5 px-3 rounded-xl bg-[#9333EA] hover:bg-[#7e22ce] text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>
                {isClaiming
                  ? "Transfert en cours..."
                  : "Réclamer mon Bonus (900 FCFA)"}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </button>
            <p className="text-[9px] text-[#4B5563] text-center">
              Cliquez pour transférer directement les 900 FCFA vers votre solde disponible.
            </p>
          </div>
        ) : (
          <p className="text-[9px] text-[#4B5563]">
            Encore {Math.max(0, target - level1Count)} filleul(s) direct(s) pour transférer vos {welcomeBonusAmount} FCFA.
          </p>
        )}

        {/* Message retour */}
        {feedback && (
          <div className="text-[10px] font-bold text-white bg-black/70 p-2 rounded-lg border border-white/15">
            {feedback}
          </div>
        )}
        {/* Lien vers la page dédiée de Récompense de Démarrage */}
        <Link
          href="/recompense-demarrage"
          className="w-full mt-2 py-1.5 px-2.5 rounded-xl bg-white/70 hover:bg-white text-[#1F2937] text-[10px] font-bold text-center flex items-center justify-center gap-1 transition-colors border border-[#9333EA]/20 shadow-2xs"
        >
          <span>Voir le système complet & lignes descendantes</span>
          <ArrowRight className="w-3 h-3 text-[#9333EA]" />
        </Link>
      </div>
    </div>
  );
}
