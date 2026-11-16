import React from "react";

export type PlatformType = "tiktok" | "youtube" | "ads" | "adsense" | "instagram" | "trivia" | "solde";

interface PlatformLogoProps {
  platform: PlatformType | string;
  className?: string;
  size?: number;
}

export function PlatformLogo({ platform, className = "w-6 h-6", size }: PlatformLogoProps) {
  const norm = platform.toLowerCase();
  const style = size ? { width: size, height: size } : undefined;

  switch (norm) {
    case "tiktok":
      return (
        <svg
          viewBox="0 0 48 48"
          style={style}
          className={`${className} flex-shrink-0 rounded-xl overflow-hidden shadow-xs`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Fond sombre officiel TikTok */}
          <rect width="48" height="48" rx="11" fill="#010101" />
          {/* Cyan layer (décalage chromatique gauche) */}
          <path
            d="M32.8 18.2c-2.4-.3-4.5-1.5-5.8-3.3v14.8c0 4.8-3.9 8.6-8.7 8.6-2.9 0-5.5-1.4-7.1-3.6 1.3.8 2.8 1.3 4.3 1.3 4.2 0 7.6-3.4 7.6-7.6V14.7h3.8c.6 2.5 2.4 4.5 4.8 5.2l1.1-.1v-1.6z"
            fill="#25F4EE"
          />
          {/* Rouge/Rose layer (décalage chromatique droite) */}
          <path
            d="M34.8 20.2c-2.4-.3-4.5-1.5-5.8-3.3v14.8c0 4.8-3.9 8.6-8.7 8.6-2.9 0-5.5-1.4-7.1-3.6 1.3.8 2.8 1.3 4.3 1.3 4.2 0 7.6-3.4 7.6-7.6V16.7h3.8c.6 2.5 2.4 4.5 4.8 5.2l1.1-.1v-1.6z"
            fill="#FE2C55"
          />
          {/* Note de musique centrale blanche */}
          <path
            d="M33.8 19.2c-2.4-.3-4.5-1.5-5.8-3.3v14.8c0 4.8-3.9 8.6-8.7 8.6-4.8 0-8.7-3.9-8.7-8.6s3.9-8.6 8.7-8.6c.7 0 1.4.1 2.1.3v4c-.7-.3-1.4-.4-2.1-.4-2.6 0-4.8 2.1-4.8 4.7s2.1 4.7 4.8 4.7 4.8-2.1 4.8-4.7V8.5h3.8c.6 2.5 2.4 4.5 4.8 5.2l1.1-.1v5.6z"
            fill="#FFFFFF"
          />
        </svg>
      );

    case "youtube":
      return (
        <svg
          viewBox="0 0 48 48"
          style={style}
          className={`${className} flex-shrink-0 rounded-xl overflow-hidden shadow-xs`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Fond Rouge YouTube emblématique */}
          <rect width="48" height="48" rx="11" fill="#FF0000" />
          {/* Triangle de lecture blanc centré */}
          <path d="M20 16.5L32 24L20 31.5V16.5Z" fill="#FFFFFF" />
        </svg>
      );

    case "ads":
    case "adsense":
      return (
        <svg
          viewBox="0 0 48 48"
          style={style}
          className={`${className} flex-shrink-0 rounded-xl overflow-hidden shadow-xs`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Fond Google blanc épuré */}
          <rect width="48" height="48" rx="11" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
          <g transform="translate(6, 6)">
            {/* Pli Bleu AdSense incliné */}
            <rect
              x="5"
              y="4"
              width="9.5"
              height="25"
              rx="4.75"
              transform="rotate(-28 10 16)"
              fill="#4285F4"
            />
            {/* Pli Jaune/Or vertical */}
            <rect x="18" y="8" width="9.5" height="24" rx="4.75" fill="#FBBC04" />
            {/* Coin Vert de jonction */}
            <circle cx="12" cy="27" r="4.75" fill="#34A853" />
          </g>
        </svg>
      );

    case "instagram":
      return (
        <svg
          viewBox="0 0 48 48"
          style={style}
          className={`${className} flex-shrink-0 rounded-xl overflow-hidden shadow-xs`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="ig-linear-grad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FD5949" />
              <stop offset="35%" stopColor="#D6249F" />
              <stop offset="85%" stopColor="#285AEB" />
            </linearGradient>
            <radialGradient id="ig-radial-grad" cx="20%" cy="110%" r="105%">
              <stop offset="0%" stopColor="#FFDC80" />
              <stop offset="25%" stopColor="#FCAF45" />
              <stop offset="60%" stopColor="#F56040" />
              <stop offset="100%" stopColor="#FD1D1D" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* Fond officiel Dégradé Instagram */}
          <rect width="48" height="48" rx="11" fill="url(#ig-linear-grad)" />
          <rect width="48" height="48" rx="11" fill="url(#ig-radial-grad)" />
          {/* Boîtier de la caméra blanc */}
          <rect
            x="12"
            y="12"
            width="24"
            height="24"
            rx="7"
            stroke="#FFFFFF"
            strokeWidth="2.6"
            fill="none"
          />
          {/* Lentille centrale blanche */}
          <circle cx="24" cy="24" r="5.6" stroke="#FFFFFF" strokeWidth="2.6" fill="none" />
          {/* Flash blanc */}
          <circle cx="30.5" cy="17.5" r="1.5" fill="#FFFFFF" />
        </svg>
      );

    case "trivia":
      return (
        <svg
          viewBox="0 0 48 48"
          style={style}
          className={`${className} flex-shrink-0 rounded-xl overflow-hidden shadow-xs`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Fond Indigo Trivia */}
          <rect width="48" height="48" rx="11" fill="#4F46E5" />
          {/* Point d'interrogation stylisé blanc */}
          <path
            d="M21 16C21 14.3 22.3 13 24 13C25.7 13 27 14.3 27 16C27 17.5 25.8 18.6 24.5 19.5C23.6 20.2 23 21.1 23 22.5V23.5H25V22.5C25 21.7 25.4 21.1 26.1 20.5C27.7 19.3 29 17.8 29 16C29 13.2 26.8 11 24 11C21.2 11 19 13.2 19 16H21ZM23 27H25V29H23V27Z"
            fill="#FFFFFF"
          />
        </svg>
      );

    case "solde":
    default:
      return (
        <svg
          viewBox="0 0 48 48"
          style={style}
          className={`${className} flex-shrink-0 rounded-xl overflow-hidden shadow-xs`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Fond Vert Vita Earn */}
          <rect width="48" height="48" rx="11" fill="#16A34A" />
          {/* Portefeuille blanc stylisé */}
          <path
            d="M13 16C13 14.3 14.3 13 16 13H32C33.7 13 35 14.3 35 16V18H13V16ZM13 20H35V32C35 33.7 33.7 35 32 35H16C14.3 35 13 33.7 13 32V20ZM27 24C27 23.4 27.4 23 28 23H35V27H28C27.4 27 27 26.6 27 26V24Z"
            fill="#FFFFFF"
          />
          <circle cx="31" cy="25" r="1" fill="#16A34A" />
        </svg>
      );
  }
}
