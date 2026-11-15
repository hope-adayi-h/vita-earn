import Link from "next/link";
import { Briefcase, ChevronLeft, MapPin, Clock, ArrowRight, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Emploi & Recrutement — Vita Earn",
  description: "Offres d'emploi et opportunités de travail avec Vita Earn.",
};

export default function EmploiPage() {
  const jobs = [
    {
      title: "Ambassadeur Régional / Animateur Communautaire",
      location: "Lomé, Togo & Télétravail",
      type: "Temps partiel / Freelance",
      reward: "Commissions + Primes mensuelles",
      desc: "Animer les groupes WhatsApp/Telegram régionaux, former les nouveaux membres et promouvoir la plateforme.",
    },
    {
      title: "Créateur de Contenu & Partenaire Vidéo (TikTok / Reels)",
      location: "Télétravail (Afrique de l'Ouest)",
      type: "Rémunération à la tâche",
      reward: "5 000 F à 25 000 F par vidéo approuvée",
      desc: "Créer des courtes vidéos explicatives et tutoriels sur les retraits et les fonctionnalités Vita Earn.",
    },
    {
      title: "Modérateur Marketplace & Support Vendeurs",
      location: "Lomé, Togo",
      type: "Temps plein",
      reward: "Salaire fixe + intéressement",
      desc: "Vérifier la conformité des produits physiques et digitaux soumis avant publication sur la marketplace.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F4F7F0] py-6 sm:py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-vita-deep hover:underline"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Retour à l'accueil</span>
          </Link>
          <span className="text-[11px] font-bold text-indigo-800 bg-indigo-100 px-2.5 py-1 rounded-full">
            Recrutement Ouvert
          </span>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-100 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-vita-deep">Espace Emploi</h1>
              <p className="text-xs sm:text-sm text-vita-muted">
                Opportunités de collaboration et missions rémunérées Vita Earn
              </p>
            </div>
          </div>

          <div className="p-4 bg-vita-surface rounded-2xl border border-vita-border/80 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-vita-medium shrink-0 mt-0.5" />
            <p className="text-xs text-vita-text leading-relaxed">
              Toutes les offres d'emploi officielles Vita Earn sont gratuites. Ne versez jamais de frais pour postuler à un poste.
            </p>
          </div>

          <div className="space-y-4">
            {jobs.map((job, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl border border-gray-200 hover:border-indigo-300 bg-gray-50/50 hover:bg-white transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h2 className="text-sm sm:text-base font-bold text-gray-900">{job.title}</h2>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded w-fit">
                    {job.reward}
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{job.desc}</p>
                <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-500 pt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    {job.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    {job.type}
                  </span>
                </div>
                <a
                  href="mailto:recrutement@vitaearn.com?subject=Candidature%20Vita%20Earn"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 pt-1"
                >
                  <span>Postuler par e-mail</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
