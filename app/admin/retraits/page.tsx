import { redirect } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminUnlocked, checkAdminSession } from "@/lib/security/admin-lock";
import { RetraitsClient, type WithdrawalAdminItem } from "./RetraitsClient";
import { getAllStoredWithdrawals } from "@/lib/data/withdrawals-store";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { ArrowLeft, CreditCard, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Gestion des Retraits — Administration Vita Earn",
};

export const dynamic = "force-dynamic";

export default async function AdminRetraitsPage() {
  const { isAdmin, isSuperAdmin, userEmail } = await checkAdminSession();

  if (!isAdmin) {
    redirect("/auth/login?redirect=/admin/retraits");
  }

  const unlocked = await isAdminUnlocked();
  if (!unlocked) {
    redirect("/admin/lock");
  }

  let formattedWithdrawals: WithdrawalAdminItem[] = [];
  const seenIds = new Set<string>();

  try {
    const adminClient = createAdminClient();
    const { data: withdrawals, error: wErr } = await adminClient
      .from("withdrawals")
      .select("id, user_id, amount, fee, phone, operator, payment_method, status, admin_note, note, created_at")
      .order("created_at", { ascending: false });

    if (!wErr && withdrawals && withdrawals.length > 0) {
      const userIds = Array.from(new Set(withdrawals.map((w) => w.user_id).filter(Boolean)));
      let profileMap = new Map<string, string>();
      let phoneMap = new Map<string, string>();

      if (userIds.length > 0) {
        const { data: profiles } = await adminClient
          .from("profiles")
          .select("id, full_name, username, phone")
          .in("id", userIds);

        if (profiles) {
          profiles.forEach((p) => {
            profileMap.set(p.id, p.full_name || p.username || "Membre");
            if (p.phone) phoneMap.set(p.id, p.phone);
          });
        }
      }

      formattedWithdrawals = withdrawals.map((w) => {
        seenIds.add(w.id);
        const amt = Number(w.amount) || 0;
        const fee = Number(w.fee) || 500;
        const net = Math.max(0, amt - fee);
        const name = profileMap.get(w.user_id) || "Bénéficiaire";

        return {
          id: w.id,
          userId: w.user_id,
          userName: name,
          amount: amt,
          fee,
          netAmount: net,
          paymentMethod: w.operator || w.payment_method || "T-Money",
          phoneNumber: w.phone || phoneMap.get(w.user_id) || "",
          accountName: name,
          status: w.status,
          adminNote: w.admin_note || w.note || null,
          createdAt: w.created_at,
        };
      });
    }
  } catch (err) {
    console.error("Erreur chargement retraits admin:", err);
  }

  // Fusionner avec le store persistant de retraits (pour garantir la visibilité de tout retrait)
  const stored = getAllStoredWithdrawals();
  if (stored && stored.length > 0) {
    stored.forEach((s) => {
      if (!seenIds.has(s.id)) {
        seenIds.add(s.id);
        formattedWithdrawals.push({
          id: s.id,
          userId: s.userId,
          userName: s.userName,
          amount: s.amount,
          fee: s.fee,
          netAmount: s.netAmount,
          paymentMethod: s.paymentMethod,
          phoneNumber: s.phoneNumber,
          accountName: s.accountName,
          status: s.status,
          adminNote: s.adminNote,
          payoutRef: s.payoutRef,
          payoutProvider: s.payoutProvider,
          createdAt: s.createdAt,
        });
      }
    });
  }

  // Tri par date décroissante
  formattedWithdrawals.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const pendingCount = formattedWithdrawals.filter((w) => w.status === "pending").length;

  return (
    <div className="max-w-4xl mx-auto py-3 sm:py-6 space-y-6">
      <AdminNavbar
        userEmail={userEmail}
        isSuperAdmin={isSuperAdmin}
        pendingWithdrawalsCount={pendingCount}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2.5 rounded-xl border border-vita-border bg-white hover:bg-vita-surface text-vita-muted hover:text-vita-deep transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-vita-deep mb-1">
              <ShieldCheck className="w-3 h-3 text-vita-medium" />
              <span>Back-Office Sécurisé</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-vita-deep">
              Validation des Retraits Mobile Money
            </h1>
          </div>
        </div>
      </div>

      <RetraitsClient initialWithdrawals={formattedWithdrawals} />
    </div>
  );
}
