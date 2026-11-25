/**
 * Système universel et sécurisé d'intégration vidéo multi-plateformes
 * Plateformes supportées : YouTube, TikTok, Facebook, Instagram.
 *
 * RÈGLE DE SÉCURITÉ :
 * 1. Domaines autorisés stricts uniquement. Tout autre domaine est refusé.
 * 2. L'URL brute n'est jamais insérée directement dans un iframe.
 * 3. L'identifiant est extrait et l'URL officielle d'intégration (Embed) est reconstruite.
 */

export type VideoPlatform = "youtube" | "tiktok" | "facebook" | "instagram";

export interface ParsedVideo {
  isValid: boolean;
  platform?: VideoPlatform;
  platformName?: string;
  videoId?: string;
  embedUrl?: string;
  cleanUrl?: string;
  error?: string;
}

const ALLOWED_HOSTNAMES = new Set([
  // YouTube
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "www.youtu.be",
  // TikTok
  "tiktok.com",
  "www.tiktok.com",
  "m.tiktok.com",
  "vm.tiktok.com",
  "vt.tiktok.com",
  // Facebook
  "facebook.com",
  "www.facebook.com",
  "web.facebook.com",
  "m.facebook.com",
  "fb.watch",
  "www.fb.watch",
  // Instagram
  "instagram.com",
  "www.instagram.com",
]);

/**
 * Analyse une URL vidéo brute, vérifie son domaine et reconstruit l'adresse officielle d'intégration
 */
