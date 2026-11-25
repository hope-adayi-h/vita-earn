"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Link2,
  Save,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Clock,
  Sparkles,
  Loader2,
} from "lucide-react";
import { PremiumAppLogo } from "@/components/PremiumAppLogo";
import { savePremiumAppAction } from "./actions";
import type { PremiumAppId, StoredPremiumApp } from "@/lib/data/premium-apps-store";

interface AdminApplicationsClientProps {
  initialApps: StoredPremiumApp[];
}

export function AdminApplicationsClient({ initialApps }: AdminApplicationsClientProps) {
  const [apps, setApps] = useState<StoredPremiumApp[]>(initialApps);
  const [urls, setUrls] = useState<Record<PremiumAppId, string>>(() => {
    const map = {} as Record<PremiumAppId, string>;
    for (const app of initialApps) {
      map[app.id] = app.targetUrl || "";
    }
    return map;
  });
  const [comingSoonMap, setComingSoonMap] = useState<Record<PremiumAppId, boolean>>(() => {
    const map = {} as Record<PremiumAppId, boolean>;
    for (const app of initialApps) {
      map[app.id] = Boolean(app.isComingSoon);
    }
    return map;
  });

  const [savingId, setSavingId] = useState<PremiumAppId | null>(null);
  const [feedback, setFeedback] = useState<{
    appId: PremiumAppId;
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSave = (appId: PremiumAppId) => {
    setFeedback(null);
    setSavingId(appId);

    startTransition(async () => {
      const res = await savePremiumAppAction({
        id: appId,
        targetUrl: urls[appId] || "",
        isComingSoon: Boolean(comingSoonMap[appId]),
      });

      setSavingId(null);

      if (res.success && res.apps) {
        setApps(res.apps);
        setFeedback({
          appId,
          type: "success",
          text: res.message || "Enregistré avec succès.",
        });
      } else {
        setFeedback({
          appId,
          type: "error",
          text: res.error || "Impossible d'enregistrer les modifications.",
        });
      }
    });
  };

  const activeReadyCount = apps.filter((a) => !a.isComingSoon && Boolean(a.targetUrl)).length;

  return (
    <div className="space-y-6">
      {/* Résumé rapide */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center mb-3">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Applications configurées
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {apps.length} applications
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0084FF] border border-blue-100 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Prêtes au téléchargement
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {activeReadyCount} / {apps.length} actives
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">
              Aperçu côté membre
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Vérifiez l&apos;affichage final des logos et des boutons « Obtenir ».
            </p>
          </div>
          <Link
            href="/applications-premium"
            target="_blank"
            className="mt-3 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors w-fit"
          >
            <span>Voir sur le site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Liste des 4 Applications Premium */}
      <div className="space-y-4">
        {apps.map((app) => {
          const isComingSoon = Boolean(comingSoonMap[app.id]);
          const currentUrl = urls[app.id] || "";
          const isSavingThis = isPending && savingId === app.id;
          const appFeedback = feedback?.appId === app.id ? feedback : null;

          return (
            <div
              key={app.id}
              className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-6 space-y-4"
            >
              {/* En-tête de la carte */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <PremiumAppLogo appId={app.id} className="w-12 h-12" />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        Position #{app.order}
                      </span>
                      <h2 className="text-base font-black text-slate-900">{app.name}</h2>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{app.subtitle}</p>
                  </div>
                </div>

                {/* Statut actuel */}
                <div className="flex items-center gap-2 shrink-0">
                  {isComingSoon ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Bientôt disponible</span>
                    </span>
                  ) : currentUrl.trim() ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Bouton « Obtenir » actif</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      <span>Lien à renseigner</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Champ de lien + Bascule Bientôt disponible */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end pt-2 border-t border-slate-100">
                <div className="lg:col-span-7 space-y-1.5">
                  <label
                    htmlFor={`url-${app.id}`}
                    className="text-xs font-bold text-slate-700 flex items-center gap-1.5"
                  >
                    <Link2 className="w-3.5 h-3.5 text-[#0084FF]" />
                    <span>Lien de redirection (Site web, Google Drive, vidéo ou téléchargement)</span>
                  </label>
                  <input
                    id={`url-${app.id}`}
                    type="url"
                    value={currentUrl}
                    onChange={(e) =>
                      setUrls((prev) => ({ ...prev, [app.id]: e.target.value }))
                    }
                    placeholder="https://drive.google.com/... ou https://..."
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:border-[#0084FF] transition-colors"
                  />
                </div>

                <div className="lg:col-span-3">
                  <button
                    type="button"
                    onClick={() =>
                      setComingSoonMap((prev) => ({ ...prev, [app.id]: !prev[app.id] }))
                    }
                    className={`w-full min-h-[44px] px-3 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      isComingSoon
                        ? "bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100"
                        : "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100"
                    }`}
                  >
                    {isComingSoon ? (
                      <>
                        <Clock className="w-3.5 h-3.5" />
                        <span>Mode : Bientôt disponible</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mode : Disponible</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="lg:col-span-2">
                  <button
                    type="button"
                    disabled={isSavingThis}
                    onClick={() => handleSave(app.id)}
                    className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#0084FF] hover:bg-blue-600 active:scale-98 disabled:opacity-60 text-white text-xs font-black transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isSavingThis ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Envoi...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Enregistrer</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Retour d'enregistrement */}
              {appFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 border ${
                    appFeedback.type === "success"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : "bg-red-50 border-red-200 text-red-900"
                  }`}
                >
                  {appFeedback.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{appFeedback.text}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
