"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { ChevronDown, Globe, Check } from "lucide-react";

export interface Country {
  code: string;
  name: string;
  dialCode: string;
}

// Drapeaux vectoriels SVG nets et colorés garantis d'apparaître sur tous les systèmes (Windows, Mac, Mobile)
function FlagIcon({ code }: { code: string }) {
  const flags: Record<string, ReactNode> = {
    TG: (
      // Togo
      <svg className="w-5 h-3.5 rounded-[2px] shadow-sm flex-shrink-0" viewBox="0 0 500 300">
        <rect width="500" height="60" fill="#006A4E" />
        <rect y="60" width="500" height="60" fill="#FFCE00" />
        <rect y="120" width="500" height="60" fill="#006A4E" />
        <rect y="180" width="500" height="60" fill="#FFCE00" />
        <rect y="240" width="500" height="60" fill="#006A4E" />
        <rect width="180" height="180" fill="#D21034" />
        <polygon
          points="90,30 108,86 167,86 119,120 137,176 90,142 43,176 61,120 13,86 72,86"
          fill="#FFFFFF"
        />
      </svg>
    ),
    BJ: (
      // Benin
      <svg className="w-5 h-3.5 rounded-[2px] shadow-sm flex-shrink-0" viewBox="0 0 450 300">
        <rect width="180" height="300" fill="#008751" />
        <rect x="180" width="270" height="150" fill="#FCD116" />
        <rect x="180" y="150" width="270" height="150" fill="#E8112D" />
      </svg>
    ),
    CI: (
      // Cote d'Ivoire
      <svg className="w-5 h-3.5 rounded-[2px] shadow-sm flex-shrink-0" viewBox="0 0 450 300">
        <rect width="150" height="300" fill="#F77F00" />
        <rect x="150" width="150" height="300" fill="#FFFFFF" />
        <rect x="300" width="150" height="300" fill="#009E60" />
      </svg>
    ),
    SN: (
      // Senegal
      <svg className="w-5 h-3.5 rounded-[2px] shadow-sm flex-shrink-0" viewBox="0 0 450 300">
        <rect width="150" height="300" fill="#00853F" />
        <rect x="150" width="150" height="300" fill="#FDEF42" />
        <rect x="300" width="150" height="300" fill="#E31B23" />
        <polygon
          points="225,110 234,138 263,138 239,155 248,183 225,166 202,183 211,155 187,138 216,138"
          fill="#00853F"
        />
      </svg>
    ),
    BF: (
      // Burkina Faso
      <svg className="w-5 h-3.5 rounded-[2px] shadow-sm flex-shrink-0" viewBox="0 0 450 300">
        <rect width="450" height="150" fill="#DE3831" />
        <rect y="150" width="450" height="150" fill="#009E49" />
        <polygon
          points="225,110 234,138 263,138 239,155 248,183 225,166 202,183 211,155 187,138 216,138"
          fill="#FCD116"
        />
      </svg>
    ),
    ML: (
      // Mali
      <svg className="w-5 h-3.5 rounded-[2px] shadow-sm flex-shrink-0" viewBox="0 0 450 300">
        <rect width="150" height="300" fill="#14B53A" />
        <rect x="150" width="150" height="300" fill="#FCD116" />
        <rect x="300" width="150" height="300" fill="#CE1126" />
      </svg>
    ),
    NE: (
      // Niger
      <svg className="w-5 h-3.5 rounded-[2px] shadow-sm flex-shrink-0" viewBox="0 0 450 300">
        <rect width="450" height="100" fill="#E05206" />
        <rect y="100" width="450" height="100" fill="#FFFFFF" />
        <rect y="200" width="450" height="100" fill="#0DB02B" />
        <circle cx="225" cy="150" r="35" fill="#E05206" />
      </svg>
    ),
    GN: (
      // Guinee
      <svg className="w-5 h-3.5 rounded-[2px] shadow-sm flex-shrink-0" viewBox="0 0 450 300">
        <rect width="150" height="300" fill="#CE1126" />
        <rect x="150" width="150" height="300" fill="#FCD116" />
        <rect x="300" width="150" height="300" fill="#009460" />
      </svg>
    ),
    CM: (
      // Cameroun
      <svg className="w-5 h-3.5 rounded-[2px] shadow-sm flex-shrink-0" viewBox="0 0 450 300">
        <rect width="150" height="300" fill="#007A5E" />
        <rect x="150" width="150" height="300" fill="#CE1126" />
        <rect x="300" width="150" height="300" fill="#FCD116" />
        <polygon
          points="225,115 233,140 258,140 237,155 245,180 225,165 205,180 213,155 192,140 217,140"
          fill="#FCD116"
        />
      </svg>
    ),
    GA: (
      // Gabon
      <svg className="w-5 h-3.5 rounded-[2px] shadow-sm flex-shrink-0" viewBox="0 0 450 300">
        <rect width="450" height="100" fill="#009E60" />
        <rect y="100" width="450" height="100" fill="#FCD116" />
        <rect y="200" width="450" height="100" fill="#3A75C4" />
      </svg>
    ),
    CG: (
      // Congo
      <svg className="w-5 h-3.5 rounded-[2px] shadow-sm flex-shrink-0" viewBox="0 0 450 300">
        <polygon points="0,0 270,0 0,300" fill="#009543" />
        <polygon points="270,0 450,0 180,300 0,300" fill="#FBDE4A" />
        <polygon points="450,0 450,300 180,300" fill="#DC241F" />
      </svg>
    ),
    CD: (
      // RDC
      <svg className="w-5 h-3.5 rounded-[2px] shadow-sm flex-shrink-0" viewBox="0 0 450 300">
        <rect width="450" height="300" fill="#007FFF" />
        <polygon points="0,260 0,300 60,300 450,40 450,0 390,0" fill="#F7D618" />
        <polygon points="0,275 0,300 35,300 450,25 450,0 415,0" fill="#CE1021" />
        <polygon
          points="60,40 68,65 94,65 73,80 81,105 60,90 39,105 47,80 26,65 52,65"
          fill="#F7D618"
        />
      </svg>
    ),
    FR: (
      // France
      <svg className="w-5 h-3.5 rounded-[2px] shadow-sm flex-shrink-0" viewBox="0 0 450 300">
        <rect width="150" height="300" fill="#002395" />
        <rect x="150" width="150" height="300" fill="#FFFFFF" />
        <rect x="300" width="150" height="300" fill="#ED2939" />
      </svg>
    ),
    OTHER: (
      <div className="w-5 h-3.5 rounded-[2px] bg-vita-surface border border-vita-border flex items-center justify-center flex-shrink-0">
        <Globe className="w-3 h-3 text-vita-muted" />
      </div>
    ),
  };

  return flags[code] || flags.OTHER;
}

