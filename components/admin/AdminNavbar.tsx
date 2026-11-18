"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { lockAdminSessionAction } from "@/app/admin/actions";
import {
  Menu,
  X,
  LayoutDashboard,
  CreditCard,
  Users,
  ShoppingBag,
  History,
  GitBranch,
  CalendarCheck,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Lock,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
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

  const navItems = [
    {
      label: "Tableau de bord & Stats",
      sublabel: "Vue globale & KPIs",
      href: "/admin",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      label: "Validation des Retraits",
      sublabel: "Mobile Money (T-Money, Flooz)",
      href: "/admin/retraits",
      icon: CreditCard,
      badge: pendingWithdrawalsCount > 0 ? pendingWithdrawalsCount : null,
      badgeColor: "bg-amber-500 text-white animate-pulse",
    },
    {
      label: "Utilisateurs & KYC",
      sublabel: "Comptes & rôles administrateurs",
      href: "/admin/utilisateurs",
      icon: Users,
      badge: null,
    },
    {
      label: "Modération des Produits",
      sublabel: "Marketplace & catalogues vendeurs",
      href: "/admin/produits",
      icon: ShoppingBag,
      badge: pendingProductsCount > 0 ? pendingProductsCount : null,
      badgeColor: "bg-blue-500 text-white",
    },
    {
      label: "Grand Livre Financier",
      sublabel: "Écritures comptables immuables",
      href: "/admin/transactions",
      icon: History,
      badge: null,
    },
    {
      label: "Arbre d'Affiliation",
      sublabel: "Structure 3 niveaux & anti-fraude",
      href: "/admin/arbre",
      icon: GitBranch,
      badge: null,
    },
    {
      label: "Gestion des Tâches",
      sublabel: "Time Table & quiz rémunérés",
      href: "/admin/taches",
      icon: CalendarCheck,
      badge: null,
    },
    {
      label: "Réglages Plateforme",
      sublabel: "Tarifs, commissions & support",
      href: "/admin/reglages",
      icon: Settings,
      badge: null,
    },
    {
      label: "Journal d'Audit & Sécurité",
      sublabel: "Traçabilité des actions sensibles",
      href: "/admin/journal",
      icon: ShieldAlert,
      badge: null,
    },
  ];

  return (
    <>
      {/* Barre de navigation supérieure de l'administration */}
      <div className="bg-white dark:bg-[#131E17] border border-gray-100 dark:border-[#1E2E24] rounded-3xl p-3 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Bouton Menu 3 traits (☰) + Nom du module */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="p-2 sm:p-2.5 rounded-2xl bg-gray-50 dark:bg-[#1A2820] hover:bg-emerald-50 dark:hover:bg-[#203328] text-gray-800 dark:text-gray-100 hover:text-emerald-700 transition-all border border-gray-200 dark:border-[#1E2E24] cursor-pointer shrink-0 shadow-xs active:scale-95"
              aria-label="Ouvrir le menu d'administration"
              title="Menu d'administration"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-800 dark:text-emerald-400" />
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-[#14500C] to-[#2F7A1A] flex items-center justify-center text-white shrink-0 shadow-sm shadow-emerald-950/20">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-xs sm:text-sm font-black text-gray-900 dark:text-white tracking-tight truncate">
                    Console Admin
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                    {isSuperAdmin ? "Super Admin" : "Délégué"}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate hidden xs:block">
                  {userEmail} • Session sécurisée
                </p>
              </div>
            </div>
          </div>

          {/* Actions rapides à droite */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Raccourci vers l'espace membre */}
            <Link
              href="/"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#1A2820] hover:bg-gray-100 dark:hover:bg-[#23362a] text-gray-700 dark:text-gray-300 text-xs font-bold border border-gray-200 dark:border-[#1E2E24] transition-colors"
              title="Basculer vers l'espace membre"
            >
              <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
              <span>Espace Membre</span>
            </Link>

            {/* Bouton Verrouiller */}
            <button
              type="button"
              onClick={handleLock}
              disabled={isPending}
              className="px-3 sm:px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/50 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer active:scale-95"
              title="Verrouiller instantanément le panneau d'administration"
            >
              <Lock className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
              <span className="hidden sm:inline">{isPending ? "Verrouillage..." : "Verrouiller"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TIROIR LATÉRAL GAUCHE DE L'ADMINISTRATION (3 TRAITS ☰)                     */}
      {/* ========================================================================= */}
      {/* 1. Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ${
          drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* 2. Volet latéral coulissant */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 sm:w-84 max-w-[85vw] bg-white dark:bg-[#131E17] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out border-r border-gray-100 dark:border-[#1E2E24] ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Navigation administration"
      >
        {/* En-tête du tiroir avec Logo & Titre */}
        <div className="p-4 border-b border-gray-100 dark:border-[#1E2E24] flex items-center justify-between bg-gray-50/50 dark:bg-[#0E1812]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#14500C] to-[#2F7A1A] flex items-center justify-center text-white shrink-0 shadow-sm shadow-emerald-950/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                Vita Earn
              </div>
              <div className="text-sm font-black text-gray-900 dark:text-white">
                Administration
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="p-1.5 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profil administrateur actif */}
        <div className="p-3.5 bg-emerald-50/50 dark:bg-[#0E1812] border-b border-gray-100 dark:border-[#1E2E24]">
          <div className="flex items-center gap-2.5">
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white font-black text-sm flex items-center justify-center">
                E
              </div>
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#16A34A] border-2 border-white dark:border-[#131E17]"></span>
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                  {userEmail}
                </p>
              </div>
              <span className="inline-block mt-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                {isSuperAdmin ? "Super Administrateur" : "Administrateur Délégué"}
              </span>
            </div>
          </div>
        </div>

        {/* Liste des 9 Modules de la console */}
        <div className="p-3 overflow-y-auto flex-1 space-y-1">
          <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase px-3 pt-1 pb-1">
            Modules d&apos;Administration
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
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-900/20"
                    : "text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-[#1A2820] hover:text-emerald-800 dark:hover:text-emerald-300"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-gray-100 dark:bg-[#1E2E24] text-emerald-700 dark:text-emerald-400 group-hover:bg-emerald-100/50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 text-left">
                    <div className="truncate font-black">{item.label}</div>
                    <div
                      className={`text-[10px] font-medium truncate ${
                        isActive ? "text-emerald-100" : "text-gray-400 dark:text-gray-500"
                      }`}
                    >
                      {item.sublabel}
                    </div>
                  </div>
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
                      isActive ? "text-white" : "text-gray-300 group-hover:text-emerald-600"
                    }`}
                  />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Pied du tiroir : Retour membre & Verrouillage */}
        <div className="p-3 border-t border-gray-100 dark:border-[#1E2E24] bg-gray-50/70 dark:bg-[#0E1812] space-y-1.5">
          <Link
            href="/"
            onClick={() => setDrawerOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1A2820] text-xs font-bold transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Retour à l&apos;Espace Membre</span>
          </Link>

          <button
            type="button"
            onClick={handleLock}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs font-bold transition-colors cursor-pointer border border-red-200 dark:border-red-900/40"
          >
            <Lock className="w-3.5 h-3.5 text-red-600 shrink-0" />
            <span>{isPending ? "Verrouillage..." : "Verrouiller le Sas Admin"}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
