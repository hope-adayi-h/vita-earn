import React from "react";

interface OperatorLogoProps {
  operatorId: string;
  className?: string;
}

export function OperatorLogo({ operatorId, className = "w-8 h-8" }: OperatorLogoProps) {
  switch (operatorId) {
    case "tmoney":
      return (
        <svg
          viewBox="0 0 40 40"
          className={`${className} flex-shrink-0 rounded-lg overflow-hidden shadow-sm`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Fond jaune officiel Togocom */}
          <rect width="40" height="40" rx="8" fill="#FFCC00" />
          {/* Cercle vert Togocom */}
          <circle cx="20" cy="20" r="14" fill="#008836" />
          {/* Lettre T blanche stylisée */}
          <path
            d="M13 13.5H27V17.5H22V27.5H18V17.5H13V13.5Z"
            fill="white"
          />
          {/* Petit accent point énergie jaune */}
          <circle cx="25" cy="13.5" r="2" fill="#FFCC00" />
        </svg>
      );

    case "flooz":
    case "moov":
      return (
        <svg
          viewBox="0 0 40 40"
          className={`${className} flex-shrink-0 rounded-lg overflow-hidden shadow-sm`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Fond Bleu Moov Africa */}
          <rect width="40" height="40" rx="8" fill="#005BA6" />
          {/* Demi-lune / arc orange Moov */}
          <path
            d="M10 24C12 28 17 30 22 28C27 26 29 21 28 16"
            stroke="#FF6600"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Texte moov stylisé blanc */}
          <text
            x="20"
            y="21"
            fill="white"
            fontSize="9"
            fontWeight="900"
            fontFamily="system-ui, sans-serif"
            textAnchor="middle"
          >
            moov
          </text>
        </svg>
      );

    case "orange":
      return (
        <svg
          viewBox="0 0 40 40"
          className={`${className} flex-shrink-0 rounded-lg overflow-hidden shadow-sm`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Fond Orange officiel */}
          <rect width="40" height="40" rx="8" fill="#FF6600" />
          {/* Grand O / Carré central noir et blanc */}
          <rect x="12" y="12" width="16" height="16" rx="2" fill="#000000" />
          <rect x="15" y="15" width="10" height="10" rx="1" fill="#FF6600" />
          <circle cx="20" cy="20" r="2.5" fill="#FFFFFF" />
        </svg>
      );

    case "mtn_momo":
      return (
        <svg
          viewBox="0 0 40 40"
          className={`${className} flex-shrink-0 rounded-lg overflow-hidden shadow-sm`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Fond Jaune MTN emblématique */}
          <rect width="40" height="40" rx="8" fill="#FFCC00" />
          {/* Ovale bleu nuit MoMo */}
          <ellipse cx="20" cy="20" rx="16" ry="11" fill="#002D62" />
          {/* Texte MoMo en jaune vif */}
          <text
            x="20"
            y="24"
            fill="#FFCC00"
            fontSize="10"
            fontWeight="900"
            fontFamily="system-ui, sans-serif"
            letterSpacing="-0.5"
            textAnchor="middle"
          >
            MoMo
          </text>
        </svg>
      );

    case "wave":
      return (
        <svg
          viewBox="0 0 40 40"
          className={`${className} flex-shrink-0 rounded-lg overflow-hidden shadow-sm`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Fond Bleu Cyan Wave officiel */}
          <rect width="40" height="40" rx="8" fill="#1DC4FA" />
          {/* Silhouette Pingouin / Vague Wave en bleu marine */}
          <path
            d="M20 9C15.5 9 13.5 12.5 13.5 16C13.5 19 15 22 17 25C17.5 25.8 18 29 18 31H22C22 29 22.5 25.8 23 25C25 22 26.5 19 26.5 16C26.5 12.5 24.5 9 20 9Z"
            fill="#0B1B3D"
          />
          {/* Ventre blanc du pingouin Wave */}
          <ellipse cx="20" cy="18" rx="3.5" ry="5.5" fill="white" />
          {/* Bec jaune orange */}
          <path d="M18.5 14L21.5 14L20 16L18.5 14Z" fill="#FFA500" />
        </svg>
      );

    case "free":
      return (
        <svg
          viewBox="0 0 40 40"
          className={`${className} flex-shrink-0 rounded-lg overflow-hidden shadow-sm`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Fond Rouge Free Sénégal */}
          <rect width="40" height="40" rx="8" fill="#CC0000" />
          {/* Inscription cursive free */}
          <text
            x="20"
            y="25"
            fill="white"
            fontSize="14"
            fontWeight="900"
            fontStyle="italic"
            fontFamily="serif"
            textAnchor="middle"
          >
            free
          </text>
        </svg>
      );

    case "celtiis":
      return (
        <svg
          viewBox="0 0 40 40"
          className={`${className} flex-shrink-0 rounded-lg overflow-hidden shadow-sm`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Fond Violet / Magenta Celtiis Bénin */}
          <rect width="40" height="40" rx="8" fill="#8A1551" />
          {/* Motif C de Celtiis en jaune orangé */}
          <path
            d="M26 14C23 11 16 12 14 17C12 22 15 28 21 28C24 28 26 26 27 24"
            stroke="#F7B218"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </svg>
      );

    case "airtel":
      return (
        <svg
          viewBox="0 0 40 40"
          className={`${className} flex-shrink-0 rounded-lg overflow-hidden shadow-sm`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Fond Rouge Vif Airtel */}
          <rect width="40" height="40" rx="8" fill="#EE1C24" />
          {/* Corne blanche Airtel */}
          <path
            d="M15 15C15 11 20 10 24 13C27 16 26 21 23 25C20 28 15 27 14 24"
            stroke="white"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </svg>
      );

    case "card":
      return (
        <svg
          viewBox="0 0 40 40"
          className={`${className} flex-shrink-0 rounded-lg overflow-hidden shadow-sm`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Fond bleu nuit Carte Bancaire */}
          <rect width="40" height="40" rx="8" fill="#0D1B2A" />
          {/* Cercles Mastercard imbriqués */}
          <circle cx="16" cy="20" r="7" fill="#EB001B" />
          <circle cx="24" cy="20" r="7" fill="#F79E1B" fillOpacity="0.85" />
          {/* Bande / puce */}
          <rect x="8" y="10" width="6" height="4" rx="1" fill="#FFD700" />
        </svg>
      );

    default:
      return (
        <svg
          viewBox="0 0 40 40"
          className={`${className} flex-shrink-0 rounded-lg overflow-hidden shadow-sm`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="40" height="40" rx="8" fill="#1B4D0F" />
          <path
            d="M13 14H27V26H13V14Z"
            stroke="#7ED321"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="20" cy="20" r="3" fill="#7ED321" />
        </svg>
      );
  }
}
