import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdminUnlocked, checkAdminSession } from "@/lib/security/admin-lock";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import {
  Smartphone,
  ArrowLeft,
  Plus,
  CheckCircle2,
  Download,
  Layers,
  Sparkles,
} from "lucide-react";

export const metadata = {
  title: "Application Vita L — Administration Vita Earn",
};

export default async function AdminApplicationsPage() {
  const { isAdmin, isSuperAdmin, userEmail } = await checkAdminSession();

  if (!isAdmin) {
    redirect("/auth/login?redirect=/admin/applications");
  }

  const unlocked = await isAdminUnlocked();
  if (!unlocked) {
    redirect("/admin/lock");
  }

  const appList = [
    {
      id: "app_01",
      name: "Application Vita L (Mobile Android APK)",
      version: "v2.4.0",
      category: "Application Mobile",
      status: "Actif",
      downloads: 342,
      access: "Tous les membres activés",
    },
    {
      id: "app_02",
      name: "Générateur d'Annonces & Visuels IA",
      version: "v1.2.1",
      category: "Outil Digital",
      status: "Actif",
      downloads: 189,
      access: "Abonnés 4 500 FCFA",
    },
    {
      id: "app_03",
      name: "Calculateur de Commissions & Équipe",
      version: "v1.0.4",
      category: "Outil d'Affiliation",
      status: "Actif",
      downloads: 215,
      access: "Tous les membres",
    },
    {
      id: "app_04",
      name: "Auto-Poster WhatsApp Business",
      version: "v1.1.0",
      category: "Automatisation",
      status: "En révision",
      downloads: 98,
      access: "Accès Premium",
    },
  ];

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
            <span className="text-slate-900 font-bold">Application Vita L</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Application Vita L & Outils Premium
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Gestion des applications, fichiers APK et outils numériques mis à disposition des membres.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0084FF] hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-xs shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter une application</span>
        </button>
      </div>

      {/* Cartes KPI Applications */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0084FF] border border-blue-100 flex items-center justify-center mb-3">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Applications Déployées
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {appList.length} applications
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0084FF] border border-blue-100 flex items-center justify-center mb-3">
            <Download className="w-5 h-5" />
          </div>
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Total Téléchargements
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            844 installs
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Dernière Version APK
          </div>
          <div className="text-sm font-black text-slate-900 mt-2">
            Vita L v2.4.0 (Stable)
          </div>
        </div>
      </div>

      {/* Liste des applications */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 sm:p-6 space-y-4">
        <h2 className="text-base font-black text-slate-900">
          Applications & Logiciels VitaEarn
        </h2>

        <div className="divide-y divide-slate-100">
          {appList.map((app) => (
            <div key={app.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0084FF] border border-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{app.name}</h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                    <span className="font-bold text-[#0084FF]">{app.version}</span>
                    <span>•</span>
                    <span>{app.category}</span>
                    <span>•</span>
                    <span>{app.downloads} téléchargements</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                  app.status === "Actif"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}>
                  {app.status}
                </span>
                <Link
                  href="/applications-premium"
                  className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
                >
                  Voir sur le site
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
