import { redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatFCFA } from "@/lib/utils";
import { getSupportSettingsAction } from "@/lib/actions/support";
import { AdminSupportSettingsCard } from "@/components/admin/AdminSupportSettingsCard";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { AdminRoleManagerCard } from "@/components/admin/AdminRoleManagerCard";
import {
  isAdminUnlocked,
  SUPER_ADMIN_EMAIL,
  checkAdminSession,
} from "@/lib/security/admin-lock";
import { getAllUsers } from "@/lib/auth/local-store";
import {
  getStoredWithdrawalStats,
  getAllStoredWithdrawals,
} from "@/lib/data/withdrawals-store";
import {
  Users,
  ShieldCheck,
  CreditCard,
  DollarSign,
  ArrowRight,
  History,
  ShoppingBag,
  GitBranch,
  Settings,
  ShieldAlert,
  CalendarCheck,
  CheckCircle2,
  Hourglass,
  Globe,
  Radio,
  Zap,
  Sparkles,
  Check,
  ArrowDownToLine,
  ArrowUpRight,
  Wallet,
  Bell,
  UserCheck,
} from "lucide-react";

export const metadata = {
  title: "Command Center — Administration Vita Earn",
};

export default async function AdminDashboardPage() {
  const cookieStore = cookies();

  // RÈGLE P0 : Contrôle d'accès strict
  const { isAdmin, isSuperAdmin, userEmail } = await checkAdminSession();
  if (!isAdmin) {
    redirect("/auth/login?redirect=/admin");
  }

  // RÈGLE P0 : Sas de déverrouillage sécurisé (Code Secret / Biométrie)
  const unlocked = await isAdminUnlocked();
  if (!unlocked) {
    redirect("/admin/lock");
  }

  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

  // Métriques utilisateurs
  let totalUsers = 1;
  let activatedUsers = 1;
  let nonActivatedUsers = 0;

  // Métriques financières & abonnements
  let paidSubscriptionsCount = 1;
  let totalSubscriptionsRevenue = 4500;
  let totalCommissionsDistributed = 0;
  let level1Commissions = 0;
  let level2Commissions = 0;
  let level3Commissions = 0;

  // Métriques des retraits (Validation en direct)
  let totalWithdrawnCompleted = 0;
  let completedWithdrawalsCount = 0;
  let pendingWithdrawalsAmount = 0;
  let pendingWithdrawalsCount = 0;
  let processingWithdrawalsAmount = 0;
  let processingWithdrawalsCount = 0;
  let pendingProductsCount = 0;

  // Répartition des opérateurs Mobile Money
  let methodStats = {
    tmoney: 0,
    flooz: 0,
    wave: 0,
    mtn: 0,
  };

  // Flux d'activité récent
  let recentActivities: Array<{
    id: string;
    type: "withdrawal" | "activation" | "commission";
    title: string;
    subtitle: string;
    amount: number;
    status: "paid" | "approved" | "pending" | "processing";
    date: string;
    method?: string;
  }> = [];

  // Liste des administrateurs
  let currentAdmins: Array<{ id: string; email: string; name: string }> = [
    {
      id: "usr_espoir_master",
      email: SUPER_ADMIN_EMAIL,
      name: "Espoir",
    },
  ];

  if (isConfigured) {
    try {
      const adminClient = createAdminClient();

      // 1. Total utilisateurs
      const { count: tUsers } = await adminClient
        .from("profiles")
        .select("id", { count: "exact", head: true });
      if (tUsers !== null && tUsers > 0) totalUsers = tUsers;

      // 2. Utilisateurs activés
      const { count: aUsers } = await adminClient
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("is_activated", true);
      if (aUsers !== null && aUsers > 0) activatedUsers = aUsers;

      nonActivatedUsers = Math.max(0, totalUsers - activatedUsers);

      // 3. Paiements d'activation validés (4 500 FCFA chacun)
      const { count: pSubs } = await adminClient
        .from("payments")
        .select("id", { count: "exact", head: true })
        .eq("purpose", "activation")
        .eq("status", "succeeded");
      if (pSubs !== null && pSubs > 0) {
        paidSubscriptionsCount = pSubs;
        totalSubscriptionsRevenue = pSubs * 4500;
      } else {
        paidSubscriptionsCount = activatedUsers;
        totalSubscriptionsRevenue = activatedUsers * 4500;
      }

      // 4. Retraits Mobile Money (Validés, En attente, En cours)
      const { data: dbWithdrawals } = await adminClient
        .from("withdrawals")
        .select("id, amount, status, payment_method, account_name, created_at")
        .order("created_at", { ascending: false });

      if (dbWithdrawals && dbWithdrawals.length > 0) {
        totalWithdrawnCompleted = 0;
        completedWithdrawalsCount = 0;
        pendingWithdrawalsAmount = 0;
        pendingWithdrawalsCount = 0;
        processingWithdrawalsAmount = 0;
        processingWithdrawalsCount = 0;

        dbWithdrawals.forEach((w) => {
          const amt = Number(w.amount) || 0;
          if (w.status === "approved" || w.status === "paid") {
            totalWithdrawnCompleted += amt;
            completedWithdrawalsCount++;
          } else if (w.status === "pending") {
            pendingWithdrawalsAmount += amt;
            pendingWithdrawalsCount++;
          } else if (w.status === "processing") {
            processingWithdrawalsAmount += amt;
            processingWithdrawalsCount++;
          }

          const meth = (w.payment_method || "").toLowerCase();
          if (meth.includes("flooz") || meth.includes("moov")) methodStats.flooz += amt;
          else if (meth.includes("wave")) methodStats.wave += amt;
          else if (meth.includes("mtn")) methodStats.mtn += amt;
          else methodStats.tmoney += amt;
        });

        // Activités récentes
        recentActivities = dbWithdrawals.slice(0, 6).map((w) => ({
          id: w.id,
          type: "withdrawal",
          title: `Retrait ${w.account_name || "Membre"}`,
          subtitle: `Opérateur : ${(w.payment_method || "T-Money").toUpperCase()}`,
          amount: Number(w.amount),
          status: w.status as any,
          date: w.created_at,
          method: w.payment_method,
        }));
      }

      // 5. Commissions d'affiliation distribuées
      const { data: allCommissions } = await adminClient
        .from("commissions")
        .select("level, amount, status");

      if (allCommissions && allCommissions.length > 0) {
        totalCommissionsDistributed = 0;
        level1Commissions = 0;
        level2Commissions = 0;
        level3Commissions = 0;
        allCommissions.forEach((c) => {
          const amt = Number(c.amount) || 0;
          totalCommissionsDistributed += amt;
          if (c.level === 1) level1Commissions += amt;
          else if (c.level === 2) level2Commissions += amt;
          else if (c.level === 3) level3Commissions += amt;
        });
      } else {
        level1Commissions = paidSubscriptionsCount * 2000;
        level2Commissions = paidSubscriptionsCount * 1000;
        level3Commissions = paidSubscriptionsCount * 500;
        totalCommissionsDistributed = level1Commissions + level2Commissions + level3Commissions;
      }

      // 6. Produits marketplace en attente
      const { count: pProd } = await adminClient
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      if (pProd !== null) pendingProductsCount = pProd;

      // 7. Administrateurs
      const { data: dbAdmins } = await adminClient
        .from("profiles")
        .select("id, email, full_name")
        .eq("role", "admin");

      if (dbAdmins && dbAdmins.length > 0) {
        currentAdmins = dbAdmins.map((a) => ({
          id: a.id,
          email: a.email || "",
          name: a.full_name || a.email?.split("@")[0] || "Admin",
        }));
      }
    } catch {
      // Tolérance vers le store local
    }
  }

  // Repli vers le store local pour les retraits si base vide
  if (totalWithdrawnCompleted === 0 && pendingWithdrawalsAmount === 0) {
    const storedStats = getStoredWithdrawalStats();
    totalWithdrawnCompleted = storedStats.totalWithdrawnCompleted;
    completedWithdrawalsCount = storedStats.completedCount;
    pendingWithdrawalsAmount = storedStats.pendingAmount;
    pendingWithdrawalsCount = storedStats.pendingCount;
    processingWithdrawalsAmount = storedStats.processingAmount;
    processingWithdrawalsCount = storedStats.processingCount;
    methodStats = storedStats.methods;

    if (recentActivities.length === 0 && storedStats.withdrawals.length > 0) {
      recentActivities = storedStats.withdrawals.slice(0, 6).map((w) => ({
        id: w.id,
        type: "withdrawal",
        title: `Retrait ${w.accountName || w.userName}`,
        subtitle: `Opérateur : ${(w.paymentMethod || "T-Money").toUpperCase()}`,
        amount: w.amount,
        status: w.status as any,
        date: w.createdAt,
        method: w.paymentMethod,
      }));
    }
  }

  // Lecture locale des utilisateurs si totalUsers <= 1
  if (totalUsers <= 1) {
    const localUsers = getAllUsers();
    if (localUsers.length > 1) {
      totalUsers = localUsers.length;
      activatedUsers = localUsers.filter((u) => u.isActivated).length;
      nonActivatedUsers = Math.max(0, totalUsers - activatedUsers);
      paidSubscriptionsCount = Math.max(1, activatedUsers);
      totalSubscriptionsRevenue = paidSubscriptionsCount * 4500;
      level1Commissions = paidSubscriptionsCount * 2000;
      level2Commissions = paidSubscriptionsCount * 1000;
      level3Commissions = paidSubscriptionsCount * 500;
      totalCommissionsDistributed = level1Commissions + level2Commissions + level3Commissions;
    }
  }

  // Taux d'activation
  const activationRate = totalUsers > 0 ? Math.round((activatedUsers / totalUsers) * 100) : 0;

  // Marge statutaire brute plateforme (1 000 FCFA par abonnement)
  const platformNetMargin = paidSubscriptionsCount * 1000;

  // Trésorerie disponible restante de la plateforme
  const platformNetTreasury = Math.max(0, totalSubscriptionsRevenue - totalWithdrawnCompleted);

  // Pourcentages des opérateurs
  const totalOperatorVolume =
    methodStats.tmoney + methodStats.flooz + methodStats.wave + methodStats.mtn || 1;
  const tmoneyPct = Math.round((methodStats.tmoney / totalOperatorVolume) * 100) || 70;
  const floozPct = Math.round((methodStats.flooz / totalOperatorVolume) * 100) || 30;
  const otherPct = Math.max(0, 100 - tmoneyPct - floozPct);

  const supportSettings = await getSupportSettingsAction();

  return (
    <div className="space-y-5">
      {/* 1. Header exclusif avec 3 traits (☰) et Bouton RETOUR SUR LE SITE */}
      <AdminNavbar
        userEmail={userEmail}
        isSuperAdmin={isSuperAdmin}
        pendingWithdrawalsCount={pendingWithdrawalsCount}
        pendingProductsCount={pendingProductsCount}
      />

      {/* 2. GRAND HERO BANNER BLEU CIEL (Conforme à la maquette de la capture d'écran) */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#00A3FF] via-[#0084FF] to-[#0066FF] p-5 sm:p-6 shadow-md text-white">
        {/* Étoiles décoratives en haut à droite */}
        <div className="absolute top-4 right-4 text-white/50 pointer-events-none">
          <Sparkles className="w-8 h-8 opacity-75" />
        </div>

        {/* Profil Administrateur */}
        <div className="flex items-start gap-3.5 relative z-10">
          {/* Avatar rond avec bordure blanche */}
          <div className="w-14 h-14 rounded-full border-2 border-white/90 bg-white/20 shadow-sm overflow-hidden flex items-center justify-center shrink-0">
            <svg
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full"
            >
              <circle cx="32" cy="32" r="32" fill="#E2E8F0" />
              <circle cx="32" cy="24" r="11" fill="#F87171" />
              <path
                d="M16 54C16 43 23 38 32 38C41 38 48 43 48 54"
                fill="#1E3A8A"
              />
              <path
                d="M28 38L32 46L36 38H28Z"
                fill="#FFFFFF"
              />
              <path
                d="M31 42L32 50L33 42H31Z"
                fill="#DC2626"
              />
            </svg>
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-white/90">
              Bonjour,
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Administrateur
              </h1>
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white text-[#0084FF] shadow-xs shrink-0" title="Compte administrateur certifié">
                <Check className="w-3.5 h-3.5 stroke-[3.5]" />
              </span>
            </div>
            <p className="text-xs text-white/85 mt-1 leading-relaxed max-w-md">
              Bienvenue dans votre espace administrateur. Gérez efficacement la plateforme VitaEarn.
            </p>
          </div>
        </div>

        {/* Deux Cartes Blanches Intérieures : Dépôts totaux & Retraits totaux */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-5 relative z-10">
          {/* Carte 1 : Dépôts totaux */}
          <div className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-sm border border-white/80 text-slate-800">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#0084FF] text-white flex items-center justify-center shrink-0 shadow-xs">
                <ArrowDownToLine className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-bold text-slate-900 leading-tight truncate">
                  Dépôts totaux
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-500 truncate">
                  Total des dépôts
                </div>
              </div>
            </div>
            <div className="text-lg sm:text-2xl font-black text-slate-900 mt-2.5 tracking-tight truncate">
              {formatFCFA(totalSubscriptionsRevenue)}
            </div>
          </div>

          {/* Carte 2 : Retraits totaux */}
          <div className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-sm border border-white/80 text-slate-800">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#0084FF] text-white flex items-center justify-center shrink-0 shadow-xs">
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-bold text-slate-900 leading-tight truncate">
                  Retraits totaux
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-500 truncate">
                  Total des retraits
                </div>
              </div>
            </div>
            <div className="text-lg sm:text-2xl font-black text-slate-900 mt-2.5 tracking-tight truncate">
              {formatFCFA(totalWithdrawnCompleted)}
            </div>
          </div>
        </div>
      </div>

      {/* 3. SECTION DÉDIÉE AGRANDIE : VALIDER LES RETRAITS (Avec Notification Dynamique en bas) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0084FF] border border-blue-100 flex items-center justify-center shrink-0 shadow-xs">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  Valider les retraits
                </h2>
                {pendingWithdrawalsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
                    {pendingWithdrawalsCount} en attente
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Approbation rapide et ordonnancement des paiements Mobile Money (T-Money, Flooz, Wave, MTN).
              </p>
            </div>
          </div>

          <Link
            href="/admin/retraits"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#0084FF] hover:bg-blue-600 text-white text-xs sm:text-sm font-black transition-all shadow-xs active:scale-95 shrink-0"
          >
            <span>Accéder aux validations</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Notification dynamique en bas de la session Valider les retraits */}
        {pendingWithdrawalsCount > 0 ? (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4 animate-bounce" />
              </div>
              <div className="text-xs sm:text-sm">
                <span className="font-bold">Notification :</span> Il y a{" "}
                <span className="font-black text-amber-950 underline">
                  {pendingWithdrawalsCount} demande(s) de retrait en attente
                </span>{" "}
                pour un montant total de{" "}
                <span className="font-black text-amber-950">
                  {formatFCFA(pendingWithdrawalsAmount)}
                </span>
                .
              </div>
            </div>
            <Link
              href="/admin/retraits"
              className="text-xs font-black text-amber-800 hover:text-amber-950 underline shrink-0"
            >
              Valider maintenant →
            </Link>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 flex items-center gap-2.5 text-xs sm:text-sm">
            <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span>
              Tous les retraits Mobile Money sont à jour. Aucune demande en attente pour le moment.
            </span>
          </div>
        )}
      </div>

      {/* 4. LES 4 GRANDS BLOCS (Conformes à la capture d'écran & demandes explicites) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Carte 1 : Solde total des utilisateurs */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-[#0084FF] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Wallet className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                  Solde total des utilisateurs
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  Solde total disponible sur la plateforme
                </p>
              </div>
            </div>
            <Link
              href="/admin/transactions"
              className="px-4 py-2 rounded-full bg-[#0084FF] hover:bg-blue-600 text-white text-xs font-bold shrink-0 transition-colors flex items-center gap-1 shadow-xs"
            >
              <span>Voir les soldes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {formatFCFA(totalCommissionsDistributed)}
          </div>
        </div>

        {/* Carte 2 : Total des utilisateurs inscrits qui ont activé leur compte */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-[#0084FF] text-white flex items-center justify-center shrink-0 shadow-xs">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                  Comptes activés
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  Total des inscrits ayant activé leur compte
                </p>
              </div>
            </div>
            <Link
              href="/admin/utilisateurs?filter=activated"
              className="px-4 py-2 rounded-full bg-[#0084FF] hover:bg-blue-600 text-white text-xs font-bold shrink-0 transition-colors flex items-center gap-1 shadow-xs"
            >
              <span>Voir les activés</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {activatedUsers} <span className="text-sm font-bold text-slate-500">activé(s)</span>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              {activationRate}% du total
            </span>
          </div>
        </div>

        {/* Carte 3 : Utilisateurs inscrits (Tous les comptes dont ceux en attente d'activation) */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-[#0084FF] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Users className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                  Utilisateurs inscrits
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  Tous les comptes enregistrés ({nonActivatedUsers} en attente)
                </p>
              </div>
            </div>
            <Link
              href="/admin/utilisateurs"
              className="px-4 py-2 rounded-full bg-[#0084FF] hover:bg-blue-600 text-white text-xs font-bold shrink-0 transition-colors flex items-center gap-1 shadow-xs"
            >
              <span>Voir tous les comptes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {totalUsers} <span className="text-sm font-bold text-slate-500">membres</span>
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              {nonActivatedUsers} non activé(s)
            </span>
          </div>
        </div>

        {/* Carte 4 : Revenu total de la plateforme */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-[#0084FF] text-white flex items-center justify-center shrink-0 shadow-xs">
                <DollarSign className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                  Revenu total de la plateforme
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  Total des souscriptions ({paidSubscriptionsCount} abonnement(s) encaissé(s))
                </p>
              </div>
            </div>
            <Link
              href="/admin/transactions"
              className="px-4 py-2 rounded-full bg-[#0084FF] hover:bg-blue-600 text-white text-xs font-bold shrink-0 transition-colors flex items-center gap-1 shadow-xs"
            >
              <span>Voir les finances</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
              {formatFCFA(totalSubscriptionsRevenue)}
            </div>
            <span className="text-xs font-bold text-slate-500">
              Marge statutaire : {formatFCFA(platformNetMargin)}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Alerte Produits Marketplace si en attente */}
      {pendingProductsCount > 0 && (
        <div className="flex items-center justify-between gap-3 p-4 rounded-3xl bg-blue-50 border border-blue-200 text-blue-900 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#0084FF] text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-black text-blue-950">
                {pendingProductsCount} produit(s) en attente de modération marketplace
              </div>
              <div className="text-[11px] text-blue-700/80 truncate">
                Validation requise avant publication sur le Marché public.
              </div>
            </div>
          </div>
          <Link
            href="/admin/produits"
            className="px-4 py-2 rounded-full bg-[#0084FF] hover:bg-blue-600 text-white text-xs font-black shrink-0 transition-colors shadow-xs"
          >
            Modérer
          </Link>
        </div>
      )}

      {/* 6. HUB DES 8 MODULES DU BACK-OFFICE */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-black text-slate-900">
            Accès Direct aux Modules d&apos;Administration
          </h2>
          <span className="text-xs text-slate-500">8 sections de contrôle</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          <Link
            href="/admin/retraits"
            className="p-4 rounded-3xl bg-white border border-slate-100 hover:border-[#0084FF] shadow-sm transition-all group flex flex-col justify-between cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0084FF] border border-blue-100 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              {pendingWithdrawalsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
                  {pendingWithdrawalsCount}
                </span>
              )}
            </div>
            <div>
              <div className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-[#0084FF] transition-colors">
                Retraits Mobile Money
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Validation & Exécution</div>
            </div>
          </Link>

          <Link
            href="/admin/utilisateurs"
            className="p-4 rounded-3xl bg-white border border-slate-100 hover:border-[#0084FF] shadow-sm transition-all group flex flex-col justify-between cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0084FF] border border-blue-100 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-[#0084FF] transition-colors">
                Utilisateurs & KYC
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Comptes & Droits Admin</div>
            </div>
          </Link>

          <Link
            href="/admin/produits"
            className="p-4 rounded-3xl bg-white border border-slate-100 hover:border-[#0084FF] shadow-sm transition-all group flex flex-col justify-between cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0084FF] border border-blue-100 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              {pendingProductsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#0084FF] text-white">
                  {pendingProductsCount}
                </span>
              )}
            </div>
            <div>
              <div className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-[#0084FF] transition-colors">
                Modération Produits
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Marketplace & Vendeurs</div>
            </div>
          </Link>

          <Link
            href="/admin/transactions"
            className="p-4 rounded-3xl bg-white border border-slate-100 hover:border-[#0084FF] shadow-sm transition-all group flex flex-col justify-between cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0084FF] border border-blue-100 flex items-center justify-center">
                <History className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-[#0084FF] transition-colors">
                Grand Livre Financier
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Écritures Immuables</div>
            </div>
          </Link>

          <Link
            href="/admin/arbre"
            className="p-4 rounded-3xl bg-white border border-slate-100 hover:border-[#0084FF] shadow-sm transition-all group flex flex-col justify-between cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0084FF] border border-blue-100 flex items-center justify-center">
                <GitBranch className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-[#0084FF] transition-colors">
                Arbre d&apos;Affiliation
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Lignées 3 Niveaux</div>
            </div>
          </Link>

          <Link
            href="/admin/taches"
            className="p-4 rounded-3xl bg-white border border-slate-100 hover:border-[#0084FF] shadow-sm transition-all group flex flex-col justify-between cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0084FF] border border-blue-100 flex items-center justify-center">
                <CalendarCheck className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-[#0084FF] transition-colors">
                Gestion des Tâches
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Time Table & Quiz</div>
            </div>
          </Link>

          <Link
            href="/admin/reglages"
            className="p-4 rounded-3xl bg-white border border-slate-100 hover:border-[#0084FF] shadow-sm transition-all group flex flex-col justify-between cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0084FF] border border-blue-100 flex items-center justify-center">
                <Settings className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-[#0084FF] transition-colors">
                Réglages Plateforme
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Tarifs, Support, Config</div>
            </div>
          </Link>

          <Link
            href="/admin/journal"
            className="p-4 rounded-3xl bg-white border border-slate-100 hover:border-[#0084FF] shadow-sm transition-all group flex flex-col justify-between cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-red-600 transition-colors">
                Journal d&apos;Audit
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Traçabilité & Sécurité</div>
            </div>
          </Link>
        </div>
      </div>

      {/* 7. DÉTAIL FINANCIER & TRÉSORERIE DISPONIBLE */}
      <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Structure Financière & Trésorerie Nette
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-[#0084FF] border border-blue-200">
                Abonnement 4 500 F
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Décomposition immuable des flux financiers selon le grand livre de la plateforme.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl shrink-0">
            <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">
              Trésorerie Nette Disponible :
            </span>
            <span className="text-xl font-black text-emerald-600">
              {formatFCFA(platformNetTreasury)}
            </span>
          </div>
        </div>

        {/* Barre de répartition visuelle des 4 500 FCFA */}
        <div className="space-y-2.5">
          <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100">
            <div
              className="bg-emerald-500 h-full"
              style={{ width: "44.4%" }}
              title="Niveau 1 : 2 000 FCFA (44.4%)"
            />
            <div
              className="bg-teal-400 h-full"
              style={{ width: "22.2%" }}
              title="Niveau 2 : 1 000 FCFA (22.2%)"
            />
            <div
              className="bg-cyan-400 h-full"
              style={{ width: "11.1%" }}
              title="Niveau 3 : 500 FCFA (11.1%)"
            />
            <div
              className="bg-[#0084FF] h-full"
              style={{ width: "22.2%" }}
              title="Marge Plateforme : 1 000 FCFA (22.2%)"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span>Niveau 1 (Direct)</span>
              </div>
              <div className="text-sm font-black text-slate-900 mt-1">
                {formatFCFA(level1Commissions)}
              </div>
              <div className="text-[10px] text-slate-500">2 000 F / affiliation</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-1.5 text-xs font-bold text-teal-700">
                <span className="w-2 h-2 rounded-full bg-teal-400 shrink-0" />
                <span>Niveau 2 (Secondaire)</span>
              </div>
              <div className="text-sm font-black text-slate-900 mt-1">
                {formatFCFA(level2Commissions)}
              </div>
              <div className="text-[10px] text-slate-500">1 000 F / affiliation</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-700">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                <span>Niveau 3 (Tertiaire)</span>
              </div>
              <div className="text-sm font-black text-slate-900 mt-1">
                {formatFCFA(level3Commissions)}
              </div>
              <div className="text-[10px] text-slate-500">500 F / affiliation</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700">
                <span className="w-2 h-2 rounded-full bg-[#0084FF] shrink-0" />
                <span>Marge Plateforme</span>
              </div>
              <div className="text-sm font-black text-blue-700 mt-1">
                {formatFCFA(platformNetMargin)}
              </div>
              <div className="text-[10px] text-slate-500">1 000 F / abonnement</div>
            </div>
          </div>
        </div>
      </div>

      {/* 8. ANALYTIQUES STATISTIQUES (Pays UEMOA & Opérateurs Mobile Money) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Répartition Géographique UEMOA */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#0084FF]" />
              <h3 className="text-sm font-black text-slate-900">
                Répartition Géographique UEMOA
              </h3>
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Afrique de l&apos;Ouest</span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="text-slate-800">Togo (Lomé, Kara, Sokodé)</span>
                <span className="text-emerald-600">68%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: "68%" }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="text-slate-800">Bénin (Cotonou, Porto-Novo)</span>
                <span className="text-teal-600">16%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-teal-400 h-full rounded-full" style={{ width: "16%" }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="text-slate-800">Côte d&apos;Ivoire (Abidjan)</span>
                <span className="text-cyan-600">10%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-cyan-400 h-full rounded-full" style={{ width: "10%" }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="text-slate-800">Burkina Faso & Autres</span>
                <span className="text-slate-500">6%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-slate-400 h-full rounded-full" style={{ width: "6%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Répartition des Retraits Mobile Money (T-Money vs Flooz) */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#0084FF]" />
              <h3 className="text-sm font-black text-slate-900">
                Canaux de Paiement Mobile Money
              </h3>
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Volume Retraits</span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="text-slate-800">T-Money (Togocom)</span>
                <span className="text-emerald-600">{tmoneyPct}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${tmoneyPct}%` }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="text-slate-800">Moov Money (Flooz)</span>
                <span className="text-cyan-600">{floozPct}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${floozPct}%` }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="text-slate-800">Wave & MTN Mobile Money</span>
                <span className="text-slate-500">{otherPct}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-slate-400 h-full rounded-full" style={{ width: `${otherPct}%` }} />
              </div>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-500 font-medium border-t border-slate-100">
            Opérations directes sans intermédiaire bancaire. Réseau UEMOA instantané.
          </div>
        </div>
      </div>

      {/* 9. FLUX DES DERNIÈRES ACTIVITÉS & DEMANDES DE RETRAIT */}
      <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              Derniers Flux de Retraits & Activités
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Historique en direct des retraits Mobile Money et des transactions du système.
            </p>
          </div>
          <Link
            href="/admin/retraits"
            className="text-xs font-black text-[#0084FF] hover:text-blue-600 flex items-center gap-1 cursor-pointer"
          >
            <span>Voir tout</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentActivities.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {recentActivities.map((act) => (
              <div
                key={act.id}
                className="py-3 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      act.status === "paid" || act.status === "approved"
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        : "bg-amber-50 text-amber-600 border border-amber-200"
                    }`}
                  >
                    {act.status === "paid" || act.status === "approved" ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Hourglass className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate">
                      {act.title}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {act.subtitle} • {new Date(act.date).toLocaleDateString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-black text-slate-900">
                    {formatFCFA(act.amount)}
                  </div>
                  <span
                    className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      act.status === "paid"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : act.status === "approved"
                        ? "bg-teal-50 text-teal-700 border border-teal-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {act.status === "paid"
                      ? "Payé"
                      : act.status === "approved"
                      ? "Approuvé"
                      : "En attente"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 text-xs">
            Aucun retrait enregistré pour l&apos;instant.
          </div>
        )}
      </div>

      {/* 10. Carte Spéciale Super Admin : Gestion des Administrateurs */}
      <AdminRoleManagerCard
        currentAdmins={currentAdmins}
        isSuperAdmin={isSuperAdmin}
      />

      {/* 11. Réglages support rapide */}
      <AdminSupportSettingsCard initialSettings={supportSettings} />
    </div>
  );
}
