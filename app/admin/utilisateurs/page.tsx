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

  if (isConfigured) {
    try {
      const adminClient = createAdminClient();
      const { data: profiles } = await adminClient
        .from("profiles")
        .select("id, full_name, email, phone, role, is_activated, referral_code, created_at, kyc_status")
        .order("created_at", { ascending: false });

      // Charger les parrainages
      const { data: referrals } = await adminClient
        .from("referrals")
        .select("referrer_id, referred_id");

      if (profiles && profiles.length > 0) {
        formattedUsers = profiles.map((p) => {
          // Retrouver parrain
          const refRecord = referrals?.find((r) => r.referred_id === p.id);
          const uplineProfile = refRecord
            ? profiles.find((pr) => pr.id === refRecord.referrer_id)
            : null;

          // Retrouver filleuls N1
          const n1Records = referrals?.filter((r) => r.referrer_id === p.id) || [];
          const n1Profiles = n1Records
            .map((r) => profiles.find((pr) => pr.id === r.referred_id))
            .filter(Boolean)
            .map((pr) => ({
              id: pr!.id,
              name: pr!.full_name || pr!.email?.split("@")[0] || "Membre",
              email: pr!.email || "",
              isActivated: Boolean(pr!.is_activated),
              createdAt: pr!.created_at,
            }));

          // Retrouver filleuls N2
          const n1Ids = n1Records.map((r) => r.referred_id);
          const n2Records = referrals?.filter((r) => n1Ids.includes(r.referrer_id)) || [];
          const n2Profiles = n2Records
            .map((r) => profiles.find((pr) => pr.id === r.referred_id))
            .filter(Boolean)
            .map((pr) => ({
              id: pr!.id,
              name: pr!.full_name || pr!.email?.split("@")[0] || "Membre",
              email: pr!.email || "",
              isActivated: Boolean(pr!.is_activated),
              createdAt: pr!.created_at,
            }));

          // Retrouver filleuls N3
          const n2Ids = n2Records.map((r) => r.referred_id);
          const n3Records = referrals?.filter((r) => n2Ids.includes(r.referrer_id)) || [];
          const n3Profiles = n3Records
            .map((r) => profiles.find((pr) => pr.id === r.referred_id))
            .filter(Boolean)
            .map((pr) => ({
              id: pr!.id,
              name: pr!.full_name || pr!.email?.split("@")[0] || "Membre",
              email: pr!.email || "",
              isActivated: Boolean(pr!.is_activated),
              createdAt: pr!.created_at,
            }));

          const userW = allWithdrawals
            .filter((w) => w.accountName.toLowerCase().includes(p.full_name?.toLowerCase() || "") || w.phoneNumber === p.phone)
            .map((w) => ({
              id: w.id,
              amount: w.amount,
              method: w.paymentMethod,
              status: w.status,
              date: w.createdAt,
            }));

          // Correspondance avec le localStore si disponible
          const localMatch = localUsers.find(
            (lu) => lu.id === p.id || lu.email.toLowerCase() === p.email?.toLowerCase()
          );

          return {
            id: p.id,
            name: p.full_name || p.email?.split("@")[0] || "Membre",
            username: p.full_name?.toLowerCase().replace(/\s+/g, "") || "user",
            email: p.email || "",
            phone: p.phone || "",
            country: "TG",
            role: p.role || "user",
            isActivated: Boolean(p.is_activated),
            isBanned: Boolean(localMatch?.isBanned || p.kyc_status === "rejected"),
            bannedReason: localMatch?.bannedReason,
            referralCode: p.referral_code || "VE-" + p.id.slice(0, 6).toUpperCase(),
            upline: uplineProfile?.full_name || uplineProfile?.email || localMatch?.upline || "Aucun (Racine)",
            balance: localMatch?.balance ?? (p.is_activated ? 3500 : 0),
            points: localMatch?.points ?? (n1Profiles.length * 2000),
            referralsCount: n1Profiles.length + n2Profiles.length + n3Profiles.length,
            referralsLevel1: n1Profiles,
            referralsLevel2: n2Profiles,
            referralsLevel3: n3Profiles,
            withdrawals: userW,
            transactions: [
              ...(p.is_activated
                ? [
                    {
                      id: `tx_act_${p.id}`,
                      type: "Activation de compte",
                      amount: 4500,
                      description: "Paiement abonnement validé",
                      date: p.created_at,
                    },
                  ]
                : []),
            ],
            createdAt: p.created_at,
          };
        });
      }
    } catch {}
  }

  // Fusion avec les utilisateurs du store local pour garantir la présence d'Espoir, Kosqi, Koffi
  localUsers.forEach((lu) => {
    const alreadyExists = formattedUsers.some(
      (u) => u.id === lu.id || u.email.toLowerCase() === lu.email.toLowerCase()
    );

    if (!alreadyExists) {
      const userW = allWithdrawals
        .filter((w) => w.accountName.toLowerCase().includes(lu.username.toLowerCase()) || w.phoneNumber === lu.phone)
        .map((w) => ({
          id: w.id,
          amount: w.amount,
          method: w.paymentMethod,
          status: w.status,
          date: w.createdAt,
        }));

      // Calcul des filleuls locaux
      const n1Local = localUsers
        .filter((other) => other.upline?.toLowerCase() === lu.username.toLowerCase() || other.upline?.toLowerCase() === lu.email.toLowerCase() || other.upline === lu.referralCode)
        .map((other) => ({
          id: other.id,
          name: other.username,
          email: other.email,
          isActivated: other.isActivated,
          createdAt: other.createdAt,
        }));

      formattedUsers.push({
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
        points: lu.points ?? (n1Local.length * 2000),
        referralsCount: n1Local.length,
        referralsLevel1: n1Local,
        referralsLevel2: [],
        referralsLevel3: [],
        withdrawals: userW,
        transactions: [
          ...(lu.isActivated
            ? [
                {
                  id: `tx_act_${lu.id}`,
                  type: "Activation de compte",
                  amount: 4500,
                  description: "Abonnement annuel VitaEarn validé",
                  date: lu.createdAt,
                },
              ]
            : []),
        ],
        createdAt: lu.createdAt,
      });
    }
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
