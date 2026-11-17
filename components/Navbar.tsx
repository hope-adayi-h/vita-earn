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
} from "lucide-react";
import { PlatformLogo } from "./PlatformLogo";
import { HelpModal } from "@/components/HelpModal";
import { CommunityModal } from "@/components/CommunityModal";

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
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [withdrawalMenuOpen, setWithdrawalMenuOpen] = useState(false);
  const [desktopWithdrawalOpen, setDesktopWithdrawalOpen] = useState(false);
  const [teamMenuOpen, setTeamMenuOpen] = useState(false);
  const [desktopTeamOpen, setDesktopTeamOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [communityModalOpen, setCommunityModalOpen] = useState(false);

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

  // Masquer intégralement le header sur les pages d'authentification
  if (isAuthPage) {
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

  if (user?.role === "admin") {
    navLinks.push({ label: t("nav.admin"), href: "/admin", icon: ShieldCheck });
  }

  // Liens officiels du tiroir de navigation mobile (12 sections unifiées)
  const drawerNavLinks = [
    { label: t("nav.home"), href: "/", icon: Home },
    { label: t("nav.community"), href: "/communaute", icon: MessageSquare, isCommunity: true },
    { label: t("nav.withdrawal"), href: "/retrait", icon: Wallet },
    { label: t("nav.team"), href: "/equipe", icon: Users },
    { label: t("nav.welcomeBonus"), href: "/#welcome-bonus", icon: Gift },
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
    setLangDropdownOpen(false);
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
        <div className="max-w-5xl mx-auto px-2.5 sm:px-4 h-15 sm:h-18 flex items-center justify-between gap-1 sm:gap-3">
          {/* ========================================================================= */}
          {/* 1. GAUCHE MOBILE : Bouton Hamburger (3 traits)                            */}
          {/* ========================================================================= */}
          <div className="flex md:hidden items-center shrink-0">
            <button
              type="button"
              onClick={() => {
                setSidebarOpen(true);
                closeDropdowns();
              }}
              className="p-1.5 -ml-1 rounded-xl text-gray-800 dark:text-gray-100 hover:text-vita-deep hover:bg-vita-surface transition-colors focus:outline-hidden"
              aria-label="Ouvrir le menu de navigation"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800 dark:text-gray-100" />
            </button>
          </div>

          {/* ========================================================================= */}
          {/* 2. LOGO VITA EARN (Dimensions calibrées pour éviter tout chevauchement)    */}
          {/* ========================================================================= */}
          <div className="flex items-center justify-start shrink min-w-0 mr-auto pl-1 sm:pl-2">
            <Link
              href="/"
              onClick={() => {
                closeSidebar();
                closeDropdowns();
              }}
              className="flex items-center gap-1.5 sm:gap-2 group py-1"
            >
              <Image
                src="/images/logo-icon.png"
                alt="Vita Earn"
                width={36}
                height={28}
                className="h-6 sm:h-8 w-auto object-contain transition-transform group-hover:scale-105 duration-200 shrink-0"
                priority
              />
              <Image
                src="/images/logo-text.png"
                alt="Vita Earn"
                width={110}
                height={16}
                className="h-3.5 sm:h-5.5 w-auto object-contain dark:brightness-200 shrink-0"
                priority
              />
            </Link>
          </div>

          {/* ========================================================================= */}
          {/* 3. NAVIGATION DESKTOP                                                     */}
          {/* ========================================================================= */}
          {!isActivationPage && !isAuthPage && (
            <nav className="hidden md:flex items-center gap-2 lg:gap-3">
              {navLinks.map((item) => {
                if (item.href === "/retrait") {
                  return (
                    <div key="desktop-withdrawal" className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setDesktopWithdrawalOpen(!desktopWithdrawalOpen);
                          setDesktopTeamOpen(false);
                          setProfileDropdownOpen(false);
                          setLangDropdownOpen(false);
                        }}
                        className={`text-sm font-semibold transition-colors px-2.5 py-1.5 rounded-lg flex items-center gap-1 ${
                          pathname.startsWith("/retrait") || desktopWithdrawalOpen
                            ? "text-vita-deep dark:text-[#86EFAC] font-bold bg-vita-surface/80 dark:bg-emerald-950/40"
                            : "text-vita-text dark:text-gray-300 hover:text-vita-deep hover:bg-gray-50 dark:hover:bg-slate-800/50"
                        }`}
                        aria-expanded={desktopWithdrawalOpen}
                      >
                        <span>{item.label}</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            desktopWithdrawalOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {desktopWithdrawalOpen && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-[#131E17] rounded-2xl shadow-xl border border-gray-100 dark:border-[#1E2E24] p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                          <div className="px-2.5 py-1.5 mb-1 border-b border-gray-100 dark:border-[#1E2E24]">
                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                              Centre de Retrait
                            </p>
                          </div>
                          <div className="space-y-0.5">
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
                                  onClick={() => setDesktopWithdrawalOpen(false)}
                                  className={`flex items-center justify-between p-2 rounded-xl text-xs font-semibold transition-colors group ${
                                    isSubActive
                                      ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-bold"
                                      : "text-gray-700 dark:text-gray-200 hover:bg-vita-surface dark:hover:bg-slate-800/60"
                                  }`}
                                >
                                  <span className="text-xs font-bold text-gray-800 dark:text-gray-100 group-hover:text-vita-deep dark:group-hover:text-emerald-300">
                                    {sub.label}
                                  </span>
                                  <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-600 shrink-0 ml-2" />
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                if (item.href === "/equipe") {
                  return (
                    <div key="desktop-team" className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setDesktopTeamOpen(!desktopTeamOpen);
                          setDesktopWithdrawalOpen(false);
                          setProfileDropdownOpen(false);
                          setLangDropdownOpen(false);
                        }}
                        className={`text-sm font-semibold transition-colors px-2.5 py-1.5 rounded-lg flex items-center gap-1 ${
                          pathname.startsWith("/equipe") || desktopTeamOpen
                            ? "text-vita-deep dark:text-[#86EFAC] font-bold bg-vita-surface/80 dark:bg-emerald-950/40"
                            : "text-vita-text dark:text-gray-300 hover:text-vita-deep hover:bg-gray-50 dark:hover:bg-slate-800/50"
                        }`}
                        aria-expanded={desktopTeamOpen}
                      >
                        <span>{item.label}</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            desktopTeamOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {desktopTeamOpen && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-[#131E17] rounded-2xl shadow-xl border border-gray-100 dark:border-[#1E2E24] p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                          <div className="px-2.5 py-1.5 mb-1 border-b border-gray-100 dark:border-[#1E2E24]">
                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                              Mon Équipe & Réseau
                            </p>
                          </div>
                          <div className="space-y-0.5">
                            {teamSubOptions.map((sub) => {
                              return (
                                <Link
                                  key={sub.id}
                                  href={sub.href}
                                  onClick={() => setDesktopTeamOpen(false)}
                                  className="flex items-center justify-between p-2 rounded-xl text-xs font-semibold transition-colors group text-gray-700 dark:text-gray-200 hover:bg-vita-surface dark:hover:bg-slate-800/60"
                                >
                                  <span className="text-xs font-bold text-gray-800 dark:text-gray-100 group-hover:text-vita-deep dark:group-hover:text-emerald-300">
                                    {sub.label}
                                  </span>
                                  <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-600 shrink-0 ml-2" />
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`text-sm font-semibold transition-colors px-2.5 py-1.5 rounded-lg ${
                      pathname === item.href
                        ? "text-vita-deep dark:text-[#86EFAC] font-bold bg-vita-surface/80 dark:bg-emerald-950/40"
                        : "text-vita-text dark:text-gray-300 hover:text-vita-deep hover:bg-gray-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* ========================================================================= */}
          {/* 4. ACTIONS DROITE : Langue, Mode Sombre/Clair, Avatar Profil              */}
          {/* ========================================================================= */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0 relative">
            {/* 1. SÉLECTEUR DE LANGUE (FR / EN) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setLangDropdownOpen(!langDropdownOpen);
                  setProfileDropdownOpen(false);
                  setSidebarOpen(false);
                }}
                className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 hover:text-vita-deep hover:bg-vita-surface dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-slate-700"
                aria-label="Changer de langue / Change language"
                title="Langue / Language"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="uppercase">{language}</span>
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 top-11 z-50 w-36 bg-white dark:bg-[#131E17] rounded-xl shadow-2xl border border-gray-100 dark:border-[#1E2E24] p-1.5 animate-in fade-in zoom-in-95 duration-150">
                  <button
                    type="button"
                    onClick={() => {
                      setLanguage("fr");
                      setLangDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      language === "fr"
                        ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span>Français (FR)</span>
                    {language === "fr" && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLanguage("en");
                      setLangDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      language === "en"
                        ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span>English (EN)</span>
                    {language === "en" && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                  </button>
                </div>
              )}
            </div>

            {/* 2. BOUTON MODE SOMBRE / CLAIR (LUNE / SOLEIL) */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl text-gray-700 dark:text-gray-200 hover:text-vita-deep hover:bg-vita-surface dark:hover:bg-slate-800 transition-colors"
              aria-label={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
              title={theme === "dark" ? t("top.light") : t("top.dark")}
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-90 duration-200" />
              ) : (
                <Moon className="w-4 h-4 text-gray-700 hover:text-emerald-600 transition-colors" />
              )}
            </button>

            {/* 3. AVATAR DE PROFIL AVEC MENU DÉROULANT (Remplace les 3 points) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setProfileDropdownOpen(!profileDropdownOpen);
                  setLangDropdownOpen(false);
                  setSidebarOpen(false);
                }}
                className="relative rounded-full focus:outline-hidden p-0.5 border border-transparent hover:border-emerald-400 transition-colors block"
                aria-label="Profil et options"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatar}
                  alt={userDisplayName || "Avatar"}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-emerald-500/40 shadow-xs"
                />
                {/* Pastille statut en ligne (comme sur la capture Earnlix) */}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#16A34A] ring-2 ring-white dark:ring-[#131E17]" />
              </button>

              {/* Menu Pop-up sous l'avatar */}
              {profileDropdownOpen && (
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

                    {/* Centre de Retrait Mobile Money */}
                    <Link
                      href="/retrait"
                      onClick={closeDropdowns}
                      className="flex items-center justify-between p-2 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-[#17241C] text-gray-700 dark:text-gray-200 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="text-xs font-semibold">Demande de Retrait</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                    </Link>

                    {/* Historique des Retraits */}
                    <Link
                      href="/retrait/historique"
                      onClick={closeDropdowns}
                      className="flex items-center justify-between p-2 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-[#17241C] text-gray-700 dark:text-gray-200 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="text-xs font-semibold">Historique des Retraits</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                    </Link>

                    {/* Assistance WhatsApp Directe */}
                    <a
                      href="https://wa.me/22890000000?text=Bonjour%20Support%20Vita%20Earn,%20j'ai%20besoin%20d'aide."
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={closeDropdowns}
                      className="flex items-center justify-between p-2 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-[#17241C] text-gray-700 dark:text-gray-200 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="text-xs font-semibold">{t("prof.whatsapp")}</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                    </a>

                    {/* Centre d'Aide & FAQ */}
                    <button
                      type="button"
                      onClick={openFaqModal}
                      className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-[#17241C] text-gray-700 dark:text-gray-200 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="text-xs font-semibold">{t("prof.faq")}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                    </button>

                    {/* Canaux WhatsApp & Telegram */}
                    <button
                      type="button"
                      onClick={() => {
                        closeDropdowns();
                        setCommunityModalOpen(true);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-[#17241C] text-gray-700 dark:text-gray-200 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="text-xs font-semibold">{t("prof.community")}</span>
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
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-300 md:hidden ${
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* 2. Volet latéral blanc/sombre coulissant depuis la gauche */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 max-w-[85vw] bg-white dark:bg-[#131E17] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out md:hidden ${
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatar}
                alt={userDisplayName || "Avatar"}
                className="w-10 h-10 rounded-full object-cover shrink-0 shadow-xs border border-emerald-500/40"
              />
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

      {/* Modale Centre Communautaire (WhatsApp & Telegram) */}
      <CommunityModal
        isOpen={communityModalOpen}
        onClose={() => setCommunityModalOpen(false)}
      />
    </>
  );
}
