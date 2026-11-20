"use client";

import React from "react";
import * as Flags from "country-flag-icons/react/3x2";
import { Globe, CreditCard, Coins } from "lucide-react";

interface CountryFlagProps {
  country?: string;
  code?: string;
  className?: string;
}

export function CountryFlag({
  country,
  code,
  className = "w-5 h-3.5 inline-block rounded-xs shadow-xs object-cover shrink-0",
}: CountryFlagProps) {
  const raw = (code || country || "").trim().toUpperCase();

  // Détection de code 2 lettres ou nom
  let isoCode = raw;
  if (raw.includes("TOGO") || raw === "TG") isoCode = "TG";
  else if (raw.includes("BENIN") || raw.includes("BÉNIN") || raw === "BJ") isoCode = "BJ";
  else if (raw.includes("IVOIRE") || raw.includes("IVORY") || raw === "CI") isoCode = "CI";
  else if (raw.includes("SENEGAL") || raw.includes("SÉNÉGAL") || raw === "SN") isoCode = "SN";
  else if (raw.includes("BURKINA") || raw === "BF") isoCode = "BF";
  else if (raw.includes("CAMEROUN") || raw.includes("CAMEROON") || raw === "CM") isoCode = "CM";
  else if (raw.includes("MALI") || raw === "ML") isoCode = "ML";
  else if (raw.includes("NIGER") || raw === "NE") isoCode = "NE";
  else if (raw.includes("GABON") || raw === "GA") isoCode = "GA";
  else if (raw.includes("CONGO-BRAZZAVILLE") || raw === "CG") isoCode = "CG";
  else if (raw.includes("RDC") || raw.includes("KINSHASA") || raw === "CD" || raw === "XC") isoCode = "CD";
  else if (raw.includes("GUIN") || raw === "GN") isoCode = "GN";
  else if (raw.includes("GHANA") || raw === "GH") isoCode = "GH";
  else if (raw.includes("NIGERIA") || raw.includes("NIGÉRIA") || raw === "NG") isoCode = "NG";
  else if (raw.includes("KENYA") || raw === "KE") isoCode = "KE";
  else if (raw.includes("OUGANDA") || raw.includes("UGANDA") || raw === "UG") isoCode = "UG";
  else if (raw.includes("RWANDA") || raw === "RW") isoCode = "RW";
  else if (raw.includes("TANZAN") || raw === "TZ") isoCode = "TZ";
  else if (raw.includes("ZAMBI") || raw === "ZM") isoCode = "ZM";
  else if (raw.includes("MALAWI") || raw === "MW") isoCode = "MW";
  else if (raw.includes("MOZAMBIQUE") || raw === "MZ") isoCode = "MZ";
  else if (raw.includes("SIERRA") || raw === "SL") isoCode = "SL";
  else if (raw.includes("CARD") || raw.includes("INTER") || raw === "XX") isoCode = "XX";
  else if (raw.includes("CRYPTO") || raw === "XY") isoCode = "XY";

  if (isoCode === "XX") {
    return <CreditCard className="w-4 h-4 text-emerald-600 shrink-0 inline-block" />;
  }
  if (isoCode === "XY") {
    return <Coins className="w-4 h-4 text-amber-500 shrink-0 inline-block" />;
  }
  if (isoCode === "XC") {
    const CDF = Flags.CD;
    if (CDF) return <CDF className={className} />;
  }

  const FlagComponent = (Flags as Record<string, React.ComponentType<{ className?: string }>>)[isoCode];
  if (FlagComponent) {
    return <FlagComponent className={className} />;
  }

  return <Globe className="w-4 h-4 text-gray-400 shrink-0 inline-block" />;
}
