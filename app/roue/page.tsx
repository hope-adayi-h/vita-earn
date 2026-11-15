"use client";

import { useState } from "react";
import Link from "next/link";
import { Disc, ChevronLeft, Sparkles, Gift, Trophy, ArrowRight } from "lucide-react";

export default function RouePage() {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSpin = () => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);
    setTimeout(() => {
      setSpinning(false);
      setResult("Félicitations ! Vous avez gagné 250 FCFA de bonus.");
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-[#F4F7F0] py-6 sm:py-10 px-4">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-vita-deep hover:underline"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Retour à l'accueil</span>
          </Link>
          <span className="text-[11px] font-bold text-rose-800 bg-rose-100 px-2.5 py-1 rounded-full">
            Jeu Quotidien
          </span>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-100 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Disc className={`w-8 h-8 ${spinning ? "animate-spin" : ""}`} />
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-black text-vita-deep">Roue de la Chance</h1>
            <p className="text-xs sm:text-sm text-vita-muted mt-1">
              Tournez chaque jour la roue pour remporter des bonus cash et des points !
            </p>
          </div>

          <div className="p-6 bg-gradient-to-b from-rose-50/60 to-white rounded-2xl border border-rose-100 space-y-4">
            <div className="text-4xl sm:text-5xl font-black text-rose-600">
              {spinning ? "..." : result ? "250 F" : "1 Tour Gratuit"}
            </div>
            {result ? (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200">
                {result}
              </div>
            ) : (
              <p className="text-xs text-gray-600">
                Gagnez jusqu'à 5 000 FCFA directement crédités sur votre portefeuille Vita Earn.
              </p>
            )}

            <button
              type="button"
              onClick={handleSpin}
              disabled={spinning}
              className="w-full py-3.5 px-6 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-bold text-sm shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{spinning ? "Tirage en cours..." : "Lancer la Roue"}</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-left">
            <div className="p-3 bg-vita-surface rounded-xl border border-vita-border/60">
              <Gift className="w-4 h-4 text-vita-medium mb-1" />
              <div className="text-[11px] font-bold text-vita-deep">100 F - 500 F</div>
              <div className="text-[10px] text-gray-500">Bonus régulier</div>
            </div>
            <div className="p-3 bg-vita-surface rounded-xl border border-vita-border/60">
              <Trophy className="w-4 h-4 text-amber-500 mb-1" />
              <div className="text-[11px] font-bold text-vita-deep">1 000 F - 5 000 F</div>
              <div className="text-[10px] text-gray-500">Jackpot spécial</div>
            </div>
            <div className="p-3 bg-vita-surface rounded-xl border border-vita-border/60">
              <Sparkles className="w-4 h-4 text-purple-500 mb-1" />
              <div className="text-[11px] font-bold text-vita-deep">Points VIP</div>
              <div className="text-[10px] text-gray-500">Rangs de parrain</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
