import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminUnlocked, checkAdminSession } from "@/lib/security/admin-lock";
import { getAllUsers } from "@/lib/auth/local-store";
import { getAllStoredWithdrawals } from "@/lib/data/withdrawals-store";
import { UtilisateursClient, type UserItem } from "./UtilisateursClient";
import { AdminNavbar } from "@/components/admin/AdminNavbar";

export const metadata = {
  title: "Gestion des Utilisateurs — Administration Vita Earn",
};

export default async function AdminUtilisateursPage({
  searchParams,
}: {
  searchParams?: { filter?: string };
}) {
  const { isAdmin, isSuperAdmin, userEmail } = await checkAdminSession();

  if (!isAdmin) {
    redirect("/auth/login?redirect=/admin/utilisateurs");
  }

  const unlocked = await isAdminUnlocked();
  if (!unlocked) {
    redirect("/admin/lock");
  }

  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

  let formattedUsers: UserItem[] = [];
  const localUsers = getAllUsers();
  const allWithdrawals = getAllStoredWithdrawals();

  // Liste consolidée de tous les utilisateurs pour le calcul exact des lignées d'affiliation
  type RawMember = {
    id: string;
    name: string;
    username: string;
    email: string;
    phone: string;
    country: string;
    role: string;
    isActivated: boolean;
    isBanned: boolean;
    bannedReason?: string;
    referralCode?: string;
    upline?: string | null;
    balance: number;
    profit: number;
    createdAt: string;
    kycStatus?: string;
  };

  const rawUsersMap = new Map<string, RawMember>();

  // 1. Ajouter d'abord les profils Supabase
  if (isConfigured) {
    try {
      const adminClient = createAdminClient();
      const { data: profiles } = await adminClient
        .from("profiles")
        .select("id, full_name, email, phone, role, is_activated, referral_code, created_at, kyc_status")
        .order("created_at", { ascending: false });

      const { data: referrals } = await adminClient
        .from("referrals")
        .select("referrer_id, referred_id");

      if (profiles && profiles.length > 0) {
        profiles.forEach((p) => {
          const refRecord = referrals?.find((r) => r.referred_id === p.id);
          const uplineProfile = refRecord
            ? profiles.find((pr) => pr.id === refRecord.referrer_id)
            : null;

          const username = (p.full_name || p.email?.split("@")[0] || "user").toLowerCase().replace(/\s+/g, "");

          rawUsersMap.set(p.id, {
            id: p.id,
            name: p.full_name || p.email?.split("@")[0] || "Membre",
            username,
            email: p.email || "",
            phone: p.phone || "",
            country: "TG",
            role: p.role || "user",
            isActivated: Boolean(p.is_activated),
            isBanned: p.kyc_status === "rejected",
            referralCode: p.referral_code || "VE-" + p.id.slice(0, 6).toUpperCase(),
            upline: uplineProfile?.full_name || uplineProfile?.email || null,
            balance: p.is_activated ? 3500 : 0,
            profit: 0,
            createdAt: p.created_at,
            kycStatus: p.kyc_status,
          });
        });
      }
    } catch {}
  }

  // 2. Fusionner avec le local store pour assurer la présence et les données enrichies (Espoir, Kosqi, Koffi, etc.)
  localUsers.forEach((lu) => {
    const existing = Array.from(rawUsersMap.values()).find(
      (m) => m.id === lu.id || m.email.toLowerCase() === lu.email.toLowerCase()
    );

    if (existing) {
      existing.phone = lu.phone || existing.phone;
      existing.upline = lu.upline || existing.upline;
      existing.balance = lu.balance ?? existing.balance;
      existing.profit = lu.profit ?? existing.profit;
      existing.isBanned = Boolean(lu.isBanned || existing.isBanned);
      existing.bannedReason = lu.bannedReason;
      if (lu.isActivated) existing.isActivated = true;
    } else {
      rawUsersMap.set(lu.id, {
        id: lu.id,
        name: lu.username,
        username: lu.username.toLowerCase(),
        email: lu.email,
        phone: lu.phone,
        country: lu.country || "TG",
        role: lu.role,
        isActivated: lu.isActivated,
        isBanned: Boolean(lu.isBanned),
        bannedReason: lu.bannedReason,
        referralCode: lu.referralCode || "VE-" + lu.username.toUpperCase(),
        upline: lu.upline || (lu.role === "admin" ? "Aucun (Fondateur)" : "Espoir"),
        balance: lu.balance ?? (lu.isActivated ? 3500 : 0),
        profit: lu.profit ?? 0,
        createdAt: lu.createdAt,
      });
    }
  });

  const allConsolidatedUsers = Array.from(rawUsersMap.values());

  // 3. Calcul rigoureux du Réseau d'Affiliation 3 Niveaux & Profits selon la règle :
  // - Les Niveaux 1, 2, 3 ne comptabilisent QUE les utilisateurs ACTIVÉS.
  // - Les utilisateurs inscrits mais NON ACTIVÉS sont regroupés dans les filleuls en attente.
  // - Rémunération : N1 = 2 000 FCFA, N2 = 1 000 FCFA, N3 = 500 FCFA.
  formattedUsers = allConsolidatedUsers.map((user) => {
    // Vérification de filiation directe
    const isDirectChild = (candidate: RawMember) => {
      if (candidate.id === user.id) return false;
      if (!candidate.upline) return false;
      const up = candidate.upline.toLowerCase().trim();
      return (
        up === user.id.toLowerCase() ||
        up === user.username.toLowerCase() ||
        up === user.name.toLowerCase() ||
        up === user.email.toLowerCase() ||
        (user.referralCode && up === user.referralCode.toLowerCase())
      );
    };

    const directsAll = allConsolidatedUsers.filter(isDirectChild);
    const directsActive = directsAll.filter((d) => d.isActivated);
    const directsPending = directsAll.filter((d) => !d.isActivated);

    // NIVEAU 1 : Uniquement les directs ACTIVÉS
    const level1 = directsActive.map((d) => ({
      id: d.id,
      name: d.username || d.name,
      email: d.email,
      isActivated: true,
      createdAt: d.createdAt,
    }));

    // NIVEAU 2 : Uniquement les filleuls ACTIVÉS des membres de Niveau 1
    const level1Keys = directsActive.flatMap((d) => [
      d.id.toLowerCase(),
      d.username.toLowerCase(),
      d.name.toLowerCase(),
      d.email.toLowerCase(),
      d.referralCode ? d.referralCode.toLowerCase() : "",
    ]).filter(Boolean);

    const isLevel2Child = (candidate: RawMember) => {
      if (candidate.id === user.id) return false;
      if (directsAll.some((d) => d.id === candidate.id)) return false;
      if (!candidate.upline) return false;
      const up = candidate.upline.toLowerCase().trim();
      return level1Keys.includes(up);
    };

    const level2All = allConsolidatedUsers.filter(isLevel2Child);
    const level2Active = level2All.filter((d) => d.isActivated);
    const level2 = level2Active.map((d) => ({
      id: d.id,
      name: d.username || d.name,
      email: d.email,
      isActivated: true,
      createdAt: d.createdAt,
    }));

    // NIVEAU 3 : Uniquement les filleuls ACTIVÉS des membres de Niveau 2
    const level2Keys = level2Active.flatMap((d) => [
      d.id.toLowerCase(),
      d.username.toLowerCase(),
      d.name.toLowerCase(),
      d.email.toLowerCase(),
      d.referralCode ? d.referralCode.toLowerCase() : "",
    ]).filter(Boolean);

    const isLevel3Child = (candidate: RawMember) => {
      if (candidate.id === user.id) return false;
      if (directsAll.some((d) => d.id === candidate.id)) return false;
      if (level2All.some((d) => d.id === candidate.id)) return false;
      if (!candidate.upline) return false;
      const up = candidate.upline.toLowerCase().trim();
      return level2Keys.includes(up);
    };

    const level3All = allConsolidatedUsers.filter(isLevel3Child);
    const level3Active = level3All.filter((d) => d.isActivated);
    const level3 = level3Active.map((d) => ({
      id: d.id,
      name: d.username || d.name,
      email: d.email,
      isActivated: true,
      createdAt: d.createdAt,
    }));

    // Filleuls directs en attente d'activation
    const pendingDirects = directsPending.map((d) => ({
      id: d.id,
      name: d.username || d.name,
      email: d.email,
      isActivated: false,
      createdAt: d.createdAt,
    }));

    // Calcul du profit cumulé (Commissions sur abonnements payés et vérifiés)
    const cumulativeCommissions =
      (level1.length * 2000) + (level2.length * 1000) + (level3.length * 500);
    const totalProfit = Math.max(cumulativeCommissions, user.profit || 0);

    const userW = allWithdrawals
      .filter((w) =>
        w.accountName.toLowerCase().includes(user.username.toLowerCase()) ||
        w.accountName.toLowerCase().includes(user.name.toLowerCase()) ||
        (user.phone && w.phoneNumber === user.phone)
      )
      .map((w) => ({
        id: w.id,
        amount: w.amount,
        method: w.paymentMethod,
        status: w.status,
        date: w.createdAt,
      }));

    return {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      phone: user.phone,
      country: user.country,
      role: user.role,
      isActivated: user.isActivated,
      isBanned: user.isBanned,
      bannedReason: user.bannedReason,
      referralCode: user.referralCode,
      upline: user.upline || (user.role === "admin" ? "Aucun (Fondateur)" : "Espoir"),
      balance: user.balance,
      points: totalProfit,
      profit: totalProfit,
      referralsCount: directsAll.length,
      referralsDirectsTotal: directsAll.length,
      referralsDirectsActive: directsActive.length,
      referralsDirectsPending: directsPending.length,
      referralsLevel1: level1,
      referralsLevel2: level2,
      referralsLevel3: level3,
      referralsPendingDirects: pendingDirects,
      withdrawals: userW,
      transactions: [
        ...(user.isActivated
          ? [
              {
                id: `tx_act_${user.id}`,
                type: "Activation de compte",
                amount: 4500,
                description: "Abonnement annuel VitaEarn validé",
                date: user.createdAt,
              },
            ]
          : []),
        ...(cumulativeCommissions > 0
          ? [
              {
                id: `tx_comm_${user.id}`,
                type: "Commissions d'Affiliation",
                amount: cumulativeCommissions,
                description: `Gains d'équipe (${level1.length} N1, ${level2.length} N2, ${level3.length} N3)`,
                date: new Date().toISOString(),
              },
            ]
          : []),
      ],
      createdAt: user.createdAt,
    };
  });

  return (
    <div className="max-w-5xl mx-auto py-3 sm:py-6 space-y-6">
      <AdminNavbar
        userEmail={userEmail}
        isSuperAdmin={isSuperAdmin}
      />
      <UtilisateursClient
        initialUsers={formattedUsers}
        isSuperAdmin={isSuperAdmin}
        currentUserEmail={userEmail}
        initialFilter={
          searchParams?.filter === "activated" ||
          searchParams?.filter === "pending" ||
          searchParams?.filter === "admin"
            ? searchParams.filter
            : "all"
        }
      />
    </div>
  );
}
