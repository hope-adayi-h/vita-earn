"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatFCFA } from "@/lib/utils";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import type { StoredDeposit } from "@/lib/data/deposits-store";
import {
  ArrowDownToLine,
  ArrowLeft,
  CheckCircle2,
  Clock,
  CreditCard,
  Search,
  Smartphone,
  AlertCircle,
  Copy,
  Check,
  User,
  ShieldCheck,
  XCircle,
  RefreshCw,
} from "lucide-react";

interface DepotsClientProps {
  initialDeposits: StoredDeposit[];
  userEmail?: string;
  isSuperAdmin?: boolean;
}

export function DepotsClient({ initialDeposits, userEmail, isSuperAdmin }: DepotsClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "succeeded" | "pending" | "failed">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtrage
  const filteredDeposits = useMemo(() => {
    return initialDeposits.filter((dep) => {
      // Filtre de statut
      if (statusFilter === "succeeded" && dep.status !== "succeeded") return false;
      if (statusFilter === "pending" && dep.status !== "pending") return false;
      if (statusFilter === "failed" && !["failed", "cancelled"].includes(dep.status)) return false;

      // Filtre de recherche
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        dep.username.toLowerCase().includes(term) ||
        dep.fullName.toLowerCase().includes(term) ||
        dep.email.toLowerCase().includes(term) ||
        dep.phone.toLowerCase().includes(term) ||
        dep.operator.toLowerCase().includes(term) ||
        dep.id.toLowerCase().includes(term) ||
        (dep.providerRef && dep.providerRef.toLowerCase().includes(term))
      );
    });
  }, [initialDeposits, searchTerm, statusFilter]);

  // KPIs calculés en direct
  const kpis = useMemo(() => {
    const succeededDeposits = initialDeposits.filter((d) => d.status === "succeeded");
    const totalAmount = succeededDeposits.reduce((acc, d) => acc + d.amount, 0);
    const countValid = succeededDeposits.length;
    const countPending = initialDeposits.filter((d) => d.status === "pending").length;

    // Réseaux actifs distincts
    const uniqueOperators = Array.from(new Set(initialDeposits.map((d) => d.operator))).filter(Boolean);

    return {
      totalAmount,
      countValid,
      countPending,
      operators: uniqueOperators.length > 0 ? uniqueOperators : ["T-Money (Togocel)", "Moov Flooz (Togo)"],
    };
  }, [initialDeposits]);

  const getStatusBadge = (dep: StoredDeposit) => {
    if (dep.status === "succeeded") {
      const isAutoSasPay = dep.confirmationSource?.toLowerCase().includes("saspay");
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>{isAutoSasPay ? "Paiement automatique confirmé par SasPay" : dep.confirmationSource || "Confirmé par SasPay"}</span>
        </span>
      );
    }
    if (dep.status === "pending") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0 animate-pulse" />
          <span>En attente de paiement (SasPay)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
        <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
        <span>Paiement refusé / Échoué</span>
      </span>
    );
  };

  const getOperatorBadge = (operator: string) => {
    let colorClass = "bg-blue-50 text-[#0084FF] border-blue-200";
    if (operator.includes("Togocel") || operator.includes("T-Money")) {
      colorClass = "bg-[#E0F2FE] text-[#0284C7] border-sky-300";
    } else if (operator.includes("Moov") || operator.includes("Flooz")) {
      colorClass = "bg-orange-50 text-orange-700 border-orange-200";
    } else if (operator.includes("Wave")) {
      colorClass = "bg-cyan-50 text-cyan-700 border-cyan-200";
    } else if (operator.includes("MTN")) {
      colorClass = "bg-amber-50 text-amber-800 border-amber-300";
    } else if (operator.includes("Orange")) {
      colorClass = "bg-orange-50 text-orange-600 border-orange-300";
    } else if (operator.includes("Carte")) {
      colorClass = "bg-purple-50 text-purple-700 border-purple-200";
    }

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border ${colorClass}`}>
        <Smartphone className="w-3 h-3 shrink-0" />
        <span>{operator}</span>
      </span>
    );
  };

  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <AdminNavbar userEmail={userEmail || "admin@vitaearn.com"} isSuperAdmin={Boolean(isSuperAdmin)} />

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link href="/admin" className="hover:text-[#0084FF] flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Tableau de bord</span>
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-bold">Dépôts Mobile Money</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Dépôts Mobile Money
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Suivi automatique des encaissements d&apos;abonnements et recharges gérés par SasPay.
          </p>
        </div>
      </div>

      {/* Cartes KPI Dépôts (100% Dynamiques & Réels) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
        {/* KPI 1 : Total Dépôts Encaissés */}
        <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0084FF] border border-blue-100 flex items-center justify-center mb-3">
            <ArrowDownToLine className="w-5 h-5" />
          </div>
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Dépôt Total en Caisse
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {formatFCFA(kpis.totalAmount)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
            Somme des dépôts validés
          </div>
        </div>

        {/* KPI 2 : Nombre de Dépôts Validés */}
        <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Dépôts Validés
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {kpis.countValid}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
            Transactions complétées
          </div>
        </div>

        {/* KPI 3 : En Attente */}
        <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center mb-3">
            <Clock className="w-5 h-5" />
          </div>
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            En Attente de Règlement
          </div>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {kpis.countPending}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
            Sessions SasPay en cours
          </div>
        </div>

        {/* KPI 4 : Réseaux Actifs */}
        <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0084FF] border border-blue-100 flex items-center justify-center mb-3">
            <CreditCard className="w-5 h-5" />
          </div>
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Réseaux Actifs
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {kpis.operators.map((op) => (
              <span
                key={op}
                className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[11px] font-bold"
              >
                {op.split(" ")[0]}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Barre de recherche et filtres de statut */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Recherche */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par nom d'utilisateur, téléphone, opérateur, référence..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:border-[#0084FF] focus:bg-white transition-all"
            />
          </div>

          {/* Filtres de statut */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                statusFilter === "all"
                  ? "bg-[#0084FF] text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Tous ({initialDeposits.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("succeeded")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                statusFilter === "succeeded"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Validés ({initialDeposits.filter((d) => d.status === "succeeded").length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("pending")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                statusFilter === "pending"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              En attente ({initialDeposits.filter((d) => d.status === "pending").length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("failed")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                statusFilter === "failed"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Échoués ({initialDeposits.filter((d) => ["failed", "cancelled"].includes(d.status)).length})
            </button>
          </div>
        </div>

        {/* Tableau desktop / Cartes mobile */}
        {filteredDeposits.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs sm:text-sm">
            Aucun dépôt ne correspond à votre recherche.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold">
                  <th className="pb-3.5 pl-2">Utilisateur</th>
                  <th className="pb-3.5">Numéro & Opérateur</th>
                  <th className="pb-3.5">Montant Encaissé</th>
                  <th className="pb-3.5">Statut & Confirmation</th>
                  <th className="pb-3.5">Date & Heure</th>
                  <th className="pb-3.5 pr-2 text-right">Réf. SasPay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDeposits.map((dep) => (
                  <tr key={dep.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* 1. Utilisateur */}
                    <td className="py-4 pl-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center font-black text-xs shrink-0">
                          {(dep.username || dep.fullName).slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-black text-slate-900 flex items-center gap-1.5">
                            <span>@{dep.username}</span>
                            {dep.fullName && dep.fullName !== dep.username && (
                              <span className="text-slate-500 font-medium text-xs">
                                ({dep.fullName})
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                            {dep.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 2. Numéro & Opérateur */}
                    <td className="py-4">
                      <div className="space-y-1">
                        <div className="font-mono font-bold text-slate-900 text-xs">
                          {dep.phone}
                        </div>
                        <div>{getOperatorBadge(dep.operator)}</div>
                      </div>
                    </td>

                    {/* 3. Montant */}
                    <td className="py-4">
                      <div>
                        <div className="font-black text-slate-900 text-base">
                          {formatFCFA(dep.amount)}
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {dep.purpose}
                        </div>
                      </div>
                    </td>

                    {/* 4. Statut & Confirmation (Demandé expressément par l'utilisateur) */}
                    <td className="py-4">
                      <div className="space-y-1">
                        <div>{getStatusBadge(dep)}</div>
                        {dep.confirmedAt && (
                          <div className="text-[10px] text-emerald-700 font-semibold pl-1">
                            Validé le {formatDateTime(dep.confirmedAt)}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 5. Date & Heure */}
                    <td className="py-4">
                      <div className="text-xs text-slate-600 font-medium">
                        {formatDateTime(dep.createdAt)}
                      </div>
                    </td>

                    {/* 6. Référence SasPay */}
                    <td className="py-4 pr-2 text-right">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(dep.providerRef || dep.id, dep.id)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 font-mono text-[11px] font-bold border border-slate-200 transition-colors cursor-pointer"
                        title="Copier la référence de transaction"
                      >
                        <span>#{(dep.providerRef || dep.id).slice(0, 10)}</span>
                        {copiedId === dep.id ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-400" />
                        )}
                      </button>
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
