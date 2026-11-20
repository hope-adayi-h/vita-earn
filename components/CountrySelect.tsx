"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  COUNTRIES,
  getAllCountries,
  getCountryByCode,
  type CountryInfo,
} from "@/lib/countries";
import { CountryFlag } from "./CountryFlag";
import { ChevronDown, Search, Check, X, Globe } from "lucide-react";

export type Country = CountryInfo;

export interface CountrySelectProps {
  value: CountryInfo | string | null;
  onChange: (country: CountryInfo) => void;
  error?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showDialCode?: boolean;
  filterAllowedCodes?: string[];
  name?: string;
  id?: string;
}

export function CountrySelect({
  value,
  onChange,
  error,
  label,
  placeholder = "Sélectionnez votre pays",
  disabled = false,
  className = "",
  showDialCode = true,
  filterAllowedCodes,
  name,
  id,
}: CountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Liste des pays triée par ordre alphabétique en français
  const allCountries = useMemo(() => {
    let list = getAllCountries();
    if (filterAllowedCodes && filterAllowedCodes.length > 0) {
      const allowedSet = new Set(filterAllowedCodes.map((c) => c.toUpperCase()));
      list = list.filter((c) => allowedSet.has(c.code.toUpperCase()));
    }
    return list;
  }, [filterAllowedCodes]);

  // Résolution du pays sélectionné
  const currentCountry: CountryInfo | null = useMemo(() => {
    if (!value) return null;
    if (typeof value === "string") {
      return getCountryByCode(value) || null;
    }
    return value;
  }, [value]);

  // Filtrage avec barre de recherche
  const filteredCountries = useMemo(() => {
    if (!search.trim()) return allCountries;
    const term = search.toLowerCase().trim();
    return allCountries.filter((c) => {
      const nameMatch = c.name.toLowerCase().includes(term);
      const codeMatch = c.code.toLowerCase().includes(term);
      const dialMatch = c.dialCode.toLowerCase().includes(term);
      const currencyMatch = c.currency.toLowerCase().includes(term);
      return nameMatch || codeMatch || dialMatch || currencyMatch;
    });
  }, [search, allCountries]);

  // Gestion de la fermeture au clic extérieur
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (c: CountryInfo) => {
    onChange(c);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5"
        >
          {label}
        </label>
      )}

      {name && (
        <input
          type="hidden"
          name={name}
          value={currentCountry ? currentCountry.code : ""}
        />
      )}

      {/* Déclencheur du sélecteur */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        className={`w-full touch-target min-h-[44px] rounded-xl border bg-white dark:bg-[#17241C] px-3.5 py-2.5 text-xs sm:text-sm text-left flex items-center justify-between transition-all shadow-xs ${
          isOpen
            ? "border-emerald-600 ring-2 ring-emerald-500/20"
            : error
            ? "border-red-400 bg-red-50/30"
            : "border-gray-200 dark:border-[#1E2E24] hover:border-emerald-600"
        } ${disabled ? "opacity-60 cursor-not-allowed bg-gray-50 dark:bg-gray-900" : "cursor-pointer"}`}
      >
        <div className="flex items-center gap-2.5 truncate">
          {currentCountry ? (
            <>
              <CountryFlag code={currentCountry.flagCode} className="w-5 h-3.5 shrink-0" />
              <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                {currentCountry.name}
              </span>
              {showDialCode && (
                <span className="text-[11px] font-mono font-medium text-gray-500 dark:text-gray-400 shrink-0">
                  ({currentCountry.dialCode})
                </span>
              )}
            </>
          ) : (
            <>
              <Globe className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-gray-400">{placeholder}</span>
            </>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-emerald-600" : ""
          }`}
        />
      </button>

      {/* Menu déroulant avec recherche */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-72 flex flex-col rounded-2xl border border-gray-200 dark:border-[#1E2E24] bg-white dark:bg-[#131E17] shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
          {/* Champ de recherche */}
          <div className="p-2 border-b border-gray-100 dark:border-[#1E2E24] bg-gray-50/80 dark:bg-[#17241C]/80">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un pays ou indicatif..."
                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-[#1E2E24] bg-white dark:bg-[#131E17] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-hidden focus:border-emerald-600"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Liste déroulante des pays */}
          <div className="overflow-y-auto max-h-56 divide-y divide-gray-50 dark:divide-[#1E2E24]/40 py-1">
            {filteredCountries.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-400">
                Aucun pays trouvé
              </div>
            ) : (
              filteredCountries.map((country) => {
                const isSelected = currentCountry?.code === country.code;
                return (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleSelect(country)}
                    className={`w-full touch-target min-h-[44px] px-3 py-2 text-left text-xs flex items-center justify-between gap-2.5 transition-colors ${
                      isSelected
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold"
                        : "hover:bg-gray-50 dark:hover:bg-[#17241C] text-gray-800 dark:text-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <CountryFlag code={country.flagCode} className="w-5 h-3.5 shrink-0" />
                      <span className="truncate">{country.name}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/80 px-1.5 py-0.5 rounded-md border border-gray-200 dark:border-gray-700">
                        {country.dialCode}
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
