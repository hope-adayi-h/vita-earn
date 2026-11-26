import Link from "next/link";
import {
  GraduationCap,
  ChevronLeft,
  Download,
  ShieldCheck,
  BookOpen,
} from "lucide-react";
import { fetchAndSyncFormations } from "@/lib/data/formations-store";

export const metadata = {
  title: "Formations & Ressources — Vita Earn",
  description: "Catalogue officiel des formations et documents pédagogiques pour les membres Vita Earn.",
};

export const dynamic = "force-dynamic";

export default async function FormationsPage() {
  const formations = await fetchAndSyncFormations();

  return (
    <div className="min-h-screen bg-[#F4F7F0] py-6 sm:py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Barre supérieure */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B4D0F] hover:underline min-h-[44px]"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Retour à l&apos;accueil</span>
          </Link>
          <span className="text-[11px] font-bold text-[#1B4D0F] bg-[#7ED321]/25 px-3 py-1 rounded-full">
            Programme Pédagogique
          </span>
        </div>

        {/* Conteneur principal */}
        <div className="bg-white rounded-[28px] p-5 sm:p-8 shadow-xs border border-slate-200/80 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#1B4D0F] text-[#7ED321] flex items-center justify-center shrink-0 shadow-xs">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#14201A] tracking-tight">
                Formations Vita Earn
              </h1>
              <p className="text-xs sm:text-sm text-[#5B6B60]">
                Ressources et guides pratiques inclus avec votre adhésion
              </p>
            </div>
          </div>

          <div className="p-4 bg-[#F4F7F0] rounded-2xl border border-[#1B4D0F]/15 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#2F7A1A] shrink-0 mt-0.5" />
            <p className="text-xs text-[#14201A] leading-relaxed font-medium">
              Votre adhésion de 4 500 FCFA vous donne accès aux formations officielles publiées par l&apos;administration. Cliquez sur <strong>Télécharger la formation</strong> pour accéder au document ou à la ressource.
            </p>
          </div>

          {/* Liste des formations */}
          {formations.length === 0 ? (
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200/80 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-[#2F7A1A] flex items-center justify-center mx-auto">
                <BookOpen className="w-6 h-6" />
              </div>
              <h2 className="text-sm font-black text-[#14201A]">
                Aucune formation disponible pour le moment
              </h2>
              <p className="text-xs text-[#5B6B60] max-w-sm mx-auto">
                De nouvelles formations et ressources pédagogiques seront bientôt ajoutées par l&apos;administration.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5">
              {formations.map((formation) => (
                <article
                  key={formation.id}
                  className="rounded-3xl border border-slate-200 bg-white overflow-hidden hover:border-[#2F7A1A]/50 hover:shadow-sm transition-all flex flex-col"
                >
                  {/* Image de couverture */}
                  <div className="w-full h-48 sm:h-56 bg-slate-100 relative overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formation.imageUrl}
                      alt={formation.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Contenu */}
                  <div className="p-5 sm:p-6 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <h2 className="text-base sm:text-lg font-black text-[#14201A] leading-snug">
                        {formation.title}
                      </h2>
                      <p className="text-xs sm:text-sm text-[#5B6B60] leading-relaxed whitespace-pre-line">
                        {formation.description}
                      </p>
                    </div>

                    <div className="pt-2">
                      <a
                        href={formation.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-[#1B4D0F] hover:bg-[#2F7A1A] active:scale-98 text-white font-black text-xs sm:text-sm shadow-xs transition-all inline-flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4 text-[#7ED321]" />
                        <span>Télécharger la formation</span>
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
