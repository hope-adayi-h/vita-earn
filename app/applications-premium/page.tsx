import Link from "next/link";
import {
  Sparkles,
  ChevronLeft,
  ShieldCheck,
  ExternalLink,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { fetchAndSyncPremiumApps } from "@/lib/data/premium-apps-store";
import { PremiumAppLogo } from "@/components/PremiumAppLogo";

export const metadata = {
  title: "Applications Premium — Vita Earn",
  description:
    "Applications et abonnements premium exclusifs inclus pour les membres Vita Earn : Netflix Premium, Vita Canal+, Gemini Pro 12 mois, Telegram.",
};

export const dynamic = "force-dynamic";

export default async function ApplicationsPremiumPage() {
  const apps = await fetchAndSyncPremiumApps();

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
          <span className="text-[11px] font-bold text-[#1B4D0F] bg-[#7ED321]/20 border border-[#7ED321]/40 px-3 py-1 rounded-full">
            Exclusif Membres Activés
          </span>
        </div>

        {/* Conteneur principal */}
        <div className="bg-white rounded-[28px] p-5 sm:p-8 shadow-xs border border-slate-200/80 space-y-6">
          {/* En-tête */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#1B4D0F] text-[#7ED321] flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#14201A] tracking-tight">
                Applications Premium
              </h1>
              <p className="text-xs sm:text-sm text-[#5B6B60]">
                Accès et outils numériques inclus avec votre compte Vita Earn
              </p>
            </div>
          </div>

          {/* Bannière info adhésion */}
          <div className="p-4 bg-[#F4F7F0] rounded-2xl border border-[#1B4D0F]/15 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#2F7A1A] shrink-0 mt-0.5" />
            <p className="text-xs text-[#14201A] leading-relaxed font-medium">
              Ces applications sont mises à disposition sans frais supplémentaires pour les membres ayant activé leur compte Vita Earn (4 500 FCFA). Cliquez sur <strong>Obtenir</strong> devant l&apos;application souhaitée pour y accéder.
            </p>
          </div>

          {/* Liste des 4 Applications dans l'ordre exact */}
          <div className="space-y-4">
            {apps.map((app) => {
              const hasLink = Boolean(app.targetUrl && app.targetUrl.trim().length > 0);
              const isAvailable = !app.isComingSoon && hasLink;

              return (
                <div
                  key={app.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isAvailable
                      ? "bg-white border-slate-200 hover:border-[#2F7A1A]/50 hover:shadow-sm"
                      : "bg-slate-50/80 border-slate-200/80"
                  }`}
                >
                  {/* Gauche : Logo + Infos */}
                  <div className="flex items-start gap-4 min-w-0">
                    <PremiumAppLogo appId={app.id} className="w-14 h-14" />
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-sm sm:text-base font-black text-[#14201A]">
                          {app.name}
                        </h2>
                        {isAvailable ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#1B4D0F] bg-[#7ED321]/25 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Disponible</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" />
                            <span>Bientôt disponible</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-bold text-[#2F7A1A]">{app.subtitle}</p>
                      <p className="text-xs text-[#5B6B60] leading-relaxed">
                        {app.description}
                      </p>
                    </div>
                  </div>

                  {/* Droite : Bouton Obtenir ou Bientôt disponible */}
                  <div className="shrink-0 sm:pl-2">
                    {isAvailable ? (
                      <a
                        href={app.targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-[#1B4D0F] hover:bg-[#2F7A1A] active:scale-98 text-white font-black text-xs sm:text-sm shadow-xs transition-all inline-flex items-center justify-center gap-2"
                      >
                        <span>Obtenir</span>
                        <ExternalLink className="w-4 h-4 text-[#7ED321]" />
                      </a>
                    ) : (
                      <span
                        aria-disabled="true"
                        className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-200/80 text-slate-500 font-bold text-xs inline-flex items-center justify-center gap-1.5 cursor-not-allowed select-none"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Bientôt disponible</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
