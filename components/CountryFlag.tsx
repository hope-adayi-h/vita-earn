import React from "react";

interface CountryFlagProps {
  country: string;
  className?: string;
}

export function CountryFlag({ country, className = "w-5 h-3.5" }: CountryFlagProps) {
  const norm = (country || "").trim().toUpperCase();

  // TOGO (TG)
  if (norm.includes("TOGO") || norm === "TG") {
    return (
      <svg
        viewBox="0 0 500 300"
        className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}
        aria-label="Drapeau Togo"
      >
        <rect width="500" height="60" fill="#006A4E" />
        <rect y="60" width="500" height="60" fill="#FFCE00" />
        <rect y="120" width="500" height="60" fill="#006A4E" />
        <rect y="180" width="500" height="60" fill="#FFCE00" />
        <rect y="240" width="500" height="60" fill="#006A4E" />
        <rect width="180" height="180" fill="#D21034" />
        <polygon
          points="90,45 103,85 145,85 111,110 124,150 90,125 56,150 69,110 35,85 77,85"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  // BURKINA FASO (BF)
  if (norm.includes("BURKINA") || norm === "BF") {
    return (
      <svg
        viewBox="0 0 600 400"
        className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}
        aria-label="Drapeau Burkina Faso"
      >
        <rect width="600" height="200" fill="#EF2B2D" />
        <rect y="200" width="600" height="200" fill="#009E49" />
        <polygon
          points="300,140 318,195 376,195 329,229 347,284 300,250 253,284 271,229 224,195 282,195"
          fill="#FCD116"
        />
      </svg>
    );
  }

  // CÔTE D'IVOIRE (CI) / IVORY COAST
  if (norm.includes("IVORY") || norm.includes("IVOIRE") || norm === "CI") {
    return (
      <svg
        viewBox="0 0 450 300"
        className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}
        aria-label="Drapeau Côte d'Ivoire"
      >
        <rect width="150" height="300" fill="#F77F00" />
        <rect x="150" width="150" height="300" fill="#FFFFFF" />
        <rect x="300" width="150" height="300" fill="#009E60" />
      </svg>
    );
  }

  // BÉNIN (BJ)
  if (norm.includes("BENIN") || norm.includes("BÉNIN") || norm === "BJ") {
    return (
      <svg
        viewBox="0 0 450 300"
        className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}
        aria-label="Drapeau Bénin"
      >
        <rect width="180" height="300" fill="#008751" />
        <rect x="180" width="270" height="150" fill="#FCD116" />
        <rect x="180" y="150" width="270" height="150" fill="#E8112D" />
      </svg>
    );
  }

  // CAMEROUN (CM) / CAMEROON
  if (norm.includes("CAMEROON") || norm.includes("CAMEROUN") || norm === "CM") {
    return (
      <svg
        viewBox="0 0 450 300"
        className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}
        aria-label="Drapeau Cameroun"
      >
        <rect width="150" height="300" fill="#007A5E" />
        <rect x="150" width="150" height="300" fill="#CE1126" />
        <rect x="300" width="150" height="300" fill="#FCD116" />
        <polygon
          points="225,120 234,148 263,148 240,165 249,192 225,175 201,192 210,165 187,148 216,148"
          fill="#FCD116"
        />
      </svg>
    );
  }

  // SÉNÉGAL (SN)
  if (norm.includes("SENEGAL") || norm.includes("SÉNÉGAL") || norm === "SN") {
    return (
      <svg
        viewBox="0 0 450 300"
        className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}
        aria-label="Drapeau Sénégal"
      >
        <rect width="150" height="300" fill="#00853F" />
        <rect x="150" width="150" height="300" fill="#FDEF42" />
        <rect x="300" width="150" height="300" fill="#E31B23" />
        <polygon
          points="225,120 234,148 263,148 240,165 249,192 225,175 201,192 210,165 187,148 216,148"
          fill="#00853F"
        />
      </svg>
    );
  }

  // MALI (ML)
  if (norm.includes("MALI") || norm === "ML") {
    return (
      <svg
        viewBox="0 0 450 300"
        className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}
        aria-label="Drapeau Mali"
      >
        <rect width="150" height="300" fill="#14B53A" />
        <rect x="150" width="150" height="300" fill="#FCD116" />
        <rect x="300" width="150" height="300" fill="#CE1126" />
      </svg>
    );
  }

  // Par défaut : Drapeau stylisé Afrique de l'Ouest
  return (
    <svg
      viewBox="0 0 450 300"
      className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}
      aria-label="Drapeau"
    >
      <rect width="150" height="300" fill="#10B981" />
      <rect x="150" width="150" height="300" fill="#F59E0B" />
      <rect x="300" width="150" height="300" fill="#EF4444" />
    </svg>
  );
}
