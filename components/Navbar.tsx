"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  ShoppingBag,
  Wallet,
  PlusCircle,
  User,
  ShieldCheck,
  Menu,
  X,
  Home,
  LogOut,
  MoreHorizontal,
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
  Headphones,
  HelpCircle,
  MessageCircle,
  Mail,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { HelpModal } from "@/components/HelpModal";

interface NavbarProps {
  user?: {
    email?: string | null;
    isActivated?: boolean;
    role?: string;
  } | null;
}

export function Navbar({ user }: NavbarProps) {
  const rawPathname = usePathname();
  const pathname = rawPathname || "";

  // État du tiroir latéral gauche (Menu Hamburger)
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // État du menu déroulant droit (Trois petits points : Aide & Assistance)
  const [helpDropdownOpen, setHelpDropdownOpen] = useState(false);

  // État du modal complet d'Assistance / FAQ
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  const isActivationPage = pathname.startsWith("/activation");
  const isAuthPage = pathname.startsWith("/auth");

  // Définition de l'utilisateur actif (par défaut Koffi sur le dashboard)
  const activeUser = user || {
    email: "koffi@vitaearn.com",
    isActivated: false,
    role: "user",
  };

  const navLinks = [
    { label: "Accueil", href: "/", icon: Home },
    { label: "Marché", href: "/marche", icon: ShoppingBag },
    { label: "Vendre", href: "/vendre", icon: PlusCircle },
    { label: "Tâches", href: "/taches", icon: CalendarCheck },
    { label: "Portefeuille", href: "/portefeuille", icon: Wallet },
    { label: "Profil", href: "/profil", icon: User },
  ];

  if (activeUser.role === "admin") {
    navLinks.push({ label: "Admin", href: "/admin", icon: ShieldCheck });
  }

  const closeSidebar = () => setSidebarOpen(false);
  const closeHelpDropdown = () => setHelpDropdownOpen(false);

  const openFaqModal = () => {
    closeHelpDropdown();
    closeSidebar();
    setHelpModalOpen(true);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/98 backdrop-blur-md border-b border-gray-100 shadow-xs transition-all">
        <div className="max-w-5xl mx-auto px-4 h-16 sm:h-18 flex items-center justify-between">
          {/* ========================================================================= */}
          {/* 1. GAUCHE MOBILE : Bouton Hamburger (3 traits)                            */}
          {/* ========================================================================= */}
          <div className="flex md:hidden items-center">
            <button
              type="button"
              onClick={() => {
                setSidebarOpen(true);
                setHelpDropdownOpen(false);
              }}
              className="p-2 -ml-2 rounded-xl text-gray-800 hover:text-vita-deep hover:bg-vita-surface transition-colors focus:outline-none"
              aria-label="Ouvrir le menu de navigation"
            >
              <Menu className="w-6 h-6 text-gray-800" />
            </button>
          </div>

          {/* ========================================================================= */}
          {/* 2. CENTRE MOBILE / GAUCHE DESKTOP : Logo et Nom VITA EARN en grand       */}
          {/* ========================================================================= */}
          <div className="flex-1 md:flex-initial flex items-center justify-center md:justify-start">
            <Link
              href="/"
              onClick={() => {
                closeSidebar();
                closeHelpDropdown();
              }}
              className="flex items-center gap-2 group py-1"
            >
              <Image
                src="/images/logo-icon.png"
                alt="Vita Earn"
                width={56}
                height={40}
                className="h-8 sm:h-9 w-auto object-contain mix-blend-multiply transition-transform group-hover:scale-105 duration-200"
                priority
              />
              <Image
                src="/images/logo-text.png"
                alt="Vita Earn"
                width={170}
                height={20}
                className="h-5 sm:h-6 w-auto object-contain mix-blend-multiply"
                priority
              />
            </Link>
          </div>

          {/* ========================================================================= */}
          {/* 3. NAVIGATION DESKTOP                                                     */}
          {/* ========================================================================= */}
          {!isActivationPage && !isAuthPage && (
            <nav className="hidden md:flex items-center gap-4">
              {navLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-semibold transition-colors px-2.5 py-1.5 rounded-lg ${
                    pathname === item.href
                      ? "text-vita-deep font-bold bg-vita-surface/80"
                      : "text-vita-text hover:text-vita-deep hover:bg-gray-50"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}

          {/* ========================================================================= */}
          {/* 4. ACTIONS DESKTOP                                                        */}
          {/* ========================================================================= */}
          <div className="hidden md:flex items-center gap-3">
            {/* Bouton Aide & Support sur Desktop */}
            <button
              type="button"
              onClick={() => setHelpModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-vita-deep bg-vita-surface rounded-lg border border-vita-border hover:bg-white transition-colors"
            >
              <Headphones className="w-3.5 h-3.5 text-vita-medium" />
              <span>Aide</span>
            </button>

            {!activeUser.isActivated && !isActivationPage && (
              <Link
                href="/activation"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors shadow-xs"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Activer mon compte</span>
              </Link>
            )}

            {activeUser.role === "admin" && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-xs"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </Link>
            )}

            <Link
              href="/profil"
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-vita-deep bg-vita-surface rounded-lg border border-vita-border hover:bg-white transition-colors"
            >
              <User className="w-3.5 h-3.5 text-vita-medium" />
              <span className="truncate max-w-[130px]">{activeUser.email || "Mon compte"}</span>
            </Link>

            <Link
              href="/auth/logout"
              className="p-2 text-gray-500 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
              title="Se déconnecter"
            >
              <LogOut className="w-4 h-4" />
            </Link>
          </div>

          {/* ========================================================================= */}
          {/* 5. DROITE MOBILE : Trois petits points (...) pour l'Assistance & Aide    */}
          {/* ========================================================================= */}
          <div className="flex md:hidden items-center relative">
            <button
              type="button"
              onClick={() => {
                setHelpDropdownOpen(!helpDropdownOpen);
                setSidebarOpen(false);
              }}
              className="p-2 -mr-2 rounded-xl text-gray-800 hover:text-vita-deep hover:bg-vita-surface transition-colors focus:outline-none"
              aria-label="Assistance et aide"
            >
              <MoreHorizontal className="w-6 h-6 text-gray-800" />
            </button>

            {/* Menu Pop-up sous les 3 points : AIDE & SUPPORT */}
            {helpDropdownOpen && (
              <div className="absolute right-0 top-12 z-50 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 p-3.5 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-vita-deep" />
                    <span className="text-xs font-bold text-vita-deep uppercase tracking-wider">
                      Assistance & Aide
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={closeHelpDropdown}
                    className="p-1 rounded-md text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1.5">
                  {/* Option 1 : Assistance WhatsApp Directe */}
                  <a
                    href="https://wa.me/22890000000?text=Bonjour%20Support%20Vita%20Earn,%20j'ai%20besoin%20d'aide."
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={closeHelpDropdown}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <MessageCircle className="w-4 h-4 shrink-0" />
                      <div className="text-left">
                        <div className="text-xs font-bold">Assistance WhatsApp</div>
                        <div className="text-[10px] text-white/80">Support réactif 7j/7</div>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </a>

                  {/* Option 2 : Centre d'Aide & FAQ */}
                  <button
                    type="button"
                    onClick={openFaqModal}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl text-left bg-vita-surface hover:bg-vita-surface/80 text-vita-deep transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <HelpCircle className="w-4 h-4 text-vita-medium shrink-0" />
                      <div>
                        <div className="text-xs font-bold">Questions Fréquentes</div>
                        <div className="text-[10px] text-vita-muted">Activation, tâches, retraits</div>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-vita-muted" />
                  </button>

                  {/* Option 3 : Comment activer son compte */}
                  <Link
                    href="/activation"
                    onClick={closeHelpDropdown}
                    className="flex items-center justify-between p-2.5 rounded-xl text-left hover:bg-gray-50 text-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-gray-800">Guide d'activation</div>
                        <div className="text-[10px] text-gray-500">Paiement unique de 4 500 F</div>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                  </Link>

                  {/* Option 4 : Guide des retraits */}
                  <Link
                    href="/portefeuille"
                    onClick={closeHelpDropdown}
                    className="flex items-center justify-between p-2.5 rounded-xl text-left hover:bg-gray-50 text-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Wallet className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-gray-800">Retraits Mobile Money</div>
                        <div className="text-[10px] text-gray-500">Seuil min. 4 500 FCFA</div>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                  </Link>

                  {/* Option 5 : Email */}
                  <a
                    href="mailto:support@vitaearn.com"
                    onClick={closeHelpDropdown}
                    className="flex items-center justify-between p-2.5 rounded-xl text-left hover:bg-gray-50 text-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Mail className="w-4 h-4 text-gray-500 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-gray-800">Support Email</div>
                        <div className="text-[10px] text-gray-500">support@vitaearn.com</div>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* TIROIR LATÉRAL GAUCHE (Off-canvas Sidebar Navigation)                      */}
      {/* ========================================================================= */}
      {/* 1. Backdrop obscurci */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-300 md:hidden ${
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* 2. Tiroir coulissant depuis la gauche (ne couvre pas toute la page) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-[285px] sm:w-[320px] max-w-[82vw] h-full bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Menu principal de navigation"
      >
        {/* En-tête du tiroir avec logo et croix de fermeture */}
        <div className="p-4 border-b border-vita-border flex items-center justify-between bg-vita-surface/40">
          <Link href="/" onClick={closeSidebar} className="flex items-center gap-2">
            <Image
              src="/images/logo-icon.png"
              alt="Vita Earn"
              width={45}
              height={32}
              className="h-7 w-auto object-contain mix-blend-multiply"
            />
            <Image
              src="/images/logo-text.png"
              alt="Vita Earn"
              width={140}
              height={17}
              className="h-4 sm:h-5 w-auto object-contain mix-blend-multiply"
            />
          </Link>
          <button
            type="button"
            onClick={closeSidebar}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-200/60 transition-colors"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profil de l'utilisateur dans le tiroir */}
        <div className="p-4 bg-vita-surface/80 border-b border-vita-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-vita-deep text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
              {activeUser.email ? activeUser.email.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-vita-deep truncate">{activeUser.email}</p>
              <div className="flex items-center gap-1 mt-0.5">
                {activeUser.isActivated ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Compte activé
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                    <AlertCircle className="w-3 h-3 text-amber-600" />
                    Non activé
                  </span>
                )}
              </div>
            </div>
          </div>

          {!activeUser.isActivated && (
            <Link
              href="/activation"
              onClick={closeSidebar}
              className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Activer mon compte (4 500 F)</span>
            </Link>
          )}
        </div>

        {/* Liens de navigation dans le tiroir */}
        <div className="p-3 overflow-y-auto flex-1 space-y-1">
          <p className="text-[11px] font-bold text-vita-muted uppercase px-3 pt-1 pb-1">
            Navigation
          </p>
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-vita-surface text-vita-deep font-bold"
                    : "text-vita-text hover:bg-vita-surface/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${isActive ? "text-vita-deep" : "text-vita-medium"}`}
                  />
                  <span>{item.label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-vita-muted/60" />
              </Link>
            );
          })}

          <div className="pt-2 mt-2 border-t border-vita-border/60">
            <button
              type="button"
              onClick={openFaqModal}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-vita-text hover:bg-vita-surface/60 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Headphones className="w-4 h-4 text-vita-medium" />
                <span>Centre d'Aide & FAQ</span>
              </div>
              <ChevronRight className="w-4 h-4 text-vita-muted/60" />
            </button>
          </div>
        </div>

        {/* Pied du tiroir : Déconnexion */}
        <div className="p-3 border-t border-vita-border bg-gray-50/80">
          <Link
            href="/auth/logout"
            onClick={closeSidebar}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Se déconnecter</span>
          </Link>
        </div>
      </aside>

      {/* Modal complet Assistance & FAQ */}
      <HelpModal isOpen={helpModalOpen} onClose={() => setHelpModalOpen(false)} />
    </>
  );
}
