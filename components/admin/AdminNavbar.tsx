"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { lockAdminSessionAction } from "@/app/admin/actions";
import { AdminNotificationBell } from "./AdminNotificationBell";
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  CreditCard,
  ArrowDownToLine,
  Zap,
  CalendarCheck,
  GraduationCap,
  ShoppingBag,
  Briefcase,
  Smartphone,
  Settings,
  ShieldCheck,
  Lock,
  ChevronRight,
  Globe,
  ExternalLink,
  Video,
} from "lucide-react";

interface AdminNavbarProps {
  userEmail: string;
  isSuperAdmin: boolean;
  pendingWithdrawalsCount?: number;
  pendingProductsCount?: number;
}

export function AdminNavbar({
  userEmail,
  isSuperAdmin,
  pendingWithdrawalsCount = 0,
  pendingProductsCount = 0,
}: AdminNavbarProps) {
  const pathname = usePathname() || "";
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleLock = () => {
    startTransition(async () => {
      await lockAdminSessionAction();
    });
  };

  // Liste ordonnée exacte selon les exigences de l'administrateur (sans aucun petit texte en dessous)
  const navItems = [
    {
      label: "Tableau de bord",
      href: "/admin",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      label: "Utilisateurs",
      href: "/admin/utilisateurs",
      icon: Users,
      badge: null,
    },
    {
      label: "Retraits",
      href: "/admin/retraits",
      icon: CreditCard,
      badge: pendingWithdrawalsCount > 0 ? pendingWithdrawalsCount : null,
      badgeColor: "bg-amber-500 text-white animate-pulse",
    },
    {
      label: "Dépôt mobile money",
      href: "/admin/depots",
      icon: ArrowDownToLine,
      badge: null,
    },
    {
      label: "Paiement automatique",
      href: "/admin/paiements-auto",
      icon: Zap,
      badge: null,
    },
    {
      label: "Paiement alternatif",
      href: "/admin/paiement-alternatif",
      icon: ExternalLink,
      badge: null,
    },
    {
      label: "Gestion des tâches",
      href: "/admin/taches",
      icon: CalendarCheck,
      badge: null,
    },
    {
      label: "Formation Vita Earn",
      href: "/admin/formations",
      icon: GraduationCap,
      badge: null,
    },
    {
      label: "Marketplace",
      href: "/admin/produits",
      icon: ShoppingBag,
      badge: pendingProductsCount > 0 ? pendingProductsCount : null,
      badgeColor: "bg-[#0084FF] text-white",
    },
    {
      label: "KYC Vendeurs",
      href: "/admin/kyc",
      icon: ShieldCheck,
      badge: null,
    },
    {
      label: "Emploi",
      href: "/admin/emploi",
      icon: Briefcase,
      badge: null,
    },
    {
      label: "Conférences Live",
      href: "/admin/live",
      icon: Video,
      badge: null,
    },
    {
      label: "Application Vita L",
      href: "/admin/applications",
      icon: Smartphone,
      badge: null,
    },
    {
      label: "Réglages plateforme",
      href: "/admin/reglages",
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <>
      {/* Barre supérieure du Command Center Administrateur */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl p-3 sm:p-4 shadow-sm text-slate-900">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Bouton Menu 3 traits (☰) + Nom du Command Center */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="p-2 sm:p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border border-slate-200 cursor-pointer shrink-0 shadow-xs active:scale-95"
              aria-label="Ouvrir le menu d'administration"
              title="Menu du panneau d'administration"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-[#0084FF]" />
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-[#0084FF] to-sky-400 flex items-center justify-center text-white shrink-0 shadow-sm">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-xs sm:text-sm font-black text-slate-900 tracking-wide uppercase truncate">
                    Command Center
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-[#0084FF] border border-blue-200 shrink-0">
                    {isSuperAdmin ? "Super Admin" : "Délégué"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 truncate">
                  <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    En direct
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="truncate hidden xs:inline">{userEmail}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions rapides à droite : CLOCHE DE NOTIFICATION + RETOUR SUR LE SITE + VERROUILLER */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Cloche de notifications centralisée en temps réel */}
            <AdminNotificationBell />

            {/* Bouton retour sur le site */}
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-md transition-all border border-emerald-400/40 cursor-pointer active:scale-95 group"
              title="Retourner sur le site public pour voir vos comptes et activités"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-100 group-hover:rotate-12 transition-transform" />
              <span className="font-black tracking-tight">Retour sur le site</span>
            </Link>

            {/* Bouton Verrouiller l'accès */}
            <button
              type="button"
              onClick={handleLock}
              disabled={isPending}
              className="px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer active:scale-95"
              title="Verrouiller instantanément le panneau d'administration"
            >
              <Lock className="w-3.5 h-3.5 text-red-500" />
              <span className="hidden md:inline">{isPending ? "Verrouillage..." : "Verrouiller"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* TIROIR LATÉRAL GAUCHE DU COMMAND CENTER (FOND BLANC, LOGOS BLEUS, TEXTES NOIRS) */}
      {/* ========================================================================= */}
      {/* 1. Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ${
          drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* 2. Volet latéral coulissant (Fond BLANC, Textes NOIRS, Logos BLEUS) */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 sm:w-84 max-w-[85vw] bg-white text-slate-900 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-200 ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Navigation Command Center"
      >
        {/* En-tête du tiroir avec Logo & Titre (Fond blanc) */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0084FF] shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-[#0084FF]">
                Portail Exécutif
              </div>
              <div className="text-sm font-black text-slate-900">
                Command Center
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profil administrateur actif (Fond clair) */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200/80">
          <div className="flex items-center gap-2.5">
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-xl bg-[#0084FF] text-white font-black text-sm flex items-center justify-center shadow-xs">
                E
              </div>
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-white"></span>
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 truncate">
                {userEmail}
              </p>
              <span className="inline-block mt-0.5 text-[10px] font-black uppercase tracking-wider text-[#0084FF] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                {isSuperAdmin ? "Super Administrateur" : "Délégué"}
              </span>
            </div>
          </div>
        </div>

        {/* Liste des sections de menu : FOND BLANC, ÉCRITURES NOIRES, LOGOS BLEUS, AUCUN PETIT TEXTE */}
        <div className="p-3 overflow-y-auto flex-1 space-y-1 bg-white">
          <p className="text-[10px] font-black text-slate-400 uppercase px-3 pt-1 pb-1 tracking-wider">
            Menu Administrateur
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setDrawerOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition-all group ${
                  isActive
                    ? "bg-blue-50 text-[#0084FF] border border-blue-200/80 shadow-xs"
                    : "text-slate-900 hover:bg-slate-50 hover:text-black border border-transparent hover:border-slate-100"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                      isActive
                        ? "bg-[#0084FF] text-white border-[#0084FF]"
                        : "bg-blue-50/70 text-[#0084FF] border-blue-100 group-hover:bg-[#0084FF] group-hover:text-white group-hover:border-[#0084FF] transition-colors"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`truncate font-black text-xs ${isActive ? "text-[#0084FF]" : "text-slate-900"}`}>
                    {item.label}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {item.badge !== null && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        item.badgeColor || "bg-amber-500 text-white"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight
                    className={`w-3.5 h-3.5 ${
                      isActive ? "text-[#0084FF]" : "text-slate-300 group-hover:text-slate-500"
                    }`}
                  />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Pied du tiroir : FOND BLANC / GRIS TRÈS CLAIR, RETOUR SUR LE SITE & VERROUILLAGE */}
        <div className="p-3 border-t border-slate-200/80 bg-slate-50 space-y-2">
          {/* Bouton étendu retour sur le site */}
          <Link
            href="/"
            onClick={() => setDrawerOpen(false)}
            className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-sm transition-all border border-emerald-400/30"
          >
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span>Retour sur le site</span>
            </div>
            <span className="text-[10px] opacity-90">Mes comptes →</span>
          </Link>

          <button
            type="button"
            onClick={handleLock}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-colors cursor-pointer border border-red-200"
          >
            <Lock className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <span>{isPending ? "Verrouillage..." : "Verrouiller le Sas Admin"}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
