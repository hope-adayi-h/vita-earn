"use client";

import { useState } from "react";
import { AlertTriangle, Play, RefreshCw } from "lucide-react";
import type { VideoPlatform } from "@/lib/video/universal-embed";

interface VideoEmbedPlayerProps {
  embedUrl: string;
  platform: VideoPlatform;
  title?: string;
  className?: string;
}

export function VideoEmbedPlayer({
  embedUrl,
  platform,
  title = "Vidéo du jour",
  className = "",
}: VideoEmbedPlayerProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (!embedUrl || hasError) {
    return (
      <div className="w-full aspect-video rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center p-6 text-center text-slate-300 space-y-3">
        <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">Impossible de charger cette vidéo</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            La vidéo est temporairement indisponible ou ses paramètres de confidentialité restreignent son intégration externe.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setHasError(false);
            setIsLoading(true);
          }}
          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Réessayer</span>
        </button>
      </div>
    );
  }

  // Configuration des dimensions et ratios selon la plateforme
  // TikTok & Reels sont principalement verticaux mais peuvent aussi s'adapter
  const isVertical = platform === "tiktok" || platform === "instagram";

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden bg-black shadow-lg border border-slate-800 ${
        isVertical ? "max-w-md mx-auto aspect-[9/16] min-h-[460px] max-h-[580px]" : "aspect-video"
      } ${className}`}
    >
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-slate-400 z-10 space-y-2">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <span className="text-xs font-medium">Chargement du lecteur vidéo sécurisé...</span>
        </div>
      )}

      <iframe
        src={embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox="allow-scripts allow-same-origin allow-presentation allow-forms allow-popups"
        className="w-full h-full border-0 absolute inset-0"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
    </div>
  );
}
