import { redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { formatFCFA } from "@/lib/utils";
import { WithdrawalModal } from "@/components/WithdrawalModal";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Clock,
  History,
  AlertCircle,
  CheckCircle2,
  Hourglass,
  Layers,
  Smartphone,
  ExternalLink,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Portefeuille — Vita Earn",
};

interface WithdrawalItem {
  id: string;
  amount: number;
  net_amount: number;
  payment_method: string;
  phone_number: string;
  status: "pending" | "processing" | "approved" | "rejected" | "paid";
  admin_note?: string | null;
  created_at: string;
}

export default async function PortefeuillePage() {
  const cookieStore = cookies();
  const sessionUserCookie = cookieStore.get("vita_session_user")?.value;
  let sessionUser: any = null;
  if (sessionUserCookie) {
    try {
      sessionUser = JSON.parse(sessionUserCookie);
    } catch {}
  }
  const testUser = cookieStore.get("vita_test_user")?.value || sessionUser?.username;
  const isActivatedCookie = cookieStore.get("vita_account_activated")?.value === "true";

  const supabase = createClient();
  let user: any = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user || null;
  } catch {}

  // Si ni utilisateur Supabase ni utilisateur cookie/session, rediriger vers login
  if (!user && !sessionUser && !testUser) {
    redirect("/auth/login?redirect=/portefeuille");
  }

  let username = sessionUser?.username || testUser || "Utilisateur";
  let availableBalance = Number(sessionUser?.balance) || 0;
  let pendingBalance = 0;
  let totalEarned = Number(sessionUser?.profit) || Number(sessionUser?.balance) || 0;
  let totalWithdrawn = 0;

  let withdrawals: WithdrawalItem[] = [];
  let ledgerEntries: Array<{
    id: string;
    amount: number;
    entry_type: string;
    description: string;
    created_at: string;
  }> = [];

  let sumWithdrawnFromCookie = 0;

  // Lecture des retraits locaux depuis le cookie vita_withdrawals
  try {
    const rawW = cookieStore.get("vita_withdrawals")?.value;
    if (rawW) {
      const records = JSON.parse(rawW);
      if (Array.isArray(records) && records.length > 0) {
        const localWithdrawals: WithdrawalItem[] = records.map((r: any) => ({
          id: r.id || `w-${Date.now()}`,
          amount: Number(r.amount) || 0,
          net_amount: Number(r.netAmount || r.amount - 500) || 0,
          payment_method: r.paymentMethod || "T-Money",
          phone_number: r.phoneNumber || "",
          status: (r.status as any) || "processing",
          created_at: r.createdAt || new Date().toISOString(),
        }));
        withdrawals = [...localWithdrawals, ...withdrawals];
        sumWithdrawnFromCookie = records.reduce((acc: number, r: any) => acc + (Number(r.amount) || 0), 0);
        totalWithdrawn += sumWithdrawnFromCookie;
        availableBalance = Math.max(0, availableBalance - sumWithdrawnFromCookie);
      }
    }
  } catch {}

  if (user) {
    try {
      const [wbRes, withdrawalsRes, entriesRes] = await Promise.all([
        supabase
          .from("wallet_balances")
          .select("balance, available_balance, pending_balance, total_earned, total_withdrawn")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("withdrawals")
          .select("id, amount, net_amount, payment_method, phone_number, status, admin_note, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("ledger_entries")
          .select("id, amount, entry_type, description, created_at")
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      const wb = wbRes.data;
      if (wb) {
        availableBalance = Number(wb.available_balance ?? wb.balance) || 0;
        pendingBalance = Number(wb.pending_balance) || 0;
        totalEarned = Number(wb.total_earned) || 0;
        totalWithdrawn = Number(wb.total_withdrawn) || 0;
      }

      const userWithdrawals = withdrawalsRes.data;
      if (userWithdrawals && userWithdrawals.length > 0) {
        withdrawals = userWithdrawals as unknown as WithdrawalItem[];
      }

      const entries = entriesRes.data;
      if (entries && entries.length > 0) {
        ledgerEntries = entries.map((e) => ({
          id: e.id,
          amount: Number(e.amount),
          entry_type: e.entry_type,
          description: e.description,
          created_at: e.created_at,
        }));
      }
    } catch {
      // Supabase non connecté ou table vide
    }
  }

  if (sumWithdrawnFromCookie > 0) {
    availableBalance = Math.max(0, availableBalance - sumWithdrawnFromCookie);
  }

  const getStatusBadge = (status: WithdrawalItem["status"]) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
            <Hourglass className="w-3 h-3 text-amber-600 animate-pulse" />
            En attente
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3 text-blue-600" />
            En cours
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Approuvé
          </span>
        );
      case "paid":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-900 border border-green-300">
            <ShieldCheck className="w-3 h-3 text-green-700" />
            Payé (Mobile Money)
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3 text-red-600" />
            Refusé (Fonds restitués)
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto pt-2 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-vita-deep tracking-tight">
            Mon Portefeuille
          </h1>
          <p className="text-xs sm:text-sm text-vita-muted">
            Gestion sécurisée de vos soldes et retraits Mobile Money en direct.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/retrait"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-vita-primary hover:bg-vita-primary-hover text-white text-xs font-bold transition shadow-sm"
          >
            <Smartphone className="w-4 h-4 text-emerald-200" />
            <span>Retirer Mobile Money</span>
          </Link>
          <WithdrawalModal availableBalance={availableBalance} />
        </div>
      </div>

      {/* 1. Carte des Soldes Distincts (Solde disponible & Solde en attente) */}
      <div className="bg-gradient-to-br from-vita-deep via-vita-medium to-[#236014] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs uppercase tracking-wider text-white/75 font-bold flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-vita-bright" />
            Portefeuille Électronique
          </span>
          <span className="text-[11px] bg-white/15 px-3 py-1 rounded-full font-bold text-white/90 backdrop-blur">
            Grand livre immuable
          </span>
        </div>

        {/* Grille des 2 soldes principaux */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-white/15">
          {/* A. SOLDE DISPONIBLE */}
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/20">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-emerald-200 uppercase tracking-wide">
                Solde disponible
              </span>
              <span className="text-[10px] bg-emerald-500/30 text-emerald-100 px-2 py-0.5 rounded-full font-semibold">
                Retirable
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {formatFCFA(availableBalance)}
            </div>
            <span className="text-[11px] text-white/70 block mt-1">
              Disponible pour transfert immédiat
            </span>
          </div>

          {/* B. SOLDE EN ATTENTE */}
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/20">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-amber-200 uppercase tracking-wide">
                Solde en attente
              </span>
              <span className="text-[10px] bg-amber-500/30 text-amber-100 px-2 py-0.5 rounded-full font-semibold">
                En validation
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-200 tracking-tight">
              {formatFCFA(pendingBalance)}
            </div>
            <span className="text-[11px] text-white/70 block mt-1">
              Commissions en cours de consolidation
            </span>
          </div>
        </div>

        {/* Métriques Total encaissé & Total retiré */}
        <div className="grid grid-cols-2 gap-4 pt-5 text-xs">
          <div>
            <span className="text-white/70 block mb-0.5 font-medium">Total encaissé</span>
            <span className="font-extrabold text-base sm:text-lg text-vita-bright">
              {formatFCFA(totalEarned)}
            </span>
          </div>
          <div>
            <span className="text-white/70 block mb-0.5 font-medium">Total retiré</span>
            <span className="font-extrabold text-base sm:text-lg text-white">
              {formatFCFA(totalWithdrawn)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Demandes de Retrait récentes */}
      <div className="bg-white rounded-3xl border border-vita-border/90 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-vita-border/60 pb-3">
          <h2 className="text-sm font-bold text-vita-deep flex items-center gap-2">
            <Hourglass className="w-4 h-4 text-vita-medium" />
            <span>Historique des demandes de retrait</span>
          </h2>
          <div className="flex items-center gap-3">
            <Link
              href="/retrait/historique"
              className="text-xs font-bold text-vita-primary hover:underline flex items-center gap-1"
            >
              <span>Voir tout</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
            <span className="text-xs text-vita-muted">
              {withdrawals.length} demande{withdrawals.length > 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {withdrawals.length === 0 ? (
          <div className="py-6 text-center text-xs text-vita-muted">
            <p>Vous n'avez soumis aucune demande de retrait pour le moment.</p>
            <p className="text-[11px] mt-1 text-vita-muted/80">
              Dès 2 000 FCFA disponibles, cliquez sur &laquo; Demander un retrait &raquo;.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-vita-border/60">
            {withdrawals.map((w) => (
              <div key={w.id} className="py-3.5 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-vita-text">
                      {formatFCFA(w.amount)}
                    </span>
                    <span className="text-[11px] text-vita-muted uppercase font-bold">
                      ({w.payment_method})
                    </span>
                  </div>
                  <div>{getStatusBadge(w.status)}</div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-vita-muted">
                  <span>Numéro : {w.phone_number}</span>
                  <span>{new Date(w.created_at).toLocaleDateString("fr-FR")}</span>
                </div>

                {w.admin_note && (
                  <div className="p-2 rounded-lg bg-vita-surface text-[11px] text-vita-text border border-vita-border/60">
                    <strong className="text-vita-deep">Note admin :</strong> {w.admin_note}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Écritures du Grand Livre Immuable */}
      <div className="bg-white rounded-3xl border border-vita-border/90 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-vita-border/60 pb-3">
          <h2 className="text-sm font-bold text-vita-deep flex items-center gap-2">
            <History className="w-4 h-4 text-vita-medium" />
            <span>Grand livre financier (Journal audité)</span>
          </h2>
          <span className="text-xs text-vita-muted">
            {ledgerEntries.length} écriture{ledgerEntries.length > 1 ? "s" : ""}
          </span>
        </div>

        {ledgerEntries.length === 0 ? (
          <div className="py-6 text-center text-xs text-vita-muted">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">Aucune transaction enregistrée pour l'instant.</p>
          </div>
        ) : (
          <div className="divide-y divide-vita-border/60">
            {ledgerEntries.map((entry) => (
              <div key={entry.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      entry.amount >= 0
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {entry.amount >= 0 ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-vita-text">{entry.description}</p>
                    <p className="text-[10px] text-vita-muted">
                      {new Date(entry.created_at).toLocaleDateString("fr-FR")} à{" "}
                      {new Date(entry.created_at).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <span
                  className={`font-black ${
                    entry.amount >= 0 ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {entry.amount >= 0 ? "+" : ""}
                  {formatFCFA(entry.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