export const COUNTRIES: Country[] = [
  { code: "TG", name: "Togo", dialCode: "+228" },
  { code: "BJ", name: "Bénin", dialCode: "+229" },
  { code: "CI", name: "Côte d'Ivoire", dialCode: "+225" },
  { code: "SN", name: "Sénégal", dialCode: "+221" },
  { code: "BF", name: "Burkina Faso", dialCode: "+226" },
  { code: "ML", name: "Mali", dialCode: "+223" },
  { code: "NE", name: "Niger", dialCode: "+227" },
  { code: "GN", name: "Guinée", dialCode: "+224" },
  { code: "CM", name: "Cameroun", dialCode: "+237" },
  { code: "GA", name: "Gabon", dialCode: "+241" },
  { code: "CG", name: "Congo", dialCode: "+242" },
  { code: "CD", name: "RDC", dialCode: "+243" },
  { code: "FR", name: "France", dialCode: "+33" },
  { code: "OTHER", name: "Autre pays", dialCode: "+" },
];

interface CountrySelectProps {
  value: Country | null;
  onChange: (country: Country) => void;
  error?: string;
}

export function CountrySelect({ value, onChange, error }: CountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      {/* Bouton sélecteur personnalisé */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full touch-target rounded-xl border bg-vita-surface/50 px-3.5 text-xs sm:text-sm text-left flex items-center justify-between transition-all shadow-sm ${
          isOpen
            ? "border-vita-medium bg-white ring-2 ring-vita-bright/30"
            : error
            ? "border-red-300 bg-red-50/30"
            : "border-vita-border hover:border-vita-medium hover:bg-white"
        }`}
      >
        <div className="flex items-center gap-2.5 truncate">
          {value ? (
            <>
              <FlagIcon code={value.code} />
              <span className="font-medium text-vita-text">{value.name}</span>
              <span className="text-xs text-vita-muted font-mono font-medium">
                ({value.dialCode})
              </span>
            </>
          ) : (
            <>
              <Globe className="w-4 h-4 text-vita-muted flex-shrink-0" />
              <span className="text-vita-muted">Sélectionnez votre pays</span>
            </>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-vita-muted transition-transform duration-200 flex-shrink-0 ${
            isOpen ? "rotate-180 text-vita-deep" : ""
          }`}
        />
      </button>

      {/* Menu déroulant personnalisé avec tous les drapeaux et indicatifs */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-60 overflow-y-auto rounded-2xl border border-vita-border bg-white p-1.5 shadow-xl animate-fadeIn">
          <div className="divide-y divide-vita-border/40">
            {COUNTRIES.map((country) => {
              const isSelected = value?.code === country.code;
              return (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => {
                    onChange(country);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-between text-left transition-colors ${
                    isSelected
                      ? "bg-vita-surface text-vita-deep font-bold"
                      : "hover:bg-vita-surface/60 text-vita-text"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <FlagIcon code={country.code} />
                    <span className="truncate">{country.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-vita-muted bg-vita-surface px-1.5 py-0.5 rounded border border-vita-border/60">
                      {country.dialCode}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-vita-deep flex-shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
