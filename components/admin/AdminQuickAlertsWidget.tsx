"use client";

import Link from "next/link";
import {
  BellRing,
  CreditCard,
  ShieldCheck,
  Video,
  ShoppingBag,
  ArrowDownToLine,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react";
import type { AdminNotificationSummary } from "@/lib/data/admin-notifications-types";

interface AdminQuickAlertsWidgetProps {
  summary: AdminNotificationSummary;
}

export function AdminQuickAlertsWidget({ summary }: AdminQuickAlertsWidgetProps) {
  const {
    totalCount,
    withdrawalsCount,
    kycCount,
    liveCount,
    productsCount,
    depositsCount,
    items,
  } = summary;

  if (totalCount === 0) {
    return (
      <div className="p-4 bg-emerald-50/80 rounded-3xl border border-emerald-200/80 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-emerald-950 block">
              Toutes les demandes sont traitées
            </span>
            <span className="text-emerald-700 text-[11px]">
              Aucun retrait, KYC, live ou produit en attente. Le système fonctionne en temps réel.
            </span>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-emerald-200/60 text-emerald-900 text-[10px] font-black uppercase tracking-wider shrink-0">
          Système à jour
        </span>
      </div>
    );
  }

  // Si des demandes sont en attente : affichage dynamique non saturant
  const recentItems = items.slice(0, 3);

  return (
    <div className="bg-gradient-to-br from-amber-50/90 via-white to-orange-50/40 rounded-3xl p-5 shadow-xs border-2 border-amber-300/80 space-y-4 text-slate-900">
      {/* En-tête de l'alerte */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-amber-200/60">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                Demandes Prioritaires en Attente
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[11px] font-black shadow-xs">
                {totalCount} action{totalCount > 1 ? "s" : ""}
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Des utilisateurs attendent votre validation dans les différentes sections.
            </p>
          </div>
        </div>

        {/* Pilules de raccourcis cliquables */}
        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
          {withdrawalsCount > 0 && (
            <Link
              href="/admin/retraits"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>{withdrawalsCount} Retrait{withdrawalsCount > 1 ? "s" : ""}</span>
            </Link>
          )}

          {kycCount > 0 && (
            <Link
              href="/admin/kyc"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{kycCount} KYC</span>
            </Link>
          )}

          {liveCount > 0 && (
            <Link
              href="/admin/live"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Video className="w-3.5 h-3.5" />
              <span>{liveCount} Live{liveCount > 1 ? "s" : ""}</span>
            </Link>
          )}

          {productsCount > 0 && (
            <Link
              href="/admin/produits"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{productsCount} Produit{productsCount > 1 ? "s" : ""}</span>
            </Link>
          )}

          {depositsCount > 0 && (
            <Link
              href="/admin/depots"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              <span>{depositsCount} Dépôt{depositsCount > 1 ? "s" : ""}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Aperçu des 3 demandes les plus récentes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
        {recentItems.map((item) => (
          <div
            key={item.id}
            className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2.5 hover:border-slate-300 transition-colors"
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                  {item.type}
                </span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  Récemment
                </span>
              </div>
              <h3 className="text-xs font-bold text-slate-900 line-clamp-1">
                {item.title}
              </h3>
              <p className="text-[11px] text-slate-600 line-clamp-1">
                {item.subtitle}
              </p>
            </div>

            <Link
              href={item.href}
              className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-[#0084FF] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <span>{item.actionLabel}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
