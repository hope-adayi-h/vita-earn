"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";
import {
  Menu,
  X,
  Home,
  ShoppingBag,
  Wallet,
  User,
  ShieldCheck,
  CalendarCheck,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Headphones,
  HelpCircle,
  MessageCircle,
  Mail,
  ExternalLink,
  ChevronRight,
  MessageSquare,
  Users,
  Gift,
  Disc,
  Briefcase,
  Sparkles,
  GraduationCap,
  Moon,
  Sun,
  Globe,
  Camera,
  Check,
  History,
  ChevronDown,
  Video,
  PlaySquare,
  MousePointerClick,
  LayoutDashboard,
  CreditCard,
  GitBranch,
  Settings,
  ShieldAlert,
  Lock,
} from "lucide-react";
import { PlatformLogo } from "./PlatformLogo";
import { HelpModal } from "@/components/HelpModal";
import { CommunityModal } from "@/components/CommunityModal";
import { FaqModal } from "@/components/FaqModal";
import { SupportModal } from "@/components/SupportModal";

interface NavbarProps {
  user?: {
    email?: string | null;
    name?: string | null;
    isActivated?: boolean;
    role?: string;
  } | null;
}

export function Navbar({ user }: NavbarProps) {
  const rawPathname = usePathname();
  const pathname = rawPathname || "";

  const { language, setLanguage, theme, toggleTheme, avatar, setAvatar, t } = useApp();

  // États des menus et modales
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [withdrawalMenuOpen, setWithdrawalMenuOpen] = useState(false);
  const [desktopWithdrawalOpen, setDesktopWithdrawalOpen] = useState(false);
  const [teamMenuOpen, setTeamMenuOpen] = useState(false);
  const [desktopTeamOpen, setDesktopTeamOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(pathname.startsWith("/admin"));
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [faqModalOpen, setFaqModalOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [communityModalOpen, setCommunityModalOpen] = useState(false);

  // Sous-options d'Administration
  const adminSubOptions = [
    { label: "Tableau de bord & Stats", href: "/admin", icon: LayoutDashboard },
    { label: "Validation des Retraits", href: "/admin/retraits", icon: CreditCard },
    { label: "Utilisateurs & KYC", href: "/admin/utilisateurs", icon: Users },
    { label: "Modération Produits", href: "/admin/produits", icon: ShoppingBag },
    { label: "Grand Livre Financier", href: "/admin/transactions", icon: History },
    { label: "Arbre d'Affiliation", href: "/admin/arbre", icon: GitBranch },
    { label: "Gestion des Tâches", href: "/admin/taches", icon: CalendarCheck },
    { label: "Réglages Plateforme", href: "/admin/reglages", icon: Settings },
    { label: "Journal d'Audit", href: "/admin/journal", icon: ShieldAlert },
    { label: "Verrouiller le Sas", href: "/admin/lock", icon: Lock },
  ];

  // Sous-options du Centre de Retrait
  const withdrawalSubOptions = [
    {
      id: "solde",
      label: "Retrait Solde",
      href: "/retrait?type=solde",
      platform: "solde",
      icon: Wallet,
      color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60",
    },
    {
      id: "tiktok",
      label: "Retrait TikTok",
      href: "/retrait?type=tiktok",
      platform: "tiktok",
      icon: Video,
      color: "text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/60",
    },
    {
      id: "youtube",
      label: "Retrait YouTube",
      href: "/retrait?type=youtube",
      platform: "youtube",
      icon: PlaySquare,
      color: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60",
    },
    {
      id: "ads",
      label: "Retrait AdSense",
      href: "/retrait?type=ads",
      platform: "adsense",
      icon: MousePointerClick,
      color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60",
    },
    {
      id: "instagram",
      label: "Retrait Instagram",
      href: "/retrait?type=instagram",
      platform: "instagram",
      icon: Camera,
      color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60",
    },
    {
      id: "historique",
      label: "Historique",
      href: "/retrait/historique",
      platform: null,
      icon: History,
      color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60",
    },
  ];

  // Sous-options de Mon Équipe (Niveau 1, 2, 3, Inactifs)
  const teamSubOptions = [
    {
      id: "level-1",
      label: "Niveau 1",
      href: "/equipe?level=1",
    },
    {
      id: "level-2",
      label: "Niveau 2",
      href: "/equipe?level=2",
    },
    {
      id: "level-3",
      label: "Niveau 3",
      href: "/equipe?level=3",
    },
    {
      id: "inactifs",
      label: "Inactifs",
      href: "/equipe?level=inactifs",
    },
  ];

  const isActivationPage = pathname.startsWith("/activation");
  const isAuthPage = pathname.startsWith("/auth");

  // RÈGLE : Masquer intégralement le header sur les pages d'auth, d'activation/paiement, ou tant que le compte n'est pas activé
  if (isAuthPage || isActivationPage || !user?.isActivated) {
    return null;
  }

  // Définition de l'utilisateur actif
  const isLoggedIn = Boolean(user);
  const userDisplayName = user?.name || (user?.email ? user.email.split("@")[0] : "");
  const userInitial = userDisplayName ? userDisplayName.charAt(0).toUpperCase() : "U";
  const isActivated = Boolean(user?.isActivated);

  // Gestion du téléversement de la photo de profil
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Liens pour la barre supérieure Desktop
  const navLinks = [
    { label: t("nav.home"), href: "/", icon: Home },
    { label: t("nav.market"), href: "/marche", icon: ShoppingBag },
    { label: t("nav.tasks"), href: "/taches", icon: CalendarCheck },
    { label: t("nav.withdrawal"), href: "/retrait", icon: Wallet },
    { label: t("nav.team"), href: "/equipe", icon: Users },
    { label: t("nav.profile"), href: "/profil", icon: User },
  ];

  const isAdminUser = user?.role === "admin" || user?.email === "adayiespoir60@gmail.com";

  if (isAdminUser) {
    navLinks.push({ label: t("nav.admin") || "Administration", href: "/admin", icon: ShieldCheck });
  }

  // Liens officiels du tiroir de navigation mobile (12 sections unifiées + Admin si éligible)
  const drawerNavLinks = [
    { label: t("nav.home"), href: "/", icon: Home },
    ...(isAdminUser
      ? [{ label: "Administration", href: "/admin", icon: ShieldCheck, isAdmin: true }]
      : []),
    { label: t("nav.community"), href: "/communaute", icon: MessageSquare, isCommunity: true },
    { label: t("nav.withdrawal"), href: "/retrait", icon: Wallet },
    { label: t("nav.team"), href: "/equipe", icon: Users },
    { label: t("nav.welcomeBonus"), href: "/recompense-demarrage", icon: Gift },
    { label: t("nav.wheel"), href: "/roue", icon: Disc },
    { label: t("nav.tasks"), href: "/taches", icon: CalendarCheck },
    { label: t("nav.market"), href: "/marche", icon: ShoppingBag },
    { label: t("nav.jobs"), href: "/emploi", icon: Briefcase },
    { label: t("nav.premium"), href: "/applications-premium", icon: Sparkles },
    { label: t("nav.training"), href: "/formations", icon: GraduationCap },
    { label: t("nav.profile"), href: "/profil", icon: User },
  ];

  const closeSidebar = () => setSidebarOpen(false);
  const closeDropdowns = () => {
    setProfileDropdownOpen(false);
    setDesktopWithdrawalOpen(false);
    setDesktopTeamOpen(false);
  };

  const openFaqModal = () => {
    closeDropdowns();
    closeSidebar();
    setHelpModalOpen(true);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#131E17]/95 backdrop-blur-md border-b border-gray-100 dark:border-[#1E2E24] shadow-xs transition-colors">
        <div className="max-w-5xl mx-auto px-2 sm:px-4 h-15 sm:h-16 flex items-center justify-between">
          {/* ========================================================================= */}
          {/* 1. ZONE GAUCHE : Bouton Menu ☰ (inchangé)                                 */}
          {/* ========================================================================= */}
          <div className="flex items-center shrink-0 w-20 sm:w-24 justify-start">
            <button
              type="button"
              onClick={() => {
                setSidebarOpen(true);
                closeDropdowns();
              }}
              className="p-1.5 -ml-1 rounded-xl text-gray-800 dark:text-gray-100 hover:text-vita-deep hover:bg-vita-surface dark:hover:bg-slate-800 transition-colors focus:outline-hidden cursor-pointer"
              aria-label="Ouvrir le menu de navigation"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800 dark:text-gray-100" />
            </button>
          </div>

          {/* ========================================================================= */}
          {/* 2. ZONE CENTRE : Logo "V" + Nom "VITA EARN" (proportions équilibrées)     */}
          {/* ========================================================================= */}
          <div className="flex-1 flex items-center justify-center min-w-0 px-1">
            <Link
              href="/"
              onClick={() => {
                closeSidebar();
                closeDropdowns();
              }}
              className="flex items-center gap-1.5 sm:gap-2 group py-1 shrink-0"
            >
              <Image
                src="/images/logo-icon.png"
                alt="Vita Earn"
                width={38}
                height={32}
                className="h-7 sm:h-8 w-auto object-contain transition-transform group-hover:scale-105 duration-200 shrink-0"
                priority
              />
              <Image
                src="/images/logo-text.png"
                alt="Vita Earn"
                width={110}
                height={18}
                className="h-4 sm:h-[18px] w-auto object-contain dark:brightness-200 shrink-0"
                priority
              />
            </Link>
          </div>

          {/* ========================================================================= */}
          {/* 3. ZONE DROITE : Bouton thème (lune/soleil) + Avatar avec point vert en ligne */}
          {/* ========================================================================= */}
          <div className="flex items-center justify-end shrink-0 w-20 sm:w-24 gap-1.5 sm:gap-2.5 relative">
            {/* Bouton Mode Sombre / Clair (Lune / Soleil) */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 sm:p-2 rounded-xl text-gray-700 dark:text-gray-200 hover:text-vita-deep hover:bg-vita-surface dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
              title={theme === "dark" ? t("top.light") : t("top.dark")}
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-90 duration-200" />
              ) : (
                <Moon className="w-4 h-4 text-gray-700 dark:text-gray-200 hover:text-emerald-600 transition-colors" />
              )}
            </button>

            {/* Avatar de profil (petite tête avec point vert en ligne en haut) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setProfileDropdownOpen(!profileDropdownOpen);
                  setSidebarOpen(false);
                }}
                className="relative rounded-full focus:outline-hidden p-0.5 border border-transparent hover:border-emerald-400 transition-colors block cursor-pointer"
                aria-label="Profil et options"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatar}
                  alt={userDisplayName || "Avatar"}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-emerald-500/40 shadow-xs"
                />
                {/* Point vert en haut montrant le statut en ligne */}
                <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5 sm:h-3 sm:w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-[#16A34A] border-2 border-white dark:border-[#131E17]"></span>
                </span>
              </button>

              {/* Menu Pop-up sous l'avatar */}
              {profileDropdownOpen && (
                <>
                  {/* Backdrop invisible pour fermer au clic extérieur */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={closeDropdowns}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 top-11 z-50 w-72 sm:w-80 bg-white dark:bg-[#131E17] rounded-2xl shadow-2xl border border-gray-100 dark:border-[#1E2E24] p-3.5 animate-in fade-in zoom-in-95 duration-150">
                    {/* Profil & Statut */}
                    <div className="pb-3 mb-3 border-b border-gray-100 dark:border-[#1E2E24]">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={avatar}
                            alt={userDisplayName || "Avatar"}
                            className="w-11 h-11 rounded-full object-cover border border-gray-200 dark:border-gray-700 shadow-xs"
                          />
                          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#16A34A] border-2 border-white dark:border-[#131E17]"></span>
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                            {userDisplayName || t("prof.myAccount")}
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                            {user?.email || "membre@vitaearn.com"}
                          </p>
                          <div className="mt-1">
                            {isActivated ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                {t("nav.accountActive")}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                                <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                {t("nav.accountInactive")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Option de changement de photo de profil */}
                      <div className="mt-2.5">
                        <label className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gray-50 dark:bg-[#17241C] hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-gray-700 dark:text-gray-300 hover:text-emerald-800 dark:hover:text-emerald-300 text-xs font-semibold border border-gray-200 dark:border-[#1E2E24] cursor-pointer transition-colors">
                          <Camera className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                          <span>{t("prof.changeAvatar")}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarUpload}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Actions & Raccourcis */}
                    <div className="space-y-1">
                      {/* Mon Profil */}
                      <Link
                        href="/profil"
                        onClick={closeDropdowns}
                        className="flex items-center justify-between p-2 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-[#17241C] text-gray-700 dark:text-gray-200 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="text-xs font-semibold">{t("prof.viewProfile")}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                      </Link>

                      {/* Foire Aux Questions (FAQ) */}
                      <button
                        type="button"
                        onClick={() => {
                          closeDropdowns();
                          setFaqModalOpen(true);
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-[#17241C] text-gray-700 dark:text-gray-200 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="text-xs font-semibold">FAQ (Questions - Réponses)</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                      </button>

                      {/* Support Client (Email & Telegram) */}
                      <button
                        type="button"
                        onClick={() => {
                          closeDropdowns();
                          setSupportModalOpen(true);
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-[#17241C] text-gray-700 dark:text-gray-200 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <Headphones className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="text-xs font-semibold">Support Client</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                      </button>

                      {/* Activer mon compte si non activé */}
                      {!isActivated && (
                        <Link
                          href="/activation"
                          onClick={closeDropdowns}
                          className="flex items-center justify-between p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-800 dark:text-amber-300 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                            <span className="text-xs font-bold">{t("prof.howToActivate")}</span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-amber-600" />
                        </Link>
                      )}

                      {/* Déconnexion */}
                      <div className="pt-2 mt-2 border-t border-gray-100 dark:border-[#1E2E24]">
                        <Link
                          href="/auth/logout"
                          onClick={closeDropdowns}
                          className="flex items-center justify-between p-2 rounded-xl text-left hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <LogOut className="w-4 h-4 text-red-500 shrink-0" />
                            <span className="text-xs font-bold">{t("nav.logout")}</span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-red-400" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* TIROIR LATÉRAL GAUCHE (Off-canvas Sidebar Navigation)                      */}
      {/* ========================================================================= */}
      {/* 1. Backdrop obscurci */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ${
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* 2. Volet latéral blanc/sombre coulissant depuis la gauche */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 sm:w-80 max-w-[85vw] bg-white dark:bg-[#131E17] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Navigation principale"
      >
        {/* En-tête du tiroir avec Logo */}
        <div className="p-4 border-b border-vita-border dark:border-[#1E2E24] flex items-center justify-between">
          <Link
            href="/"
            onClick={closeSidebar}
            className="flex items-center gap-2"
          >
            <Image
              src="/images/logo-icon.png"
              alt="Vita Earn"
              width={42}
              height={30}
              className="h-7 w-auto object-contain"
            />
            <Image
              src="/images/logo-text.png"
              alt="Vita Earn"
              width={140}
              height={17}
              className="h-4 sm:h-5 w-auto object-contain dark:brightness-200"
            />
          </Link>
          <button
            type="button"
            onClick={closeSidebar}
            className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profil de l'utilisateur dans le tiroir */}
        {isLoggedIn ? (
          <div className="p-4 bg-vita-surface/80 dark:bg-[#0E1812] border-b border-vita-border dark:border-[#1E2E24]">
            <div className="flex items-center gap-3">
              <label className="relative shrink-0 cursor-pointer group" title={t("prof.changeAvatar")}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatar}
                  alt={userDisplayName || "Avatar"}
                  className="w-10 h-10 rounded-full object-cover shrink-0 shadow-xs border border-emerald-500/40 group-hover:opacity-80 transition-opacity"
                />
                <span className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-4 h-4 text-white" />
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </label>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-vita-deep dark:text-emerald-400 truncate">{userDisplayName}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  {isActivated ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      {t("nav.accountActive")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded">
                      <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      {t("nav.accountInactive")}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {!isActivated && (
              <Link
                href="/activation"
                onClick={closeSidebar}
                className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{t("nav.activate")}</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="p-4 bg-vita-surface/80 dark:bg-[#0E1812] border-b border-vita-border dark:border-[#1E2E24]">
            <p className="text-xs font-bold text-vita-deep dark:text-emerald-400 mb-2">Vita Earn</p>
            <div className="flex gap-2">
              <Link
                href="/auth/login"
                onClick={closeSidebar}
                className="flex-1 text-center py-2 px-3 rounded-xl bg-white dark:bg-[#131E17] border border-vita-border dark:border-[#1E2E24] text-xs font-bold text-vita-deep dark:text-gray-200 hover:bg-vita-surface transition-colors shadow-2xs"
              >
                {t("nav.login")}
              </Link>
              <Link
                href="/auth/register"
                onClick={closeSidebar}
                className="flex-1 text-center py-2 px-3 rounded-xl bg-[#16A34A] text-xs font-bold text-white hover:bg-[#15803D] transition-colors shadow-2xs"
              >
                {t("nav.register")}
              </Link>
            </div>
          </div>
        )}

        {/* Liens de navigation dans le tiroir */}
        <div className="p-3 overflow-y-auto flex-1 space-y-1">
          <p className="text-[11px] font-bold text-vita-muted dark:text-gray-400 uppercase px-3 pt-1 pb-1">
            {t("nav.navigation")}
          </p>
          {drawerNavLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            if (item.href === "/retrait") {
              const isSectionActive = pathname.startsWith("/retrait");
              return (
                <div key={item.label} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setWithdrawalMenuOpen((prev) => !prev)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isSectionActive || withdrawalMenuOpen
                        ? "bg-vita-surface dark:bg-emerald-950/40 text-vita-deep dark:text-emerald-300 font-bold"
                        : "text-vita-text dark:text-gray-200 hover:bg-vita-surface/60 dark:hover:bg-slate-800/50"
                    }`}
                    aria-expanded={withdrawalMenuOpen}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isSectionActive || withdrawalMenuOpen
                            ? "text-vita-deep dark:text-emerald-400"
                            : "text-vita-medium dark:text-emerald-500"
                        }`}
                      />
                      <span className="truncate text-sm font-semibold">
                        {item.label}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-vita-muted/60 dark:text-gray-400 shrink-0 ml-1 transition-transform duration-200 ${
                        withdrawalMenuOpen ? "rotate-180 text-emerald-600 dark:text-emerald-400" : ""
                      }`}
                    />
                  </button>

                  {/* Options déroulantes du Centre de Retrait */}
                  {withdrawalMenuOpen && (
                    <div className="mt-1 ml-4 pl-3 py-1 space-y-1 border-l-2 border-emerald-500/30 dark:border-emerald-500/20">
                      {withdrawalSubOptions.map((sub) => {
                        const SubIcon = sub.icon;
                        const isSubActive =
                          sub.id === "historique"
                            ? pathname === "/retrait/historique"
                            : pathname === sub.href;
                        return (
                          <Link
                            key={sub.id}
                            href={sub.href}
                            onClick={() => {
                              closeSidebar();
                            }}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors group ${
                              isSubActive
                                ? "bg-emerald-100/70 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200 font-bold"
                                : "text-gray-700 dark:text-gray-300 hover:bg-vita-surface dark:hover:bg-slate-800/60"
                            }`}
                          >
                            <span className="truncate text-xs font-bold text-gray-800 dark:text-gray-100 group-hover:text-vita-deep dark:group-hover:text-emerald-300 transition-colors">
                              {sub.label}
                            </span>
                            <ChevronRight className="w-3 h-3 text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 shrink-0 ml-2" />
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            if (item.href === "/equipe") {
              const isSectionActive = pathname.startsWith("/equipe");
              return (
                <div key={item.label} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setTeamMenuOpen((prev) => !prev)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isSectionActive || teamMenuOpen
                        ? "bg-vita-surface dark:bg-emerald-950/40 text-vita-deep dark:text-emerald-300 font-bold"
                        : "text-vita-text dark:text-gray-200 hover:bg-vita-surface/60 dark:hover:bg-slate-800/50"
                    }`}
                    aria-expanded={teamMenuOpen}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isSectionActive || teamMenuOpen
                            ? "text-vita-deep dark:text-emerald-400"
                            : "text-vita-medium dark:text-emerald-500"
                        }`}
                      />
                      <span className="truncate text-sm font-semibold">
                        {item.label}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-vita-muted/60 dark:text-gray-400 shrink-0 ml-1 transition-transform duration-200 ${
                        teamMenuOpen ? "rotate-180 text-emerald-600 dark:text-emerald-400" : ""
                      }`}
                    />
                  </button>

                  {/* Options déroulantes de Mon Équipe */}
                  {teamMenuOpen && (
                    <div className="mt-1 ml-4 pl-3 py-1 space-y-1 border-l-2 border-emerald-500/30 dark:border-emerald-500/20">
                      {teamSubOptions.map((sub) => {
                        return (
                          <Link
                            key={sub.id}
                            href={sub.href}
                            onClick={() => {
                              closeSidebar();
                            }}
                            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors group text-gray-700 dark:text-gray-300 hover:bg-vita-surface dark:hover:bg-slate-800/60"
                          >
                            <span className="truncate text-xs font-bold text-gray-800 dark:text-gray-100 group-hover:text-vita-deep dark:group-hover:text-emerald-300 transition-colors">
                              {sub.label}
                            </span>
                            <ChevronRight className="w-3 h-3 text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 shrink-0 ml-2" />
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            if (item.href === "/admin") {
              const isSectionActive = pathname.startsWith("/admin");
              return (
                <div key={item.label} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setAdminMenuOpen((prev) => !prev)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isSectionActive || adminMenuOpen
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-bold border border-emerald-500/20"
                        : "text-vita-text dark:text-gray-200 hover:bg-vita-surface/60 dark:hover:bg-slate-800/50"
                    }`}
                    aria-expanded={adminMenuOpen}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isSectionActive || adminMenuOpen
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-emerald-600 dark:text-emerald-500"
                        }`}
                      />
                      <span className="truncate text-sm font-semibold">
                        Administration
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                        Admin
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-vita-muted/60 dark:text-gray-400 shrink-0 ml-1 transition-transform duration-200 ${
                        adminMenuOpen ? "rotate-180 text-emerald-600 dark:text-emerald-400" : ""
                      }`}
                    />
                  </button>

                  {/* Options déroulantes de l'Administration */}
                  {adminMenuOpen && (
                    <div className="mt-1 ml-4 pl-3 py-1 space-y-1 border-l-2 border-emerald-500/30 dark:border-emerald-500/20">
                      {adminSubOptions.map((sub) => {
                        const SubIcon = sub.icon;
                        const isSubActive =
                          sub.href === "/admin"
                            ? pathname === "/admin"
                            : pathname === sub.href;
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            onClick={() => {
                              closeSidebar();
                            }}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors group ${
                              isSubActive
                                ? "bg-emerald-100/70 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200 font-bold"
                                : "text-gray-700 dark:text-gray-300 hover:bg-vita-surface dark:hover:bg-slate-800/60"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <SubIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="truncate text-xs font-bold text-gray-800 dark:text-gray-100 group-hover:text-vita-deep dark:group-hover:text-emerald-300 transition-colors">
                                {sub.label}
                              </span>
                            </div>
                            <ChevronRight className="w-3 h-3 text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 shrink-0 ml-2" />
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => {
                  closeSidebar();
                  if (item.isCommunity) {
                    setCommunityModalOpen(true);
                  }
                }}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-vita-surface dark:bg-emerald-950/40 text-vita-deep dark:text-emerald-300 font-bold"
                    : "text-vita-text dark:text-gray-200 hover:bg-vita-surface/60 dark:hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${isActive ? "text-vita-deep dark:text-emerald-400" : "text-vita-medium dark:text-emerald-500"}`}
                  />
                  <span className="truncate text-sm font-semibold">
                    {item.label}
                  </span>
                  {(item as any).isAdmin && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 ml-2">
                      Accès Restreint
                    </span>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-vita-muted/60 dark:text-gray-500 shrink-0 ml-1" />
              </Link>
            );
          })}

          <div className="pt-2 mt-2 border-t border-vita-border/60 dark:border-[#1E2E24]">
            <button
              type="button"
              onClick={openFaqModal}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-vita-text dark:text-gray-200 hover:bg-vita-surface/60 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Headphones className="w-4 h-4 text-vita-medium dark:text-emerald-500" />
                <span className="text-sm font-semibold">{t("nav.helpFaq")}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-vita-muted/60 dark:text-gray-500 shrink-0" />
            </button>
          </div>
        </div>

        {/* Pied du tiroir : Déconnexion */}
        {isLoggedIn && (
          <div className="p-3 border-t border-vita-border dark:border-[#1E2E24] bg-gray-50/80 dark:bg-[#0E1812]">
            <Link
              href="/auth/logout"
              onClick={closeSidebar}
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-sm font-bold transition-colors"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>{t("nav.logout")}</span>
            </Link>
          </div>
        )}
      </aside>

      {/* Modale d'Assistance & FAQ */}
      <HelpModal isOpen={helpModalOpen} onClose={() => setHelpModalOpen(false)} />

      {/* Modale FAQ complète de A à Z */}
      <FaqModal isOpen={faqModalOpen} onClose={() => setFaqModalOpen(false)} />

      {/* Modale Support Client (Email & Telegram) */}
      <SupportModal
        isOpen={supportModalOpen}
        onClose={() => setSupportModalOpen(false)}
        userEmail={user?.email}
        userName={userDisplayName}
      />

      {/* Modale Centre Communautaire (WhatsApp & Telegram) */}
      <CommunityModal
        isOpen={communityModalOpen}
        onClose={() => setCommunityModalOpen(false)}
      />
    </>
  );
}
