import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdminUnlocked, checkAdminSession } from "@/lib/security/admin-lock";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { formatFCFA } from "@/lib/utils";
import {
  Briefcase,
  ArrowLeft,
  Plus,
  CheckCircle2,
  Clock,
  MapPin,
  Building,
} from "lucide-react";

export const metadata = {
  title: "Gestion des Offres d'Emploi — Administration Vita Earn",
};

export default async function AdminEmploiPage() {
  const { isAdmin, isSuperAdmin, userEmail } = await checkAdminSession();

  if (!isAdmin) {
    redirect("/auth/login?redirect=/admin/emploi");
  }

  const unlocked = await isAdminUnlocked();
  if (!unlocked) {
    redirect("/admin/lock");
  }

  const jobOffers = [
    {
      id: "job_01",
      title: "Assistant Support Client & WhatsApp",
      company: "Vita Earn Support Hub",
      location: "Lomé, Togo (Télétravail)",
      salary: 75000,
      type: "Temps Partiel",
      status: "Actif",
      applicants: 12,
    },
    {
      id: "job_02",
      title: "Modérateur de Contenu Marketplace",
      company: "Rise Tech Group",
      location: "Télétravail (UEMOA)",
      salary: 60000,
      type: "Freelance",
      status: "Actif",
      applicants: 8,
    },
    {
      id: "job_03",
      title: "Créateur de Contenu Vidéo TikTok & Reels",
      company: "Partenaire Marketing",
      location: "À distance",
      salary: 50000,
      type: "Par mission",
      status: "Actif",
      applicants: 19,
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
            <span className="text-slate-900 font-bold">Emploi</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Emploi & Missions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Gestion des offres professionnelles et opportunités rémunérées publiées sur la plateforme.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0084FF] hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-xs shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Publier une offre d&apos;emploi</span>
        </button>
      </div>

      {/* Cartes KPI Emploi */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0084FF] border border-blue-100 flex items-center justify-center mb-3">
            <Briefcase className="w-5 h-5" />
          </div>
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Offres Actives
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {jobOffers.length} postes
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0084FF] border border-blue-100 flex items-center justify-center mb-3">
            <Building className="w-5 h-5" />
          </div>
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Candidatures Reçues
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            39 postulants
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Accès Recrutement
          </div>
          <div className="text-sm font-black text-slate-900 mt-2">
            Membres certifiés VitaEarn
          </div>
        </div>
      </div>

      {/* Liste des offres d'emploi */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 sm:p-6 space-y-4">
        <h2 className="text-base font-black text-slate-900">
          Liste des Postes et Missions Rémunérées
        </h2>

        <div className="divide-y divide-slate-100">
          {jobOffers.map((job) => (
            <div key={job.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0084FF] border border-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{job.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                    <span className="font-bold text-slate-700">{job.company}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {job.location}
                    </span>
                    <span>•</span>
                    <span className="font-black text-[#0084FF]">{formatFCFA(job.salary)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#0084FF] border border-blue-200">
                  {job.applicants} candidat(s)
                </span>
                <Link
                  href="/emploi"
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
