"use client";

import { useState } from "react";
import { AlertTriangle, Play, RefreshCw, ExternalLink } from "lucide-react";
import type { VideoPlatform } from "@/lib/video/universal-embed";

interface VideoEmbedPlayerProps {
  embedUrl: string;
  platform: VideoPlatform;
  title?: string;
  className?: string;
  directUrl?: string;
}

export function VideoEmbedPlayer({
  embedUrl,
  platform,
  title = "Vidéo du jour",
  className = "",
  directUrl,
}: VideoEmbedPlayerProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Déterminer l'URL directe pour ouverture externe
  const fallbackUrl =
    directUrl ||
    (platform === "tiktok" && !embedUrl.includes("/embed/v2/")
      ? embedUrl
      : platform === "youtube" && embedUrl.includes("embed/")
      ? `https://www.youtube.com/watch?v=${embedUrl.split("embed/")[1]?.split("?")[0]}`
      : embedUrl);

  const platformDisplayName =
    platform === "tiktok"
      ? "TikTok"
      : platform === "youtube"
      ? "YouTube"
      : platform === "instagram"
      ? "Instagram"
      : "Facebook";

  // Pour TikTok avec code court alphabétique (qui échoue en /embed/v2/), afficher directement le lecteur interactif avec accès direct
  const isShortTikTok = platform === "tiktok" && embedUrl.includes("/embed/v2/") && !/\d{10,}/.test(embedUrl);

  if (!embedUrl || hasError || isShortTikTok) {
    return (
      <div className="w-full rounded-2xl bg-slate-900 border border-slate-800 p-6 text-center text-slate-300 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
          <Play className="w-7 h-7 text-emerald-400 fill-emerald-400/20" />
        </div>
        <div>
          <h4 className="text-sm font-black text-white">Vidéo {platformDisplayName} prête pour le visionnage</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
            Pour une expérience optimale sans restriction de navigateur, visionnez la vidéo directement sur {platformDisplayName} pendant au moins 30 secondes pour débloquer votre récompense.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
          {fallbackUrl && (
            <a
              href={fallbackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black inline-flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <span>Lancer sur {platformDisplayName}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <button
            type="button"
            onClick={() => {
              setHasError(false);
              setIsLoading(true);
            }}
            className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Réessayer l&apos;intégration</span>
          </button>
        </div>
      </div>
    );
  }

  const isVertical = platform === "tiktok" || platform === "instagram";

  return (
    <div className="space-y-2">
      <div
        className={`relative w-full rounded-2xl overflow-hidden bg-black shadow-lg border border-slate-800 ${
          isVertical ? "max-w-md mx-auto aspect-[9/16] min-h-[440px] max-h-[580px]" : "aspect-video"
        } ${className}`}
      >
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-slate-400 z-10 space-y-2">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
            <span className="text-xs font-medium">Chargement du lecteur {platformDisplayName}...</span>
          </div>
        )}

        <iframe
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="w-full h-full border-0 absolute inset-0"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        />
      </div>

      {/* Barre de secours discrète et élégante */}
      {fallbackUrl && (
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600">
          <span className="font-medium">Un souci d&apos;affichage avec le lecteur intégré ?</span>
          <a
            href={fallbackUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 underline decoration-emerald-300"
          >
            <span>Ouvrir sur {platformDisplayName}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
}
