"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Users,
  Copy,
  Check,
  Share2,
  Search,
  ArrowLeft,
  Award,
  Clock,
  Phone,
  ShieldCheck,
  TrendingUp,
  CreditCard,
  UserCheck,
  UserX,
  ChevronRight,
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
  referralCode,
  appUrl,
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
  const router = useRouter();
  const searchParams = useSearchParams();

  // Onglet actif : "1" | "2" | "3" | "inactifs"
  const urlLevel = searchParams.get("level") || initialTab;
  const validTab = ["1", "2", "3", "inactifs"].includes(urlLevel) ? urlLevel : "1";
  const [activeTab, setActiveTab] = useState<string>(validTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (urlLevel && ["1", "2", "3", "inactifs"].includes(urlLevel)) {
      setActiveTab(urlLevel);
    }
  }, [urlLevel]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    router.replace(`/equipe?level=${tab}`, { scroll: false });
  };

  const referralLink = `${appUrl}/auth/register?ref=${referralCode || "VE"}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleShare = async () => {
    const shareText = `Rejoins mon réseau sur Vita Earn et commence à générer des revenus Mobile Money : ${referralLink}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Rejoins mon réseau Vita Earn",
          text: shareText,
          url: referralLink,
        });
      } catch {}
    } else {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(shareText)}`,
        "_blank"
      );
    }
  };

  // Filtrage selon l'onglet actif et la recherche
  const currentTabMembers = useMemo(() => {
    if (activeTab === "inactifs") {
      return referrals.filter((r) => !r.isActivated);
    }
    const numLevel = Number(activeTab) as 1 | 2 | 3;
    return referrals.filter((r) => r.level === numLevel && r.isActivated);
  }, [activeTab, referrals]);

  const filteredMembers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return currentTabMembers;
    return currentTabMembers.filter(
      (m) =>
        m.username.toLowerCase().includes(query) ||
        m.fullName.toLowerCase().includes(query) ||
        m.phone.toLowerCase().includes(query) ||
        m.country.toLowerCase().includes(query)
    );
  }, [currentTabMembers, searchQuery]);

  // Métriques de l'onglet actif
  const tabConfig = useMemo(() => {
    switch (activeTab) {
      case "1":
        return {
          title: "Membres Actifs Niveau 1",
          subtitle: "Consultez vos filleuls directs et vos commissions de 2 000 FCFA",
          commissionRate: "2 000 FCFA",
          totalCount: level1Count,
          totalAmount: level1Count * 4500,
          totalEarned: level1Earned,
          badgeColor: "bg-emerald-500",
        };
      case "2":
        return {
          title: "Membres Actifs Niveau 2",
          subtitle: "Consultez vos filleuls de 2e génération et vos commissions de 1 000 FCFA",
          commissionRate: "1 000 FCFA",
          totalCount: level2Count,
          totalAmount: level2Count * 4500,
          totalEarned: level2Earned,
          badgeColor: "bg-sky-500",
        };
      case "3":
        return {
          title: "Membres Actifs Niveau 3",
          subtitle: "Consultez vos filleuls de 3e génération et vos commissions de 500 FCFA",
          commissionRate: "500 FCFA",
          totalCount: level3Count,
          totalAmount: level3Count * 4500,
          totalEarned: level3Earned,
          badgeColor: "bg-amber-500",
        };
      case "inactifs":
      default:
        return {
          title: "Membres Inactifs (En attente)",
          subtitle: "Utilisateurs inscrits avec votre lien mais n'ayant pas encore finalisé l'activation",
          commissionRate: "0 FCFA",
          totalCount: inactifsCount,
          totalAmount: inactifsCount * 4500,
          totalEarned: 0,
          badgeColor: "bg-gray-400",
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

        {/* Badge Commission active */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300 self-start sm:self-auto">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Commission par membre : {tabConfig.commissionRate}</span>
        </div>
      </div>

      {/* 2. LIEN D'INVITATION RAPIDE (BOÎTE PREMIUM) */}
      <div className="rounded-2xl bg-gradient-to-r from-[#1B4D0F] via-[#2F7A1A] to-[#1B4D0F] text-white p-3.5 sm:p-4 shadow-md space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-white text-[11px] sm:text-xs flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-300" />
            <span>Votre lien d&apos;invitation officiel :</span>
          </span>
          <span className="text-[10px] font-black text-amber-300 bg-black/40 px-2 py-0.5 rounded-lg border border-amber-300/30">
            Code : {referralCode || "VE"}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="flex-1 text-xs font-mono font-bold bg-white text-gray-900 rounded-xl px-3.5 py-2 border-2 border-transparent select-all focus:outline-hidden"
          />
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] active:scale-95 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Copié !</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copier</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] active:scale-95 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. CARTES STATISTIQUES EN HAUT (TOTAL USERS & TOTAL AMOUNT) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
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

        {/* MONTANT TOTAL (TOTAL AMOUNT) */}
        <div className="rounded-2xl bg-white dark:bg-[#131E17] border border-gray-100 dark:border-[#1E2E24] p-3.5 sm:p-5 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider">
              TOTAL AMOUNT
            </p>
            <p className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white truncate">
              XOF {tabConfig.totalAmount.toLocaleString("fr-FR")}
            </p>
          </div>
        </div>

        {/* GAINS COMMISSIONS ENCAISSÉS */}
        <div className="col-span-2 sm:col-span-1 rounded-2xl bg-white dark:bg-[#131E17] border border-gray-100 dark:border-[#1E2E24] p-3.5 sm:p-5 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider">
              {activeTab === "inactifs" ? "POTENTIEL EN ATTENTE" : "COMMISSIONS CUMULÉES"}
            </p>
            <p className="text-lg sm:text-2xl font-black text-amber-600 dark:text-amber-400 truncate">
              {activeTab === "inactifs"
                ? `${formatFCFA(inactifsCount * 2000)}`
                : `${formatFCFA(tabConfig.totalEarned)}`}
            </p>
          </div>
        </div>
      </div>

      {/* 4. SÉLECTEUR D'ONGLETS HORIZONTAL (Niveau 1, 2, 3, Inactifs) */}
      <div className="flex overflow-x-auto gap-2 p-1 bg-gray-100 dark:bg-[#0E1812] rounded-2xl border border-gray-200 dark:border-[#1E2E24] no-scrollbar">
        <button
          type="button"
          onClick={() => handleTabChange("1")}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === "1"
              ? "bg-[#16A34A] text-white shadow-sm"
              : "text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-slate-800"
          }`}
        >
          <span>Niveau 1</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === "1"
                ? "bg-white text-emerald-800"
                : "bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200"
            }`}
          >
            {level1Count}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("2")}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === "2"
              ? "bg-[#16A34A] text-white shadow-sm"
              : "text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-slate-800"
          }`}
        >
          <span>Niveau 2</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === "2"
                ? "bg-white text-emerald-800"
                : "bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200"
            }`}
          >
            {level2Count}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("3")}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === "3"
              ? "bg-[#16A34A] text-white shadow-sm"
              : "text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-slate-800"
          }`}
        >
          <span>Niveau 3</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === "3"
                ? "bg-white text-emerald-800"
                : "bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200"
            }`}
          >
            {level3Count}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("inactifs")}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === "inactifs"
              ? "bg-amber-600 text-white shadow-sm"
              : "text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-slate-800"
          }`}
        >
          <span>Inactifs</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === "inactifs"
                ? "bg-white text-amber-900"
                : "bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200"
            }`}
          >
            {inactifsCount}
          </span>
        </button>
      </div>

      {/* 5. SECTION "RECENT REFERRALS" AVEC BARRE DE RECHERCHE */}
      <div className="bg-white dark:bg-[#131E17] rounded-3xl border border-gray-100 dark:border-[#1E2E24] shadow-xs overflow-hidden">
        {/* En-tête de la section et barre de recherche */}
        <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-[#1E2E24] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
              Recent Referrals ({filteredMembers.length})
            </h2>
            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
              Frais d&apos;inscription : 4 500 FCFA
            </span>
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

        {/* 6. TABLEAU / LISTE DES FILLEULS */}
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
                  <th className="py-3 px-4">INSCRIPTION</th>
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

                    {/* INSCRIPTION (4500 FCFA & GAIN) */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <p className="font-bold text-gray-800 dark:text-gray-200">
                        4 500 FCFA
                      </p>
                      <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        {member.isActivated
                          ? `+${formatFCFA(member.commissionEarned)}`
                          : "En attente"}
                      </p>
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
