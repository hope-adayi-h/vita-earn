import { redirect } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminUnlocked, checkAdminSession } from "@/lib/security/admin-lock";
import { formatFCFA } from "@/lib/utils";
import {
  ArrowLeft,
  Search,
  History,
  TrendingUp,
  User,
  CreditCard,
  Layers,
  ShieldCheck,
} from "lucide-react";

export const metadata = {
  title: "Inspection des Transactions — Administration",
};

interface PageProps {
  searchParams: { user?: string; tab?: string };
}

export default async function AdminTransactionsPage({ searchParams }: PageProps) {
  const { isAdmin } = await checkAdminSession();

  if (!isAdmin) {
    redirect("/auth/login?redirect=/admin/transactions");
  }

  const unlocked = await isAdminUnlocked();
  if (!unlocked) {
    redirect("/admin/lock");
  }

  const adminClient = createAdminClient();
  const activeTab = searchParams.tab || "commissions";
  const userFilter = searchParams.user?.trim();

  // 1. Charger les utilisateurs pour le sélecteur / filtre
  const { data: allProfiles } = await adminClient
    .from("profiles")
    .select("id, full_name, referral_code, role, is_activated")
    .order("created_at", { ascending: false })
    .limit(50);

  const profileMap = new Map(
    (allProfiles || []).map((p) => [p.id, p.full_name || p.referral_code || "Membre"])
  );

  // 2. Charger les commissions
  let commissionsQuery = adminClient
    .from("commissions")
    .select("id, beneficiary_id, buyer_id, level, amount, status, created_at, payment_id")
    .order("created_at", { ascending: false })
    .limit(50);

  if (userFilter) {
    commissionsQuery = commissionsQuery.or(
      `beneficiary_id.eq.${userFilter},buyer_id.eq.${userFilter}`
    );
  }

  const { data: commissions } = await commissionsQuery;

  // 3. Charger les écritures du grand livre (ledger_entries)
  let ledgerQuery = adminClient
    .from("ledger_entries")
    .select("id, wallet_id, amount, entry_type, description, reference_id, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: ledgerEntries } = await ledgerQuery;

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-8 space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          className="p-2.5 rounded-xl border border-vita-border bg-white hover:bg-vita-surface text-vita-muted hover:text-vita-deep transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-vita-deep">
            Inspection des Transactions & Commissions
          </h1>
          <p className="text-xs text-vita-muted">
            Journal complet des flux financiers et des commissions d'affiliation sur 3 niveaux.
          </p>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex border-b border-vita-border gap-2">
        <Link
          href={`/admin/transactions?tab=commissions${userFilter ? `&user=${userFilter}` : ""}`}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "commissions"
              ? "border-vita-deep text-vita-deep"
              : "border-transparent text-vita-muted hover:text-vita-text"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Commissions d'Affiliation ({commissions?.length || 0})</span>
        </Link>

        <Link
          href={`/admin/transactions?tab=ledger${userFilter ? `&user=${userFilter}` : ""}`}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "ledger"
              ? "border-vita-deep text-vita-deep"
              : "border-transparent text-vita-muted hover:text-vita-text"
          }`}
        >
          <History className="w-4 h-4" />
          <span>Grand Livre Immuable ({ledgerEntries?.length || 0})</span>
        </Link>
      </div>

      {/* Vue Commissions */}
      {activeTab === "commissions" && (
        <div className="bg-white rounded-3xl border border-vita-border/90 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-vita-border/60 pb-3">
            <h2 className="text-xs sm:text-sm font-bold text-vita-deep uppercase tracking-wider">
              Flux des Commissions Récentes
            </h2>
            <span className="text-[11px] text-vita-muted">
              N1: 2 000 F • N2: 1 000 F • N3: 500 F
            </span>
          </div>

          {!commissions || commissions.length === 0 ? (
            <div className="py-8 text-center text-xs text-vita-muted">
              Aucune commission enregistrée dans le système pour le moment.
            </div>
          ) : (
            <div className="divide-y divide-vita-border/60">
              {commissions.map((c) => (
                <div key={c.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-vita-deep">
                        {profileMap.get(c.beneficiary_id) || "Bénéficiaire"}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-green-100 text-green-800">
                        Niveau {c.level}
                      </span>
                    </div>
                    <p className="text-[11px] text-vita-muted">
                      Activé par :{" "}
                      <strong className="text-vita-text">
                        {profileMap.get(c.buyer_id) || "Filleul"}
                      </strong>{" "}
                      • {new Date(c.created_at).toLocaleDateString("fr-FR")} à{" "}
                      {new Date(c.created_at).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black text-emerald-700 block">
                      +{formatFCFA(c.amount)}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-vita-muted">
                      {c.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Vue Grand Livre */}
      {activeTab === "ledger" && (
        <div className="bg-white rounded-3xl border border-vita-border/90 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-vita-border/60 pb-3">
            <h2 className="text-xs sm:text-sm font-bold text-vita-deep uppercase tracking-wider">
              Écritures Comptables du Grand Livre
            </h2>
            <span className="text-[11px] text-vita-muted">Grand livre immuable</span>
          </div>

          {!ledgerEntries || ledgerEntries.length === 0 ? (
            <div className="py-8 text-center text-xs text-vita-muted">
              Aucune écriture comptable dans le grand livre.
            </div>
          ) : (
            <div className="divide-y divide-vita-border/60">
              {ledgerEntries.map((l) => (
                <div key={l.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-vita-text block">{l.description}</span>
                    <span className="text-[10px] text-vita-muted font-mono">
                      Type: {l.entry_type} • Date: {new Date(l.created_at).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  <span
                    className={`font-black ${
                      l.amount >= 0 ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {l.amount >= 0 ? "+" : ""}
                    {formatFCFA(l.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
