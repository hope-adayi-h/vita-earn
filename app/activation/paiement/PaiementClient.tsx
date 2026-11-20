"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ActivationData } from "../types";
import { submitActivationPaymentAction } from "../actions";
import { formatFCFA } from "@/lib/utils";
import { CountrySelect, type Country } from "@/components/CountrySelect";
import { OperatorLogo } from "@/components/OperatorLogo";
import { TermsAccordion } from "@/components/TermsAccordion";
import { AlternativePaymentButton } from "@/components/payments/AlternativePaymentButton";
import type { AlternativePaymentUserView } from "@/lib/data/alternative-payment-store";
import { getCountryByCode } from "@/lib/countries";
import {
  ShieldCheck,
  ArrowLeft,
  Lock,
  Phone,
  User,
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  CreditCard,
  Zap,
  ShieldAlert,
} from "lucide-react";
import type { AutoPaymentCountrySettings } from "@/lib/data/auto-payment-countries-store";

interface PaiementClientProps {
  initialData: ActivationData;
  alternativePayment?: AlternativePaymentUserView | null;
  autoPaymentSettings?: AutoPaymentCountrySettings | null;
}

interface Operator {
  id: string;
  name: string;
  subtitle: string;
}

function getOperatorsForCountry(countryCode?: string): Operator[] {
  switch (countryCode) {
    case "TG":
      return [
        { id: "tmoney", name: "T-Money", subtitle: "Togocom Togo" },
        { id: "flooz", name: "Moov Flooz", subtitle: "Moov Africa Togo" },
        { id: "card", name: "Carte bancaire", subtitle: "Visa / Mastercard" },
      ];
    case "BJ":
      return [
        { id: "mtn_momo", name: "MTN Mobile Money", subtitle: "MTN Bénin" },
        { id: "moov", name: "Moov Money", subtitle: "Moov Africa Bénin" },
        { id: "celtiis", name: "Celtiis Cash", subtitle: "SBIN Bénin" },
        { id: "card", name: "Carte bancaire", subtitle: "Visa / Mastercard" },
      ];
    case "CI":
      return [
        { id: "wave", name: "Wave", subtitle: "Wave Côte d'Ivoire" },
        { id: "orange", name: "Orange Money", subtitle: "Orange CI" },
        { id: "mtn_momo", name: "MTN Mobile Money", subtitle: "MTN CI" },
        { id: "moov", name: "Moov Money", subtitle: "Moov Africa CI" },
        { id: "card", name: "Carte bancaire", subtitle: "Visa / Mastercard" },
      ];
    case "SN":
      return [
        { id: "wave", name: "Wave", subtitle: "Wave Sénégal" },
        { id: "orange", name: "Orange Money", subtitle: "Orange Sénégal" },
        { id: "free", name: "Free Money", subtitle: "Free Sénégal" },
        { id: "card", name: "Carte bancaire", subtitle: "Visa / Mastercard" },
      ];
    case "BF":
      return [
        { id: "orange", name: "Orange Money", subtitle: "Orange Burkina" },
        { id: "moov", name: "Moov Money", subtitle: "Moov Africa Burkina" },
        { id: "card", name: "Carte bancaire", subtitle: "Visa / Mastercard" },
      ];
    case "ML":
      return [
        { id: "orange", name: "Orange Money", subtitle: "Orange Mali" },
        { id: "moov", name: "Moov Money", subtitle: "Moov Africa Mali" },
        { id: "card", name: "Carte bancaire", subtitle: "Visa / Mastercard" },
      ];
    case "CM":
      return [
        { id: "mtn_momo", name: "MTN Mobile Money", subtitle: "MTN Cameroun" },
        { id: "orange", name: "Orange Money", subtitle: "Orange Cameroun" },
        { id: "card", name: "Carte bancaire", subtitle: "Visa / Mastercard" },
      ];
    case "GN":
      return [
        { id: "orange", name: "Orange Money", subtitle: "Orange Guinée" },
        { id: "mtn_momo", name: "MTN Mobile Money", subtitle: "MTN Guinée" },
        { id: "card", name: "Carte bancaire", subtitle: "Visa / Mastercard" },
      ];
    case "NE":
      return [
        { id: "airtel", name: "Airtel Money", subtitle: "Airtel Niger" },
        { id: "moov", name: "Moov Money", subtitle: "Moov Africa Niger" },
        { id: "card", name: "Carte bancaire", subtitle: "Visa / Mastercard" },
      ];
    default:
      return [
        { id: "mobile_money", name: "Mobile Money", subtitle: "Opérateur sous-régional" },
        { id: "card", name: "Carte bancaire", subtitle: "Visa / Mastercard" },
      ];
  }
}

