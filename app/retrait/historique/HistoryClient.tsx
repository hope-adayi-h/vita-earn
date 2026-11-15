"use client";

import { useState } from "react";
import Link from "next/link";
import { formatFCFA } from "@/lib/utils";
import type { WithdrawalRecord } from "../actions";
import {
  ArrowLeft,
  Wallet,
  Clock,
  CheckCircle2,
  AlertCircle,
  History,
  ArrowUpRight,
  PlusCircle,
  Smartphone,
  ShieldCheck,
  Search,
} from "lucide-react";

interface HistoryClientProps {
  initialHistory: WithdrawalRecord[];
  totalWithdrawn: number;
}

export function HistoryClient({ initialHistory, totalWithdrawn }: HistoryClientProps) {
  const [filter, setFilter] = useState<"all" | "completed" | "processing">("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = initialHistory.filter((item) => {
    if (filter === "completed" && item.status !== "completed") return false;
    if (filter === "processing" && item.status !== "processing" && item.status !== "pending") return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        item.reference.toLowerCase().includes(term) ||
        item.paymentMethod.toLowerCase().includes(term) ||
        item.phoneNumber.toLowerCase().includes(term)
      );
    }
    return true;
  });

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-12">
      {/* 1. EN-TÊTE AVEC BOUTON RETOUR & STATISTIQUES */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/retrait"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-vita-deep dark:text-emerald-400 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Faire un nouveau retrait</span>
        </Link>

        <Link
          href="/"
          className="text-xs font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
        >
          Tableau de Bord
        </Link>
      </div>

      {/* CARTE STATISTIQUES DES RETRAITS */}
      <div className="rounded-3xl bg-gradient-to-br from-[#16A34A] to-[#15803D] p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white backdrop-blur mb-1">
              <History className="w-3.5 h-3.5" />
              <span>Historique Global</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Historique des Retraits
            </h1>
            <p className="text-xs text-emerald-100 mt-0.5">
              Traçabilité complète de l&apos;ensemble de vos virements Mobile Money.
            </p>
          </div>

          <div className="text-right bg-black/20 backdrop-blur px-3 py-2 rounded-2xl border border-white/20">
            <span className="block text-[9px] uppercase font-bold text-emerald-200">Total Retiré</span>
            <span className="text-lg sm:text-xl font-black text-white">
              {formatFCFA(totalWithdrawn)}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs text-emerald-100">
          <span>Nombre total d&apos;opérations : <strong>{initialHistory.length}</strong></span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>Paiements vérifiés</span>
          </span>
        </div>
      </div>

      {/* 2. BARRE D'OUTILS : RECHERCHE & FILTRES */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Filtres de statut */}
        <div className="flex rounded-xl bg-gray-100 dark:bg-[#17241C] p-1 border border-gray-200 dark:border-[#1E2E24]">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === "all"
                ? "bg-[#16A34A] text-white shadow-xs"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
            }`}
          >
            Tous ({initialHistory.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("completed")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === "completed"
                ? "bg-[#16A34A] text-white shadow-xs"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
            }`}
          >
            Validés
          </button>
          <button
            type="button"
            onClick={() => setFilter("processing")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === "processing"
                ? "bg-[#16A34A] text-white shadow-xs"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
            }`}
          >
            En cours
          </button>
        </div>

        {/* Barre de recherche par référence ou opérateur */}
        <div className="relative flex-1 sm:max-w-xs">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par réf. ou opérateur..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-200 dark:border-[#1E2E24] bg-white dark:bg-[#131E17] text-xs text-gray-800 dark:text-gray-200 focus:outline-hidden focus:border-[#16A34A]"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* 3. LISTE DES RETRAITS */}
      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-[#131E17] rounded-3xl border border-gray-200 dark:border-[#1E2E24] p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-400 flex items-center justify-center mx-auto">
              <History className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-sm text-gray-800 dark:text-gray-200">
                Aucun retrait trouvé
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Vous n&apos;avez pas encore effectué de retrait correspondant à ces critères.
              </p>
            </div>
            <Link
              href="/retrait"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Effectuer mon premier retrait</span>
            </Link>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-[#131E17] rounded-2xl border border-gray-200 dark:border-[#1E2E24] p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-emerald-300 dark:hover:border-emerald-600 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    item.status === "completed"
                      ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                      : "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
                  }`}
                >
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-900 dark:text-gray-100">
                      {item.paymentMethod}
                    </span>
                    <span className="text-[10px] font-mono text-gray-500 bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      {item.reference}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Vers : <strong className="text-gray-700 dark:text-gray-300">{item.phoneNumber}</strong>
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {new Date(item.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-[#1E2E24]">
                <span className="text-base font-black text-gray-900 dark:text-gray-100">
                  {formatFCFA(item.amount)}
                </span>
                <div className="mt-0.5">
                  {item.status === "completed" ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Validé &amp; Payé
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                      <Clock className="w-3 h-3 text-amber-600" />
                      En cours de transfert
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