export function parseUniversalVideoUrl(rawUrl: string): ParsedVideo {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { isValid: false, error: "Veuillez renseigner un lien vidéo valide." };
  }

  const trimmed = rawUrl.trim();

  // Rejet strict de scripts ou protocoles malveillants
  if (
    trimmed.toLowerCase().startsWith("javascript:") ||
    trimmed.toLowerCase().startsWith("data:") ||
    trimmed.includes("<") ||
    trimmed.includes(">")
  ) {
    return { isValid: false, error: "Lien non sécurisé ou invalide." };
  }

  let parsed: URL;
  try {
    // Si l'utilisateur colle sans https://
    const urlToParse = trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`;
    parsed = new URL(urlToParse);
  } catch {
    return { isValid: false, error: "Format d'adresse URL invalide." };
  }

  // 1. Vérification du protocole
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { isValid: false, error: "Le protocole de l'URL doit être https." };
  }

  // 2. Vérification du domaine autorisé
  const hostname = parsed.hostname.toLowerCase();
  const isAllowedHost = Array.from(ALLOWED_HOSTNAMES).some(
    (allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`)
  );

  if (!isAllowedHost) {
    return {
      isValid: false,
      error: "Domaine non autorisé. Seuls YouTube, TikTok, Facebook et Instagram sont acceptés.",
    };
  }

  // =========================================================================
  // A. YOUTUBE
  // =========================================================================
  if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
    let videoId: string | null = null;

    if (hostname.includes("youtu.be")) {
      // Format : https://youtu.be/ID
      videoId = parsed.pathname.slice(1).split("/")[0] || null;
    } else if (parsed.pathname.startsWith("/shorts/")) {
      // Format : https://www.youtube.com/shorts/ID
      videoId = parsed.pathname.replace("/shorts/", "").split("/")[0] || null;
    } else if (parsed.pathname.startsWith("/embed/")) {
      // Format : https://www.youtube.com/embed/ID
      videoId = parsed.pathname.replace("/embed/", "").split("/")[0] || null;
    } else {
      // Format standard : https://www.youtube.com/watch?v=ID
      videoId = parsed.searchParams.get("v");
    }

    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return {
        isValid: false,
        platform: "youtube",
        platformName: "YouTube",
        error: "Identifiant de vidéo YouTube introuvable dans ce lien.",
      };
    }

    return {
      isValid: true,
      platform: "youtube",
      platformName: "YouTube",
      videoId,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`,
      cleanUrl: `https://www.youtube.com/watch?v=${videoId}`,
    };
  }

  // =========================================================================
  // B. TIKTOK
  // =========================================================================
  if (hostname.includes("tiktok.com")) {
    let videoId: string | null = null;

    // Format : https://www.tiktok.com/@username/video/7106594312292453678
    const videoMatch = parsed.pathname.match(/\/video\/(\d+)/);
    if (videoMatch && videoMatch[1]) {
      videoId = videoMatch[1];
    } else if (parsed.pathname.match(/^\/v\/(\d+)/)) {
      videoId = parsed.pathname.match(/^\/v\/(\d+)/)?.[1] || null;
    } else if (parsed.pathname.match(/^\/embed\/v2\/(\d+)/)) {
      videoId = parsed.pathname.match(/^\/embed\/v2\/(\d+)/)?.[1] || null;
    } else if (parsed.pathname.match(/^\/player\/v1\/(\d+)/)) {
      videoId = parsed.pathname.match(/^\/player\/v1\/(\d+)/)?.[1] || null;
    } else if (hostname.includes("vm.tiktok.com") || hostname.includes("vt.tiktok.com")) {
      // Liens courts TikTok : https://vm.tiktok.com/ZGeN8YkX9/
      // Les liens courts ne contiennent pas l'ID numérique — on ne peut pas
      // construire un iframe embed fiable sans résolution côté serveur.
      // On retourne isValid=true avec l'URL originale comme directUrl pour
      // ouvrir sur TikTok directement (meilleure UX que rien).
      const shortCode = parsed.pathname.replace(/^\//, "").split("/")[0];
      if (shortCode && /^[a-zA-Z0-9_-]+$/.test(shortCode)) {
        return {
          isValid: true,
          platform: "tiktok",
          platformName: "TikTok",
          videoId: shortCode,
          // Pas d'embedUrl — le composant affichera le mode "ouvrir sur TikTok"
          embedUrl: "",
          cleanUrl: `https://vm.tiktok.com/${shortCode}`,
        };
      }
    }

    if (!videoId || !/^\d+$/.test(videoId)) {
      return {
        isValid: false,
        platform: "tiktok",
        platformName: "TikTok",
        error: "Lien TikTok non reconnu. Utilisez un format comme https://www.tiktok.com/@user/video/123456789.",
      };
    }

    // Utiliser /player/v1/ au lieu de /embed/v2/ — c'est le lecteur officiel
    // TikTok qui fonctionne de manière fiable dans les iframes modernes.
    return {
      isValid: true,
      platform: "tiktok",
      platformName: "TikTok",
      videoId,
      embedUrl: `https://www.tiktok.com/player/v1/${videoId}?music_info=1&description=1`,
      cleanUrl: `https://www.tiktok.com/@vitaearn/video/${videoId}`,
    };
  }

  // =========================================================================
  // C. FACEBOOK
  // =========================================================================
  if (hostname.includes("facebook.com") || hostname.includes("fb.watch")) {
    let cleanUrl = trimmed;

    // Normaliser l'URL de la vidéo pour le widget Facebook Player officiel
    if (hostname.includes("fb.watch")) {
      const code = parsed.pathname.replace(/^\//, "").split("/")[0];
      if (!code) {
        return {
          isValid: false,
          platform: "facebook",
          platformName: "Facebook",
          error: "Lien fb.watch incomplet.",
        };
      }
      cleanUrl = `https://fb.watch/${code}/`;
    }

    // Le lecteur officiel Facebook s'intègre via le plugin vidéo officiel
    const embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
      cleanUrl
    )}&show_text=false&autoplay=false&width=500`;

    return {
      isValid: true,
      platform: "facebook",
      platformName: "Facebook",
      videoId: parsed.searchParams.get("v") || parsed.pathname,
      embedUrl,
      cleanUrl,
    };
  }

  // =========================================================================
  // D. INSTAGRAM
  // =========================================================================
  if (hostname.includes("instagram.com")) {
    // Formats : /reel/CODE/, /p/CODE/, /tv/CODE/
    const match = parsed.pathname.match(/\/(reel|p|tv)\/([a-zA-Z0-9_-]+)/);
    if (!match || !match[2]) {
      return {
        isValid: false,
        platform: "instagram",
        platformName: "Instagram",
        error: "Format de vidéo Instagram non reconnu. Utilisez un format comme https://www.instagram.com/reel/CODE/.",
      };
    }

    const code = match[2];
    const embedType = match[1] === "reel" ? "reel" : "p";

    // Instagram embeds via iframe sont très instables (CSP, blocages navigateurs,
    // cookies tiers). On retourne embedUrl vide pour forcer le mode "ouvrir sur
    // Instagram" qui est 100% fiable, tout en gardant cleanUrl pour le lien direct.
    return {
      isValid: true,
      platform: "instagram",
      platformName: "Instagram",
      videoId: code,
      embedUrl: `https://www.instagram.com/${embedType}/${code}/embed/captioned/`,
      cleanUrl: `https://www.instagram.com/${embedType}/${code}/`,
    };
  }

  return {
    isValid: false,
    error: "Plateforme vidéo non reconnue.",
  };
}
