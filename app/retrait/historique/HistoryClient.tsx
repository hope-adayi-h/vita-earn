"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatFCFA } from "@/lib/utils";
import type { WithdrawalRecord } from "../actions";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  History,
  PlusCircle,
  Smartphone,
  ShieldCheck,
  Search,
  Calendar,
  Zap,
  ArrowDownLeft,
} from "lucide-react";

interface HistoryClientProps {
  initialHistory: WithdrawalRecord[];
  totalWithdrawn: number;
}

function formatDateTime(dateStr?: string) {
  if (!dateStr) return "À l'instant";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export function HistoryClient({ initialHistory, totalWithdrawn }: HistoryClientProps) {
  const router = useRouter();
  const [isPendingTransition, startTransition] = useTransition();
  const [filter, setFilter] = useState<"all" | "completed" | "processing">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [localHistory, setLocalHistory] = useState<WithdrawalRecord[]>(initialHistory);

  const filtered = localHistory.filter((item) => {
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
              <span>Historique &amp; Traçabilité</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Historique des Retraits
            </h1>
            <p className="text-xs text-emerald-100 mt-0.5">
              Suivi en temps réel de vos demandes et confirmation des virements Mobile Money.
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
          <span>Nombre total d&apos;opérations : <strong>{localHistory.length}</strong></span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>Paiements sécurisés (10 min à 24h)</span>
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
            Tous ({localHistory.length})
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
            En attente ({localHistory.filter((i) => i.status !== "completed").length})
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
            Validés ({localHistory.filter((i) => i.status === "completed").length})
          </button>
        </div>

        {/* Barre de recherche par référence ou opérateur */}
        <div className="relative flex-1 sm:max-w-xs">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par réf., tél. ou opérateur..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-200 dark:border-[#1E2E24] bg-white dark:bg-[#131E17] text-xs text-gray-800 dark:text-gray-200 focus:outline-hidden focus:border-[#16A34A]"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* 3. LISTE DES RETRAITS AVEC DÉTAILS COMPLETS & NOTIFICATIONS */}
      <div className="space-y-3.5">
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
          filtered.map((item) => {
            const fee = item.fee ?? 500;
            const netAmount = item.netAmount ?? Math.max(0, item.amount - fee);
            const isCompleted = item.status === "completed";
            const delay = item.estimatedDelay || "10 minutes à 24 heures";

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-[#131E17] rounded-3xl border border-gray-200 dark:border-[#1E2E24] p-4 sm:p-5 shadow-sm space-y-4 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
              >
                {/* A. EN-TÊTE : Opérateur + Référence + Statut Badge */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 dark:border-[#1E2E24] pb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isCompleted
                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                          : "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-gray-900 dark:text-gray-100">
                          {item.paymentMethod}
                        </span>
                        <span className="text-[10px] font-mono text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-bold">
                          {item.reference}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-500">
                        Bénéficiaire : <strong className="text-gray-800 dark:text-gray-200">{item.phoneNumber}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Badge de statut */}
                  <div>
                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 dark:bg-emerald-950/70 dark:text-emerald-300 px-3 py-1 rounded-full border border-emerald-300 dark:border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Validé &amp; Payé</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100 dark:bg-amber-950/70 dark:text-amber-300 px-3 py-1 rounded-full border border-amber-300 dark:border-amber-800">
                        <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                        <span>En attente de traitement</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* B. GRILLE DES DÉTAILS FINANCIERS : Brut, Frais, Net direct */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-gray-50 dark:bg-[#17241C] border border-gray-100 dark:border-[#1E2E24] text-center">
                  <div className="p-1.5">
                    <span className="block text-[10px] text-gray-500 font-medium">Montant demandé</span>
                    <span className="text-xs sm:text-sm font-black text-gray-900 dark:text-gray-100">
                      {formatFCFA(item.amount)}
                    </span>
                  </div>

                  <div className="p-1.5 border-x border-gray-200 dark:border-[#223528]">
                    <span className="block text-[10px] text-gray-500 font-medium">Frais déduits</span>
                    <span className="text-xs sm:text-sm font-black text-rose-600 dark:text-rose-400">
                      - {formatFCFA(fee)}
                    </span>
                  </div>

                  <div className="p-1.5 bg-emerald-100/60 dark:bg-emerald-900/30 rounded-xl">
                    <span className="block text-[10px] text-emerald-800 dark:text-emerald-300 font-bold uppercase tracking-tight">
                      Net à recevoir
                    </span>
                    <span className="text-xs sm:text-sm font-black text-[#16A34A] dark:text-emerald-400">
                      {formatFCFA(netAmount)}
                    </span>
                  </div>
                </div>

                {/* C. INFORMATIONS D'HORODATAGE & DÉLAI */}
                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-300 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-gray-500 text-[11px]">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Demandé le :</span>
                    </span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200 text-[11px]">
                      {formatDateTime(item.createdAt)}
                    </span>
                  </div>

                  {!isCompleted && (
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-gray-500 text-[11px]">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Délai estimé :</span>
                      </span>
                      <span className="font-bold text-amber-700 dark:text-amber-400 text-[11px]">
                        {delay}
                      </span>
                    </div>
                  )}

                  {isCompleted && item.processedAt && (
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-gray-500 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Validé et payé le :</span>
                      </span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 text-[11px]">
                        {formatDateTime(item.processedAt)}
                      </span>
                    </div>
                  )}
                </div>

                {/* D. ENCADRÉ DE NOTIFICATION OFFICIELLE PROFESSIONNELLE */}
                {isCompleted ? (
                  <div className="rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-3.5 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Notification : Paiement validé et viré avec succès</span>
                    </div>
                    <p className="text-[11px] text-emerald-900/90 dark:text-emerald-200/90 leading-relaxed">
                      Votre virement net de <strong>{formatFCFA(netAmount)}</strong> a été <strong>bel et bien validé</strong> et déposé sur votre numéro <strong>{item.phoneNumber}</strong> ({item.paymentMethod}) le <strong>{formatDateTime(item.processedAt || item.createdAt)}</strong>. Transaction vérifiée et archivée sous la référence <code>{item.reference}</code>.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-3.5 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-300 font-bold">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
                        <span>Notification : Retrait en cours de traitement</span>
                      </div>
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-200/60 dark:bg-amber-900/60 px-2 py-0.5 rounded-full">
                        Délai : 10 min à 24h
                      </span>
                    </div>

                    <p className="text-[11px] text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
                      Votre demande de retrait de <strong>{formatFCFA(item.amount)}</strong> a été enregistrée à <strong>{formatDateTime(item.createdAt)}</strong>. Frais fixes : <strong>{formatFCFA(fee)}</strong>. Vous allez recevoir la somme nette de <strong>{formatFCFA(netAmount)}</strong> directement sur votre numéro <strong>{item.phoneNumber}</strong> ({item.paymentMethod}) dans un délai de <strong>10 minutes à 24 heures</strong>.
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
