import { redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatFCFA } from "@/lib/utils";
import { getSupportSettingsAction } from "@/lib/actions/support";
import { AdminSupportSettingsCard } from "@/components/admin/AdminSupportSettingsCard";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminRoleManagerCard } from "@/components/admin/AdminRoleManagerCard";
import {
  isAdminUnlocked,
  SUPER_ADMIN_EMAIL,
  checkAdminSession,
} from "@/lib/security/admin-lock";
import { getAllUsers } from "@/lib/auth/local-store";
import {
  Users,
  ShieldCheck,
  CreditCard,
  DollarSign,
  Layers,
  ArrowRight,
  TrendingUp,
  Clock,
  History,
  Lock,
  ShoppingBag,
  GitBranch,
  Settings,
  ShieldAlert,
  CalendarCheck,
  CheckCircle2,
} from "lucide-react";

export const metadata = {
  title: "Administration — Vita Earn",
};

export default async function AdminDashboardPage() {
  const cookieStore = cookies();
  const supabase = createClient();

  const { isAdmin, isSuperAdmin, userEmail } = await checkAdminSession();

  // RÈGLE P0 : Contrôle d'accès strict
  if (!isAdmin) {
    redirect("/auth/login?redirect=/admin");
  }

  // RÈGLE P0 : Vérification du sas de déverrouillage (Face ID / Code Secret)
  const unlocked = await isAdminUnlocked();
  if (!unlocked) {
    redirect("/admin/lock");
  }

  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

  let totalUsers = 1;
  let activatedUsers = 1;
  let nonActivatedUsers = 0;
  let paidSubscriptionsCount = 1;
  let totalSubscriptionsRevenue = 4500;
  let totalCommissionsDistributed = 0;
  let level1Commissions = 0;
  let level2Commissions = 0;
  let level3Commissions = 0;
  let totalCommissionsCount = 0;
  let totalAvailableBalances = 0;
  let totalPendingBalances = 0;
  let pendingWithdrawalsCount = 0;
  let pendingProductsCount = 0;

  // Liste des administrateurs pour la gestion des rôles
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

      const { count: tUsers } = await adminClient
        .from("profiles")
        .select("id", { count: "exact", head: true });
      if (tUsers !== null) totalUsers = tUsers;

      const { count: aUsers } = await adminClient
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("is_activated", true);
      if (aUsers !== null) activatedUsers = aUsers;

      nonActivatedUsers = Math.max(0, totalUsers - activatedUsers);

      const { count: pSubs } = await adminClient
        .from("payments")
        .select("id", { count: "exact", head: true })
        .eq("purpose", "activation")
        .eq("status", "succeeded");
      if (pSubs !== null) {
        paidSubscriptionsCount = pSubs;
        totalSubscriptionsRevenue = pSubs * 4500;
      }

      const { data: allCommissions } = await adminClient
        .from("commissions")
        .select("level, amount, status");

      if (allCommissions) {
        totalCommissionsCount = allCommissions.length;
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
      }

      const { data: allBalances } = await adminClient
        .from("wallet_balances")
        .select("balance, available_balance, pending_balance");

      if (allBalances) {
        totalAvailableBalances = 0;
        totalPendingBalances = 0;
        allBalances.forEach((b) => {
          totalAvailableBalances += Number(b.available_balance ?? b.balance) || 0;
          totalPendingBalances += Number(b.pending_balance) || 0;
        });
      }

      const { count: pWith } = await adminClient
        .from("withdrawals")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      if (pWith !== null) pendingWithdrawalsCount = pWith;

      const { count: pProd } = await adminClient
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      if (pProd !== null) pendingProductsCount = pProd;

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
      // Conservation des valeurs locales
    }
  } else {
    // Lecture du store local
    const localUsers = getAllUsers();
    totalUsers = localUsers.length;
    activatedUsers = localUsers.filter((u) => u.isActivated).length;
    nonActivatedUsers = totalUsers - activatedUsers;
    paidSubscriptionsCount = activatedUsers;
    totalSubscriptionsRevenue = activatedUsers * 4500;

    const admins = localUsers.filter((u) => u.role === "admin");
    if (admins.length > 0) {
      currentAdmins = admins.map((a) => ({
        id: a.id,
        email: a.email,
        name: a.username,
      }));
    }
  }

  // Marge brute plateforme (1 000 FCFA par abonnement activé)
  const platformNetMargin = Math.max(
    0,
    paidSubscriptionsCount * 1000
  );

  const supportSettings = await getSupportSettingsAction();

  return (
    <div className="max-w-5xl mx-auto py-4 sm:py-8 space-y-6">
      {/* Header avec état du sas et bouton verrouiller */}
      <AdminHeader userEmail={userEmail} isSuperAdmin={isSuperAdmin} />

      {/* Titre principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Panneau de Contrôle Exécutif
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Supervision financière, modération des flux et administration générale Vita Earn.
          </p>
        </div>
      </div>

      {/* Raccourcis des 8 Modules du Back-Office */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <Link
          href="/admin/retraits"
          className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#131E17] border border-gray-100 dark:border-[#1E2E24] hover:border-emerald-500/50 dark:hover:border-emerald-500/50 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            {pendingWithdrawalsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                {pendingWithdrawalsCount}
              </span>
            )}
          </div>
          <div>
            <div className="text-xs font-bold text-gray-800 dark:text-gray-100 group-hover:text-emerald-600 transition-colors">
              Retraits Mobile Money
            </div>
            <div className="text-[11px] text-gray-400">Validation & Exécution</div>
          </div>
        </Link>

        <Link
          href="/admin/utilisateurs"
          className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#131E17] border border-gray-100 dark:border-[#1E2E24] hover:border-emerald-500/50 dark:hover:border-emerald-500/50 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-700 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-gray-800 dark:text-gray-100 group-hover:text-emerald-600 transition-colors">
              Utilisateurs & KYC
            </div>
            <div className="text-[11px] text-gray-400">Comptes & Droits Admin</div>
          </div>
        </Link>

        <Link
          href="/admin/produits"
          className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#131E17] border border-gray-100 dark:border-[#1E2E24] hover:border-emerald-500/50 dark:hover:border-emerald-500/50 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            {pendingProductsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                {pendingProductsCount}
              </span>
            )}
          </div>
          <div>
            <div className="text-xs font-bold text-gray-800 dark:text-gray-100 group-hover:text-emerald-600 transition-colors">
              Modération Produits
            </div>
            <div className="text-[11px] text-gray-400">Marketplace & Vendeurs</div>
          </div>
        </Link>

        <Link
          href="/admin/transactions"
          className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#131E17] border border-gray-100 dark:border-[#1E2E24] hover:border-emerald-500/50 dark:hover:border-emerald-500/50 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-700 dark:text-purple-400 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-gray-800 dark:text-gray-100 group-hover:text-emerald-600 transition-colors">
              Grand Livre Financier
            </div>
            <div className="text-[11px] text-gray-400">Écritures Immuables</div>
          </div>
        </Link>

        <Link
          href="/admin/arbre"
          className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#131E17] border border-gray-100 dark:border-[#1E2E24] hover:border-emerald-500/50 dark:hover:border-emerald-500/50 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-teal-500/15 text-teal-700 dark:text-teal-400 flex items-center justify-center">
              <GitBranch className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-gray-800 dark:text-gray-100 group-hover:text-emerald-600 transition-colors">
              Arbre d&apos;Affiliation
            </div>
            <div className="text-[11px] text-gray-400">Lignées & Anti-Fraude</div>
          </div>
        </Link>

        <Link
          href="/admin/taches"
          className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#131E17] border border-gray-100 dark:border-[#1E2E24] hover:border-emerald-500/50 dark:hover:border-emerald-500/50 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-gray-800 dark:text-gray-100 group-hover:text-emerald-600 transition-colors">
              Gestion des Tâches
            </div>
            <div className="text-[11px] text-gray-400">Time Table & Rémunérations</div>
          </div>
        </Link>

        <Link
          href="/admin/reglages"
          className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#131E17] border border-gray-100 dark:border-[#1E2E24] hover:border-emerald-500/50 dark:hover:border-emerald-500/50 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-slate-500/15 text-slate-700 dark:text-slate-400 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-gray-800 dark:text-gray-100 group-hover:text-emerald-600 transition-colors">
              Réglages Plateforme
            </div>
            <div className="text-[11px] text-gray-400">Tarifs, Commissions, Support</div>
          </div>
        </Link>

        <Link
          href="/admin/journal"
          className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#131E17] border border-gray-100 dark:border-[#1E2E24] hover:border-emerald-500/50 dark:hover:border-emerald-500/50 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-red-500/15 text-red-700 dark:text-red-400 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-gray-800 dark:text-gray-100 group-hover:text-emerald-600 transition-colors">
              Journal d&apos;Audit
            </div>
            <div className="text-[11px] text-gray-400">Traçabilité & Sécurité</div>
          </div>
        </Link>
      </div>

      {/* Grille des Métriques Financières & Trésorerie */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-[#131E17] rounded-3xl border border-gray-100 dark:border-[#1E2E24] p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1 font-bold">
            <span>Utilisateurs Inscrits</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">
            {(totalUsers || 0).toLocaleString("fr-FR")}
          </div>
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-[#1E2E24] text-[11px]">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              {activatedUsers || 0} activés (4 500 F)
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-amber-600 font-bold">
              {nonActivatedUsers} en attente
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#131E17] rounded-3xl border border-gray-100 dark:border-[#1E2E24] p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1 font-bold">
            <span>Revenus Abonnements</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
            {formatFCFA(totalSubscriptionsRevenue)}
          </div>
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-[#1E2E24] text-[11px]">
            <span className="text-gray-500 font-medium">
              Marge plateforme :
            </span>
            <span className="text-emerald-600 font-bold">
              {formatFCFA(platformNetMargin)}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#131E17] rounded-3xl border border-gray-100 dark:border-[#1E2E24] p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1 font-bold">
            <span>Commissions Distribuées</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">
            {formatFCFA(totalCommissionsDistributed)}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-[#1E2E24] text-[10px] text-gray-500">
            <span>N1: {formatFCFA(level1Commissions)}</span>
            <span>N2: {formatFCFA(level2Commissions)}</span>
            <span>N3: {formatFCFA(level3Commissions)}</span>
          </div>
        </div>
      </div>

      {/* Carte Spéciale Super Admin : Gestion des Administrateurs */}
      <AdminRoleManagerCard
        currentAdmins={currentAdmins}
        isSuperAdmin={isSuperAdmin}
      />

      {/* Réglages support rapide */}
      <AdminSupportSettingsCard initialSettings={supportSettings} />
    </div>
  );
}
