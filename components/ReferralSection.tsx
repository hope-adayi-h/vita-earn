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
    const shareText = `Rejoins mon réseau sur Vita Earn et commence à gagner dès aujourd'hui : ${referralLink}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Rejoins Vita Earn",
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
    <div className="bg-white rounded-2xl border border-vita-border/90 p-4 sm:p-5 shadow-sm space-y-3.5 relative overflow-hidden">
      {/* En-tête de section compact */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-vita-deep to-vita-medium text-white flex items-center justify-center shadow-sm flex-shrink-0">
            <Users2 className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-100 text-vita-deep mb-0.5">
              <Sparkles className="w-2.5 h-2.5 text-vita-bright" />
              <span>Affiliation 3 Niveaux</span>
            </div>
            <h2 className="text-sm sm:text-base font-extrabold text-vita-deep leading-tight">
              Mon Réseau & Parrainage
            </h2>
            <p className="text-[11px] text-vita-muted leading-tight">
              Partagez votre lien et percevez vos commissions certifiées.
            </p>
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <span className="block text-[9px] font-bold uppercase text-vita-muted">
            Gains Cumulés
          </span>
          <span className="text-sm sm:text-base font-black text-emerald-600">
            {formatFCFA(totalEarned)}
          </span>
        </div>
      </div>

      {/* Boîte Lien de Parrainage avec Copie et Partage - Format Affiné */}
      <div className="p-3 rounded-xl bg-vita-surface/80 border border-vita-border/80 space-y-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="font-bold text-vita-text uppercase tracking-wider text-[9px]">
            Lien personnel d'invitation :
          </span>
          <span className="text-[9px] font-bold text-vita-deep bg-white px-1.5 py-0.5 rounded border border-vita-border">
            Code : {referralCode || "N/A"}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="w-full text-[11px] font-mono font-medium bg-white border border-vita-border rounded-lg px-2.5 py-1.5 text-vita-text select-all focus:outline-none"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="touch-target px-2.5 py-1.5 rounded-lg bg-vita-deep hover:bg-vita-medium text-white text-[11px] font-bold transition-colors flex items-center gap-1 flex-shrink-0 shadow-sm"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-vita-bright" />
                <span>Copié</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copier</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="touch-target px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors flex items-center gap-1 flex-shrink-0 shadow-sm"
            title="Partager"
          >
            <Share2 className="w-3 h-3" />
            <span className="hidden sm:inline">Partager</span>
          </button>
        </div>
      </div>

      {/* Grille des 3 Niveaux de Commissions - Plus compacte et lisible */}
      <div className="grid grid-cols-3 gap-2">
        {/* Niveau 1 : 2 000 FCFA */}
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50/50 border border-emerald-200 text-left">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-800">
              Niv. 1
            </span>
            <span className="text-[8px] font-extrabold text-emerald-700 bg-emerald-100 px-1 py-0.5 rounded">
              2 000 F
            </span>
          </div>
          <div className="text-base sm:text-lg font-black text-vita-deep">
            {level1Count}
          </div>
          <p className="text-[9px] text-vita-muted font-medium">
            Filleuls directs
          </p>
          <div className="text-[10px] font-bold text-emerald-700 mt-1 pt-1 border-t border-emerald-100">
            {formatFCFA(level1Earned)}
          </div>
        </div>

        {/* Niveau 2 : 1 000 FCFA */}
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-50 to-sky-50/50 border border-sky-200 text-left">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-sky-800">
              Niv. 2
            </span>
            <span className="text-[8px] font-extrabold text-sky-700 bg-sky-100 px-1 py-0.5 rounded">
              1 000 F
            </span>
          </div>
          <div className="text-base sm:text-lg font-black text-vita-deep">
            {level2Count}
          </div>
          <p className="text-[9px] text-vita-muted font-medium">
            2e génération
          </p>
          <div className="text-[10px] font-bold text-sky-700 mt-1 pt-1 border-t border-sky-100">
            {formatFCFA(level2Earned)}
          </div>
        </div>

        {/* Niveau 3 : 500 FCFA */}
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200 text-left">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-800">
              Niv. 3
            </span>
            <span className="text-[8px] font-extrabold text-amber-700 bg-amber-100 px-1 py-0.5 rounded">
              500 F
            </span>
          </div>
          <div className="text-base sm:text-lg font-black text-vita-deep">
            {level3Count}
          </div>
          <p className="text-[9px] text-vita-muted font-medium">
            3e génération
          </p>
          <div className="text-[10px] font-bold text-amber-700 mt-1 pt-1 border-t border-amber-100">
            {formatFCFA(level3Earned)}
          </div>
        </div>
      </div>

      {/* Dépliant de la liste des filleuls par génération */}
      <div className="border-t border-vita-border/60 pt-2.5">
        <button
          type="button"
          onClick={() => setShowList(!showList)}
          className="w-full flex items-center justify-between text-[11px] font-bold text-vita-deep hover:text-vita-medium transition-colors select-none"
        >
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-vita-medium" />
            <span>Détail des filleuls ({totalNetwork} membre{totalNetwork > 1 ? "s" : ""})</span>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-vita-muted transition-transform duration-200 ${
              showList ? "rotate-180" : ""
            }`}
          />
        </button>

        {showList && (
          <div className="mt-2.5 space-y-2 animate-fadeIn">
            {/* Filtre onglets par niveau */}
            <div className="flex rounded-lg bg-vita-surface p-0.5 border border-vita-border text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setSelectedTab(1)}
                className={`flex-1 py-1 rounded transition-all ${
                  selectedTab === 1
                    ? "bg-white text-vita-deep shadow-sm"
                    : "text-vita-muted hover:text-vita-text"
                }`}
              >
                Niv. 1 ({level1Count})
              </button>
              <button
                type="button"
                onClick={() => setSelectedTab(2)}
                className={`flex-1 py-1 rounded transition-all ${
                  selectedTab === 2
                    ? "bg-white text-vita-deep shadow-sm"
                    : "text-vita-muted hover:text-vita-text"
                }`}
              >
                Niv. 2 ({level2Count})
              </button>
              <button
                type="button"
                onClick={() => setSelectedTab(3)}
                className={`flex-1 py-1 rounded transition-all ${
                  selectedTab === 3
                    ? "bg-white text-vita-deep shadow-sm"
                    : "text-vita-muted hover:text-vita-text"
                }`}
              >
                Niv. 3 ({level3Count})
              </button>
            </div>

            {/* Liste des filleuls */}
            {filteredReferrals.length === 0 ? (
              <div className="py-4 text-center text-[10px] text-vita-muted bg-vita-surface/40 rounded-lg">
                Aucun membre enregistré à ce niveau pour le moment.
              </div>
            ) : (
              <div className="divide-y divide-vita-border/60 bg-white rounded-lg border border-vita-border">
                {filteredReferrals.map((m) => (
                  <div
                    key={m.id}
                    className="p-2 flex items-center justify-between text-[11px]"
                  >
                    <div>
                      <span className="font-semibold text-vita-text block text-[11px]">
                        {m.name}
                      </span>
                      <span className="text-[9px] text-vita-muted">
                        Inscrit le {m.date}
                      </span>
                    </div>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        m.isActivated
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {m.isActivated ? "Actif (Payé)" : "Non activé"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
