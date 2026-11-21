"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import type { ActivationData } from "./types";
import {
  startSasPayActivationAction,
  checkSasPayPaymentStatusAction,
  confirmSasPayOtpAction,
} from "./actions";
import {
  User,
  CreditCard,
  Globe,
  ArrowLeftRight,
  Home,
  Wallet,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  ChevronDown,
  ArrowUp,
  ShieldAlert,
  Mail,
  KeyRound,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";

import { AlternativePaymentButton } from "@/components/payments/AlternativePaymentButton";
import type { AlternativePaymentUserView } from "@/lib/data/alternative-payment-store";
import type { AutoPaymentCountrySettings } from "@/lib/data/auto-payment-countries-store";
import {
  resolveUserCountry,
  getAllCountries,
  type CountryInfo,
  type CountryOperator,
} from "@/lib/countries";

interface ActivationClientProps {
  initialData: ActivationData;
  alternativePayment?: AlternativePaymentUserView | null;
  autoPaymentSettings?: AutoPaymentCountrySettings | null;
}

export function stripCountryDialCode(rawPhone?: string | null): string {
  if (!rawPhone) return "";
  let p = rawPhone.trim();
  if (p.startsWith("+")) {
    p = p.slice(1).trim();
  } else if (p.startsWith("00")) {
    p = p.slice(2).trim();
  }
  const codes = [
    "228", "229", "225", "221", "226", "227", "224",
    "241", "242", "243", "233", "260", "237", "235"
  ];
  for (const code of codes) {
    if (p.startsWith(code) && p.length > code.length + 4) {
      p = p.slice(code.length).trim();
      break;
    }
  }
  return p.replace(/^[\s\-\.\(\)]+/, "").trim();
}

export function ActivationClient({
  initialData,
  alternativePayment,
  autoPaymentSettings,
}: ActivationClientProps) {
  const router = useRouter();
  const { t } = useApp();

  // 1. Détection automatique du pays de l'utilisateur
  const allCountries = getAllCountries();
  const initialCountry = resolveUserCountry(initialData.user.country, initialData.user.phone);
  const [activeCountry, setActiveCountry] = useState<CountryInfo>(initialCountry);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  // 2. Opérateurs strictement filtrés pour le pays de l'utilisateur
  const availableOperators: CountryOperator[] =
    activeCountry.payinOperators && activeCountry.payinOperators.length > 0
      ? activeCountry.payinOperators
      : activeCountry.saspaySupported
      ? [{ code: "card", name: "Carte Bancaire Visa / Mastercard" }]
      : [];

  const [selectedChannel, setSelectedChannel] = useState<string>(
    availableOperators[0]?.code || "togocel"
  );

  // Mettre à jour l'opérateur sélectionné si le pays change
  const handleCountrySelect = (code: string) => {
    const found = allCountries.find((c) => c.code === code);
    if (found) {
      setActiveCountry(found);
      const ops = found.payinOperators.length > 0 ? found.payinOperators : [{ code: "card", name: "Carte Bancaire" }];
      setSelectedChannel(ops[0]?.code || "togocel");
      setShowCountryPicker(false);
      setErrorMessage(null);
    }
  };

  const [fullName, setFullName] = useState(
    initialData.user.fullName || initialData.user.username || ""
  );
  const [walletNumber, setWalletNumber] = useState(
    stripCountryDialCode(initialData.user.phone) || ""
  );

  // États pour le paiement direct in-app (STK Push)
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  type PushState = "idle" | "waiting_pin" | "otp_prompt" | "success" | "failed";
  const [pushState, setPushState] = useState<PushState>("idle");
  const [activeSlug, setActiveSlug] = useState<string>("");
  const [activeTxId, setActiveTxId] = useState<string>("");
  const [instructions, setInstructions] = useState<string[]>([]);
  const [otpValue, setOtpValue] = useState<string>("");
  const [otpSubmitting, setOtpSubmitting] = useState<boolean>(false);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const displayUsername = initialData.user.username || initialData.user.fullName || "Utilisateur";
  const rawInitialPhone = walletNumber || initialData.user.phone || "";
  const displayPhone = stripCountryDialCode(rawInitialPhone) || "90 00 00 00";
  const currency = initialData.currency || "XOF";

  const isChad = activeCountry.code === "TD" || !activeCountry.saspaySupported;
  const isCountrySuspended = Boolean(
    autoPaymentSettings?.suspendedCountries &&
    autoPaymentSettings.suspendedCountries.includes(activeCountry.code.toUpperCase())
  );

  const selectedOperator = availableOperators.find((op) => op.code === selectedChannel);
  const selectedOperatorName = selectedOperator?.name || "Mobile Money";

  // Nettoyage de l'intervalle de polling au démontage
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Déclencher le paiement direct (STK Push sur le téléphone du client)
  const handleStartPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (isChad) {
      setErrorMessage(
        "Le paiement en ligne n'est pas encore disponible pour le Tchad. Contactez l'administrateur pour effectuer votre paiement et activer votre compte."
      );
      return;
    }

    if (isCountrySuspended) {
      setErrorMessage(
        autoPaymentSettings?.customMessage ||
          "Les paiements automatiques sont temporairement suspendus pour votre pays. Veuillez contacter notre administration."
      );
      return;
    }

    const cleanLocalDigits = walletNumber.replace(/\D/g, "");
    if (cleanLocalDigits.length < 6) {
      setErrorMessage("Veuillez saisir un numéro de téléphone valide.");
      return;
    }

    setIsProcessing(true);

    try {
      const res = await startSasPayActivationAction({
        channel: selectedChannel,
        walletNumber: cleanLocalDigits,
        fullName: fullName.trim(),
        countryCode: activeCountry.code,
      });

      if (res.error) {
        setErrorMessage(res.error);
        setIsProcessing(false);
        return;
      }

      if (res.success && res.slug) {
        setActiveSlug(res.slug);
        setActiveTxId(res.transactionId || "");
        setInstructions(
          res.instructions && res.instructions.length > 0
            ? res.instructions
            : ["Merci de finaliser le paiement sur votre téléphone."]
        );
        setIsProcessing(false);

        if (res.otpRequired) {
          setPushState("otp_prompt");
        } else {
          setPushState("waiting_pin");
        }

        // Lancement du polling en direct (interrogation toutes les 2.5 secondes)
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        const slugToCheck = res.slug;
        const txToCheck = res.transactionId;

        pollIntervalRef.current = setInterval(async () => {
          const statusRes = await checkSasPayPaymentStatusAction({
            slug: slugToCheck,
            transactionId: txToCheck,
          });

          if (statusRes.status === "SUCCESS") {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setPushState("success");
            try {
              document.cookie = "vita_account_activated=true; path=/; max-age=2592000; SameSite=Lax";
            } catch {}
            setTimeout(() => {
              window.location.href = "/";
            }, 1800);
          } else if (statusRes.status === "FAILED") {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setPushState("failed");
            setErrorMessage(statusRes.error || "Le paiement n'a pas été validé sur votre mobile.");
          }
        }, 2500);
      } else {
        setErrorMessage("Impossible d'initier la demande sur votre mobile. Veuillez réessayer.");
        setIsProcessing(false);
      }
    } catch {
      setErrorMessage("Une erreur réseau est survenue lors de la connexion à SasPay.");
      setIsProcessing(false);
    }
  };

  // Validation manuelle de l'OTP si l'opérateur en exige un
  const handleConfirmOtp = async () => {
    if (!otpValue.trim() || !activeSlug) return;
    setOtpSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await confirmSasPayOtpAction({
        slug: activeSlug,
        otp: otpValue.trim(),
      });

      if (!res.success) {
        setErrorMessage(res.error || "Code OTP invalide.");
        setOtpSubmitting(false);
        return;
      }

      setPushState("waiting_pin");
      setOtpSubmitting(false);
    } catch {
      setErrorMessage("Erreur lors de la validation du code OTP.");
      setOtpSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-4 pb-12">
      {/* CARTE 1 : Statut du compte (Account Status) */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs">
        {initialData.isActivated ? (
          <div>
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-base mb-1">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{t("act.active")}</span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500">
              {t("act.activeSub")}
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 text-rose-600 font-bold text-base mb-1">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <span>{t("act.inactive")}</span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500">
              {t("act.inactiveSub")}
            </p>
          </div>
        )}
      </div>

      {/* CARTE 2 : Informations de Dépôt (Deposit Info) */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-900">{t("act.depositInfo")}</h2>
          <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
            <CreditCard className="w-4 h-4" />
          </div>
        </div>

        <div className="space-y-4">
          {/* USER NAME */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 mt-0.5 border border-gray-100 flex-shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                {t("act.username")}
              </span>
              <p className="text-sm font-semibold text-gray-900 truncate">
                {displayUsername}
              </p>
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          {/* DEPOSIT NUMBER */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mt-0.5 border border-emerald-100 flex-shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                {t("act.depositNumber")}
              </span>
              <p className="text-sm font-semibold text-gray-900 truncate">
                {displayPhone}
              </p>
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          {/* CURRENCY & PAYS */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 mt-0.5 border border-gray-100 flex-shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Pays de résidence & Devise
              </span>
              <p className="text-sm font-semibold text-gray-900">
                {activeCountry.name} ({activeCountry.currency})
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CARTE 3 : Actions Rapides */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-900">{t("act.quickActions")}</h2>
          <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600 border border-sky-100">
            <ArrowLeftRight className="w-4 h-4" />
          </div>
        </div>

        <Link
          href="/"
          className="w-full touch-target rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-sm py-3 px-4 flex items-center justify-center gap-2 shadow-xs transition-colors"
        >
          <Home className="w-4 h-4 text-white" />
          <span>{t("act.dashboard")}</span>
        </Link>
      </div>

      {/* CARTE 4 : Paiement Mobile Money Direct (STK Push In-App) */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs relative overflow-hidden">
        <div className="flex items-start justify-between pb-3 mb-4 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Paiement Mobile Money automatique</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Débit direct sur votre téléphone sans redirection externe
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-[#0084FF] border border-blue-100 flex-shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
        </div>

        {/* Message d'erreur éventuel */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ============================================================== */}
        {/* ÉTAT 1 : EN ATTENTE DU CODE SECRET MOBILE MONEY (STK PUSH ACTIF) */}
        {/* ============================================================== */}
        {pushState === "waiting_pin" ? (
          <div className="py-6 px-2 text-center space-y-5 animate-fadeIn">
            {/* Animation de pulsation mobile */}
            <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0084FF] opacity-25"></span>
              <div className="relative w-16 h-16 rounded-full bg-blue-50 border-2 border-[#0084FF] flex items-center justify-center text-[#0084FF] shadow-md">
                <Smartphone className="w-8 h-8 animate-pulse text-[#0084FF]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-extrabold text-gray-900">
                Demande envoyée sur votre téléphone
              </h3>
              <p className="text-xs text-gray-600 max-w-sm mx-auto leading-relaxed">
                Veuillez consulter l'écran de votre téléphone portable pour saisir votre code secret Mobile Money et valider le paiement.
              </p>
            </div>

            {/* Récapitulatif de la transaction en attente */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 text-left max-w-xs mx-auto space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-medium">Opérateur :</span>
                <span className="font-bold text-gray-900">{selectedOperatorName}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-medium">Numéro :</span>
                <span className="font-bold text-gray-900">{walletNumber}</span>
              </div>
              <div className="flex justify-between items-center text-xs pt-2 border-t border-gray-200">
                <span className="text-gray-500 font-medium">Montant :</span>
                <span className="font-extrabold text-base text-[#0084FF]">4 500 FCFA</span>
              </div>
            </div>

            {/* Indicateur de synchronisation en direct */}
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#0084FF]">
              <Loader2 className="w-4 h-4 animate-spin text-[#0084FF]" />
              <span>En attente de votre validation mobile...</span>
            </div>

            {/* Bouton d'annulation pour modifier le numéro */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                  setPushState("idle");
                  setErrorMessage(null);
                }}
                className="text-xs text-gray-500 hover:text-gray-800 underline cursor-pointer inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Modifier mon numéro ou changer d'opérateur</span>
              </button>
            </div>
          </div>
        ) : pushState === "otp_prompt" ? (
          /* ============================================================== */
          /* ÉTAT 2 : CODE OTP REQUIS PAR L'OPÉRATEUR                       */
          /* ============================================================== */
          <div className="py-6 px-2 text-center space-y-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-blue-50 border-2 border-[#0084FF] flex items-center justify-center text-[#0084FF] mx-auto shadow-md">
              <KeyRound className="w-8 h-8 text-[#0084FF]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-gray-900">
                Code d'autorisation requis
              </h3>
              <p className="text-xs text-gray-600 max-w-sm mx-auto leading-relaxed">
                {instructions[0] || "Veuillez entrer le code de confirmation reçu par SMS ou composé sur votre mobile."}
              </p>
            </div>

            <div className="max-w-xs mx-auto space-y-3 pt-2">
              <input
                type="text"
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value)}
                placeholder="Entrez le code OTP"
                className="w-full text-center tracking-widest text-lg font-black px-4 py-3 rounded-xl border border-gray-300 focus:border-[#0084FF] focus:outline-hidden"
              />

              <button
                type="button"
                disabled={otpSubmitting || !otpValue.trim()}
                onClick={handleConfirmOtp}
                className="w-full touch-target py-3 px-4 rounded-xl bg-[#0084FF] hover:bg-[#0070D8] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md transition-colors disabled:opacity-50"
              >
                {otpSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Validation en cours...</span>
                  </>
                ) : (
                  <span>Confirmer le code OTP</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                  setPushState("idle");
                }}
                className="text-xs text-gray-500 hover:text-gray-800 underline cursor-pointer inline-flex items-center gap-1 pt-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Retour</span>
              </button>
            </div>
          </div>
        ) : pushState === "success" ? (
          /* ============================================================== */
          /* ÉTAT 3 : SUCCÈS CONFIRMÉ & REDIRECTION TABLEAU DE BORD         */
          /* ============================================================== */
          <div className="py-8 px-2 text-center space-y-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-600 flex items-center justify-center text-emerald-600 mx-auto shadow-md">
              <CheckCircle2 className="w-9 h-9 text-emerald-600" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-gray-900">
                Paiement validé avec succès !
              </h3>
              <p className="text-xs text-emerald-700 font-semibold max-w-sm mx-auto leading-relaxed">
                Votre compte Vita Earn est désormais activé. Redirection immédiate vers votre tableau de bord...
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-600 pt-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Chargement du tableau de bord...</span>
            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* ÉTAT NORMAL : FORMULAIRE FILTRÉ PAR PAYS                       */
          /* ============================================================== */
          <form onSubmit={handleStartPayment} className="space-y-4">
            {/* Ligne Pays avec possibilité de changer */}
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-bold text-gray-700">
                Pays : <span className="text-gray-900 font-black">{activeCountry.name}</span>
              </span>
              <button
                type="button"
                onClick={() => setShowCountryPicker(!showCountryPicker)}
                className="text-[11px] font-semibold text-[#0084FF] hover:underline cursor-pointer"
              >
                {showCountryPicker ? "Fermer" : "Changer de pays"}
              </button>
            </div>

            {/* Sélecteur de pays alternatif si déplié */}
            {showCountryPicker && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2 animate-fadeIn">
                <label htmlFor="country-selector" className="text-[11px] font-bold text-gray-600 block">
                  Choisir votre pays :
                </label>
                <div className="relative">
                  <select
                    id="country-selector"
                    value={activeCountry.code}
                    onChange={(e) => handleCountrySelect(e.target.value)}
                    className="w-full touch-target px-3 py-2 rounded-lg border border-gray-300 bg-white text-xs font-medium text-gray-800 appearance-none focus:outline-hidden focus:border-[#0084FF] pr-8"
                  >
                    {allCountries.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.dialCode})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Sélection du canal : STRICTEMENT FILTRÉ SUR LE PAYS DE L'UTILISATEUR */}
            <div>
              <label htmlFor="channel-select" className="text-xs font-semibold text-gray-700 mb-1.5 block">
                Moyen de paiement disponible ({activeCountry.name})
              </label>
              <div className="relative">
                <select
                  id="channel-select"
                  name="channel"
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value)}
                  className="w-full touch-target px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs sm:text-sm font-medium text-gray-800 appearance-none focus:outline-hidden focus:border-[#0084FF] focus:ring-1 focus:ring-[#0084FF] pr-9"
                >
                  {availableOperators.map((op) => (
                    <option key={op.code} value={op.code}>
                      {op.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Numéro de téléphone Mobile Money : Pur numéro local */}
            <div>
              <label htmlFor="walletNumber" className="text-xs font-semibold text-gray-700 mb-1.5 block">
                Numéro de compte Mobile Money
              </label>
              <div className="relative flex rounded-xl border border-gray-200 overflow-hidden bg-white focus-within:border-[#0084FF] focus-within:ring-1 focus-within:ring-[#0084FF]">
                <span className="inline-flex items-center px-3 py-2.5 bg-gray-50 text-xs font-bold text-gray-600 border-r border-gray-200 select-none">
                  {activeCountry.dialCode}
                </span>
                <input
                  id="walletNumber"
                  name="walletNumber"
                  type="tel"
                  value={walletNumber}
                  onChange={(e) => setWalletNumber(stripCountryDialCode(e.target.value) || e.target.value)}
                  placeholder="Ex: 90 12 34 56"
                  className="w-full touch-target px-3.5 py-2.5 bg-white text-xs sm:text-sm font-medium text-gray-800 focus:outline-hidden"
                  required
                />
              </div>
            </div>

            {/* Montant officiel : toujours 4 500 FCFA affiché */}
            <div>
              <label htmlFor="amount" className="text-xs font-semibold text-gray-700 mb-1.5 block">
                Montant de l'adhésion
              </label>
              <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
                <span className="inline-flex items-center px-4 py-2.5 bg-gray-100 text-xs font-bold text-gray-600 border-r border-gray-200 select-none">
                  {currency}
                </span>
                <input
                  id="amount"
                  name="amount"
                  type="text"
                  value="4 500"
                  readOnly
                  className="w-full px-3.5 py-2.5 bg-gray-50 text-xs sm:text-sm font-black text-gray-900 cursor-not-allowed select-none focus:outline-hidden"
                />
              </div>
            </div>

            {/* Boutons d'action : Dashboard & Payer avec SasPay OU Alerte Tchad / Pays Suspendu */}
            {isChad ? (
              <div className="p-4 rounded-xl bg-white border-2 border-[#16A34A] shadow-xs space-y-3">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-[#16A34A] shrink-0 mt-0.5" />
                  <div className="text-xs text-gray-800 leading-relaxed font-medium">
                    Le paiement en ligne n'est pas encore disponible pour le Tchad. Contactez l'administrateur pour effectuer votre paiement et activer votre compte.
                  </div>
                </div>
                <a
                  href={`mailto:${autoPaymentSettings?.adminEmail || "admin@vitaearn.com"}?subject=${encodeURIComponent(`Assistance paiement adhésion - Tchad (@${displayUsername})`)}`}
                  className="touch-target w-full py-2.5 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-[#16A34A] font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Mail className="w-4 h-4 text-[#16A34A]" />
                  <span>Contacter l'administrateur ({autoPaymentSettings?.adminEmail || "admin@vitaearn.com"})</span>
                </a>
              </div>
            ) : isCountrySuspended ? (
              <div className="p-4 rounded-xl bg-white border-2 border-[#16A34A] shadow-xs space-y-3">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-[#16A34A] shrink-0 mt-0.5" />
                  <div className="text-xs text-gray-800 leading-relaxed font-medium">
                    {autoPaymentSettings?.customMessage ||
                      "Les paiements automatiques sont temporairement suspendus pour ce pays. Veuillez contacter notre administration."}
                  </div>
                </div>
                {autoPaymentSettings?.adminEmail && (
                  <a
                    href={`mailto:${autoPaymentSettings.adminEmail}?subject=Paiement%20activation%20VitaEarn`}
                    className="touch-target w-full py-2.5 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-[#16A34A] font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Mail className="w-4 h-4 text-[#16A34A]" />
                    <span>Contacter l'administrateur ({autoPaymentSettings.adminEmail})</span>
                  </a>
                )}
              </div>
            ) : (
              <div className="pt-2 grid grid-cols-2 gap-3">
                <Link
                  href="/"
                  className="touch-target px-3 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs sm:text-sm text-center flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Home className="w-4 h-4" />
                  <span>{t("act.dashboard")}</span>
                </Link>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="touch-target px-3 py-2.5 rounded-xl bg-[#0084FF] hover:bg-[#0070D8] text-white font-bold text-xs sm:text-sm text-center flex items-center justify-center gap-1.5 shadow-md transition-colors disabled:opacity-75 disabled:cursor-wait cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Connexion...</span>
                    </>
                  ) : (
                    <>
                      <Wallet className="w-4 h-4 text-white" />
                      <span>Payer maintenant</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Bouton de paiement alternatif (affiché uniquement si éligible côté serveur) */}
            <AlternativePaymentButton
              config={alternativePayment || null}
              username={displayUsername}
            />
          </form>
        )}
      </div>

      {/* BOUTON DU BAS : Aller au tableau de bord */}
      <div className="flex justify-end pt-1">
        <Link
          href="/"
          className="touch-target px-4 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs sm:text-sm inline-flex items-center gap-2 shadow-xs transition-colors"
        >
          <Home className="w-4 h-4 text-white" />
          <span>{t("act.dashboard")}</span>
        </Link>
      </div>

      {/* PILL DU SITE (vitaearn.com) */}
      <div className="text-center pt-2 pb-2">
        <span className="inline-block px-4 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[11px] font-semibold text-gray-600 dark:text-gray-300 shadow-xs">
          vitaearn.com
        </span>
      </div>

      {/* BOUTON FLOTTANT RETOUR EN HAUT */}
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-20 right-4 z-40 w-11 h-11 rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
        aria-label="Retour en haut"
      >
        <ArrowUp className="w-5 h-5 text-white" />
      </button>
    </div>
  );
}
