"use client";

import { useEffect, useState } from "react";
import { Video, Radio, BellRing, ExternalLink, X, Clock, Calendar, Sparkles } from "lucide-react";
import type { LiveAlertPayload, LiveConference } from "@/lib/data/live-store";
import { getLiveAlertsAction } from "@/app/live/actions";

export function LiveHomepageBanner() {
  const [alerts, setAlerts] = useState<LiveAlertPayload | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadAlerts() {
      try {
        const res = await getLiveAlertsAction();
        if (isMounted && res.ok && res.alerts) {
          setAlerts(res.alerts);
        }
      } catch (err) {
        console.error("Erreur chargement alertes live:", err);
      }
    }

    loadAlerts();
    const interval = setInterval(loadAlerts, 60000); // Mise à jour chaque minute

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (dismissed || !alerts) return null;

  const { activeLive, imminentLive, tomorrowLive } = alerts;

  // 1. LIVE EN DIRECT MAINTENANT (Priorité 1 absolue : Alerte modale / flottante rouge vive)
  if (activeLive) {
    return (
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-50 animate-in slide-in-from-bottom-5 duration-300">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-950 via-slate-900 to-red-900 text-white p-5 shadow-2xl border-2 border-red-500 shadow-red-600/30">
          {/* Bouton fermer */}
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="absolute top-3 right-3 p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="space-y-3 pr-6">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-[11px] font-black uppercase tracking-wider animate-pulse shadow-xs">
                <Radio className="w-3 h-3" />
                Live En Direct
              </span>
              <span className="text-[11px] text-red-200 truncate">
                {activeLive.category}
              </span>
            </div>

            <div>
              <h4 className="text-sm sm:text-base font-extrabold text-white leading-tight">
                {activeLive.title}
              </h4>
              <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                {activeLive.description}
              </p>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-300">
              <span>Par <strong>{activeLive.applicantName}</strong></span>
              <span>•</span>
              <span>Salle ouverte</span>
            </div>

            <div className="pt-1 flex items-center gap-2">
              <a
                href={activeLive.meetUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setDismissed(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs shadow-md shadow-red-600/40 hover:scale-102 active:scale-98 transition-all flex-1"
              >
                <Video className="w-4 h-4 animate-bounce" />
                <span>Participer au live</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={() => setDismissed(true)}
                className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Plus tard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. LIVE COMMENCE DANS MOINS DE 10 MINUTES
  if (imminentLive) {
    return (
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-50 animate-in slide-in-from-bottom-5 duration-300">
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-5 shadow-2xl border-2 border-amber-500 shadow-amber-500/20">
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="absolute top-3 right-3 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="space-y-3 pr-6">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-[11px] font-black uppercase tracking-wider animate-pulse shadow-xs">
                <Clock className="w-3 h-3" />
                Démarre dans quelques minutes
              </span>
            </div>

            <div>
              <h4 className="text-sm font-extrabold text-white leading-tight">
                {imminentLive.title}
              </h4>
              <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                Présenté par {imminentLive.applicantName} à {imminentLive.scheduledTime} GMT.
              </p>
            </div>

            <div className="pt-1 flex items-center gap-2">
              <a
                href={imminentLive.meetUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setDismissed(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-md hover:scale-102 transition-all flex-1"
              >
                <Video className="w-4 h-4" />
                <span>Rejoindre la salle Google Meet</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={() => setDismissed(true)}
                className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. RAPPEL 24H AVANT POUR LES UTILISATEURS ABONNÉS À LA CLOCHE
  if (tomorrowLive) {
    return (
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-50 animate-in slide-in-from-bottom-5 duration-300">
        <div className="relative overflow-hidden rounded-3xl bg-white text-slate-900 p-5 shadow-2xl border-2 border-emerald-500 shadow-emerald-500/10">
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="absolute top-3 right-3 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="space-y-3 pr-6">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-[#1B4D0F] text-[11px] font-bold">
                <BellRing className="w-3 h-3 text-[#1B4D0F]" />
                Rappel de votre session Live
              </span>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900 leading-tight">
                {tomorrowLive.title}
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                Votre conférence commence demain à <strong>{tomorrowLive.scheduledTime} GMT</strong> avec {tomorrowLive.applicantName}.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDismissed(true)}
                className="px-4 py-2 rounded-xl bg-[#1B4D0F] hover:bg-[#2F7A1A] text-white font-bold text-xs transition-colors cursor-pointer flex-1 text-center"
              >
                J&apos;ai noté, merci
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
