import Link from "next/link";
import { GraduationCap, ChevronLeft, BookOpen, Clock, Play, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Formations & Ressources — Vita Earn",
  description: "Formations et compétences pratiques offertes avec votre abonnement Vita Earn.",
};

export default function FormationsPage() {
  const courses = [
    {
      title: "Maîtriser le Marketing d'Affiliation en Afrique francophone",
      duration: "4 heures • 12 modules",
      level: "Débutant à Intermédiaire",
      desc: "Apprenez les méthodes éthiques et légales pour développer un réseau d'abonnés solide et générer des revenus récurrents.",
    },
    {
      title: "Créer et Vendre ses Produits Digitaux sur la Marketplace",
      duration: "3 heures • 8 modules",
      level: "Tous niveaux",
      desc: "De la création d'un e-book ou tutoriel PDF jusqu'à sa publication et sa vente automatisée via Mobile Money.",
    },
    {
      title: "Stratégies WhatsApp Business & Publicité Facebook Mobile",
      duration: "5 heures • 15 modules",
      level: "Intermédiaire",
      desc: "Optimisez votre profil WhatsApp, configurez vos réponses automatiques et créez des campagnes publicitaires rentables.",
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
          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
            Programme Pédagogique
          </span>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-100 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-vita-deep">Formations Vita Earn</h1>
              <p className="text-xs sm:text-sm text-vita-muted">
                Développez vos compétences numériques et votre indépendance financière
              </p>
            </div>
          </div>

          <div className="p-4 bg-vita-surface rounded-2xl border border-vita-border/80 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-vita-medium shrink-0 mt-0.5" />
            <p className="text-xs text-vita-text leading-relaxed">
              Votre adhésion annuelle de 4 500 FCFA débloque l'accès complet et illimité à l'ensemble du catalogue de formations et aux mises à jour.
            </p>
          </div>

          <div className="space-y-4">
            {courses.map((course, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl border border-gray-200 bg-gray-50/50 hover:bg-white hover:border-emerald-300 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h2 className="text-sm sm:text-base font-bold text-gray-900">{course.title}</h2>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full w-fit">
                    Accès Inclus
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{course.desc}</p>
                <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-500 pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    {course.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-gray-400" />
                    {course.level}
                  </span>
                </div>
                <div className="pt-1">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-vita-deep hover:bg-vita-medium text-white font-bold text-xs shadow-xs transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Commencer le cours</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
