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

  try {
    const adminClient = createAdminClient();
    const { data: withdrawals } = await adminClient
      .from("withdrawals")
      .select("id, user_id, amount, fee, net_amount, payment_method, phone_number, account_name, status, admin_note, created_at")
      .order("created_at", { ascending: false });

    if (withdrawals && withdrawals.length > 0) {
      const userIds = Array.from(new Set(withdrawals.map((w) => w.user_id)));
      const { data: profiles } = await adminClient
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      const profileMap = new Map((profiles || []).map((p) => [p.id, p.full_name]));

      formattedWithdrawals = withdrawals.map((w) => ({
        id: w.id,
        userId: w.user_id,
        userName: profileMap.get(w.user_id) || "Utilisateur",
        amount: Number(w.amount),
        fee: Number(w.fee),
        netAmount: Number(w.net_amount),
        paymentMethod: w.payment_method,
        phoneNumber: w.phone_number,
        accountName: w.account_name,
        status: w.status,
        adminNote: w.admin_note,
        createdAt: w.created_at,
      }));
    }
  } catch {}

  // Repli résilient si Supabase est hors-ligne ou vide
  if (formattedWithdrawals.length === 0) {
    const stored = getAllStoredWithdrawals();
    formattedWithdrawals = stored.map((w) => ({
      id: w.id,
      userId: w.userId,
      userName: w.userName,
      amount: w.amount,
      fee: w.fee,
      netAmount: w.netAmount,
      paymentMethod: w.paymentMethod,
      phoneNumber: w.phoneNumber,
      accountName: w.accountName,
      status: w.status,
      adminNote: w.adminNote,
      createdAt: w.createdAt,
    }));
  }

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
