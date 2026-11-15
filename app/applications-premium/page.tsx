import Link from "next/link";
import { Sparkles, ChevronLeft, Download, ShieldCheck, Lock } from "lucide-react";

export const metadata = {
  title: "Applications Premium — Vita Earn",
  description: "Applications et outils numériques exclusifs pour les membres Vita Earn.",
};

export default function ApplicationsPremiumPage() {
  const apps = [
    {
      name: "Vita Auto-Poster WhatsApp & Socials",
      category: "Marketing & Automatisation",
      version: "v2.4 Pro",
      desc: "Outil permettant de publier automatiquement vos liens de parrainage et produits dans vos groupes et statuts.",
      isFreeForActive: true,
    },
    {
      name: "Canva Pro & Templates E-commerce 2026",
      category: "Design & Création",
      version: "Pack Illimité",
      desc: "Plus de 500 modèles de bannières publicitaires et visuels professionnels prêts à l'emploi.",
      isFreeForActive: true,
    },
    {
      name: "Générateur de Scripts Vidéo IA",
      category: "Intelligence Artificielle",
      version: "Cloud App",
      desc: "Créez des textes publicitaires percutants en français pour booster vos ventes et attirer des filleuls.",
      isFreeForActive: true,
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
          <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full">
            Réservé aux Membres
          </span>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-100 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-vita-deep">Applications Premium</h1>
              <p className="text-xs sm:text-sm text-vita-muted">
                Logiciels et outils numériques inclus avec votre abonnement
              </p>
            </div>
          </div>

          <div className="p-4 bg-vita-surface rounded-2xl border border-vita-border/80 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-vita-medium shrink-0 mt-0.5" />
            <p className="text-xs text-vita-text leading-relaxed">
              Ces applications sont accessibles sans frais supplémentaires pour tous les membres ayant activé leur compte Vita Earn (4 500 FCFA).
            </p>
          </div>

          <div className="space-y-4">
            {apps.map((app, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl border border-gray-200 bg-gray-50/50 hover:bg-white hover:border-amber-300 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-gray-900">{app.name}</h2>
                    <span className="text-[11px] text-gray-500">{app.category} • {app.version}</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full w-fit">
                    Inclus avec adhésion
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{app.desc}</p>
                <div className="pt-1">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-vita-deep hover:bg-vita-medium text-white font-bold text-xs shadow-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Télécharger / Accéder</span>
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
