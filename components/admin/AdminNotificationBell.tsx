"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import {
  Bell,
  BellRing,
  CreditCard,
  ShieldCheck,
  Video,
  ShoppingBag,
  ArrowDownToLine,
  ExternalLink,
  RefreshCw,
  X,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import type {
  AdminNotificationItem,
  AdminNotificationSummary,
  AdminNotificationType,
} from "@/lib/data/admin-notifications-types";
import { getAdminNotificationsAction } from "@/app/admin/actions";

interface AdminNotificationBellProps {
  initialSummary?: AdminNotificationSummary;
}

export function AdminNotificationBell({ initialSummary }: AdminNotificationBellProps) {
  const [summary, setSummary] = useState<AdminNotificationSummary>(
    initialSummary || {
      totalCount: 0,
      withdrawalsCount: 0,
      kycCount: 0,
      liveCount: 0,
      productsCount: 0,
      depositsCount: 0,
      items: [],
      lastCheckedAt: new Date().toISOString(),
    }
  );

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | AdminNotificationType>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    setIsRefreshing(true);
    try {
      const res = await getAdminNotificationsAction();
      if (res.ok && res.summary) {
        setSummary(res.summary);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Rafraîchissement automatique toutes les 20 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      startTransition(() => {
        fetchNotifications();
      });
    }, 20000);

    const handleFocus = () => {
      fetchNotifications();
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // Fermeture au clic extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const filteredItems = summary.items.filter((item) => {
    if (filter === "all") return true;
    return item.type === filter;
  });

  const formatRelativeTime = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const minutes = Math.floor(diffMs / 60000);
      if (minutes < 1) return "À l'instant";
      if (minutes < 60) return `Il y a ${minutes} min`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `Il y a ${hours} h`;
      return new Date(dateStr).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Récemment";
    }
  };

  const getCategoryIcon = (type: AdminNotificationType) => {
    switch (type) {
      case "withdrawal":
        return <CreditCard className="w-4 h-4 text-amber-600" />;
      case "kyc":
        return <ShieldCheck className="w-4 h-4 text-blue-600" />;
      case "live":
        return <Video className="w-4 h-4 text-red-600" />;
      case "product":
        return <ShoppingBag className="w-4 h-4 text-purple-600" />;
      case "deposit":
        return <ArrowDownToLine className="w-4 h-4 text-emerald-600" />;
    }
  };

  const getCategoryBadgeClass = (type: AdminNotificationType) => {
    switch (type) {
      case "withdrawal":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "kyc":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "live":
        return "bg-red-100 text-red-800 border-red-200";
      case "product":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "deposit":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* BOUTON CLOCHE DE NOTIFICATION ANIMÉE */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border border-slate-200 cursor-pointer shrink-0 shadow-xs active:scale-95 flex items-center justify-center"
        aria-label="Ouvrir les notifications administratives"
        title="Voir les demandes et alertes en direct"
      >
        {summary.totalCount > 0 ? (
          <BellRing className="w-5 h-5 text-amber-600 animate-[bounce_1.5s_infinite]" />
        ) : (
          <Bell className="w-5 h-5 text-slate-600" />
        )}

        {/* Badge animé en haut à droite avec le compteur */}
        {summary.totalCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] px-1 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-5 min-w-[20px] px-1 bg-red-600 text-white text-[10px] font-black items-center justify-center border-2 border-white shadow-xs">
              {summary.totalCount > 99 ? "99+" : summary.totalCount}
            </span>
          </span>
        )}
      </button>

      {/* VOLET DÉROULANT / POP-UP DES NOTIFICATIONS (Style Command Center) */}
      {isOpen && (
        <div className="fixed sm:absolute top-16 right-2 sm:right-0 sm:top-12 z-50 w-[95vw] sm:w-[420px] max-w-[440px] bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-900">
          {/* Header du panneau */}
          <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-amber-400">
                <BellRing className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold tracking-tight">
                  Demandes & Notifications
                </h3>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>En temps réel • {summary.totalCount} en attente</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={fetchNotifications}
                disabled={isRefreshing}
                className="p-1.5 rounded-xl hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Actualiser les demandes"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Onglets de filtrage rapide */}
          <div className="flex items-center gap-1.5 p-2 bg-slate-50 border-b border-slate-100 overflow-x-auto text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                filter === "all"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200"
              }`}
            >
              Toutes ({summary.totalCount})
            </button>

            {summary.withdrawalsCount > 0 && (
              <button
                type="button"
                onClick={() => setFilter("withdrawal")}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  filter === "withdrawal"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200"
                }`}
              >
                <CreditCard className="w-3 h-3" />
                <span>Retraits ({summary.withdrawalsCount})</span>
              </button>
            )}

            {summary.kycCount > 0 && (
              <button
                type="button"
                onClick={() => setFilter("kyc")}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  filter === "kyc"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200"
                }`}
              >
                <ShieldCheck className="w-3 h-3" />
                <span>KYC ({summary.kycCount})</span>
              </button>
            )}

            {summary.liveCount > 0 && (
              <button
                type="button"
                onClick={() => setFilter("live")}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  filter === "live"
                    ? "bg-red-600 text-white shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200"
                }`}
              >
                <Video className="w-3 h-3" />
                <span>Lives ({summary.liveCount})</span>
              </button>
            )}

            {summary.productsCount > 0 && (
              <button
                type="button"
                onClick={() => setFilter("product")}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  filter === "product"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200"
                }`}
              >
                <ShoppingBag className="w-3 h-3" />
                <span>Produits ({summary.productsCount})</span>
              </button>
            )}

            {summary.depositsCount > 0 && (
              <button
                type="button"
                onClick={() => setFilter("deposit")}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  filter === "deposit"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200"
                }`}
              >
                <ArrowDownToLine className="w-3 h-3" />
                <span>Dépôts ({summary.depositsCount})</span>
              </button>
            )}
          </div>

          {/* Liste des notifications défilante */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
            {filteredItems.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <div className="w-10 h-10 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-800">
                  Aucune demande en attente
                </p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  Toutes les opérations d&apos;administration sont à jour. Les nouvelles demandes des utilisateurs s&apos;afficheront ici automatiquement.
                </p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl hover:bg-slate-50 transition-colors flex items-start gap-3 group"
                >
                  <div className="p-2 rounded-xl bg-slate-100 shrink-0 mt-0.5">
                    {getCategoryIcon(item.type)}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900 leading-snug">
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 truncate font-medium">
                      {item.subtitle}
                    </p>

                    {item.detail && (
                      <p className="text-[10px] text-slate-500 bg-white p-1.5 rounded-lg border border-slate-100">
                        {item.detail}
                      </p>
                    )}

                    <div className="pt-1.5 flex items-center justify-between">
                      <span
                        className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${getCategoryBadgeClass(
                          item.type
                        )}`}
                      >
                        {item.type}
                      </span>

                      <Link
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-900 hover:bg-[#0084FF] text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                      >
                        <span>{item.actionLabel}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pied du panneau avec lien vers le tableau de bord */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-500">
              Système de surveillance Vita Earn
            </span>
            <Link
              href="/admin"
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-bold text-[#0084FF] hover:underline"
            >
              Tableau de bord
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
