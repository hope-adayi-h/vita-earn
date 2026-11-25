"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, RefreshCw, ExternalLink, AlertTriangle } from "lucide-react";
import type { VideoPlatform } from "@/lib/video/universal-embed";

interface VideoEmbedPlayerProps {
  embedUrl: string;
  platform: VideoPlatform;
  title?: string;
  className?: string;
  directUrl?: string;
}

/**
 * Lecteur vidéo universel — YouTube, TikTok, Instagram, Facebook.
 *
 * Stratégie par plateforme :
 * - YouTube : iframe standard youtube-nocookie.com (très fiable).
 * - TikTok  : iframe /player/v1/{id} (lecteur officiel TikTok).
 *   Si l'embedUrl est vide (lien court sans ID numérique), mode externe.
 * - Instagram : iframe /embed/captioned/ avec injection du script embed.js
 *   en fallback si l'iframe seul ne charge pas. Si échec total, mode externe.
 * - Facebook : iframe plugins/video.php (fiable).
 *
 * Fallback universel : bouton "Ouvrir sur [Plateforme]" avec le lien direct.
 */
export function VideoEmbedPlayer({
  embedUrl,
  platform,
  title = "Vidéo du jour",
  className = "",
  directUrl,
}: VideoEmbedPlayerProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Déterminer l'URL directe pour ouverture externe
  const fallbackUrl =
    directUrl ||
    (platform === "youtube" && embedUrl.includes("embed/")
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

  // Pour Instagram : injecter le script embed.js dynamiquement après le chargement
  // de l'iframe pour forcer le rendu du contenu intégré.
  useEffect(() => {
    const processInstagramEmbeds = () => {
      if (typeof window === "undefined") return;
      const win = window as unknown as {
        instgrm?: { Embeds?: { process: () => void } };
      };
      win.instgrm?.Embeds?.process();
    };

    if (platform === "instagram" && iframeLoaded && !hasError) {
      if (!document.getElementById("instagram-embed-script")) {
        const script = document.createElement("script");
        script.id = "instagram-embed-script";
        script.src = "https://www.instagram.com/embed.js";
        script.async = true;
        script.onload = processInstagramEmbeds;
        document.body.appendChild(script);
      } else {
        processInstagramEmbeds();
      }
    }
  }, [platform, iframeLoaded, hasError]);

  // Timeout de détection d'échec de chargement (8 secondes)
  useEffect(() => {
    if (!embedUrl || hasError || !isLoading) return;

    const timeout = setTimeout(() => {
      if (isLoading && !iframeLoaded) {
        // L'iframe n'a toujours pas chargé après 8s — considérer comme bloqué
        // mais ne pas forcer l'erreur pour TikTok/Instagram car le player peut
        // être lent sur les connexions africaines
        setIsLoading(false);
      }
    }, 8000);

    return () => clearTimeout(timeout);
  }, [embedUrl, hasError, isLoading, iframeLoaded]);

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
    setIframeLoaded(true);
  }, []);

  const handleIframeError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  const handleRetry = useCallback(() => {
    setHasError(false);
    setIsLoading(true);
    setIframeLoaded(false);
  }, []);

  // MODE EXTERNE : pas d'embedUrl ou erreur confirmée
  if (!embedUrl || hasError) {
    return (
      <div className="w-full rounded-2xl bg-slate-900 border border-slate-800 p-6 text-center text-slate-300 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
          {hasError ? (
            <AlertTriangle className="w-7 h-7 text-amber-400" />
          ) : (
            <Play className="w-7 h-7 text-emerald-400 fill-emerald-400/20" />
          )}
        </div>
        <div>
          <h4 className="text-sm font-black text-white">
            {hasError
              ? `Le lecteur intégré ${platformDisplayName} n'a pas pu charger`
              : `Vidéo ${platformDisplayName} prête pour le visionnage`}
          </h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
            {hasError
              ? `Le navigateur a bloqué le lecteur intégré. Visionnez la vidéo directement sur ${platformDisplayName} pour débloquer votre récompense.`
              : `Visionnez la vidéo directement sur ${platformDisplayName} pendant au moins 30 secondes pour débloquer votre récompense.`}
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
          {hasError && (
            <button
              type="button"
              onClick={handleRetry}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Réessayer l&apos;intégration</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // MODE IFRAME INTÉGRÉ
  const isVertical = platform === "tiktok" || platform === "instagram";

  // Sandbox / attributs spécifiques par plateforme
  const iframeAllow =
    "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen";

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className={`relative w-full rounded-2xl overflow-hidden bg-black shadow-lg border border-slate-800 ${
          isVertical ? "max-w-md mx-auto aspect-[9/16] min-h-[440px] max-h-[580px]" : "aspect-video"
        } ${className}`}
      >
        {/* Spinner de chargement */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-slate-400 z-10 space-y-2">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
            <span className="text-xs font-medium">Chargement du lecteur {platformDisplayName}...</span>
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={embedUrl}
          title={title}
          allow={iframeAllow}
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          className="w-full h-full border-0 absolute inset-0"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
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
