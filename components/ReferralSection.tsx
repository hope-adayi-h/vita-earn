"use client";

import { useState } from "react";
import {
  Users2,
  Copy,
  Check,
  Share2,
  TrendingUp,
  ShieldCheck,
  ChevronDown,
  Layers,
  Sparkles,
  Award,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { formatFCFA } from "@/lib/utils";

interface ReferralMember {
  id: string;
  name: string;
  date: string;
  level: number;
  isActivated: boolean;
}

interface ReferralSectionProps {
  referralCode: string;
  appUrl: string;
  level1Count: number;
  level2Count: number;
  level3Count: number;
  level1Earned: number;
  level2Earned: number;
  level3Earned: number;
  referrals?: ReferralMember[];
}

export function ReferralSection({
  referralCode,
  appUrl,
  level1Count,
  level2Count,
  level3Count,
  level1Earned,
  level2Earned,
  level3Earned,
  referrals = [],
}: ReferralSectionProps) {
  const [copied, setCopied] = useState(false);
  const [showList, setShowList] = useState(false);
  const [selectedTab, setSelectedTab] = useState<1 | 2 | 3>(1);

  const referralLink = `${appUrl}/auth/register?ref=${referralCode || "VE"}`;
  const totalEarned = level1Earned + level2Earned + level3Earned;
  const totalNetwork = level1Count + level2Count + level3Count;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleShare = async () => {
    const shareText = `Rejoins mon réseau sur Vita Earn et commence à gagner des revenus Mobile Money : ${referralLink}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Rejoins mon réseau Vita Earn",
          text: shareText,
          url: referralLink,
        });
      } catch {
        // Annulé
      }
    } else {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(shareText)}`,
        "_blank"
      );
    }
  };

  const filteredReferrals = referrals.filter((r) => r.level === selectedTab);

  return (
    <div
      id="equipe"
      className="rounded-3xl bg-gradient-to-br from-[#0B2E0A] via-[#154611] to-[#1C5A17] text-white p-4 sm:p-6 shadow-2xl space-y-4 relative overflow-hidden border-2 border-emerald-400/40 transition-all hover:border-emerald-300"
    >
      {/* Effets lumineux d'arrière-plan pour un rendu spectaculaire */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-400/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* En-tête de section ultra valorisant */}
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-[#16A34A] text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
            <Users2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 mb-1">
              <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
              <span>Affiliation Légale 3 Niveaux</span>
            </div>
            <h2 className="text-base sm:text-xl font-black text-white tracking-tight">
              Mon Réseau & Parrainage
            </h2>
            <p className="text-xs text-emerald-100/90 leading-snug max-w-sm mt-0.5">
              Partagez votre lien exclusif et encaissez directement vos commissions Mobile Money.
            </p>
          </div>
        </div>

        <div className="text-right shrink-0 bg-white/10 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/20">
          <span className="block text-[9px] font-extrabold uppercase tracking-wider text-emerald-200">
            Gains Cumulés
          </span>
          <span className="text-sm sm:text-lg font-black text-amber-300">
            {formatFCFA(totalEarned)}
          </span>
        </div>
      </div>

      {/* Boîte Lien de Parrainage Haute Visibilité (Zone centrale de capture) */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-white/10 backdrop-blur-md border-2 border-emerald-300/40 space-y-2.5 relative z-10 shadow-inner">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-white uppercase tracking-wider text-[10px] flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-300" />
            <span>Votre lien d&apos;invitation officiel :</span>
          </span>
          <span className="text-[10px] font-black text-amber-300 bg-black/40 px-2 py-0.5 rounded-lg border border-amber-300/30">
            Code : {referralCode || "N/A"}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              readOnly
              value={referralLink}
              className="w-full text-xs font-mono font-bold bg-white text-gray-900 rounded-xl px-3.5 py-2.5 border-2 border-transparent focus:border-amber-400 shadow-sm select-all focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 sm:flex-initial touch-target px-4 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] active:scale-95 text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-md shadow-green-900/40"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-200" />
                  <span>Lien Copié !</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copier le Lien</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="flex-1 sm:flex-initial touch-target px-3.5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] active:scale-95 text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-md shadow-green-900/40"
              title="Partager sur WhatsApp"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grille des 3 Niveaux de Commissions en cartes premium */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 relative z-10">
        {/* Niveau 1 : 2 000 FCFA */}
        <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-emerald-400/30 text-left transition-all hover:bg-white/15">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-200">
              Niv. 1
            </span>
            <span className="text-[9px] font-black text-emerald-950 bg-emerald-300 px-1.5 py-0.5 rounded-md shadow-xs">
              2 000 F
            </span>
          </div>
          <div className="text-lg sm:text-2xl font-black text-white">
            {level1Count}
          </div>
          <p className="text-[10px] text-emerald-200/80 font-medium">
            Filleuls directs
          </p>
          <div className="text-[11px] font-black text-amber-300 mt-1.5 pt-1.5 border-t border-white/15">
            {formatFCFA(level1Earned)}
          </div>
        </div>

        {/* Niveau 2 : 1 000 FCFA */}
        <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-sky-400/30 text-left transition-all hover:bg-white/15">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-200">
              Niv. 2
            </span>
            <span className="text-[9px] font-black text-sky-950 bg-sky-300 px-1.5 py-0.5 rounded-md shadow-xs">
              1 000 F
            </span>
          </div>
          <div className="text-lg sm:text-2xl font-black text-white">
            {level2Count}
          </div>
          <p className="text-[10px] text-sky-200/80 font-medium">
            2e génération
          </p>
          <div className="text-[11px] font-black text-amber-300 mt-1.5 pt-1.5 border-t border-white/15">
            {formatFCFA(level2Earned)}
          </div>
        </div>

        {/* Niveau 3 : 500 FCFA */}
        <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-amber-400/30 text-left transition-all hover:bg-white/15">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-200">
              Niv. 3
            </span>
            <span className="text-[9px] font-black text-amber-950 bg-amber-300 px-1.5 py-0.5 rounded-md shadow-xs">
              500 F
            </span>
          </div>
          <div className="text-lg sm:text-2xl font-black text-white">
            {level3Count}
          </div>
          <p className="text-[10px] text-amber-200/80 font-medium">
            3e génération
          </p>
          <div className="text-[11px] font-black text-amber-300 mt-1.5 pt-1.5 border-t border-white/15">
            {formatFCFA(level3Earned)}
          </div>
        </div>
      </div>

      {/* Accordéon de la liste des filleuls */}
      <div className="border-t border-white/20 pt-2.5 relative z-10">
        <button
          type="button"
          onClick={() => setShowList(!showList)}
          className="w-full flex items-center justify-between text-xs font-bold text-emerald-100 hover:text-white transition-colors select-none py-1"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-300" />
            <span>Voir le détail de vos membres ({totalNetwork} filleul{totalNetwork > 1 ? "s" : ""})</span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-emerald-200 transition-transform duration-200 ${
              showList ? "rotate-180" : ""
            }`}
          />
        </button>

        {showList && (
          <div className="mt-3 space-y-3 animate-in fade-in duration-200">
            {/* Onglets Niv 1 / Niv 2 / Niv 3 */}
            <div className="flex rounded-xl bg-black/30 p-1 border border-white/15">
              <button
                type="button"
                onClick={() => setSelectedTab(1)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedTab === 1
                    ? "bg-[#16A34A] text-white shadow-xs"
                    : "text-emerald-200 hover:text-white"
                }`}
              >
                Niveau 1 ({level1Count})
              </button>
              <button
                type="button"
                onClick={() => setSelectedTab(2)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedTab === 2
                    ? "bg-[#16A34A] text-white shadow-xs"
                    : "text-emerald-200 hover:text-white"
                }`}
              >
                Niveau 2 ({level2Count})
              </button>
              <button
                type="button"
                onClick={() => setSelectedTab(3)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedTab === 3
                    ? "bg-[#16A34A] text-white shadow-xs"
                    : "text-emerald-200 hover:text-white"
                }`}
              >
                Niveau 3 ({level3Count})
              </button>
            </div>

            {/* Liste des membres */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {filteredReferrals.length === 0 ? (
                <div className="py-6 text-center text-xs text-emerald-200/70 bg-black/20 rounded-xl border border-white/10">
                  Aucun membre enregistré au Niveau {selectedTab} pour le moment.
                </div>
              ) : (
                filteredReferrals.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-black/25 border border-white/10 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-500/30 text-emerald-200 flex items-center justify-center font-bold text-xs border border-emerald-400/40">
                        {r.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-white">{r.name}</p>
                        <p className="text-[10px] text-emerald-200/70">{r.date}</p>
                      </div>
                    </div>
                    <div>
                      {r.isActivated ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-400/30">
                          <Check className="w-3 h-3 text-emerald-300" />
                          Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-400/30">
                          En attente
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
