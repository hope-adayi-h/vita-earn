"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  AlertTriangle,
  Mail,
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
  Check,
  X,
  RotateCcw,
  Sliders,
  CheckSquare,
  Square,
  Globe,
} from "lucide-react";
import { getAllCountries, type CountryInfo } from "@/lib/countries";
import { CountryFlag } from "@/components/CountryFlag";
import { saveAutoPaymentCountriesAction } from "./actions";
import type { AutoPaymentCountrySettings } from "@/lib/data/auto-payment-countries-store";

interface PaiementsAutoClientProps {
  initialSettings: AutoPaymentCountrySettings;
  userEmail: string;
}

export function PaiementsAutoClient({
  initialSettings,
  userEmail,
}: PaiementsAutoClientProps) {
  const [suspendedCountries, setSuspendedCountries] = useState<string[]>(
    initialSettings.suspendedCountries || []
  );
  const [adminEmail, setAdminEmail] = useState(
    initialSettings.adminEmail || userEmail || "admin@vitaearn.com"
  );
  const [customMessage, setCustomMessage] = useState(
    initialSettings.customMessage ||
      "Les paiements automatiques sont temporairement suspendus pour votre pays. Veuillez contacter notre administration pour procéder à votre adhésion."
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Liste des 25 pays officiels pris en charge par SasPay
  const allCountriesList = useMemo(() => getAllCountries().filter((c) => c.saspaySupported !== false), []);

  // Filtrage dynamique selon la recherche
  const filteredCountries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allCountriesList;
    return allCountriesList.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.currency.toLowerCase().includes(q)
    );
  }, [allCountriesList, searchQuery]);

  // Un pays est ACTIF si son code n'est PAS dans suspendedCountries
  const isCountryActive = (code: string) => {
    return !suspendedCountries.includes(code.toUpperCase());
  };

  const toggleCountryActive = (code: string) => {
    const upper = code.toUpperCase();
    if (suspendedCountries.includes(upper)) {
      // Était suspendu -> devient actif (retiré de la liste noire)
      setSuspendedCountries(suspendedCountries.filter((c) => c !== upper));
    } else {
      // Était actif -> devient suspendu (ajouté à la liste noire)
      setSuspendedCountries([...suspendedCountries, upper]);
    }
  };

  const handleActivateAll = () => {
    setSuspendedCountries([]); // Aucun pays suspendu = tous cochés
  };

  const handleSuspendAll = () => {
    setSuspendedCountries(allCountriesList.map((c) => c.code.toUpperCase()));
  };

  const activeCount = allCountriesList.length - suspendedCountries.length;
  const suspendedCount = suspendedCountries.length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const res = await saveAutoPaymentCountriesAction({
        suspendedCountries,
        customMessage: customMessage.trim(),
        adminEmail: adminEmail.trim(),
      });

      if (res.success) {
        setMessage({
          type: "success",
          text: res.message || "Paramètres enregistrés et appliqués en direct sur le site.",
        });
      } else {
        setMessage({
          type: "error",
          text: res.error || "Erreur lors de la sauvegarde.",
        });
      }
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* 1. EN-TÊTE DE LA PAGE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors shadow-2xs"
            title="Retour au Command Center"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-0.5">
              <span>Administration</span>
              <span>/</span>
              <span className="text-slate-900 font-bold">Paiement Automatique</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Contrôle des Pays & Paiements Automatiques SasPay
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            <span>25 Pays SasPay</span>
          </span>
        </div>
      </div>

      {/* NOTIFICATION D'ÉTAT */}
      {message && (
        <div
          className={`p-4 rounded-2xl flex items-start gap-3 text-xs font-bold border transition-all ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-950"
              : "bg-red-50 border-red-300 text-red-950"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <p className="leading-relaxed">{message.text}</p>
        </div>
      )}

      {/* 2. CONFIGURATION GLOBALE (MESSAGE D'ALERTE & EMAIL ADMIN) */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Paramètres d&apos;Alerte pour les Pays Suspendus
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Modifiable à tout moment
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                E-mail de contact affiché aux pays suspendus
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@vitaearn.com"
                  className="w-full touch-target pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 font-medium focus:outline-hidden focus:border-emerald-600"
                  required
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                Message d&apos;alerte affiché à l&apos;utilisateur d&apos;un pays suspendu
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={2}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600"
                placeholder="Ex: Les paiements automatiques sont temporairement suspendus pour votre pays. Veuillez contacter notre administration..."
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Ce message sera affiché dans un encadré blanc épuré avec bordure verte sur la page de paiement lorsque l&apos;utilisateur sélectionne un pays décoché.
              </p>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="touch-target min-h-[44px] px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              {isPending ? (
                <span>Enregistrement...</span>
              ) : (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Enregistrer les réglages & autorisations</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 3. BARRE DE RECHERCHE & GESTION DES PAYS */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Autorisation des Pays SasPay
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Cochez pour autoriser les paiements SasPay. Décochez un pays pour bloquer immédiatement ses transactions en cas de suspicion ou de fraude.
              </p>
            </div>

            {/* Statistiques rapides */}
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                {activeCount} Autorisé(s)
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
                {suspendedCount} Suspendu(s)
              </span>
            </div>
          </div>

          {/* Recherche & boutons de masse */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un pays ou une devise (ex: Togo, Bénin, XOF)..."
                className="w-full touch-target pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:border-emerald-600"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleActivateAll}
                className="flex-1 sm:flex-none touch-target px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tout activer (Tous cochés)</span>
              </button>

              <button
                type="button"
                onClick={handleSuspendAll}
                className="flex-1 sm:flex-none touch-target px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5 text-red-500" />
                <span>Tout suspendre</span>
              </button>
            </div>
          </div>

          {/* GRILLE DES 25 PAYS AVEC CROCHET / CASE ULTRA-VISIBLE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-3">
            {filteredCountries.map((country) => {
              const active = isCountryActive(country.code);
              return (
                <div
                  key={country.code}
                  onClick={() => toggleCountryActive(country.code)}
                  className={`touch-target p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    active
                      ? "bg-emerald-50/40 border-emerald-500/80 shadow-2xs hover:bg-emerald-50/70"
                      : "bg-white border-slate-200 opacity-60 hover:opacity-90"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <CountryFlag code={country.flagCode} className="w-6 h-4.5 rounded-xs shrink-0 shadow-2xs" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-xs sm:text-sm font-black text-slate-900 truncate">
                          {country.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700">
                          Devise : {country.currency}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {country.code}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* CROCHET / CASE ULTRA-VISIBLE AUX COULEURS DU SITE */}
                  <div className="shrink-0 flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md hidden sm:inline-block ${
                        active
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {active ? "Actif" : "Suspendu"}
                    </span>

                    <div
                      className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all ${
                        active
                          ? "bg-emerald-600 border-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30"
                          : "bg-white border-slate-300 text-transparent"
                      }`}
                      title={active ? "Pays autorisé (Coché)" : "Pays suspendu (Décoché)"}
                    >
                      <Check className="w-4 h-4 stroke-3 text-white" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredCountries.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-xs font-medium">
              Aucun pays correspondant à « {searchQuery} ».
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
