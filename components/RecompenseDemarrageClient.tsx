"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Gift,
  ArrowLeft,
  Users,
  CheckCircle2,
  Sparkles,
  ArrowUp,
} from "lucide-react";
import { claimWelcomeBonusAction } from "@/lib/actions/tasks";
import { formatFCFA } from "@/lib/utils";

export interface Level1Member {
  id: string;
  username: string;
  fullName: string;
  phone?: string;
  country?: string;
  date: string;
  timeAgo: string;
  amountPaid: number;
  commissionEarned: number;
  isActivated: boolean;
}

interface RecompenseDemarrageClientProps {
  level1Count: number;
  bonusAmount?: number;
  initialClaimed?: boolean;
  members: Level1Member[];
}

export function RecompenseDemarrageClient({
  level1Count,
  bonusAmount = 900,
  initialClaimed = false,
  members = [],
}: RecompenseDemarrageClientProps) {
  const target = 20;
  const isTargetReached = level1Count >= target;
  const progressPercent = Math.min(100, Math.round((level1Count / target) * 100));

  const [isClaimed, setIsClaimed] = useState(initialClaimed);
  const [isClaiming, setIsClaiming] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const handleClaim = async () => {
    if (!isTargetReached || isClaimed || isClaiming) return;
    setIsClaiming(true);
    setFeedback(null);

    const res = await claimWelcomeBonusAction();
    setIsClaiming(false);

    if (res.success) {
      setIsClaimed(true);
      setFeedback({ success: true, message: res.message });
    } else {
      setFeedback({ success: false, message: res.message });
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6">
      {/* 1. EN-TÊTE DE NAVIGATION & RETOUR */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="w-10 h-10 rounded-2xl bg-white dark:bg-[#131E17] border border-gray-200 dark:border-[#1E2E24] text-gray-700 dark:text-gray-200 hover:text-vita-deep dark:hover:text-emerald-400 flex items-center justify-center transition-colors shadow-2xs cursor-pointer shrink-0"
          aria-label="Retour à l'accueil"
        >
          <ArrowLeft className="w-4.5 h-4.5" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            Rachat de bonus de niveau 1
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Développez votre équipe de niveau 1 et débloquez votre récompense de jalon
          </p>
        </div>
      </div>

      {/* Message de notification si réclamation effectuée */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm font-bold flex items-start gap-2.5 animate-in fade-in duration-200 ${
            feedback.success
              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
          }`}
        >
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 2. GRANDE CARTE VIOLETTE / DEGRADE (STYLE EXACT DES CAPTURES D'ECRAN) */}
      <div className="rounded-3xl bg-gradient-to-br from-[#6366F1] via-[#7C3AED] to-[#A855F7] p-5 sm:p-7 text-white shadow-xl relative overflow-hidden">
        {/* Halo décoratif */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        {/* Badge supérieur */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
            <Gift className="w-4 h-4 text-white" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-widest text-white/90">
            RÉCOMPENSE D&apos;UN JALON
          </span>
        </div>

        {/* Titre & Description du jalon */}
        <p className="text-xs sm:text-sm text-white/90 font-medium">
          Référez <span className="font-black text-white">20 lignes descendantes de niveau 1 actives</span> et réclamez
        </p>

        {/* Gros Montant XOF 900 */}
        <div className="my-3 sm:my-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              XOF {bonusAmount.toLocaleString("fr-FR")}
            </span>
          </div>
        </div>

        {/* Barre de progression avec compteurs */}
        <div className="space-y-1.5 my-3">
          <div className="flex items-center justify-between text-xs font-bold text-white/90">
            <span>{level1Count} / {target} lignes descendantes</span>
            <span>{progressPercent} %</span>
          </div>
          <div className="w-full h-3 rounded-full bg-white/25 overflow-hidden backdrop-blur-xs">
            <div
              className="h-full bg-white rounded-full transition-all duration-700 ease-out shadow-xs"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Statut sous la barre */}
        <p className="text-xs font-medium text-white/95 flex items-center gap-1.5 mt-2 mb-5">
          {isClaimed ? (
            <>
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
              <span>Vous avez atteint la cible - Bonus échangé avec succès !</span>
            </>
          ) : isTargetReached ? (
            <>
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
              <span>Félicitations ! Vous avez atteint la cible de 20 membres. Cliquez pour réclamer votre bonus de {formatFCFA(bonusAmount)} !</span>
            </>
          ) : (
            <>
              <span>Il vous reste {target - level1Count} filleul(s) de niveau 1 pour débloquer votre bonus de {formatFCFA(bonusAmount)}.</span>
            </>
          )}
        </p>

        {/* Cadre intérieur : LIGNES DESCENDANTES ACTIVES */}
        <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center mb-5">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white/80">
            LIGNES DESCENDANTES ACTIVES
          </p>
          <p className="text-3xl sm:text-4xl font-black text-white mt-1">
            {level1Count}
          </p>
        </div>

        {/* BOUTON ROUGE DE RÉCLAMATION / DÉJÀ RACHETÉ (CONFORME À LA CAPTURE) */}
        <div>
          {isClaimed ? (
            <button
              type="button"
              disabled
              className="w-full py-3.5 px-6 rounded-2xl bg-[#DC2626] text-white font-bold text-sm tracking-wide shadow-md opacity-90 cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Gift className="w-4 h-4" />
              <span>Déjà racheté</span>
            </button>
          ) : isTargetReached ? (
            <button
              type="button"
              onClick={handleClaim}
              disabled={isClaiming}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-black text-sm tracking-wide shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 animate-pulse"
            >
              <Gift className="w-4 h-4" />
              <span>{isClaiming ? "Attribution en cours..." : "RÉCLAMER LE BONUS (900 FCFA)"}</span>
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="w-full py-3.5 px-6 rounded-2xl bg-[#DC2626]/40 text-white/70 font-bold text-sm tracking-wide cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Gift className="w-4 h-4" />
              <span>Réclamer le bonus ({level1Count}/{target})</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. TABLEAU DES LIGNES DESCENDANTES RÉCENTES DE NIVEAU 1 */}
      <div className="bg-white dark:bg-[#131E17] rounded-3xl border border-gray-100 dark:border-[#1E2E24] shadow-xs overflow-hidden">
        {/* En-tête de section */}
        <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-[#1E2E24] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Users className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-gray-900 dark:text-white">
                Lignes descendantes récentes de niveau 1
              </h2>
              <p className="text-[11px] text-gray-400">
                Vos filleuls directs inscrits avec votre lien personnel
              </p>
            </div>
          </div>
          <span className="text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#1E2E24] px-3 py-1 rounded-full">
            {Math.max(level1Count, members.length)} au total
          </span>
        </div>

        {/* Tableau défilable horizontalement sur mobile (4 colonnes exactes : DATE, TÉLÉPHONE, NOM D'UTILISATEUR, REVENU) */}
        <div className="overflow-x-auto">
          <div className="min-w-[580px]">
            {/* En-têtes de colonnes */}
            <div className="grid grid-cols-12 px-4 sm:px-6 py-3 bg-gray-50/80 dark:bg-[#0E1812] border-b border-gray-100 dark:border-[#1E2E24] text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              <div className="col-span-3">DATE</div>
              <div className="col-span-3">TÉLÉPHONE</div>
              <div className="col-span-3">NOM D&apos;UTILISATEUR</div>
              <div className="col-span-3 text-right">REVENU</div>
            </div>

            {/* Lignes du tableau */}
            <div className="divide-y divide-gray-100 dark:divide-[#1E2E24]">
              {members.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs">
                  Aucun filleul de niveau 1 enregistré pour le moment.
                </div>
              ) : (
                members.map((member) => (
                  <div
                    key={member.id}
                    className="grid grid-cols-12 items-center px-4 sm:px-6 py-3.5 hover:bg-gray-50/70 dark:hover:bg-[#17241C] transition-colors text-xs"
                  >
                    {/* Colonne 1 : DATE */}
                    <div className="col-span-3 pr-2">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {member.date}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">
                        {member.timeAgo}
                      </p>
                    </div>

                    {/* Colonne 2 : TÉLÉPHONE */}
                    <div className="col-span-3 pr-2">
                      <span className="font-medium text-gray-600 dark:text-gray-300 truncate block">
                        {member.phone || "Non renseigné"}
                      </span>
                    </div>

                    {/* Colonne 3 : NOM D'UTILISATEUR */}
                    <div className="col-span-3 pr-2">
                      <span className="font-bold text-gray-900 dark:text-white truncate block">
                        @{member.username}
                      </span>
                    </div>

                    {/* Colonne 4 : REVENU */}
                    <div className="col-span-3 text-right">
                      <span className="font-black text-gray-900 dark:text-white">
                        XOF {member.commissionEarned.toLocaleString("fr-FR")}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. BOUTON FLOTTANT RETOUR EN HAUT (STYLE EXACT DE LA CAPTURE D'ÉCRAN) */}
      <button
        type="button"
        onClick={() => {
          if (typeof window !== "undefined") {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }}
        className="fixed bottom-6 right-6 w-11 h-11 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95 z-30 cursor-pointer"
        aria-label="Retour en haut"
      >
        <ArrowUp className="w-5 h-5 stroke-[2.5]" />
      </button>
    </div>
  );
}
