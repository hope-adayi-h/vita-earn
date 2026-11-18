import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdminUnlocked, checkAdminSession } from "@/lib/security/admin-lock";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import {
  Zap,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Cpu,
  Sliders,
  AlertTriangle,
} from "lucide-react";

export const metadata = {
  title: "Paiement Automatique — Administration Vita Earn",
};

export default async function AdminPaiementsAutoPage() {
  const { isAdmin, isSuperAdmin, userEmail } = await checkAdminSession();

  if (!isAdmin) {
    redirect("/auth/login?redirect=/admin/paiements-auto");
  }

  const unlocked = await isAdminUnlocked();
  if (!unlocked) {
    redirect("/admin/lock");
  }

  return (
    <div className="space-y-6">
      <AdminNavbar
        userEmail={userEmail}
        isSuperAdmin={isSuperAdmin}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link href="/admin" className="hover:text-[#0084FF] flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Tableau de bord</span>
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-bold">Paiement Automatique</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Paiement Automatique
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Automatisation des décaissements et passerelles d&apos;ordonnancement direct Mobile Money.
          </p>
        </div>
      </div>

      {/* État des passerelles d'exécution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0084FF] border border-blue-100 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Passerelle T-Money Auto</h2>
                <p className="text-xs text-slate-500">Togo Telecom / Yas Togo</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
              Opérationnel
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Exécution instantanée des demandes de retrait T-Money validées par l&apos;administrateur.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0084FF] border border-blue-100 flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Passerelle Moov Flooz Auto</h2>
                <p className="text-xs text-slate-500">Moov Africa Togo</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
              Opérationnel
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Ordonnancement direct sur les comptes marchands et numéros vérifiés Flooz.
          </p>
        </div>
      </div>

      {/* Règles de sécurité pour les paiements automatiques */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900">
              Garde-fous de Sécurité Financière
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Paramètres stricts régissant l&apos;approbation automatique des retraits.
            </p>
          </div>
        </div>

        <div className="space-y-3 divide-y divide-slate-100 text-xs sm:text-sm">
          <div className="flex items-center justify-between pt-3">
            <div>
              <div className="font-bold text-slate-900">Contrôle anti-fraude double validation</div>
              <div className="text-xs text-slate-500">Exige la validation de l&apos;administrateur pour tout montant &gt; 25 000 FCFA.</div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-50 text-[#0084FF] border border-blue-200">
              Actif
            </span>
          </div>

          <div className="flex items-center justify-between pt-3">
            <div>
              <div className="font-bold text-slate-900">Vérification de l&apos;activation du compte</div>
              <div className="text-xs text-slate-500">Seuls les membres avec statut activé peuvent recevoir un paiement.</div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
              Obligatoire
            </span>
          </div>

          <div className="flex items-center justify-between pt-3">
            <div>
              <div className="font-bold text-slate-900">Journal immuable Grand Livre</div>
              <div className="text-xs text-slate-500">Écriture instantanée dans ledger_entries lors de chaque décaissement.</div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-800">
              Immuable
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
