"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Users,
  Search,
  ArrowLeft,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { CountryFlag } from "@/components/CountryFlag";
import { formatFCFA } from "@/lib/utils";

export interface ReferralMember {
  id: string;
  username: string;
  fullName: string;
  phone: string;
  country: string;
  date: string;
  timeAgo: string;
  level: 1 | 2 | 3;
  amountPaid: number;
  commissionEarned: number;
  isActivated: boolean;
}

interface EquipeViewProps {
  referralCode: string;
  appUrl: string;
  level1Count: number;
  level2Count: number;
  level3Count: number;
  inactifsCount: number;
  level1Earned: number;
  level2Earned: number;
  level3Earned: number;
  initialTab?: string;
  referrals: ReferralMember[];
}

export function EquipeView({
  level1Count,
  level2Count,
  level3Count,
  inactifsCount,
  level1Earned,
  level2Earned,
  level3Earned,
  initialTab = "1",
  referrals = [],
}: EquipeViewProps) {
  const searchParams = useSearchParams();

  // Onglet actif déterminé par le paramètre d'URL ?level=1|2|3|inactifs
  const urlLevel = searchParams.get("level") || initialTab || "1";
  const activeTab = ["1", "2", "3", "inactifs"].includes(urlLevel) ? urlLevel : "1";

  const [searchQuery, setSearchQuery] = useState("");

  // Filtrage selon le niveau actif
  const currentTabMembers = useMemo(() => {
    if (activeTab === "inactifs") {
      return referrals.filter((r) => !r.isActivated);
    }
    const numLevel = Number(activeTab) as 1 | 2 | 3;
    return referrals.filter((r) => r.level === numLevel && r.isActivated);
  }, [activeTab, referrals]);

  const filteredMembers = useMemo(() => {
    const rawQuery = searchQuery.trim().toLowerCase();
    if (!rawQuery) return currentTabMembers;

    // Suppression de tous les caractères non numériques pour la recherche téléphonique flexible
    const digitsOnlyQuery = rawQuery.replace(/[\s\-\.\+\(\)]/g, "");

    return currentTabMembers.filter((m) => {
      // Correspondance sur le nom d'utilisateur, le nom complet ou le pays
      const textMatch =
        m.username.toLowerCase().includes(rawQuery) ||
        m.fullName.toLowerCase().includes(rawQuery) ||
        m.country.toLowerCase().includes(rawQuery);

      if (textMatch) return true;

      // Correspondance directe sur le champ téléphone brut
      if (m.phone.toLowerCase().includes(rawQuery)) return true;

      // Correspondance numérique flexible : compare les chiffres uniquement
      // Permet de trouver "90234512" même si saisi avec ou sans espaces, avec ou sans "+", avec ou sans indicatif pays
      if (digitsOnlyQuery.length >= 2) {
        const cleanMemberPhone = m.phone.replace(/[\s\-\.\+\(\)]/g, "");
        if (cleanMemberPhone.includes(digitsOnlyQuery)) return true;
      }

      return false;
    });
  }, [currentTabMembers, searchQuery]);

  // Configuration dynamique selon la section
  const tabConfig = useMemo(() => {
    switch (activeTab) {
      case "1":
        return {
          title: "Membres Actifs Niveau 1",
          subtitle: "Consultez vos filleuls directs et vos commissions de 2 000 FCFA",
          commissionRate: "2 000 FCFA",
          commissionLabel: "TOTAL DE 2 000 F",
          totalCount: level1Count,
          totalEarned: level1Earned,
          showCommission: true,
        };
      case "2":
        return {
          title: "Membres Actifs Niveau 2",
          subtitle: "Consultez vos filleuls de 2e génération et vos commissions de 1 000 FCFA",
          commissionRate: "1 000 FCFA",
          commissionLabel: "TOTAL DE 1 000 F",
          totalCount: level2Count,
          totalEarned: level2Earned,
          showCommission: true,
        };
      case "3":
        return {
          title: "Membres Actifs Niveau 3",
          subtitle: "Consultez vos filleuls de 3e génération et vos commissions de 500 FCFA",
          commissionRate: "500 FCFA",
          commissionLabel: "TOTAL DE 500 F",
          totalCount: level3Count,
          totalEarned: level3Earned,
          showCommission: true,
        };
      case "inactifs":
      default:
        return {
          title: "Membres Inactifs (En attente)",
          subtitle: "Utilisateurs inscrits avec votre lien mais n'ayant pas encore finalisé l'activation",
          commissionRate: "0 FCFA",
          commissionLabel: "",
          totalCount: inactifsCount,
          totalEarned: 0,
          showCommission: false,
        };
    }
  }, [activeTab, level1Count, level2Count, level3Count, inactifsCount, level1Earned, level2Earned, level3Earned]);

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6">
      {/* 1. EN-TÊTE DE NAVIGATION & RETOUR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="w-9 h-9 rounded-xl bg-white dark:bg-[#131E17] border border-gray-200 dark:border-[#1E2E24] text-gray-700 dark:text-gray-200 hover:text-vita-deep dark:hover:text-emerald-400 flex items-center justify-center transition-colors shadow-2xs"
            aria-label="Retour à l'accueil"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              {tabConfig.title}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              {tabConfig.subtitle}
            </p>
          </div>
        </div>

        {/* Badge Commission active pour les niveaux 1, 2, 3 */}
        {tabConfig.showCommission && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300 self-start sm:self-auto">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Commission par membre : {tabConfig.commissionRate}</span>
          </div>
        )}
      </div>

      {/* 2. CARTES STATISTIQUES EN HAUT */}
      {tabConfig.showCommission ? (
        /* Pages Niveau 1, 2, 3 : 2 cartes (TOTAL USERS + TOTAL DE [MONTANT]) */
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* TOTAL UTILISATEURS */}
          <div className="rounded-2xl bg-white dark:bg-[#131E17] border border-gray-100 dark:border-[#1E2E24] p-3.5 sm:p-5 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider">
                TOTAL USERS
              </p>
              <p className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white truncate">
                {tabConfig.totalCount}
              </p>
            </div>
          </div>

          {/* TOTAL DES COMMISSIONS (ex: TOTAL DE 2 000 F / TOTAL DE 1 000 F / TOTAL DE 500 F) */}
          <div className="rounded-2xl bg-white dark:bg-[#131E17] border border-gray-100 dark:border-[#1E2E24] p-3.5 sm:p-5 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider">
                {tabConfig.commissionLabel}
              </p>
              <p className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 truncate">
                {formatFCFA(tabConfig.totalEarned)}
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Page Inactifs : Uniquement TOTAL USERS */
        <div className="max-w-xs">
          <div className="rounded-2xl bg-white dark:bg-[#131E17] border border-gray-100 dark:border-[#1E2E24] p-3.5 sm:p-5 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider">
                TOTAL USERS
              </p>
              <p className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white truncate">
                {tabConfig.totalCount}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. SECTION "RECENT REFERRALS" AVEC BARRE DE RECHERCHE */}
      <div className="bg-white dark:bg-[#131E17] rounded-3xl border border-gray-100 dark:border-[#1E2E24] shadow-xs overflow-hidden">
        {/* En-tête de la section et barre de recherche */}
        <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-[#1E2E24] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
              Recent Referrals ({filteredMembers.length})
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search username or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs font-medium bg-gray-50 dark:bg-[#0E1812] text-gray-900 dark:text-gray-100 rounded-xl pl-9 pr-3.5 py-2.5 border border-gray-200 dark:border-[#1E2E24] focus:outline-hidden focus:border-[#16A34A]"
              />
            </div>
            <button
              type="button"
              className="px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-colors shadow-2xs shrink-0"
            >
              Search
            </button>
          </div>
        </div>

        {/* 4. TABLEAU / LISTE DES FILLEULS */}
        {filteredMembers.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
              Aucun membre trouvé dans cette section.
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 max-w-sm mx-auto">
              {activeTab === "inactifs"
                ? "Tous vos filleuls ont activé leur compte avec succès !"
                : "Invitez de nouveaux membres avec votre lien pour commencer à percevoir vos commissions."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-[#0E1812] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider text-[10px] border-b border-gray-100 dark:border-[#1E2E24]">
                <tr>
                  <th className="py-3 px-4">DATE / TIME</th>
                  <th className="py-3 px-4">COUNTRY</th>
                  <th className="py-3 px-4">PHONE</th>
                  <th className="py-3 px-4">USERNAME</th>
                  <th className="py-3 px-4">COMMISSION</th>
                  <th className="py-3 px-4 text-right">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#1E2E24]">
                {filteredMembers.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-gray-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* DATE / TIME */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <p className="font-bold text-gray-800 dark:text-gray-200">
                        {member.date}
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">
                        {member.timeAgo}
                      </p>
                    </td>

                    {/* COUNTRY */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <CountryFlag country={member.country} className="w-5 h-3.5" />
                        <span className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide text-[11px]">
                          {member.country}
                        </span>
                      </div>
                    </td>

                    {/* PHONE */}
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-gray-600 dark:text-gray-400 font-semibold">
                      {member.phone}
                    </td>

                    {/* USERNAME / NAME */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                          {member.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {member.username}
                        </span>
                      </div>
                    </td>

                    {/* COMMISSION RESPECTIVE */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {member.isActivated ? (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          +{formatFCFA(member.commissionEarned)}
                        </span>
                      ) : (
                        <span className="font-medium text-gray-400 dark:text-gray-500">
                          0 FCFA
                        </span>
                      )}
                    </td>

                    {/* STATUS (Actif en vert / Inactif en orange) */}
                    <td className="py-3 px-4 whitespace-nowrap text-right">
                      {member.isActivated ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Actif</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          <span>Inactif</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