export function PaiementClient({
  initialData,
  alternativePayment,
  autoPaymentSettings,
}: PaiementClientProps) {
  const router = useRouter();

  const [fullName, setFullName] = useState(
    initialData.user.fullName !== "Utilisateur" && initialData.user.fullName !== "Nouvel Utilisateur"
      ? initialData.user.fullName
      : ""
  );
  const [email, setEmail] = useState(
    initialData.user.email !== "visiteur@vitaearn.com" ? initialData.user.email : ""
  );

  // Pays sélectionné (null par défaut pour obliger à choisir)
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [phone, setPhone] = useState(initialData.user.phone || "");
  const [paymentMethod, setPaymentMethod] = useState<string>("tmoney");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(initialData.isActivated);

  // Opérateurs disponibles selon le pays choisi depuis la source unique lib/countries
  const countryObj = selectedCountry ? getCountryByCode(selectedCountry.code) : null;
  const operators: Operator[] =
    countryObj && countryObj.payinOperators.length > 0
      ? countryObj.payinOperators.map((op) => ({
          id: op.code,
          name: op.name,
          subtitle: `${countryObj.name} (${countryObj.currency})`,
        }))
      : getOperatorsForCountry(selectedCountry?.code);

  const isSaspayUnsupported = useMemo(() => {
    if (!selectedCountry) return false;
    const countryData = getCountryByCode(selectedCountry.code);
    return countryData ? countryData.saspaySupported === false : selectedCountry.code === "TD";
  }, [selectedCountry]);

  const isCountrySuspended = useMemo(() => {
    if (!selectedCountry || !autoPaymentSettings?.suspendedCountries) return false;
    return autoPaymentSettings.suspendedCountries.includes(selectedCountry.code.toUpperCase());
  }, [selectedCountry, autoPaymentSettings?.suspendedCountries]);

  const handleCountryChange = (country: Country) => {
    setSelectedCountry(country);
    const countryData = getCountryByCode(country.code);
    if (countryData && countryData.payinOperators.length > 0) {
      setPaymentMethod(countryData.payinOperators[0].code);
    } else {
      const countryOps = getOperatorsForCountry(country.code);
      if (countryOps.length > 0) {
        setPaymentMethod(countryOps[0].id);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedCountry) {
      setErrorMessage("Veuillez sélectionner votre pays de résidence.");
      return;
    }

    if (isSaspayUnsupported) {
      setErrorMessage(
        "Le paiement en ligne n'est pas encore disponible pour le Tchad. Contactez l'administrateur pour effectuer votre paiement et activer votre compte."
      );
      return;
    }

    if (isCountrySuspended) {
      setErrorMessage(
        autoPaymentSettings?.customMessage ||
          `Les paiements automatiques sont temporairement suspendus pour votre pays (${selectedCountry.name}). Veuillez contacter notre administration.`
      );
      return;
    }

    if (!phone || phone.trim().length < 6) {
      setErrorMessage("Veuillez entrer un numéro de téléphone Mobile Money valide.");
      return;
    }

    if (!fullName || fullName.trim().length < 2) {
      setErrorMessage("Veuillez renseigner votre nom complet.");
      return;
    }

    if (!termsAccepted) {
      setErrorMessage("Veuillez accepter les conditions générales ci-dessous pour procéder au paiement.");
      return;
    }

    const formattedPhone = phone.startsWith("+")
      ? phone.trim()
      : `${selectedCountry.dialCode} ${phone.trim()}`;

    setLoading(true);

    try {
      const res = await submitActivationPaymentAction({
        fullName: fullName.trim(),
        country: selectedCountry.name,
        phone: formattedPhone,
        paymentMethod,
      });

      if (res.error) {
        setErrorMessage(res.error);
      } else if (res.success) {
        if (res.redirectUrl && res.redirectUrl.startsWith("http")) {
          window.location.href = res.redirectUrl;
          return;
        }
        setIsSuccess(true);
        setTimeout(() => {
          router.push("/activation");
        }, 1800);
      }
    } catch {
      setErrorMessage("Une erreur est survenue lors du traitement du paiement.");
    } finally {
      setLoading(false);
    }
  };

  // Écran de confirmation de paiement réussi
  if (isSuccess) {
    return (
      <div className="max-w-lg mx-auto py-8 px-4 text-center">
        <div className="bg-white rounded-3xl border border-vita-border p-8 sm:p-10 shadow-xl space-y-5 animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-green-100 text-vita-deep flex items-center justify-center mx-auto border-2 border-vita-bright">
            <CheckCircle2 className="w-10 h-10 text-vita-deep" />
          </div>

          <h1 className="text-2xl font-black text-vita-deep">
            Paiement confirmé avec succès !
          </h1>
          <p className="text-xs sm:text-sm text-vita-muted max-w-sm mx-auto leading-relaxed">
            Félicitations ! Votre adhésion Vita Earn de <strong>{formatFCFA(initialData.feeAmount)}</strong> a été
            validée. Votre compte vendeur est désormais pleinement actif.
          </p>

          <div className="pt-3 flex flex-col sm:flex-row gap-2.5 justify-center">
            <Link
              href="/vendre"
              className="touch-target px-5 py-2.5 rounded-xl bg-vita-deep hover:bg-vita-medium text-white font-bold text-xs shadow-md transition-colors inline-flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 text-vita-bright" />
              <span>Publier mon premier article</span>
            </Link>
            <Link
              href="/portefeuille"
              className="touch-target px-5 py-2.5 rounded-xl bg-white hover:bg-vita-surface border border-vita-border text-vita-deep font-semibold text-xs transition-colors inline-flex items-center justify-center"
            >
              <span>Accéder à mon portefeuille</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-4 sm:py-8 px-2 space-y-6">
      {/* Lien retour vers la page d'adhésion */}
      <div className="flex items-center justify-between">
        <Link
          href="/activation"
          className="inline-flex items-center gap-2 text-xs font-bold text-vita-muted hover:text-vita-deep transition-colors touch-target px-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour aux informations d'adhésion</span>
        </Link>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-green-100 text-vita-deep">
          <Lock className="w-3 h-3" />
          <span>Paiement sécurisé</span>
        </div>
      </div>

      {/* Carte du formulaire de paiement */}
      <div className="bg-white rounded-3xl border border-vita-border/90 p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* En-tête récapitulatif */}
        <div className="border-b border-vita-border/80 pb-5 mb-5 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-vita-deep">
              Finalisation de paiement
            </h1>
          </div>

          <div className="text-right flex-shrink-0">
            <span className="block text-[10px] uppercase font-bold text-vita-muted">
              Total à payer
            </span>
            <span className="text-xl sm:text-2xl font-black text-vita-deep">
              {formatFCFA(initialData.feeAmount)}
            </span>
          </div>
        </div>

        {/* Message d'erreur */}
        {errorMessage && (
          <div className="mb-5 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Nom complet */}
          <div>
            <label className="block text-xs font-bold text-vita-text uppercase tracking-wider mb-1.5">
              Nom complet du titulaire
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-vita-muted" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Votre nom complet"
                required
                className="w-full touch-target rounded-xl border border-vita-border bg-white pl-10 pr-4 text-xs sm:text-sm text-vita-text placeholder:text-vita-muted/60 focus:outline-none focus:ring-2 focus:ring-vita-medium"
              />
            </div>
          </div>

          {/* 2. Adresse e-mail pour reçu */}
          <div>
            <label className="block text-xs font-bold text-vita-text uppercase tracking-wider mb-1.5">
              Adresse e-mail (reçu de paiement)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-vita-muted" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nom@exemple.com"
                required
                className="w-full touch-target rounded-xl border border-vita-border bg-white pl-10 pr-4 text-xs sm:text-sm text-vita-text placeholder:text-vita-muted/60 focus:outline-none focus:ring-2 focus:ring-vita-medium"
              />
            </div>
          </div>

          {/* 3. Choix du pays de résidence */}
          <div>
            <label className="block text-xs font-bold text-vita-text uppercase tracking-wider mb-1.5">
              Votre pays de résidence
            </label>
            <CountrySelect value={selectedCountry} onChange={handleCountryChange} />
          </div>

          {/* 4. Moyen de paiement Mobile Money selon pays */}
          {selectedCountry && !isSaspayUnsupported && operators.length > 0 && (
            <div className="pt-2 animate-fadeIn">
              <label className="block text-xs font-bold text-vita-text uppercase tracking-wider mb-2">
                Opérateur Mobile Money disponible ({selectedCountry.name}) :
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {operators.map((op) => (
                  <button
                    key={op.id}
                    type="button"
                    onClick={() => setPaymentMethod(op.id)}
                    className={`touch-target p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 ${
                      paymentMethod === op.id
                        ? "border-vita-deep bg-green-50/70 ring-2 ring-vita-deep shadow-sm"
                        : "border-vita-border bg-white hover:border-vita-medium hover:bg-vita-surface/40"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <OperatorLogo operatorId={op.id} className="w-9 h-9" />
                      <div className="min-w-0">
                        <span className="block text-xs sm:text-sm font-bold text-vita-deep truncate">
                          {op.name}
                        </span>
                        <span className="block text-[11px] text-vita-muted truncate">
                          {op.subtitle}
                        </span>
                      </div>
                    </div>
                    {paymentMethod === op.id ? (
                      <CheckCircle2 className="w-4 h-4 text-vita-deep flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-vita-border flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 5. Numéro de téléphone Mobile Money */}
          <div>
            <label className="block text-xs font-bold text-vita-text uppercase tracking-wider mb-1.5">
              Numéro de téléphone Mobile Money
            </label>
            <div className="relative flex rounded-xl border border-vita-border overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-vita-medium">
              <div className="flex items-center gap-1.5 px-3 py-2 bg-vita-surface border-r border-vita-border text-vita-text font-bold text-xs select-none">
                <Phone className="w-3.5 h-3.5 text-vita-muted" />
                <span>{selectedCountry ? selectedCountry.dialCode : "+..."}</span>
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Entrez le numéro de téléphone Mobile Money"
                required
                className="w-full touch-target px-3 py-2 text-xs sm:text-sm text-vita-text placeholder:text-vita-muted/60 focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-vita-muted mt-1">
              Un message de validation Mobile Money sera envoyé sur ce numéro.
            </p>
          </div>

          {/* Conditions générales d'adhésion & Avertissement obligatoire */}
          <div className="pt-2">
            <TermsAccordion
              checked={termsAccepted}
              onChange={setTermsAccepted}
              error={errorMessage && !termsAccepted ? "Veuillez cocher cette case pour continuer" : undefined}
            />
          </div>

          {/* Bouton de confirmation du paiement ou Message Tchad / suspension */}
          <div className="pt-4">
            {isSaspayUnsupported ? (
              <div className="p-5 rounded-2xl bg-white border-2 border-emerald-600 shadow-md space-y-3 text-center animate-fadeIn">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center border border-emerald-200">
                  <ShieldAlert className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-slate-900">
                    Paiement en ligne non disponible ({selectedCountry?.name})
                  </h3>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed max-w-md mx-auto">
                    Le paiement en ligne n'est pas encore disponible pour le Tchad. Contactez l'administrateur pour effectuer votre paiement et activer votre compte.
                  </p>
                </div>
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                  <a
                    href={`mailto:${autoPaymentSettings?.adminEmail || "admin@vitaearn.com"}?subject=${encodeURIComponent(`Assistance paiement adhésion - Tchad (@${initialData.user.username || initialData.user.fullName})`)}`}
                    className="w-full sm:w-auto touch-target px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Mail className="w-4 h-4 text-white" />
                    <span>Contacter l&apos;administrateur : {autoPaymentSettings?.adminEmail || "admin@vitaearn.com"}</span>
                  </a>
                </div>
              </div>
            ) : isCountrySuspended ? (
              <div className="p-5 rounded-2xl bg-white border-2 border-emerald-600 shadow-md space-y-3 text-center animate-fadeIn">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center border border-emerald-200">
                  <ShieldAlert className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-slate-900">
                    Paiement automatique suspendu ({selectedCountry?.name})
                  </h3>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed max-w-md mx-auto">
                    {autoPaymentSettings?.customMessage ||
                      "Votre pays a été temporairement suspendu pour les paiements automatiques sur le site. Veuillez contacter l'administrateur."}
                  </p>
                </div>
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                  <a
                    href={`mailto:${autoPaymentSettings?.adminEmail || "admin@vitaearn.com"}?subject=${encodeURIComponent(`Assistance paiement adhésion - ${selectedCountry?.name} (@${initialData.user.username})`)}`}
                    className="w-full sm:w-auto touch-target px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Mail className="w-4 h-4 text-white" />
                    <span>Contacter l&apos;administrateur : {autoPaymentSettings?.adminEmail || "admin@vitaearn.com"}</span>
                  </a>
                </div>
              </div>
            ) : (
              <button
                type="submit"
                disabled={loading || !termsAccepted}
                className="w-full touch-target rounded-2xl bg-gradient-to-r from-vita-deep via-vita-medium to-[#236014] hover:from-vita-medium hover:to-vita-deep text-white font-extrabold text-sm sm:text-base transition-all duration-300 shadow-md hover:shadow-xl active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 py-4 cursor-pointer"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Traitement du paiement sécurisé...</span>
                  </div>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-vita-bright" />
                    <span>Payer {formatFCFA(initialData.feeAmount)}</span>
                  </>
                )}
              </button>
            )}

            {/* Bouton de paiement alternatif (affiché uniquement si éligible côté serveur) */}
            <AlternativePaymentButton
              config={alternativePayment || null}
              username={initialData.user.username || initialData.user.fullName}
            />
          </div>
        </form>

        <div className="mt-5 pt-4 border-t border-vita-border/60 text-center">
          <p className="text-[11px] text-vita-muted leading-relaxed">
            Paiement unique certifié. En validant, votre compte est immédiatement rattaché au grand
            livre financier Vita Earn.
          </p>
        </div>
      </div>
    </div>
  );
}
