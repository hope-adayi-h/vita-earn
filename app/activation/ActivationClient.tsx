"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import type { ActivationData } from "./types";
import { startSasPayActivationAction } from "./actions";
import {
  User,
  CreditCard,
  Globe,
  ArrowLeftRight,
  PhoneCall,
  Home,
  Wallet,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  ChevronDown,
  ArrowUp,
  ExternalLink,
} from "lucide-react";

import { AlternativePaymentButton } from "@/components/payments/AlternativePaymentButton";
import type { AlternativePaymentUserView } from "@/lib/data/alternative-payment-store";

interface ActivationClientProps {
  initialData: ActivationData;
  alternativePayment?: AlternativePaymentUserView | null;
}

const PAYMENT_CHANNELS = [
  { id: "tmoney_tg", name: "T-Money Togo (+228)", country: "Togo", code: "+228" },
  { id: "flooz_tg", name: "Moov Flooz Togo (+228)", country: "Togo", code: "+228" },
  { id: "mtn_bj", name: "MTN MoMo Bénin (+229)", country: "Bénin", code: "+229" },
  { id: "moov_bj", name: "Moov Money Bénin (+229)", country: "Bénin", code: "+229" },
  { id: "orange_ci", name: "Orange Money Côte d'Ivoire (+225)", country: "Côte d'Ivoire", code: "+225" },
  { id: "mtn_ci", name: "MTN MoMo Côte d'Ivoire (+225)", country: "Côte d'Ivoire", code: "+225" },
  { id: "wave_ci", name: "Wave Côte d'Ivoire / Sénégal (+225 / +221)", country: "UEMOA", code: "+225" },
  { id: "orange_sn", name: "Orange Money Sénégal (+221)", country: "Sénégal", code: "+221" },
  { id: "orange_bf", name: "Orange / Moov Burkina Faso (+226)", country: "Burkina Faso", code: "+226" },
  { id: "airtel_ne", name: "Airtel / Moov Niger (+227)", country: "Niger", code: "+227" },
  { id: "orange_gn", name: "Orange / MTN Guinée (+224)", country: "Guinée", code: "+224" },
  { id: "airtel_ga", name: "Airtel / Moov Gabon (+241)", country: "Gabon", code: "+241" },
  { id: "airtel_cg", name: "Airtel / MTN Congo (+242 / +243)", country: "Congo", code: "+242" },
  { id: "mtn_gh", name: "MTN / Vodafone Ghana (+233)", country: "Ghana", code: "+233" },
  { id: "mtn_zm", name: "MTN / Airtel Zambie (+260)", country: "Zambie", code: "+260" },
  { id: "mtn_cm", name: "MTN MoMo Cameroun (+237)", country: "Cameroun", code: "+237" },
  { id: "orange_cm", name: "Orange Money Cameroun (+237)", country: "Cameroun", code: "+237" },
  { id: "card_all", name: "Carte Bancaire Visa / Mastercard (Tous pays)", country: "International", code: "" },
];

export function ActivationClient({
  initialData,
  alternativePayment,
}: ActivationClientProps) {
  const router = useRouter();
  const { t } = useApp();
  const [selectedChannel, setSelectedChannel] = useState(PAYMENT_CHANNELS[0].id);
  const [fullName, setFullName] = useState(initialData.user.fullName || initialData.user.username || "");
  const [walletNumber, setWalletNumber] = useState(initialData.user.phone || "");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const displayUsername = initialData.user.username || initialData.user.fullName || "Utilisateur";
  const displayPhone = walletNumber || initialData.user.phone || "+228 90 00 00 00";
  const currency = initialData.currency || "XOF";
  const feeAmount = initialData.feeAmount || 4500;

  const handleStartPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const res = await startSasPayActivationAction({
        channel: selectedChannel,
        walletNumber: walletNumber.trim(),
        fullName: fullName.trim(),
      });

      if (res.error) {
        setErrorMessage(res.error);
        setIsProcessing(false);
      } else if (res.checkoutUrl) {
        // Redirection directe vers la page officielle de paiement sécurisée de SasPay
        window.location.href = res.checkoutUrl;
      } else {
        setErrorMessage("Lien de paiement non reçu. Veuillez réessayer.");
        setIsProcessing(false);
      }
    } catch {
      setErrorMessage("Une erreur réseau est survenue lors de la connexion à SasPay.");
      setIsProcessing(false);
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

          {/* CURRENCY */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 mt-0.5 border border-gray-100 flex-shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                {t("act.currency")}
              </span>
              <p className="text-sm font-semibold text-gray-900">
                {currency}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CARTE 3 : Actions Rapides (Quick Actions) */}
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

      {/* CARTE 4 : Paiement Mobile Money & Carte Bancaire (SasPay) */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs">
        <div className="flex items-start justify-between pb-3 mb-4 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-bold text-gray-900">{t("act.stkTitle")}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Réglez vos frais d'activation en ligne via Mobile Money ou Carte Bancaire
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100 flex-shrink-0">
            <CreditCard className="w-4 h-4" />
          </div>
        </div>

        {/* Message d'erreur éventuel */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleStartPayment} className="space-y-4">
          {/* Sélection du canal / pays */}
          <div>
            <label htmlFor="channel-select" className="text-xs font-semibold text-gray-700 mb-1.5 block">
              {t("act.selectChannel")}
            </label>
            <div className="relative">
              <select
                id="channel-select"
                name="channel"
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                className="w-full touch-target px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs sm:text-sm font-medium text-gray-800 appearance-none focus:outline-hidden focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A] pr-9"
              >
                {PAYMENT_CHANNELS.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Numéro de téléphone Mobile Money */}
          <div>
            <label htmlFor="walletNumber" className="text-xs font-semibold text-gray-700 mb-1.5 block">
              Numéro de compte Mobile Money
            </label>
            <input
              id="walletNumber"
              name="walletNumber"
              type="tel"
              value={walletNumber}
              onChange={(e) => setWalletNumber(e.target.value)}
              placeholder="Ex: +228 90 12 34 56"
              className="w-full touch-target px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs sm:text-sm font-medium text-gray-800 focus:outline-hidden focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]"
              required
            />
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
            <p className="text-[11px] text-gray-500 mt-1">
              Adhésion annuelle donnant accès à toutes les formations et outils d'affiliation.
            </p>
          </div>

          {/* Boutons d'action : Dashboard & Payer avec SasPay */}
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
              className="touch-target px-3 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs sm:text-sm text-center flex items-center justify-center gap-1.5 shadow-md transition-colors disabled:opacity-75 disabled:cursor-wait cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Connexion SasPay...</span>
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4" />
                  <span>Payer 4 500 FCFA</span>
                </>
              )}
            </button>
          </div>

          {/* Bouton de paiement alternatif (affiché uniquement si éligible côté serveur) */}
          <AlternativePaymentButton
            config={alternativePayment || null}
            username={displayUsername}
          />
        </form>

        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-center gap-1.5 text-[11px] text-gray-500">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Portail officiel sécurisé SasPay (T-Money, Flooz, Wave, MTN, Orange, Carte)</span>
        </div>
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

      {/* BOUTON FLOTTANT RETOUR EN HAUT (Scroll to top) */}
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
