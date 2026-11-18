import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdminUnlocked, checkAdminSession } from "@/lib/security/admin-lock";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import {
  GraduationCap,
  ArrowLeft,
  BookOpen,
  Plus,
  CheckCircle2,
  Lock,
  Layers,
  Video,
} from "lucide-react";

export const metadata = {
  title: "Formation Vita Earn — Administration Vita Earn",
};

export default async function AdminFormationsPage() {
  const { isAdmin, isSuperAdmin, userEmail } = await checkAdminSession();

  if (!isAdmin) {
    redirect("/auth/login?redirect=/admin/formations");
  }

  const unlocked = await isAdminUnlocked();
  if (!unlocked) {
    redirect("/admin/lock");
  }

  const formationsList = [
    {
      id: "form_01",
      title: "E-Commerce & Vente en Ligne en Afrique de l'Ouest",
      modulesCount: 6,
      duration: "3h 45m",
      category: "Business",
      status: "Publié",
      access: "Abonnés Activés (4 500 FCFA)",
    },
    {
      id: "form_02",
      title: "Stratégies d'Affiliation & Monétisation WhatsApp & TikTok",
      modulesCount: 8,
      duration: "4h 20m",
      category: "Marketing",
      status: "Publié",
      access: "Abonnés Activés (4 500 FCFA)",
    },
    {
      id: "form_03",
      title: "Intelligence Artificielle & Outils Digitaux pour Freelances",
      modulesCount: 5,
      duration: "2h 30m",
      category: "Technologie",
      status: "Publié",
      access: "Abonnés Activés (4 500 FCFA)",
    },
    {
      id: "form_04",
      title: "Gestion Financière Personnelle & Mobile Money",
      modulesCount: 4,
      duration: "1h 50m",
      category: "Finance",
      status: "Publié",
      access: "Abonnés Activés (4 500 FCFA)",
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
            <span className="text-slate-900 font-bold">Formation Vita Earn</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Formation Vita Earn
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Gestion des programmes pédagogiques inclus dans l&apos;abonnement membre.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0084FF] hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-xs shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter une formation</span>
        </button>
      </div>

      {/* Cartes KPI Formations */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0084FF] border border-blue-100 flex items-center justify-center mb-3">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Formations Actives
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {formationsList.length} programmes
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0084FF] border border-blue-100 flex items-center justify-center mb-3">
            <Video className="w-5 h-5" />
          </div>
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Total Modules Vidéo
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            23 chapitres
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Accès Membres
          </div>
          <div className="text-sm font-black text-slate-900 mt-2">
            Inclus dès activation du compte
          </div>
        </div>
      </div>

      {/* Liste des formations */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 sm:p-6 space-y-4">
        <h2 className="text-base font-black text-slate-900">
          Catalogue des Programmes de Formation
        </h2>

        <div className="divide-y divide-slate-100">
          {formationsList.map((form) => (
            <div key={form.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0084FF] border border-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{form.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">{form.category}</span>
                    <span>•</span>
                    <span>{form.modulesCount} modules</span>
                    <span>•</span>
                    <span>{form.duration}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {form.status}
                </span>
                <Link
                  href="/formations"
                  className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
                >
                  Visualiser
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
