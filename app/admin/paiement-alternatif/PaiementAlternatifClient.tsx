"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { getAllCountries, type CountryInfo } from "@/lib/countries";
import { CountryFlag } from "@/components/CountryFlag";
import { AlternativePaymentButton } from "@/components/payments/AlternativePaymentButton";
import type { AlternativePaymentSettings } from "@/lib/data/alternative-payment-store";
import { saveAlternativePaymentAction } from "./actions";
import {
  ShieldCheck,
  ArrowLeft,
  Link as LinkIcon,
  Globe,
  Mail,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Eye,
  Info,
  Check,
} from "lucide-react";

interface PaiementAlternatifClientProps {
  initialSettings: AlternativePaymentSettings;
  userEmail: string;
}

export function PaiementAlternatifClient({
  initialSettings,
  userEmail,
}: PaiementAlternatifClientProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // États du formulaire
  const [isEnabled, setIsEnabled] = useState(initialSettings.isEnabled);
  const [paymentUrl, setPaymentUrl] = useState(initialSettings.paymentUrl || "");
  const [buttonLabel, setButtonLabel] = useState(initialSettings.buttonLabel || "Payer via un lien alternatif");
  const [userMessage, setUserMessage] = useState(
    initialSettings.userMessage || "Si le paiement habituel ne fonctionne pas, utilisez ce lien."
  );
  const [allCountries, setAllCountries] = useState(initialSettings.allCountries);
  const [targetCountries, setTargetCountries] = useState<string[]>(
    initialSettings.targetCountries || []
  );
  const [email, setEmail] = useState(initialSettings.email || userEmail || "support@vitaearn.com");
  const [postPaymentInstructions, setPostPaymentInstructions] = useState(
    initialSettings.postPaymentInstructions ||
      "Après ton paiement, envoie la capture d'écran de ta transaction à l'adresse ci-dessous. Ton compte sera activé après vérification."
  );

  const countriesList = useMemo(() => getAllCountries(), []);

  // Gestion des cases à cocher des pays
  const toggleCountry = (code: string) => {
    const upper = code.toUpperCase();
    if (targetCountries.includes(upper)) {
      setTargetCountries(targetCountries.filter((c) => c !== upper));
    } else {
      setTargetCountries([...targetCountries, upper]);
    }
  };

  const handleSelectAllCountries = (checked: boolean) => {
    setAllCountries(checked);
    if (checked) {
      // Si "Tous les pays" est coché, on peut soit vider soit préserver
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Validation préalable du lien
    const cleanUrl = paymentUrl.trim();
    if (isEnabled || cleanUrl) {
      if (!cleanUrl) {
        setMessage({
          type: "error",
          text: "Le lien de paiement est obligatoire lorsque le bouton alternatif est activé.",
        });
        return;
      }
      if (!cleanUrl.toLowerCase().startsWith("https://")) {
        setMessage({
          type: "error",
          text: "L'adresse du lien de paiement doit obligatoirement commencer par https:// (http://, javascript:, data: refusés).",
        });
        return;
      }
      try {
        const u = new URL(cleanUrl);
        if (u.protocol !== "https:") {
          setMessage({
            type: "error",
            text: "Le protocole du lien doit être strictement https://.",
          });
          return;
        }
      } catch {
        setMessage({ type: "error", text: "L'URL saisie est invalide." });
        return;
      }
    }

    if (isEnabled && !email.trim()) {
      setMessage({
        type: "error",
        text: "Veuillez renseigner votre adresse e-mail administrateur pour la réception des captures d'écran.",
      });
      return;
    }

    startTransition(async () => {
      const res = await saveAlternativePaymentAction({
        isEnabled,
        paymentUrl: cleanUrl,
        buttonLabel,
        userMessage,
        targetCountries,
        allCountries,
        email: email.trim(),
        postPaymentInstructions,
      });

      if (!res.success) {
        setMessage({ type: "error", text: res.error || "Erreur de sauvegarde." });
      } else {
        setMessage({
          type: "success",
          text: res.message || "Paramètres du paiement alternatif enregistrés avec succès.",
        });
      }
    });
  };

  // Objet de prévisualisation
  const previewConfig = useMemo(() => {
    if (!isEnabled || !paymentUrl.trim()) return null;
    return {
      paymentUrl: paymentUrl.trim(),
      buttonLabel: buttonLabel || "Payer via un lien alternatif",
      userMessage,
      email: email.trim() || null,
      postPaymentInstructions,
    };
  }, [isEnabled, paymentUrl, buttonLabel, userMessage, email, postPaymentInstructions]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* 1. En-tête avec bouton retour */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors shadow-2xs"
            title="Retour au Command Center"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Paiement Alternatif</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold border border-sky-200">
                Lien Externe
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Redirigez les utilisateurs vers un lien de paiement externe sécurisé lorsque l&apos;API principale rencontre des limites par pays.
            </p>
          </div>
        </div>

        <Link
          href="/admin/reglages"
          className="text-xs font-bold text-slate-600 hover:text-slate-900 underline hidden sm:inline-block"
        >
          Tous les réglages
        </Link>
      </div>

      {/* Message de notification */}
      {message && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-3 animate-in fade-in ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* 2. Formulaire principal */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-6">
          {/* SECTION A : INTERRUPTEUR D'ACTIVATION */}
          <div
            className={`flex items-center justify-between p-4 sm:p-5 rounded-2xl border-2 transition-all ${
              isEnabled ? "bg-emerald-50/50 border-[#16A34A]" : "bg-slate-50 border-slate-200"
            }`}
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${
                    isEnabled ? "bg-[#16A34A] text-white" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {isEnabled ? "Actif sur le site" : "Désactivé"}
                </span>
                <p className="font-bold text-sm sm:text-base text-slate-900">
                  Activer le bouton de paiement alternatif
                </p>
              </div>
              <p className="text-xs text-slate-500">
                {isEnabled
                  ? "Le bouton sera visible sur les écrans de paiement pour les pays éligibles."
                  : "Le bouton est actuellement masqué pour tous les utilisateurs."}
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-8 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6.5 after:w-6.5 after:transition-all peer-checked:bg-[#16A34A] shadow-inner"></div>
            </label>
          </div>

          {/* SECTION B : LIEN DE PAIEMENT & LIBELLÉ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Champ Lien de paiement */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Lien de paiement externe (HTTPS uniquement) *
                </label>
                <span className="text-[11px] text-slate-400 font-medium">Ex: SasPay, PayDunya, Stripe</span>
              </div>
              <div className="relative">
                <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={paymentUrl}
                  onChange={(e) => setPaymentUrl(e.target.value)}
                  placeholder="https://app.saspay.me/pay/..."
                  required={isEnabled}
                  className="w-full touch-target pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Seules les adresses sécurisées débutant strictement par <strong>https://</strong> sont acceptées.
              </p>
            </div>

            {/* Champ Libellé du bouton */}
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5">
                Libellé du bouton
              </label>
              <input
                type="text"
                value={buttonLabel}
                onChange={(e) => setButtonLabel(e.target.value)}
                placeholder="Payer via un lien alternatif"
                required
                className="w-full touch-target px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-hidden focus:border-emerald-600"
              />
            </div>

            {/* Champ Message affiché aux utilisateurs */}
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5">
                Message affiché aux utilisateurs
              </label>
              <input
                type="text"
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                placeholder="Si le paiement habituel ne fonctionne pas, utilisez ce lien."
                required
                className="w-full touch-target px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:border-emerald-600"
              />
            </div>
          </div>

          {/* SECTION C : SÉLECTION DES PAYS CONCERNÉS */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Pays concernés
                </label>
                <p className="text-xs text-slate-500 mt-0.5">
                  Le bouton sera affiché exclusivement aux utilisateurs dont le profil correspond aux pays sélectionnés.
                </p>
              </div>

              {/* Case Tous les pays */}
              <button
                type="button"
                onClick={() => handleSelectAllCountries(!allCountries)}
                className={`touch-target px-3.5 py-2 rounded-xl flex items-center gap-2.5 border-2 transition-all cursor-pointer ${
                  allCountries
                    ? "bg-white border-[#16A34A] text-[#16A34A] font-bold shadow-xs"
                    : "bg-slate-100 border-slate-300 text-slate-700 font-semibold"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-md flex items-center justify-center border-2 transition-all ${
                    allCountries
                      ? "bg-[#16A34A] border-[#16A34A] text-white shadow-xs"
                      : "bg-white border-slate-300 text-transparent"
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span className="text-xs font-black">Tous les pays (sans filtre)</span>
              </button>
            </div>

            {/* Grille des 25 pays */}
            {!allCountries && (
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 max-h-72 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {countriesList.map((country) => {
                    const isChecked = targetCountries.includes(country.code.toUpperCase());
                    return (
                      <button
                        key={country.code}
                        type="button"
                        onClick={() => toggleCountry(country.code)}
                        className={`touch-target p-2.5 rounded-xl text-left text-xs flex items-center justify-between gap-2 border-2 transition-all cursor-pointer ${
                          isChecked
                            ? "bg-emerald-50/40 border-[#16A34A] shadow-xs text-slate-900 font-bold"
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <CountryFlag code={country.flagCode} className="w-5 h-3.5 shrink-0 rounded-xs shadow-2xs" />
                          <div className="truncate">
                            <span className="block truncate font-semibold">{country.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono font-normal">
                              {country.currency}
                            </span>
                          </div>
                        </div>
                        <div
                          className={`w-6 h-6 rounded-md shrink-0 flex items-center justify-center border-2 transition-all ${
                            isChecked
                              ? "bg-[#16A34A] border-[#16A34A] text-white shadow-xs"
                              : "bg-white border-slate-300 text-transparent"
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {!allCountries && targetCountries.length === 0 && (
              <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 p-2.5 rounded-xl">
                Aucun pays n&apos;est actuellement coché : le bouton alternatif ne sera affiché à personne.
              </p>
            )}
          </div>

          {/* SECTION D : ADRESSE E-MAIL DE RÉCEPTION DES CAPTURES (MODIFIABLE PAR L'ADMINISTRATEUR) */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                Votre adresse e-mail officielle de réception des captures
              </label>
              <p className="text-xs text-slate-500 mb-2">
                Renseignez ici l&apos;adresse e-mail (votre propre e-mail administrateur ou support) sur laquelle les adhérents doivent expédier la capture de leur transaction. Vous pouvez la modifier à tout moment.
              </p>
              <div className="relative max-w-lg">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@vitaearn.com ou contact@..."
                  className="w-full touch-target pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 font-medium focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5">
                Instructions après paiement
              </label>
              <textarea
                value={postPaymentInstructions}
                onChange={(e) => setPostPaymentInstructions(e.target.value)}
                rows={2}
                placeholder="Après ton paiement, envoie la capture d'écran de ta transaction à l'adresse ci-dessous. Ton compte sera activé après vérification."
                className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:border-emerald-600"
              />
            </div>
          </div>

          {/* SECTION E : BOUTON ENREGISTRER */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="w-full touch-target min-h-[46px] rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-sm py-3.5 px-6 flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-60 cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enregistrement en cours...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5 text-white" />
                  <span>Enregistrer les paramètres du paiement alternatif</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* 3. Aperçu en temps réel : "Tel que l'utilisateur le verra" */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-sky-600" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
              Aperçu en direct (tel que l&apos;utilisateur le verra sur son écran de paiement)
            </h3>
          </div>
          <span className="text-[11px] font-bold text-slate-400">Rendu instantané</span>
        </div>

        {previewConfig ? (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 max-w-lg mx-auto">
            {/* Simulation du bouton normal */}
            <div className="w-full py-3.5 rounded-2xl bg-emerald-700 text-white font-black text-xs text-center opacity-60 pointer-events-none select-none">
              Payer 4 500 FCFA (Bouton normal)
            </div>

            {/* Composant de bouton alternatif avec aperçu */}
            <AlternativePaymentButton config={previewConfig} username="koffi" />
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-400">
            {isEnabled
              ? "Veuillez renseigner un lien HTTPS valide pour voir l'aperçu."
              : "Le paiement alternatif est actuellement désactivé. Activez l'interrupteur ci-dessus pour prévisualiser le bouton."}
          </div>
        )}
      </div>
    </div>
  );
}
